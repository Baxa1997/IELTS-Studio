import "server-only";

import { planTier, type OrgPlan } from "@/lib/billing/plans";
import { hasLapsed } from "@/lib/billing/lifecycle";
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

/**
 * The org, with a lapsed plan already treated as trial.
 *
 * WHY EXPIRY IS ENFORCED ON THE READ PATH AND NOT ONLY BY THE CRON. The nightly
 * job (lib/billing/expiry.ts) does the durable work — it downgrades the row,
 * closes the subscription and sends the email. But a job that runs daily is a
 * job that can be up to a day late, and quota is read hundreds of times a day.
 * Without this, every expiry handed out a free day of Pro; with a missed run, a
 * free week.
 *
 * It DERIVES rather than writes: no update happens here, so a hot read path
 * stays a read. The cron is still what makes the downgrade real and what tells
 * the learner. This just refuses to sell them something they no longer have.
 *
 * `hasLapsed` is deliberately narrow — an org with no subscription row, or one
 * with no end date, is NOT lapsed. Several paid orgs here are exactly that:
 * comped accounts, the shared library orgs, and plans granted by hand from the
 * admin console. Treating them as expired would have downgraded every one.
 *
 * For Stripe it allows a few days past the period end, because Stripe renews by
 * itself and a renewal webhook that lands late must not throttle somebody who
 * has just been charged. The nightly job asks Stripe directly inside that window.
 *
 * Per-org limit overrides are NOT cleared here. They are an admin's explicit
 * decision, and the durable downgrade (lib/billing/downgrade.ts) leaves them in
 * place too — if this cleared them, the allowance would change shape the moment
 * the nightly job ran.
 */
async function loadOrg(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("plan, grading_monthly_limit, generation_monthly_limit, billing_enforced, subscriptions(status, current_period_end, provider)")
    .eq("id", organizationId)
    .single();

  if (!data) return { admin, org: data };

  const sub = Array.isArray(data.subscriptions) ? data.subscriptions[0] : data.subscriptions;
  if (hasLapsed(sub)) {
    return { admin, org: { ...data, plan: "trial" } };
  }
  return { admin, org: data };
}

type LoadedOrg = Awaited<ReturnType<typeof loadOrg>>;

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
  return getGradingQuotaFromOrg(organizationId, await loadOrg(organizationId));
}

async function getGradingQuotaFromOrg(organizationId: string, loaded: LoadedOrg): Promise<Quota> {
  const { admin, org } = loaded;
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
  return getGenerationQuotaFromOrg(organizationId, await loadOrg(organizationId));
}

async function getGenerationQuotaFromOrg(organizationId: string, loaded: LoadedOrg): Promise<Quota> {
  const { admin, org } = loaded;
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
  const loaded = await loadOrg(organizationId);
  const { org } = loaded;
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const [grade, generate, speaking] = await Promise.all([
    getGradingQuotaFromOrg(organizationId, loaded),
    getGenerationQuotaFromOrg(organizationId, loaded),
    getSpeakingQuotaFromOrg(organizationId, loaded),
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
  return getSpeakingQuotaFromOrg(organizationId, await loadOrg(organizationId));
}

async function getSpeakingQuotaFromOrg(organizationId: string, loaded: LoadedOrg): Promise<Quota> {
  const { admin, org } = loaded;
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
