import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { gradeEssay, type EssayGrade, type GradeEssayInput } from "@/lib/ai";
import { recomputeSkillEstimate } from "@/lib/estimates/service";

/**
 * The grade-and-persist core, shared by the request route and the queue drainer
 * so there is ONE grading code path. The caller is responsible for having already
 * claimed the essay (status = 'grading'); this runs the model, snapshots the
 * graded version, stores the grading, marks the essay graded, re-rolls the
 * student's estimate, and returns the trajectory.
 *
 * Failures are typed by phase so callers can react: a "grade" failure (model)
 * leaves the essay claimed for the caller to queue; a "persist" failure has
 * already reverted the essay to 'submitted'.
 */

export class GradingError extends Error {
  constructor(
    message: string,
    readonly phase: "grade" | "persist",
  ) {
    super(message);
    this.name = "GradingError";
  }
}

export interface GradableEssay {
  id: string;
  organization_id: string;
  student_id: string;
  task_type: string;
  content: string;
  word_count: number | null;
}

export interface GradingOutcome {
  grading: Record<string, unknown>;
  previous: Record<string, unknown> | null;
  history: unknown[];
  disclaimer: string;
}

export async function runGrading(
  admin: SupabaseClient,
  args: { essay: GradableEssay; promptText: string; figureText?: string; userId: string },
): Promise<GradingOutcome> {
  const { essay, promptText, figureText, userId } = args;

  // 1) Grade (one extra retry on top of the pipeline's internal transient retries).
  let grade: EssayGrade;
  try {
    grade = await gradeWithRetry({
      taskType: essay.task_type as GradeEssayInput["taskType"],
      promptText,
      // Academic Task 1 only: the figure's data, so the grader can check accuracy.
      ...(figureText ? { figure: figureText } : {}),
      essayText: essay.content,
      meta: { organizationId: essay.organization_id, userId, essayId: essay.id },
    });
  } catch (err) {
    throw new GradingError(errMsg(err), "grade"); // essay left claimed; caller queues
  }

  // 2) Read the prior grade (the "before") before adding this one.
  const { data: previous } = await admin
    .from("gradings")
    .select("overall_band, criteria, score_blocker, band_with_fixes, version_no, created_at")
    .eq("essay_id", essay.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3) Snapshot the exact text judged (the revision loop's honest before/after).
  const { data: lastVersion } = await admin
    .from("essay_versions")
    .select("version_no")
    .eq("essay_id", essay.id)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  const versionNo = (lastVersion?.version_no ?? 0) + 1;

  const { data: version, error: verErr } = await admin
    .from("essay_versions")
    .insert({
      essay_id: essay.id,
      organization_id: essay.organization_id,
      version_no: versionNo,
      content: essay.content,
      word_count: essay.word_count ?? 0,
    })
    .select("id, version_no")
    .single();
  if (verErr || !version) {
    await admin.from("essays").update({ status: "submitted" }).eq("id", essay.id);
    throw new GradingError(`snapshot failed: ${verErr?.message ?? "unknown"}`, "persist");
  }

  // 4) Store the grading (service-role: AI gradings have graded_by = null).
  const { data: stored, error: insErr } = await admin
    .from("gradings")
    .insert({
      essay_id: essay.id,
      organization_id: essay.organization_id,
      version_id: version.id,
      version_no: version.version_no,
      model: grade.model,
      overall_band: grade.overall_band,
      criteria: grade.criteria,
      score_blocker: grade.score_blocker,
      band_with_fixes: grade.band_with_fixes,
      annotations: grade.annotations ?? [],
      is_teacher_override: false,
      graded_by: null,
    })
    .select("id, essay_id, overall_band, criteria, score_blocker, band_with_fixes, annotations, model, created_at, version_no")
    .single();
  if (insErr || !stored) {
    await admin.from("essays").update({ status: "submitted" }).eq("id", essay.id);
    throw new GradingError(`store failed: ${insErr?.message ?? "unknown"}`, "persist");
  }

  await admin.from("essays").update({ status: "graded" }).eq("id", essay.id);

  // 5) Re-roll the writing estimate (best-effort).
  try {
    await recomputeSkillEstimate(admin, {
      studentId: essay.student_id,
      organizationId: essay.organization_id,
      skill: "writing",
    });
  } catch (err) {
    console.error("[grading] estimate recompute failed:", essay.id, errMsg(err));
  }

  const { data: history } = await admin
    .from("gradings")
    .select("version_no, overall_band, created_at")
    .eq("essay_id", essay.id)
    .order("version_no", { ascending: true });

  return {
    // `annotations` is persisted now, so the stored row already carries them; the
    // fallback just guards an older row read back without the column.
    grading: { annotations: grade.annotations ?? [], ...(stored as Record<string, unknown>) },
    previous: (previous ?? null) as Record<string, unknown> | null,
    history: history ?? [],
    disclaimer: grade.disclaimer,
  };
}

async function gradeWithRetry(input: GradeEssayInput): Promise<EssayGrade> {
  try {
    return await gradeEssay(input);
  } catch (first) {
    console.warn("[grading] first attempt failed, retrying once:", errMsg(first));
    return await gradeEssay(input); // second failure → caller handles
  }
}

function errMsg(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 500);
}
