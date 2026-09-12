import { NextResponse } from "next/server";

import { applyPlanChange, recordBillingEvent } from "@/lib/billing/service";
import { orgForStripeCustomer, reverseCommission } from "@/lib/referrals/accrual";
import { stripeVerifyAndParse } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/stripe/webhook
 *
 * Verifies the Stripe signature against the RAW body, logs the event idempotently,
 * and applies any plan change. Returns 400 only on a bad signature; everything
 * else is 200 so Stripe doesn't needlessly retry.
 */
export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");

  let parsed;
  try {
    parsed = stripeVerifyAndParse(raw, signature);
  } catch (err) {
    console.error("[billing.stripe] signature/verify failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Idempotent: a re-delivered event is a no-op.
  const event = await recordBillingEvent({
    provider: "stripe",
    eventType: parsed.eventType,
    externalEventId: parsed.eventId,
    organizationId: parsed.change?.organizationId ?? null,
    payload: JSON.parse(raw),
  });
  // Re-apply on provider retries as well. The event log is idempotent, but the
  // subscription/org update may have failed after the log insert. Replaying the
  // normalized change is safe because subscription writes and referral accrual
  // are themselves conditional/idempotent.
  if (parsed.change && event.id) {
    // The event id travels with the change so referral commission can key its
    // own idempotency to the same row this log already de-duplicates on.
    await applyPlanChange(parsed.change, event.id);
  }

  /**
   * MONEY GOING BACK OUT.
   *
   * Handled here rather than in `mapEvent`, because a refund is not a plan
   * change — it has no plan and no status to apply, and forcing it through that
   * shape would mean inventing both. It also carries none of the metadata a
   * checkout does, so the org is found through the customer that
   * `subscriptions` already stores.
   *
   * A dispute counts the same as a refund: the money is gone either way, and
   * waiting for the dispute to resolve would mean paying out commission on a
   * payment we are in the middle of losing.
   */
  if (event.fresh && (parsed.eventType === "charge.refunded" || parsed.eventType === "charge.dispute.created")) {
    const customer = stripeCustomerOf(JSON.parse(raw));
    const organizationId = customer ? await orgForStripeCustomer(customer) : null;
    if (organizationId) {
      await reverseCommission(organizationId, `stripe ${parsed.eventType}`);
    }
  }

  return NextResponse.json({ received: true });
}

/** The customer on a charge/dispute payload, whichever shape Stripe sends. */
function stripeCustomerOf(payload: unknown): string | null {
  const obj = (payload as { data?: { object?: Record<string, unknown> } })?.data?.object;
  const customer = obj?.customer;
  return typeof customer === "string" ? customer : null;
}
