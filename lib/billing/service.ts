import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { isValidPlan, planTier, type OrgPlan } from "./plans";
import type { BillingProviderId, PlanChange, SubscriptionStatus } from "./types";

/**
 * Billing orchestration shared by all providers. Webhooks normalize their event
 * into a PlanChange and call applyPlanChange; everything tenant-facing reads the
 * subscriptions row. All writes are service_role (webhooks + checkout), so billing
 * state is never client-forgeable.
 */

/** Apply a normalized plan change: upsert the subscription and reflect the plan on
 *  the organization (so quotas/seats follow immediately). A non-active status
 *  downgrades the org to trial so access tracks payment. */
export async function applyPlanChange(change: PlanChange): Promise<void> {
  const admin = createAdminClient();

  await admin.from("subscriptions").upsert(
    {
      organization_id: change.organizationId,
      provider: change.provider,
      plan: change.plan,
      status: change.status,
      external_customer_id: change.externalCustomerId ?? null,
      external_subscription_id: change.externalSubscriptionId ?? null,
      current_period_end: change.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );

  const active = change.status === "active" || change.status === "trialing";
  await admin
    .from("organizations")
    .update({ plan: active ? change.plan : "trial" })
    .eq("id", change.organizationId);
}

/**
 * Idempotent webhook log. Inserts a billing_events row; returns false when this
 * (provider, externalEventId) was already recorded — the unique constraint makes
 * provider re-deliveries safe no-ops.
 */
export async function recordBillingEvent(args: {
  provider: BillingProviderId;
  eventType: string;
  externalEventId: string | null;
  organizationId: string | null;
  payload: unknown;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("billing_events").insert({
    provider: args.provider,
    event_type: args.eventType,
    external_event_id: args.externalEventId,
    organization_id: args.organizationId,
    payload: args.payload as Record<string, unknown>,
  });
  if (error) {
    if (error.code === "23505") return false; // duplicate → already processed
    throw error;
  }
  return true;
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
  return {
    plan: data.plan as OrgPlan,
    status: data.status as SubscriptionStatus,
    provider: (data.provider as BillingProviderId | null) ?? null,
    currentPeriodEnd: (data.current_period_end as string | null) ?? null,
  };
}

/** Mark a subscription pending while the admin completes checkout. */
export async function markCheckoutPending(args: {
  organizationId: string;
  plan: OrgPlan;
  provider: BillingProviderId;
  reference: string;
}): Promise<void> {
  const admin = createAdminClient();
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
