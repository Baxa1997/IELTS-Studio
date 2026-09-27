import { NextResponse } from "next/server";

import { onTodaysList } from "@/lib/free-practice/assignment";
import { DONE_COOKIE, DONE_COOKIE_OPTIONS, doneToday, writeDone } from "@/lib/free-practice/visitor";
import { gradeReadingAttempt, type GradableQuestion } from "@/lib/reading/grade";
import { READING_DISCLAIMER } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";

// Objective marking only — no model call. Node runtime for the service-role
// client, which is the only way to read answer keys (and a visitor has no
// session for RLS to use anyway).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/public/practice/reading — marks today's free Reading practice.
 * Body: { passageId, answers: { [questionId]: string } }
 *
 * No auth, and nothing stored: there is no account to own an attempt. What
 * guards it is the rotation itself — the passage must be on THIS visitor's list
 * today, and today's free practice must not be used already — so the route
 * cannot be used to mark, and so read the keys of, any passage in the library
 * by id. Success returns the same review the signed-in route does and marks
 * the day done.
 */
export async function POST(req: Request): Promise<Response> {
  const { passageId, answers } = await readBody(req);

  const today = passageId ? await onTodaysList("reading", passageId) : null;
  if (!today) return fail(409, "not_today");
  if (today.done) return fail(429, "daily_done");

  const admin = createAdminClient();
  const [{ data: passage }, { data: rows, error }] = await Promise.all([
    admin.from("reading_passages").select("id, title").eq("id", passageId).is("organization_id", null).maybeSingle(),
    admin
      .from("reading_questions")
      .select("id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation")
      .eq("passage_id", passageId)
      .is("organization_id", null)
      .order("order_index", { ascending: true }),
  ]);
  if (error) return fail(500, "load_failed");
  if (!passage) return fail(404, "passage_not_found");
  if (!rows || rows.length === 0) return fail(422, "no_questions");

  const grade = gradeReadingAttempt(rows as GradableQuestion[], answers);

  const res = NextResponse.json({
    result: {
      passageTitle: passage.title,
      total: grade.total,
      correctCount: grade.correctCount,
      percent: grade.percent,
      band: grade.band,
      typeBreakdown: grade.typeBreakdown,
      items: grade.items,
    },
    disclaimer: READING_DISCLAIMER,
  });
  res.cookies.set(DONE_COOKIE, writeDone(await doneToday(today.day), "reading", today.day), DONE_COOKIE_OPTIONS);
  return res;
}

/** Tolerate a missing or garbage body: no passage, and no answers (all wrong). */
async function readBody(req: Request): Promise<{ passageId: string | null; answers: Record<string, string> }> {
  try {
    const body = (await req.json()) as { passageId?: unknown; answers?: unknown };
    const answers: Record<string, string> = {};
    if (body && typeof body.answers === "object" && body.answers !== null) {
      for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
        if (typeof v === "string") answers[k] = v;
      }
    }
    return { passageId: typeof body?.passageId === "string" ? body.passageId : null, answers };
  } catch {
    return { passageId: null, answers: {} };
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
