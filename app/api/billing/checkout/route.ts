import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { isValidPlan, planTier, type OrgPlan } from "@/lib/billing/plans";
import { markCheckoutPending } from "@/lib/billing/service";
import { stripeCreateCheckout } from "@/lib/billing/stripe";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout  — start an upgrade for the caller's org.
 * Body: { plan: "starter"|"pro", provider: "stripe"|"payme"|"click" }
 *
 * B2C: students upgrade their own personal org (the shipping path). The dormant
 * B2B center_admin path stays valid and returns to the console instead.
 *
 * Returns { url } to redirect to the provider's payment page, and marks the
 * subscription 'incomplete' until the webhook/callback confirms payment.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  const role = session.profile.role;
  if (role !== "student" && role !== "center_admin") return fail(403, "forbidden");
  const organizationId = session.profile.organization_id;

  const body = (await req.json().catch(() => ({}))) as { plan?: string; provider?: string };
  const plan = body.plan ?? "";
  const provider = body.provider ?? "";
  // Every paid tier is self-serve now (Enterprise has a fixed price, not sales-led).
  if (!isValidPlan(plan) || plan === "trial") {
    return fail(400, "invalid_plan");
  }

  const base = serverEnv.siteUrl;
  const returnPath = role === "student" ? "/dashboard" : "/console/billing";
  const successUrl = `${base}${returnPath}?billing=success`;
  const cancelUrl = `${base}${returnPath}?billing=cancel`;

  try {
    if (provider === "stripe") {
      if (!serverEnv.stripe) return fail(503, "stripe_unavailable");
      const r = await stripeCreateCheckout({
        organizationId,
        plan,
        successUrl,
        cancelUrl,
        customerEmail: session.user.email,
      });
      await markCheckoutPending({ organizationId, plan, provider: "stripe", reference: r.reference });
      return NextResponse.json({ url: r.url });
    }

    if (provider === "payme") {
      const cfg = serverEnv.payme;
      if (!cfg) return fail(503, "payme_unavailable");
      const tiyin = uzsTiyin(plan);
      if (tiyin == null) return fail(400, "plan_not_sold_uz");
      const payload = `m=${cfg.merchantId};ac.organization_id=${organizationId};a=${tiyin}`;
      const url = `https://checkout.paycom.uz/${Buffer.from(payload).toString("base64")}`;
      await markCheckoutPending({ organizationId, plan, provider: "payme", reference: organizationId });
      return NextResponse.json({ url });
    }

    if (provider === "click") {
      const cfg = serverEnv.click;
      if (!cfg) return fail(503, "click_unavailable");
      const uzs = planTier(plan).priceUzs;
      if (uzs == null) return fail(400, "plan_not_sold_uz");
      const url =
        `https://my.click.uz/services/pay?service_id=${cfg.serviceId}` +
        `&merchant_id=${cfg.merchantId}&amount=${uzs}&transaction_param=${organizationId}` +
        `&return_url=${encodeURIComponent(successUrl)}`;
      await markCheckoutPending({ organizationId, plan, provider: "click", reference: organizationId });
      return NextResponse.json({ url });
    }

    return fail(400, "invalid_provider");
  } catch (err) {
    console.error("[billing.checkout] failed:", err);
    return fail(502, "checkout_failed");
  }
}

function uzsTiyin(plan: OrgPlan): number | null {
  const uzs = planTier(plan).priceUzs;
  return uzs == null ? null : Math.round(uzs * 100);
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
