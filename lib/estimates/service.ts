import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_TARGET_BAND, estimateBand, type Skill } from "./compute";

/**
 * Recompute and persist a student's rolling band estimate for one skill. Called
 * (best-effort) by the grade/submit routes after a submission is graded, so the
 * "current band" tracker always reflects the latest work.
 *
 * Pass the SERVICE-ROLE client: estimates are server-owned (a student can't write
 * their own band), and we read across the student's essays/attempts to gather the
 * full band history. The baseline (the entry-diagnostic result) is frozen the
 * first time a skill is measured and never overwritten; target is preserved.
 */
export async function recomputeSkillEstimate(
  admin: SupabaseClient,
  args: { studentId: string; organizationId: string; skill: Skill },
): Promise<void> {
  const { studentId, organizationId, skill } = args;

  const bands =
    skill === "writing"
      ? await writingBands(admin, studentId, organizationId)
      : skill === "reading"
        ? await readingBands(admin, studentId, organizationId)
        : skill === "listening"
          ? await listeningBands(admin, studentId, organizationId)
          : await speakingBands(admin, studentId, organizationId);

  const { band, sampleCount } = estimateBand(bands);
  if (sampleCount === 0) return; // nothing graded yet → leave any target-only row alone

  // Preserve the frozen baseline + the student's target across recomputes.
  const { data: existing } = await admin
    .from("skill_estimates")
    .select("baseline_band, target_band")
    .eq("student_id", studentId)
    .eq("skill", skill)
    .maybeSingle();

  const baseline = existing?.baseline_band ?? band; // freeze on first measurement
  const target = existing?.target_band ?? DEFAULT_TARGET_BAND;

  const { error } = await admin.from("skill_estimates").upsert(
    {
      student_id: studentId,
      organization_id: organizationId,
      skill,
      current_band: band,
      baseline_band: baseline,
      target_band: target,
      sample_count: sampleCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,skill" },
  );
  if (error) throw new Error(`skill_estimates upsert failed: ${error.message}`);
}

/** One band per essay (its latest grading), oldest→newest. Revisions update the
 *  same essay's sample rather than counting as fresh evidence. */
async function writingBands(
  admin: SupabaseClient,
  studentId: string,
  organizationId: string,
): Promise<number[]> {
  const { data: essays } = await admin
    .from("essays")
    .select("id")
    .eq("student_id", studentId)
    .eq("organization_id", organizationId);
  const ids = (essays ?? []).map((e) => e.id as string);
  if (ids.length === 0) return [];

  const { data: gradings } = await admin
    .from("gradings")
    .select("essay_id, overall_band, created_at")
    .in("essay_id", ids)
    .order("created_at", { ascending: true });

  // Ascending order means the last write per essay_id is its latest grading.
  const latest = new Map<string, { band: number; at: string }>();
  for (const g of gradings ?? []) {
    if (g.overall_band == null) continue;
    latest.set(g.essay_id as string, { band: Number(g.overall_band), at: g.created_at as string });
  }
  return [...latest.values()].sort((a, b) => a.at.localeCompare(b.at)).map((x) => x.band);
}

/** One band per graded reading attempt, oldest→newest. */
async function readingBands(
  admin: SupabaseClient,
  studentId: string,
  organizationId: string,
): Promise<number[]> {
  const { data: attempts } = await admin
    .from("reading_attempts")
    .select("band, created_at")
    .eq("student_id", studentId)
    .eq("organization_id", organizationId)
    .eq("status", "graded")
    .order("created_at", { ascending: true });
  return (attempts ?? []).filter((a) => a.band != null).map((a) => Number(a.band));
}

/** One band per listening attempt (band lives in result.band), oldest→newest.
 *  A listening attempt is auto-graded on submit, so every row has a band. */
async function listeningBands(
  admin: SupabaseClient,
  studentId: string,
  organizationId: string,
): Promise<number[]> {
  const { data: attempts } = await admin
    .from("listening_attempts")
    .select("result, created_at")
    .eq("student_id", studentId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  return (attempts ?? [])
    .map((a) => Number((a.result as { band?: unknown } | null)?.band))
    .filter((b) => Number.isFinite(b) && b > 0);
}

/** One band per graded FULL speaking mock (result.overall_band), oldest→newest.
 *  Part-2 practice is excluded — the full mock is the real, exam-shaped speaking
 *  band; a long-turn-only practice is a partial signal. */
async function speakingBands(
  admin: SupabaseClient,
  studentId: string,
  organizationId: string,
): Promise<number[]> {
  const { data: sessions } = await admin
    .from("speaking_sessions")
    .select("result, started_at")
    .eq("student_id", studentId)
    .eq("organization_id", organizationId)
    .eq("mode", "full")
    .eq("state", "graded")
    .order("started_at", { ascending: true });
  return (sessions ?? [])
    .map((s) => {
      const r = s.result as { overall_band?: unknown; non_attempt?: unknown } | null;
      return r?.non_attempt ? NaN : Number(r?.overall_band);
    })
    .filter((b) => Number.isFinite(b) && b > 0);
}

/**
 * Best-effort refresh of the Listening + Speaking estimates from their source
 * tables. Reading/Writing recompute at grade time (they have an app-side write
 * hook); Listening/Speaking are graded off the app's write path (speaking in the
 * engine), so their estimate is refreshed lazily when the dashboard loads.
 *
 * Each skill is isolated in try/catch: before the `skill` enum migration adds
 * 'listening'/'speaking', the upsert throws and this simply no-ops (the skill
 * shows "not measured yet") — the dashboard never breaks over a pending migration.
 */
export async function refreshDerivedEstimates(
  admin: SupabaseClient,
  args: { studentId: string; organizationId: string },
): Promise<void> {
  for (const skill of ["listening", "speaking"] as const) {
    try {
      await recomputeSkillEstimate(admin, { ...args, skill });
    } catch {
      // pending enum migration, or no data yet — leave the skill unmeasured.
    }
  }
}
