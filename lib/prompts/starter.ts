import "server-only";

import type { StudyPlan } from "@/lib/plan/types";
import { createAdminClient } from "@/lib/supabase/admin";

import { STARTER_PROMPTS } from "./starter-set";

/**
 * Copy the curated starter prompts into a learner's org the first time they reach
 * the library. One-time and race-safe: we claim the seed by flipping
 * study_plans.starter_seeded → true with a conditional update, so two concurrent
 * loads can't both insert. Service-role, because RLS only lets teachers/admins
 * write writing_prompts — this is a system-owned content op (CLAUDE.md).
 *
 * Best-effort: any failure rolls the flag back so a later visit retries; it never
 * throws into the page render.
 */
export async function seedStarterPrompts(
  actor: { studentId: string; organizationId: string },
  plan: StudyPlan,
): Promise<void> {
  if (plan.starterSeeded) return;

  const admin = createAdminClient();

  // Claim the seed: only the request that flips false→true proceeds.
  const { data: claimed } = await admin
    .from("study_plans")
    .update({ starter_seeded: true })
    .eq("student_id", actor.studentId)
    .eq("starter_seeded", false)
    .select("student_id");
  if (!claimed || claimed.length === 0) return;

  try {
    const rows = STARTER_PROMPTS.map((p) => ({
      organization_id: actor.organizationId,
      task_type: p.task_type,
      category: p.category,
      prompt_text: p.prompt_text,
      figure: p.figure ?? null,
      topic_family: p.topic_family,
      difficulty: p.difficulty,
      status: "approved",
      source: "seed",
      created_by: actor.studentId,
    }));
    const { error } = await admin.from("writing_prompts").insert(rows);
    if (error) throw new Error(error.message);
  } catch (err) {
    // Roll the flag back so the next visit retries the seed.
    await admin.from("study_plans").update({ starter_seeded: false }).eq("student_id", actor.studentId);
    console.error("[starter] seed failed:", err instanceof Error ? err.message : err);
  }
}
