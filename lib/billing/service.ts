import "server-only";

import { accrueCommission } from "@/lib/referrals/accrual";
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
export async function applyPlanChange(
  change: PlanChange,
  /** The `billing_events` row this change came from. Referral commission is keyed
   *  to it, so a provider redelivering the same event cannot pay twice. Omitted
   *  for changes that are not a payment — nothing accrues without it. */
  billingEventId?: string | null,
): Promise<void> {
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
    if (error.code === "23505") return { fresh: false, id: null }; // duplicate → already processed
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
