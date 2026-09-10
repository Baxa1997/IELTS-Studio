/**
 * The billing lifecycle, as rules — pure, no I/O, no `server-only`.
 *
 * FOUR CALLERS HAVE TO AGREE ON THESE, AND THEY USED TO EACH HAVE THEIR OWN IDEA.
 * The Stripe webhook decides what an event does to an org; the nightly job
 * decides who has run out; the quota reader decides what somebody may use right
 * now; and the admin console grants plans by hand. When those disagree the
 * failures are expensive in both directions — a paying customer throttled and
 * emailed that their plan ended, or a lapsed one kept on Pro for free — and
 * neither shows up as an error. So the rules live here, once, and are tested
 * without a database.
 *
 * TWO PROVIDERS, TWO SOURCES OF TRUTH.
 * - Payme and Click do not renew. Each payment buys a period and nothing more,
 *   so the stored `current_period_end` IS the truth and a passed date means the
 *   plan has ended.
 * - Stripe renews by itself. It retries a failed card, then reports the outcome
 *   as a status (past_due, canceled). Our stored date is only a copy of Stripe's,
 *   kept current by webhooks — so for Stripe the date can only ever be a reason
 *   to go and ASK Stripe, never a reason on its own to take a plan away.
 */

import type { PlanChange, SubscriptionStatus } from "./types";

/**
 * How long past a Stripe period end we wait before treating a missing renewal
 * as a lapse on the read path.
 *
 * A renewal webhook normally lands seconds after the period rolls over. This is
 * for the day it does not — an endpoint mid-deploy, a delivery retried an hour
 * later — so that a paying customer is not throttled in the gap before the
 * nightly job asks Stripe what actually happened.
 */
export const STRIPE_RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

/** The columns these rules read off a subscription row. */
export interface SubscriptionFacts {
  status: SubscriptionStatus | string | null;
  current_period_end: string | null;
  provider?: string | null;
  external_subscription_id?: string | null;
}

/**
 * Has this subscription run out?
 *
 * NULL IS NOT LAPSED, AND THAT IS THE LOAD-BEARING PART. Several paid orgs have
 * no subscription row at all, or one with no end date — comped accounts, the
 * shared library orgs, and plans granted by hand from the admin console, the
 * owner's own among them. Reading "no end date" as "ended" would downgrade every
 * one of them the first time anything ran.
 *
 * `canceled` is not lapsed either: it is already terminal, and whatever plan the
 * org holds now was put there deliberately after it ended.
 */
export function hasLapsed(sub: SubscriptionFacts | null | undefined, now = Date.now()): boolean {
  if (!sub) return false;
  if (!sub.current_period_end) return false;
  if (sub.status === "canceled") return false;
  const end = Date.parse(sub.current_period_end);
  if (!Number.isFinite(end)) return false;
  const grace = sub.provider === "stripe" ? STRIPE_RENEWAL_GRACE_MS : 0;
  return end + grace <= now;
}

/** Is somebody currently paying for this row? */
export function isLiveSubscription(sub: SubscriptionFacts | null | undefined, now = Date.now()): boolean {
  if (!sub) return false;
  if (sub.status !== "active" && sub.status !== "trialing") return false;
  return !hasLapsed(sub, now);
}

/** Which email a downgrade sends. */
export type DowngradeReason = "ended" | "payment_failed";

/** What a subscription status does to the org's plan. */
export type OrgEffect = "grant" | "none" | DowngradeReason;

/**
 * What a status does to the org that holds it.
 *
 * `incomplete` DOES NOTHING, and that is a change from before. It means the
 * first payment never went through — there is nothing paid to take away, so if
 * the org holds a paid plan it came from somewhere else: a comp, or a different
 * subscription that is still being paid. Downgrading on it removed those.
 *
 * `past_due` is the card failing on renewal while Stripe retries. It downgrades,
 * as it always did — access tracks payment — but it says so honestly: the email
 * is "we couldn't renew", not "your plan has ended", because a retry tomorrow
 * brings the plan straight back.
 */
export function orgEffect(status: SubscriptionStatus | string): OrgEffect {
  if (status === "active" || status === "trialing") return "grant";
  if (status === "past_due") return "payment_failed";
  if (status === "canceled") return "ended";
  return "none";
}

/**
 * The subscription columns a PlanChange may write.
 *
 * ONLY WHAT THE CHANGE ACTUALLY CARRIES. The upsert used to write
 * `external_customer_id: change.externalCustomerId ?? null` and the same for
 * the subscription id and the period end — so any event missing one of them
 * ERASED it. `customer.subscription.deleted` carries no customer, which wiped
 * the one link a later refund uses to find the org; a subscription event with
 * no readable period end wiped the date the expiry rules depend on. A column the
 * change says nothing about is now left as it was.
 */
export function subscriptionUpsert(change: PlanChange, nowIso: string): Record<string, unknown> {
  const row: Record<string, unknown> = {
    organization_id: change.organizationId,
    provider: change.provider,
    plan: change.plan,
    status: change.status,
    updated_at: nowIso,
  };
  if (change.externalCustomerId) row.external_customer_id = change.externalCustomerId;
  if (change.externalSubscriptionId) row.external_subscription_id = change.externalSubscriptionId;
  if (change.currentPeriodEnd) row.current_period_end = change.currentPeriodEnd;
  return row;
}

/**
 * Should opening a checkout mark this org's row as pending?
 *
 * NOT OVER A SUBSCRIPTION SOMEBODY IS PAYING FOR. The pending marker is written
 * the moment Upgrade is clicked, before any money moves — and it used to
 * overwrite the live row with `incomplete` and the checkout SESSION id, losing
 * the real `sub_…` id. A paying customer who opened a checkout and backed out
 * was left looking unpaid.
 */
export function shouldMarkPending(existing: SubscriptionFacts | null | undefined, now = Date.now()): boolean {
  return !isLiveSubscription(existing, now);
}

/**
 * Is this a non-paying event about a DIFFERENT Stripe subscription than the
 * live one on file?
 *
 * Every checkout creates a new Stripe subscription. If a second one fails or is
 * abandoned, its events arrive for the same org — and without this they would
 * end the first, still-paid subscription and email its owner that the plan was
 * gone. Paying events for a new subscription still apply: that is an upgrade.
 */
export function isAboutAnotherSubscription(
  existing: SubscriptionFacts | null | undefined,
  change: Pick<PlanChange, "provider" | "status" | "externalSubscriptionId">,
  now = Date.now(),
): boolean {
  if (change.provider !== "stripe") return false;
  if (orgEffect(change.status) === "grant") return false;
  if (!isLiveSubscription(existing, now)) return false;
  const onFile = existing?.external_subscription_id ?? "";
  const incoming = change.externalSubscriptionId ?? "";
  return onFile.startsWith("sub_") && incoming.startsWith("sub_") && onFile !== incoming;
}
