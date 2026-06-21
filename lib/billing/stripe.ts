import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";

import { planTier } from "./plans";
import { coercePlan } from "./service";
import type { CheckoutRequest, CheckoutResult, PlanChange, SubscriptionStatus } from "./types";

/**
 * Stripe adapter — Checkout + webhooks via the REST API (no SDK dependency).
 * Subscriptions are created with inline price_data so no pre-provisioned Stripe
 * Price is required; org + plan ride in metadata so the webhook can attribute the
 * payment. Live use needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.
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
  form.set("line_items[0][price_data][currency]", tier.currency);
  form.set("line_items[0][price_data][product_data][name]", `IELTS W&R — ${tier.name}`);
  form.set("line_items[0][price_data][recurring][interval]", "month");
  form.set("line_items[0][price_data][unit_amount]", String(Math.round(tier.price * 100)));

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
      };
    case "customer.subscription.updated":
    case "customer.subscription.created":
      if (!plan) return null;
      return {
        organizationId,
        plan,
        status: mapStatus(obj.status as string),
        provider: "stripe",
        externalCustomerId: (obj.customer as string | null) ?? null,
        externalSubscriptionId: (obj.id as string | null) ?? null,
        currentPeriodEnd: unixToIso(obj.current_period_end as number | undefined),
      };
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
