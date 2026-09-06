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
    .select("baseline_band, baseline_source, target_band")
    .eq("student_id", studentId)
    .eq("skill", skill)
    .maybeSingle();

  const target = existing?.target_band ?? DEFAULT_TARGET_BAND;

  /*
   * WHERE THE STUDENT STARTED, and how much that claim is worth.
   *
   * The first measurement stands in as a baseline so progress is computable
   * from day one — but it is labelled `first_attempt`, because it might have
   * been a diagnostic sat properly or a task somebody opened on the bus.
   *
   * A PLACEMENT OVERWRITES IT, ONCE. That is the only thing allowed to move a
   * baseline after it is set: somebody sat a diagnostic on purpose, so that is
   * the real starting point and the incidental one was a placeholder. A second
   * placement does not move it again — a baseline that keeps moving is not a
   * baseline, and re-testing a student who has improved would silently erase
   * the progress the centre is selling.
   */
  const placement = await placementBand(admin, { studentId, organizationId, skill });
  const alreadyPlaced = existing?.baseline_source === "placement";

  let baseline = existing?.baseline_band ?? band;
  let baselineSource = existing?.baseline_source ?? "first_attempt";
  let baselineAt: string | undefined;
  if (placement != null && !alreadyPlaced) {
    baseline = placement.band;
    baselineSource = "placement";
    baselineAt = placement.at;
  }

  const { error } = await admin.from("skill_estimates").upsert(
    {
      student_id: studentId,
      organization_id: organizationId,
      skill,
      current_band: band,
      baseline_band: baseline,
      baseline_source: baselineSource,
      ...(baselineAt ? { baseline_at: baselineAt } : {}),
      target_band: target,
      sample_count: sampleCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,skill" },
  );
  if (error) throw new Error(`skill_estimates upsert failed: ${error.message}`);
}

/**
 * The band from this student's placement practice, if they sat one.
 *
 * WRITING AND READING ONLY, because those are the two skills a placement can
 * currently be set in — assignments carry a prompt, a reading test or a
 * listening library id, and only the first two produce a band we would want to
 * freeze. A centre that placement-tests listening gets `first_attempt` until
 * that path exists, which is the honest answer rather than a wrong one.
 *
 * Returns the EARLIEST placement attempt: if a student somehow sat two, the
 * first is where they started.
 */
async function placementBand(
  admin: SupabaseClient,
  args: { studentId: string; organizationId: string; skill: Skill },
): Promise<{ band: number; at: string } | null> {
  const { studentId, organizationId, skill } = args;
  if (skill !== "writing" && skill !== "reading") return null;

  // Which content ids were set as a placement to a group this student is in.
  const { data: memberships } = await admin
    .from("group_members")
    .select("group_id")
    .eq("student_id", studentId);
  const groupIds = (memberships ?? []).map((m) => m.group_id as string);
  if (groupIds.length === 0) return null;

  const { data: placements } = await admin
    .from("assignments")
    .select("prompt_id, reading_test_id")
    .eq("is_placement", true)
    .in("group_id", groupIds);
  const contentIds = (placements ?? [])
    .map((a) => (skill === "writing" ? a.prompt_id : a.reading_test_id))
    .filter((id): id is string => id != null);
  if (contentIds.length === 0) return null;

  if (skill === "reading") {
    const { data } = await admin
      .from("reading_attempts")
      .select("band, created_at")
      .eq("student_id", studentId)
      .eq("organization_id", organizationId)
      .eq("status", "graded")
      .in("test_id", contentIds)
      .not("band", "is", null)
      .order("created_at", { ascending: true })
      .limit(1);
    const row = data?.[0];
    return row ? { band: Number(row.band), at: row.created_at as string } : null;
  }

  const { data: essays } = await admin
    .from("essays")
    .select("id, created_at")
    .eq("student_id", studentId)
    .eq("organization_id", organizationId)
    .eq("status", "graded")
    .in("prompt_id", contentIds)
    .order("created_at", { ascending: true });
  for (const e of essays ?? []) {
    const { data: g } = await admin
      .from("gradings")
      .select("overall_band")
      .eq("essay_id", e.id as string)
      .not("overall_band", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (g?.[0]?.overall_band != null) {
      return { band: Number(g[0].overall_band), at: e.created_at as string };
    }
  }
  return null;
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
