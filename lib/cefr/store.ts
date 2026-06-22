import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

import type { CefrLevel } from "./levels";
import { CEFR_GRADE_DISCLAIMER, type CefrGrade, type CefrGradeResult } from "./schema";

/**
 * Persistence for CEFR writing attempts (the learner's distinct-track history).
 * Writes go through the service-role admin client (the grader is a system op, like
 * ai_usage); reads go through the request's RLS-scoped client so a learner only
 * ever sees their own. All writes are BEST-EFFORT: a failure (e.g. the migration
 * not yet applied) must never break grading — it just means no history is saved.
 */

export interface SaveCefrAttemptInput {
  organizationId: string;
  studentId: string;
  taskId: string | null;
  taskTitle: string | null;
  targetLevel: CefrLevel;
  genre: string;
  prompt: string;
  response: string;
  grade: CefrGradeResult;
}

export interface CefrAttemptSummary {
  id: string;
  task_title: string | null;
  target_level: string;
  estimated_level: string;
  on_target: boolean;
  genre: string;
  created_at: string;
}

export interface CefrAttemptRow extends CefrAttemptSummary {
  task_id: string | null;
  prompt: string;
  response: string;
  model: string | null;
  /** The full CefrGrade (subscales, summary, strengths, …) as stored. */
  grade: CefrGrade;
}

/** Store one graded attempt. Returns its id, or null on any failure (best-effort). */
export async function saveCefrAttempt(input: SaveCefrAttemptInput): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { grade } = input;
    // Persist only the assessment fields in `grade`; provenance (model/disclaimer)
    // is stored/derived separately.
    const stored: CefrGrade = {
      estimated_level: grade.estimated_level,
      target_level: grade.target_level,
      on_target: grade.on_target,
      subscales: grade.subscales,
      summary: grade.summary,
      strengths: grade.strengths,
      improvements: grade.improvements,
      next_level: grade.next_level,
    };
    const { data, error } = await admin
      .from("cefr_attempts")
      .insert({
        organization_id: input.organizationId,
        student_id: input.studentId,
        skill: "writing",
        task_id: input.taskId,
        task_title: input.taskTitle,
        target_level: input.targetLevel,
        genre: input.genre,
        prompt: input.prompt,
        response: input.response,
        estimated_level: grade.estimated_level,
        on_target: grade.on_target,
        model: grade.model,
        grade: stored,
      })
      .select("id")
      .single();
    if (error) throw error;
    return (data?.id as string) ?? null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[cefr.store] save failed (history not recorded):", err);
    }
    return null;
  }
}

/** The learner's most recent attempts (RLS scopes to their own). Best-effort: an
 *  error (e.g. table missing) yields an empty list rather than throwing. */
export async function loadRecentCefrAttempts(
  supabase: SupabaseClient,
  limit = 8,
): Promise<CefrAttemptSummary[]> {
  try {
    const { data, error } = await supabase
      .from("cefr_attempts")
      .select("id, task_title, target_level, estimated_level, on_target, genre, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as CefrAttemptSummary[];
  } catch {
    return [];
  }
}

/** One attempt by id (RLS ensures it's the learner's own), or null. */
export async function getCefrAttempt(
  supabase: SupabaseClient,
  id: string,
): Promise<CefrAttemptRow | null> {
  try {
    const { data, error } = await supabase
      .from("cefr_attempts")
      .select(
        "id, task_id, task_title, target_level, estimated_level, on_target, genre, prompt, response, model, grade, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as CefrAttemptRow | null) ?? null;
  } catch {
    return null;
  }
}

/** Rebuild the runtime grade shape (adds back provenance) from a stored row. */
export function attemptToGradeResult(row: CefrAttemptRow): CefrGradeResult {
  return { ...row.grade, model: row.model ?? "", disclaimer: CEFR_GRADE_DISCLAIMER };
}
