import "server-only";

import { accrueCommission } from "@/lib/referrals/accrual";
import { createAdminClient } from "@/lib/supabase/admin";

import { downgradeToFree } from "./downgrade";
import { hasLapsed } from "./lifecycle";
import { notifyPlanActivated, notifyPlanRenewed } from "./notify-expiry";
import {
  isAboutAnotherSubscription,
  orgEffect,
  shouldMarkPending,
  subscriptionUpsert,
} from "./lifecycle";
import { isValidPlan, planTier, type OrgPlan } from "./plans";
import type { BillingProviderId, PlanChange, SubscriptionStatus } from "./types";

/** The shortest period any tier sells is a month; anything moving the end by
 *  less than this is a correction of the same period, not a new one. */
const MIN_RENEWAL_ADVANCE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Billing orchestration shared by all providers. Webhooks normalize their event
 * into a PlanChange and call applyPlanChange; everything tenant-facing reads the
 * subscriptions row. All writes are service_role (webhooks + checkout), so billing
 * state is never client-forgeable.
 */

/**
 * Apply a normalized plan change: upsert the subscription and reflect the plan on
 * the organization, so quotas and seats follow immediately.
 *
 * What a status does to the org is decided by `orgEffect` (lib/billing/lifecycle.ts):
 * paying grants the plan, a failed renewal or an ending downgrades it — through
 * `downgradeToFree`, which is the only thing that sends the email — and an
 * `incomplete` first payment changes nothing, because nothing was paid.
 */
export async function applyPlanChange(
  change: PlanChange,
  /** The `billing_events` row this change came from. Referral commission is keyed
   *  to it, so a provider redelivering the same event cannot pay twice. Omitted
   *  for changes that are not a payment — nothing accrues without it. */
  billingEventId?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const now = Date.now();

  const { data: existing, error: existingError } = await admin
    .from("subscriptions")
    .select("status, current_period_end, provider, external_subscription_id")
    .eq("organization_id", change.organizationId)
    .maybeSingle();
  if (existingError) throw new Error(`could not read subscription: ${existingError.message}`);

  /* A DEAD SECOND SUBSCRIPTION MUST NOT END A LIVE FIRST ONE. Every checkout
     creates a fresh Stripe subscription, so an abandoned or failed second one
     sends its events for the same org — and they used to overwrite the paid
     row and downgrade its owner. Such an event is ignored outright: it neither
     touches the row nor the plan. */
  if (isAboutAnotherSubscription(existing, change, now)) {
    console.warn(
      `[billing] ignored ${change.status} for ${change.externalSubscriptionId}: org ${change.organizationId} has a different live subscription`,
    );
    return;
  }

  const { error: subscriptionError } = await admin
    .from("subscriptions")
    .upsert(subscriptionUpsert(change, new Date(now).toISOString()), { onConflict: "organization_id" });
  if (subscriptionError) throw new Error(`could not save subscription: ${subscriptionError.message}`);

  const effect = orgEffect(change.status);
  if (effect === "grant") {
    const { error: organizationError } = await admin
      .from("organizations")
      .update({ plan: change.plan })
      .eq("id", change.organizationId);
    if (organizationError) throw new Error(`could not apply organization plan: ${organizationError.message}`);

    /* STARTED, RENEWED, OR NEITHER — and exactly one email for each.
       "Was paying" reads the STATUS, not `isLiveSubscription`: a Stripe row
       whose renewal webhook went missing looks lapsed by date, and when the
       nightly job fetches the renewal that is a renewal, not a new start. A
       replayed event finds the row this call's first run already made active,
       so it announces nothing twice. */
    // A hand-granted 'manual' row is a comp: the first real payment after one
    // is a plan starting, not a renewal of something nobody paid for.
    const wasPaying =
      existing?.provider !== "manual" && (existing?.status === "active" || existing?.status === "trialing");
    const previousEnd = existing?.current_period_end ? Date.parse(existing.current_period_end) : NaN;
    const nextEnd = change.currentPeriodEnd ? Date.parse(change.currentPeriodEnd) : NaN;
    // ⚠️ A renewal moves the end by a whole period. A checkout writes an end
    // derived from the tier and Stripe's own subscription event then corrects
    // it by seconds — without a floor that correction was a "renewed" email
    // arriving minutes after the first payment.
    const isRenewal =
      wasPaying &&
      Number.isFinite(previousEnd) &&
      Number.isFinite(nextEnd) &&
      nextEnd - previousEnd >= MIN_RENEWAL_ADVANCE_MS;
    if (!wasPaying) {
      await notifyPlanActivated(
        change.organizationId,
        change.plan,
        change.currentPeriodEnd ?? null,
        new Date(now).toISOString(),
      );
    } else if (isRenewal && change.currentPeriodEnd) {
      await notifyPlanRenewed(change.organizationId, change.plan, change.currentPeriodEnd);
    }
  } else if (effect !== "none") {
    await downgradeToFree(change.organizationId, effect, existing?.current_period_end);
  }

  /**
   * REFERRAL COMMISSION, ACCRUED HERE AND NOWHERE ELSE.
   *
   * This is the single point all three providers pass through, so hanging
   * accrual off it means a Payme payment earns exactly what a Stripe one does,
   * and a fourth provider gets it for free. It runs LAST and cannot throw (see
   * accrueCommission): the subscription is what the customer bought, and a
   * ledger row that fails to write is recoverable from `billing_events` while a
   * payment that fails because of one is not.
   *
   * Guarded on all three of: money changed hands, we know how much, and we know
   * which event it was. A cancellation or a status change satisfies none of
   * them and accrues nothing.
   */
  if (billingEventId && change.amountMinor && change.amountMinor > 0 && change.currency) {
    await accrueCommission({
      organizationId: change.organizationId,
      billingEventId,
      amountMinor: change.amountMinor,
      currency: change.currency,
    });
  }
}

/**
 * Idempotent webhook log. Inserts a billing_events row; `fresh` is false when
 * this (provider, externalEventId) was already recorded — the unique constraint
 * makes provider re-deliveries safe no-ops.
 *
 * Returns the row `id` as well, because the referral ledger keys its idempotency
 * to this exact row: one commission per billing event, enforced by a unique FK.
 * Without the id, a redelivered webhook that slipped past the check above would
 * have nothing to collide with.
 */
export async function recordBillingEvent(args: {
  provider: BillingProviderId;
  eventType: string;
  externalEventId: string | null;
  organizationId: string | null;
  payload: unknown;
}): Promise<{ fresh: boolean; id: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("billing_events")
    .insert({
      provider: args.provider,
      event_type: args.eventType,
      external_event_id: args.externalEventId,
      organization_id: args.organizationId,
      payload: args.payload as Record<string, unknown>,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      // Return the existing row id as well. This is important for Payme/Click,
      // whose transaction state is stored in the same billing_events row before
      // the payment is applied, and for safe retries after a transient failure.
      const { data: existing } = await admin
        .from("billing_events")
        .select("id")
        .eq("provider", args.provider)
        .eq("external_event_id", args.externalEventId)
        .maybeSingle();
      return { fresh: false, id: (existing?.id as string | null) ?? null };
    }
    throw error;
  }
  return { fresh: true, id: (data?.id as string | null) ?? null };
}

export interface SubscriptionView {
  plan: OrgPlan;
  status: SubscriptionStatus;
  provider: BillingProviderId | null;
  currentPeriodEnd: string | null;
}

/** The org's current subscription (falls back to a trial view when none exists). */
export async function getSubscription(organizationId: string): Promise<SubscriptionView> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("plan, status, provider, current_period_end")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return { plan: "trial", status: "trialing", provider: null, currentPeriodEnd: null };
  const provider = (data.provider as BillingProviderId | null) ?? null;
  const currentPeriodEnd = (data.current_period_end as string | null) ?? null;
  if (hasLapsed({ status: data.status as SubscriptionStatus, current_period_end: currentPeriodEnd, provider })) {
    return { plan: "trial", status: "canceled", provider, currentPeriodEnd };
  }
  return {
    plan: data.plan as OrgPlan,
    status: data.status as SubscriptionStatus,
    provider,
    currentPeriodEnd,
  };
}

/**
 * Mark a subscription pending while somebody completes checkout.
 *
 * Skipped when the org already has a subscription being paid for. This runs the
 * moment Upgrade is clicked, before any money moves, and it used to overwrite a
 * live row with `incomplete` and the checkout SESSION id — so a paying customer
 * who opened a checkout and closed the tab lost their real `sub_…` id and read
 * as unpaid. The completed payment's own webhook writes the new state anyway.
 */
export async function markCheckoutPending(args: {
  organizationId: string;
  plan: OrgPlan;
  provider: BillingProviderId;
  reference: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("status, current_period_end, provider, external_subscription_id")
    .eq("organization_id", args.organizationId)
    .maybeSingle();
  if (!shouldMarkPending(existing)) return;

  await admin.from("subscriptions").upsert(
    {
      organization_id: args.organizationId,
      provider: args.provider,
      plan: args.plan,
      status: "incomplete",
      external_subscription_id: args.reference,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );
}

/** Resolve the plan a UZS amount (in tiyin) corresponds to — Payme/Click identify
 *  the purchase by its amount. Returns null on no exact match (reject the payment). */
export function planForUzsAmount(amountTiyin: number): OrgPlan | null {
  for (const id of ["starter", "pro"] as OrgPlan[]) {
    const uzs = planTier(id).priceUzs;
    if (uzs != null && Math.round(uzs * 100) === amountTiyin) return id;
  }
  return null;
}

export function coercePlan(value: unknown): OrgPlan | null {
  return typeof value === "string" && isValidPlan(value) ? value : null;
}
