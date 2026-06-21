import { NextResponse } from "next/server";

import { applyPlanChange, recordBillingEvent } from "@/lib/billing/service";
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
  const fresh = await recordBillingEvent({
    provider: "stripe",
    eventType: parsed.eventType,
    externalEventId: parsed.eventId,
    organizationId: parsed.change?.organizationId ?? null,
    payload: JSON.parse(raw),
  });
  if (fresh && parsed.change) {
    await applyPlanChange(parsed.change);
  }

  return NextResponse.json({ received: true });
}
