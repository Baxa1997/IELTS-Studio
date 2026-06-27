import "server-only";

import { loadStudentEstimates } from "@/lib/estimates/load";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  deriveWeeklyGoal,
  isoInDays,
  levelCheckCadenceDays,
  studyPlanInputSchema,
  type StudyPlan,
  type StudyPlanInput,
} from "./types";

/**
 * Study-plan persistence. The learner-set fields (target, exam date, self-report,
 * weekly goal) go through the RLS client (own row only). The overall target is
 * also mirrored onto skill_estimates.target_band via the service-role client,
 * because those rows are server-owned (a student can't write their own band) — but
 * setting a *target* is legitimate and keeps the existing trackers/TargetCard in
 * sync.
 */

const COLUMNS =
  "self_reported_band, target_band, exam_date, weekly_goal, last_level_check_at, next_level_check_at, starter_seeded, created_at";

export interface PlanActor {
  studentId: string;
  organizationId: string;
}

function rowToPlan(r: Record<string, unknown> | null): StudyPlan | null {
  if (!r) return null;
  return {
    selfReportedBand: r.self_reported_band != null ? Number(r.self_reported_band) : null,
    targetBand: r.target_band != null ? Number(r.target_band) : 7,
    examDate: (r.exam_date as string | null) ?? null,
    weeklyGoal: (r.weekly_goal as number | null) ?? 5,
    lastLevelCheckAt: (r.last_level_check_at as string | null) ?? null,
    nextLevelCheckAt: (r.next_level_check_at as string | null) ?? null,
    starterSeeded: Boolean(r.starter_seeded),
    createdAt: (r.created_at as string | null) ?? new Date().toISOString(),
  };
}

/** The learner's plan, or null if they haven't onboarded yet. */
export async function loadStudyPlan(studentId: string): Promise<StudyPlan | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("study_plans")
    .select(COLUMNS)
    .eq("student_id", studentId)
    .maybeSingle();
  return rowToPlan(data as Record<string, unknown> | null);
}

/**
 * Create or update a learner's plan. On first creation we schedule the first
 * level re-check; on edit we keep the existing schedule. Returns the saved plan.
 */
export async function saveStudyPlan(actor: PlanActor, rawInput: StudyPlanInput): Promise<StudyPlan> {
  const input = studyPlanInputSchema.parse(rawInput);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("study_plans")
    .select("next_level_check_at")
    .eq("student_id", actor.studentId)
    .maybeSingle();

  const estimates = await loadStudentEstimates(actor.studentId);
  const currentBand = Math.max(
    estimates.bySkill.reading.currentBand ?? 0,
    estimates.bySkill.writing.currentBand ?? 0,
  ) || null;

  const weeklyGoal =
    input.weeklyGoal ??
    deriveWeeklyGoal({ targetBand: input.targetBand, currentBand, examDate: input.examDate });

  // Schedule the first re-check on creation; preserve it on later edits.
  const nextCheck =
    (existing?.next_level_check_at as string | null) ??
    isoInDays(levelCheckCadenceDays(input.examDate));

  const { data, error } = await supabase
    .from("study_plans")
    .upsert(
      {
        student_id: actor.studentId,
        organization_id: actor.organizationId,
        self_reported_band: input.selfReportedBand,
        target_band: input.targetBand,
        exam_date: input.examDate,
        weekly_goal: weeklyGoal,
        next_level_check_at: nextCheck,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id" },
    )
    .select(COLUMNS)
    .single();
  if (error || !data) throw new Error(`study_plans upsert failed: ${error?.message ?? "unknown"}`);

  await propagateTarget(actor, input.targetBand);

  return rowToPlan(data as Record<string, unknown>)!;
}

/** Mirror the overall target onto both skill_estimates rows (target only — never
 *  touches the measured bands). Service-role: skill_estimates has no authed write. */
async function propagateTarget(actor: PlanActor, targetBand: number): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  for (const skill of ["reading", "writing"] as const) {
    await admin.from("skill_estimates").upsert(
      {
        student_id: actor.studentId,
        organization_id: actor.organizationId,
        skill,
        target_band: targetBand,
        updated_at: now,
      },
      { onConflict: "student_id,skill" },
    );
  }
}

/**
 * Graded tasks the learner completed in the last 7 days (essays graded + reading
 * attempts) — the numerator for the weekly quota. RLS client = own work only.
 */
export async function countTasksThisWeek(studentId: string): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { data: essays } = await supabase.from("essays").select("id").eq("student_id", studentId);
  const ids = (essays ?? []).map((e) => e.id as string);
  let writing = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from("gradings")
      .select("id", { count: "exact", head: true })
      .in("essay_id", ids)
      .gte("created_at", since);
    writing = count ?? 0;
  }

  const { count: reading } = await supabase
    .from("reading_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "graded")
    .gte("created_at", since);

  return writing + (reading ?? 0);
}

/**
 * Record that the learner did an explicit level re-check now, and schedule the
 * next one by the current cadence (fortnightly, tighter near the exam).
 */
export async function recordLevelCheck(studentId: string): Promise<void> {
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("study_plans")
    .select("exam_date")
    .eq("student_id", studentId)
    .maybeSingle();
  const cadence = levelCheckCadenceDays((plan?.exam_date as string | null) ?? null);
  const now = new Date();
  await supabase
    .from("study_plans")
    .update({ last_level_check_at: now.toISOString(), next_level_check_at: isoInDays(cadence, now) })
    .eq("student_id", studentId);
}
