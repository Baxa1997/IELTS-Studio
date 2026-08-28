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
    .select("plan, grading_monthly_limit, generation_monthly_limit, billing_enforced")
    .eq("id", organizationId)
    .single();
  return { admin, org: data };
}

/**
 * The billing switch. Education centers run unmetered for now (see migration
 * 20260807150000): an org with `billing_enforced = false` gets an unlimited
 * quota regardless of its plan. Flipping the column starts enforcement
 * everywhere at once, because every quota read passes through here.
 *
 * Defaults to enforcing when the column or the row is missing — a lookup
 * failure must never silently hand out unlimited AI.
 */
function effectiveLimit(
  org: { billing_enforced?: boolean | null } | null,
  planLimit: number | null,
): number | null {
  return org?.billing_enforced === false ? null : planLimit;
}

/** Monthly AI-grading quota (AI gradings only — teacher overrides don't count). */
export async function getGradingQuota(organizationId: string): Promise<Quota> {
  const { admin, org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const limit = effectiveLimit(org, org?.grading_monthly_limit ?? planTier(plan).gradeLimit);
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

/** Monthly practice quota. Counted at the PRACTICE level (task='practice',
 *  one row per user-initiated practice — recordPracticeUse / the engine's
 *  record_practice), NOT per model call: a full reading test or a listening
 *  part burns several `generate` rows (retries, validators, multiple
 *  passages), and users rightly expect "one practice = one count". */
export async function getGenerationQuota(organizationId: string): Promise<Quota> {
  const { admin, org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const limit = effectiveLimit(org, org?.generation_monthly_limit ?? planTier(plan).generateLimit);
  const { start, resetAt } = monthWindow();

  let used = 0;
  if (limit !== null) {
    const { count } = await admin
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("task", "practice")
      .eq("ok", true)
      .gte("created_at", start);
    used = count ?? 0;
  }
  return toQuota(limit, used, resetAt);
}

/** Record ONE practice use (the unit the quota counts). Best-effort — a
 *  logging failure must never break the practice itself. */
export async function recordPracticeUse(args: {
  organizationId: string;
  userId?: string | null;
  kind: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage").insert({
      organization_id: args.organizationId,
      user_id: args.userId ?? null,
      task: "practice",
      provider: "internal",
      model: "-",
      request_kind: args.kind,
      latency_ms: 0,
      ok: true,
    });
  } catch (err) {
    console.error("[quota] recordPracticeUse failed:", err);
  }
}

export interface UsageSummary {
  plan: OrgPlan;
  planName: string;
  grade: Quota;
  generate: Quota;
  /** Live 3-part speaking mocks — the most expensive thing a learner can start. */
  speaking: Quota;
}

/** One call for the sidebar plan card: plan + every monthly quota. */
export async function getUsageSummary(organizationId: string): Promise<UsageSummary> {
  const { org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const [grade, generate, speaking] = await Promise.all([
    getGradingQuota(organizationId),
    getGenerationQuota(organizationId),
    getSpeakingQuota(organizationId),
  ]);
  return { plan, planName: planTier(plan).name, grade, generate, speaking };
}

/**
 * How many live full mocks this org has left this month.
 *
 * READ-ONLY MIRROR of the engine's `ensure_full_mock_quota` (quota.py), which is
 * what actually admits or refuses a session. The counting rule is copied
 * deliberately, down to the `pending` exclusion: a learner who taps "start" and
 * backs out never connects, spends no Live minutes, and must not be charged a
 * mock. If that rule ever changes in the engine it has to change here too, or
 * the sidebar will promise a session the engine then refuses.
 *
 * Not mirrored: the engine's comped-org list (unlimited mocks for the owner and
 * one other account). Those orgs will see a limit here that is not enforced on
 * them — harmless, and better than duplicating an allow-list across repos.
 */
export async function getSpeakingQuota(organizationId: string): Promise<Quota> {
  const { admin, org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const limit = planTier(plan).fullMockLimit;
  const { start, resetAt } = monthWindow();

  const { count } = await admin
    .from("speaking_sessions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("mode", "full")
    .neq("state", "pending")
    .gte("started_at", start);

  return toQuota(limit, count ?? 0, resetAt);
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

/**
 * How much of the ready-made library this org has opened, and whether it may
 * open more.
 *
 * ⚠️ NOT A MONTHLY WINDOW, unlike everything above it. Gradings and generations
 * reset each month because they are consumption; a library unlock is a
 * PERMANENT entitlement — the learner keeps the copy, can re-open it forever,
 * and re-opening must never cost a second unlock. So this counts for all time
 * and `resetAt` is meaningless here.
 *
 * IT NEEDS NO TABLE. A learner opens a library item by cloning it, and the
 * clone records `library_key` — the template it came from. Distinct
 * `library_key` values in the org therefore ARE the unlock count, already
 * written by the code that does the opening. A separate counter could drift
 * from the thing it counts; this cannot.
 *
 * Centres are unmetered like everywhere else: `billing_enforced = false` makes
 * the limit null, so a centre's students are never shown a locked shelf.
 */
export async function getLibraryQuota(organizationId: string): Promise<Omit<Quota, "resetAt">> {
  const { admin, org } = await loadOrg(organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const limit = effectiveLimit(org, planTier(plan).libraryLimit);

  // Both shapes count against one shelf: a learner who has opened 10 passages
  // has used the allowance, whether or not any of them were full tests.
  const [tests, passages] = await Promise.all([
    admin
      .from("reading_tests")
      .select("library_key")
      .eq("organization_id", organizationId)
      .not("library_key", "is", null),
    admin
      .from("reading_passages")
      .select("library_key")
      .eq("organization_id", organizationId)
      .not("library_key", "is", null),
  ]);
  const keys = new Set<string>();
  for (const row of [...(tests.data ?? []), ...(passages.data ?? [])]) {
    const key = (row as { library_key: string | null }).library_key;
    if (key) keys.add(key);
  }
  const used = keys.size;

  return {
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
    exceeded: limit !== null && used >= limit,
  };
}

/**
 * May this org open THIS library item?
 *
 * Something already opened is always allowed through, however far over the
 * limit the org is. Re-opening is not a new unlock — the copy is already
 * theirs, and a learner locked out of work they have already started would be
 * a bug that looks like theft.
 */
export async function canOpenLibraryItem(
  organizationId: string,
  libraryKey: string,
): Promise<{ allowed: boolean; quota: Omit<Quota, "resetAt"> }> {
  const quota = await getLibraryQuota(organizationId);
  if (!quota.exceeded) return { allowed: true, quota };

  const { admin } = await loadOrg(organizationId);
  for (const table of ["reading_tests", "reading_passages"] as const) {
    const { data } = await admin
      .from(table)
      .select("id")
      .eq("organization_id", organizationId)
      .eq("library_key", libraryKey)
      .limit(1);
    if ((data ?? []).length > 0) return { allowed: true, quota };
  }
  return { allowed: false, quota };
}
