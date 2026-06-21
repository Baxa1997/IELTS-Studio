import "server-only";

import { planTier, type OrgPlan } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Per-organization AI usage quotas, enforced server-side (CLAUDE.md: "The API
 * layer owns auth, rate limits, usage quotas, billing hooks.").
 *
 * Limits come from the org's plan tier (lib/billing/plans.ts), overridable
 * per-org via `organizations.grading_monthly_limit` / `generation_monthly_limit`
 * (`null` = unlimited). Counting is org-wide so it uses the service-role client.
 *   - Gradings: AI gradings stored this calendar month (graded_by IS NULL).
 *   - Generations: successful `generate` calls logged in ai_usage this month.
 */
export type { OrgPlan };

/** @deprecated source from plans.ts; kept for callers that import the maps. */
export const PLAN_GRADE_LIMITS: Record<OrgPlan, number | null> = mapLimits("gradeLimit");
export const PLAN_SEAT_LIMITS: Record<OrgPlan, number | null> = mapLimits("seatLimit");

function mapLimits(key: "gradeLimit" | "seatLimit"): Record<OrgPlan, number | null> {
  return {
    trial: planTier("trial")[key],
    starter: planTier("starter")[key],
    pro: planTier("pro")[key],
    enterprise: planTier("enterprise")[key],
  };
}

export interface Quota {
  /** `null` = unlimited. */
  limit: number | null;
  used: number;
  /** `null` when unlimited. */
  remaining: number | null;
  /** ISO timestamp when the window rolls over (start of next month, UTC). */
  resetAt: string;
  exceeded: boolean;
}

function monthWindow(now = new Date()): { start: string; resetAt: string } {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    resetAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

async function loadOrg(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("plan, grading_monthly_limit, generation_monthly_limit")
    .eq("id", organizationId)
    .single();
  return { admin, org: data };
}

/** Monthly AI-grading quota (AI gradings only — teacher overrides don't count). */
export async function getGradingQuota(organizationId: string): Promise<Quota> {
  const { admin, org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const limit = org?.grading_monthly_limit ?? planTier(plan).gradeLimit;
  const { start, resetAt } = monthWindow();

  let used = 0;
  if (limit !== null) {
    const { count } = await admin
      .from("gradings")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("graded_by", null)
      .gte("created_at", start);
    used = count ?? 0;
  }
  return toQuota(limit, used, resetAt);
}

/** Monthly AI-generation quota (successful generate calls in ai_usage). */
export async function getGenerationQuota(organizationId: string): Promise<Quota> {
  const { admin, org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const limit = org?.generation_monthly_limit ?? planTier(plan).generateLimit;
  const { start, resetAt } = monthWindow();

  let used = 0;
  if (limit !== null) {
    const { count } = await admin
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("task", "generate")
      .eq("ok", true)
      .gte("created_at", start);
    used = count ?? 0;
  }
  return toQuota(limit, used, resetAt);
}

function toQuota(limit: number | null, used: number, resetAt: string): Quota {
  return {
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetAt,
    exceeded: limit !== null && used >= limit,
  };
}
