import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";

import { planTier, type OrgPlan } from "./plans";
import { coercePlan } from "./service";
import type { CheckoutRequest, CheckoutResult, PlanChange, SubscriptionStatus } from "./types";

/**
 * Stripe adapter — Checkout + webhooks via the REST API (no SDK dependency).
 * Subscriptions charge the tier's dashboard Price (`stripePriceId` in plans.ts,
 * overridable per-env via STRIPE_PRICE_<PLAN> — e.g. test-mode price IDs), and
 * fall back to inline price_data when no Price is configured; org + plan ride in
 * metadata so the webhook can attribute the payment. Live use needs
 * STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.
 */

const API = "https://api.stripe.com/v1";

export async function stripeCreateCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
  const cfg = serverEnv.stripe;
  if (!cfg) throw new Error("Stripe is not configured.");
  const tier = planTier(req.plan);
  if (tier.price == null) throw new Error("The Enterprise plan is sales-led — contact us.");

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("success_url", req.successUrl);
  form.set("cancel_url", req.cancelUrl);
  form.set("client_reference_id", req.organizationId);
  form.set("metadata[organizationId]", req.organizationId);
  form.set("metadata[plan]", req.plan);
  form.set("subscription_data[metadata][organizationId]", req.organizationId);
  form.set("subscription_data[metadata][plan]", req.plan);
  if (req.customerEmail) form.set("customer_email", req.customerEmail);
  form.set("line_items[0][quantity]", "1");
  // Prefer an explicit per-env Price override, else the tier's dashboard Price.
  // The hard-coded stripePriceId (plans.ts) is a LIVE Price, so a test-mode key
  // (sk_test_) would 404 on it — in test mode fall back to inline price_data so
  // local checkout works with no test Price IDs to create.
  const testMode = cfg.secretKey.startsWith("sk_test_");
  const priceId =
    process.env[`STRIPE_PRICE_${req.plan.toUpperCase()}`] ??
    (testMode ? null : tier.stripePriceId);
  if (priceId) {
    form.set("line_items[0][price]", priceId);
  } else {
    form.set("line_items[0][price_data][currency]", tier.currency);
    form.set("line_items[0][price_data][product_data][name]", `IELTS W&R — ${tier.name}`);
    form.set("line_items[0][price_data][recurring][interval]", "month");
    // The 3-month pass bills once per quarter (months=3 in plans.ts).
    form.set("line_items[0][price_data][recurring][interval_count]", String(tier.months));
    form.set("line_items[0][price_data][unit_amount]", String(Math.round(tier.price * 100)));
  }

  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) throw new Error(`Stripe checkout failed: ${data.error?.message ?? res.status}`);
  return { url: data.url, reference: data.id ?? "" };
}

/** Verify the Stripe-Signature header against the raw body, then map the event to
 *  a PlanChange (or null for events we ignore). Throws on a bad signature. */
export function stripeVerifyAndParse(
  rawBody: string,
  signatureHeader: string | null,
): { eventType: string; eventId: string; change: PlanChange | null } {
  const cfg = serverEnv.stripe;
  if (!cfg?.webhookSecret) throw new Error("Stripe webhook secret is not configured.");
  if (!verifySignature(rawBody, signatureHeader, cfg.webhookSecret)) {
    throw new Error("Invalid Stripe signature.");
  }
  const event = JSON.parse(rawBody) as StripeEvent;
  return { eventType: event.type, eventId: event.id, change: mapEvent(event) };
}

// ---- Signature (Stripe's scheme: t + v1 HMAC-SHA256 of `${t}.${body}`) ------

function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  // Reject stale signatures (>5 min) to blunt replay.
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return safeEqualHex(expected, v1);
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

// ---- Event mapping ---------------------------------------------------------

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

function mapEvent(event: StripeEvent): PlanChange | null {
  const obj = event.data.object;
  const metadata = (obj.metadata ?? {}) as Record<string, string>;
  const organizationId = metadata.organizationId ?? (obj.client_reference_id as string | undefined);
  const plan = coercePlan(metadata.plan);
  if (!organizationId) return null;

  switch (event.type) {
    case "checkout.session.completed":
      if (!plan) return null;
      return {
        organizationId,
        plan,
        status: "active",
        provider: "stripe",
        externalCustomerId: (obj.customer as string | null) ?? null,
        externalSubscriptionId: (obj.subscription as string | null) ?? null,
        // The real amount charged, not the tier's list price — so a tax line or
        // a future discount cannot make us pay commission on money we never got.
        // `amount_total` is already in minor units.
        amountMinor: (obj.amount_total as number | undefined) ?? null,
        currency: (obj.currency as string | undefined) ?? null,
        /* AN END DATE, BECAUSE A CHECKOUT SESSION HAS NONE.
           Only the subscription carries a period, and until the subscription
           events were fixed they supplied nothing either: this account runs
           Stripe API 2026-01-28.clover, which moved `current_period_end` off the
           subscription and onto its items. Every event read a field that no
           longer exists — so the column was NULL on every Stripe row, and a plan
           with no end date is a plan that never ends.

           (An earlier note here blamed missing plan metadata. That was wrong:
           checkout sets `subscription_data[metadata]`, so subscription events
           resolve their org and plan fine. They just could not read the date.)

           Derived from the tier's own billing period, the way Payme and Click
           do it. The first subscription event replaces it with Stripe's own
           date, read from `periodEndOf`. */
        currentPeriodEnd: periodEndFor(plan),
      };
    /* NO AMOUNT ON THESE, DELIBERATELY. A subscription event describes state,
       not a payment — its object has no `amount_total`, and inventing one from
       the tier would accrue commission on every status change. Renewals earn
       nothing until `invoice.payment_succeeded` is mapped (phase 6 of the
       referrals plan); first payments are covered above. */
    case "customer.subscription.updated":
    case "customer.subscription.created":
      if (!plan) return null;
      return changeFromSubscription(obj, { organizationId, plan });
    case "customer.subscription.deleted":
      return {
        organizationId,
        plan: plan ?? "trial",
        status: "canceled",
        provider: "stripe",
        externalSubscriptionId: (obj.id as string | null) ?? null,
      };
    default:
      return null; // ignore everything else
  }
}

/**
 * When the paid period of a Stripe subscription ends.
 *
 * READ FROM THE ITEMS FIRST. Stripe API 2026-01-28.clover — the version this
 * account and its webhook endpoint run — no longer puts `current_period_end` on
 * the subscription; it lives on each subscription item. Reading the old
 * top-level field returned undefined on every event, which is why every Stripe
 * row in production had no end date. The top-level field is still consulted as
 * a fallback, for an event rendered under an older API version.
 */
export function periodEndOf(obj: Record<string, unknown>): string | null {
  const items = (obj.items as { data?: { current_period_end?: unknown }[] } | undefined)?.data ?? [];
  const ends = items
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (ends.length > 0) return unixToIso(Math.max(...ends));
  return unixToIso(obj.current_period_end as number | undefined);
}

/**
 * A Stripe subscription object, as a PlanChange.
 *
 * Shared by the webhook and by the nightly reconciliation, so a subscription
 * means the same thing whether it arrived as an event or was fetched because an
 * event never came. The org is always the caller's — for the webhook, the one in
 * the metadata; for reconciliation, the row being checked.
 */
export function changeFromSubscription(
  obj: Record<string, unknown>,
  owner: { organizationId: string; plan: OrgPlan },
): PlanChange {
  const metadata = (obj.metadata ?? {}) as Record<string, string>;
  return {
    organizationId: owner.organizationId,
    plan: coercePlan(metadata.plan) ?? owner.plan,
    status: mapStatus(String(obj.status ?? "")),
    provider: "stripe",
    externalCustomerId: (obj.customer as string | null) ?? null,
    externalSubscriptionId: (obj.id as string | null) ?? null,
    currentPeriodEnd: periodEndOf(obj),
  };
}

/**
 * Ask Stripe what a subscription is doing right now.
 *
 * For reconciliation: our stored date is only ever a copy of Stripe's, so when
 * it looks lapsed the honest move is to ask rather than to act. Looks up the
 * subscription id when we have a real one, and otherwise the customer's
 * subscriptions — the pending marker used to overwrite the `sub_…` id with a
 * checkout session id, so the customer is sometimes the only reference left.
 *
 * `ok: false` means we could not find out. Callers must treat that as "do
 * nothing": taking a plan away on a network error is the worst available answer.
 */
export async function fetchLiveStripeSubscription(ref: {
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<{ ok: true; subscription: Record<string, unknown> | null } | { ok: false; error: string }> {
  const cfg = serverEnv.stripe;
  if (!cfg) return { ok: false, error: "stripe is not configured" };
  const headers = { Authorization: `Bearer ${cfg.secretKey}` };

  try {
    if (ref.subscriptionId?.startsWith("sub_")) {
      const res = await fetch(`${API}/subscriptions/${encodeURIComponent(ref.subscriptionId)}`, { headers });
      if (res.status === 404) return { ok: true, subscription: null };
      if (!res.ok) return { ok: false, error: `stripe responded ${res.status}` };
      return { ok: true, subscription: (await res.json()) as Record<string, unknown> };
    }
    if (ref.customerId?.startsWith("cus_")) {
      const res = await fetch(
        `${API}/subscriptions?customer=${encodeURIComponent(ref.customerId)}&status=all&limit=10`,
        { headers },
      );
      if (!res.ok) return { ok: false, error: `stripe responded ${res.status}` };
      const body = (await res.json()) as { data?: Record<string, unknown>[] };
      const subs = body.data ?? [];
      // A live one wins over a newer dead one: an abandoned second checkout
      // must not stand in for the subscription that is still being paid.
      const live = subs.find((sub) => sub.status === "active" || sub.status === "trialing" || sub.status === "past_due");
      return { ok: true, subscription: live ?? subs[0] ?? null };
    }
    return { ok: true, subscription: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Cancel a customer's live subscription immediately — used when the account it
 * pays for is being deleted, so the card is not charged for an account that no
 * longer exists.
 *
 * `ok: false` means we could not confirm it is cancelled, and the caller must
 * then stop: deleting the account while the subscription might still be live is
 * the one outcome worse than not deleting it. A subscription that is already
 * gone (404, or not live) counts as cancelled.
 */
export async function stripeCancelSubscription(ref: {
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = serverEnv.stripe;
  if (!cfg) return { ok: false, error: "stripe is not configured" };

  const live = await fetchLiveStripeSubscription(ref);
  if (!live.ok) return live;
  const sub = live.subscription;
  const status = String(sub?.status ?? "");
  if (!sub || !["active", "trialing", "past_due", "incomplete"].includes(status)) {
    return { ok: true };
  }

  try {
    const res = await fetch(`${API}/subscriptions/${encodeURIComponent(String(sub.id))}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.secretKey}` },
    });
    if (res.status === 404) return { ok: true };
    if (!res.ok) return { ok: false, error: `stripe responded ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** The end of the period a tier's single payment buys. */
function periodEndFor(plan: OrgPlan): string {
  const months = planTier(plan)?.months ?? 1;
  const end = new Date();
  end.setUTCMonth(end.getUTCMonth() + months);
  return end.toISOString();
}

function mapStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "canceled"; // canceled, unpaid, paused …
  }
}

function unixToIso(seconds: number | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}
