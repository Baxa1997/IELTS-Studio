import "server-only";

import { gradeReadingAttempt, type GradableQuestion, type ReadingGrade } from "@/lib/reading/grade";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mark one SHARED library passage for a visitor with no account — the
 * signed-in /api/reading/[id]/submit's marking and review, read with the
 * service role because there is no session for RLS to use.
 *
 * Two routes call it: the free daily practice (/api/public/practice/reading)
 * and the daily challenge (/api/public/practice/challenge).
 *
 * ⚠️ THIS RETURNS ANSWER KEYS (in `items`). It checks only that the passage is
 * a shared library one — WHICH passage a visitor may have marked is each
 * caller's job, and both refuse anything but the one they offered today.
 */
export type MarkedPassage =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      result: { passageTitle: string } & Pick<
        ReadingGrade,
        "total" | "correctCount" | "percent" | "band" | "typeBreakdown" | "items"
      >;
    };

export async function markLibraryPassage(passageId: string, answers: Record<string, string>): Promise<MarkedPassage> {
  const admin = createAdminClient();
  const [{ data: passage }, { data: rows, error }] = await Promise.all([
    admin.from("reading_passages").select("id, title").eq("id", passageId).eq("is_library", true).maybeSingle(),
    admin
      .from("reading_questions")
      .select("id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation")
      .eq("passage_id", passageId)
      .is("organization_id", null)
      .order("order_index", { ascending: true }),
  ]);
  if (error) return { ok: false, status: 500, error: "load_failed" };
  if (!passage) return { ok: false, status: 404, error: "passage_not_found" };
  if (!rows || rows.length === 0) return { ok: false, status: 422, error: "no_questions" };

  const grade = gradeReadingAttempt(rows as GradableQuestion[], answers);
  return {
    ok: true,
    result: {
      passageTitle: passage.title as string,
      total: grade.total,
      correctCount: grade.correctCount,
      percent: grade.percent,
      band: grade.band,
      typeBreakdown: grade.typeBreakdown,
      items: grade.items,
    },
  };
}
