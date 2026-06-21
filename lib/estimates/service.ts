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
      : await readingBands(admin, studentId, organizationId);

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
