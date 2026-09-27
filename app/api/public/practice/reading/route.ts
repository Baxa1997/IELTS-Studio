import { NextResponse } from "next/server";

import { onTodaysList } from "@/lib/free-practice/assignment";
import { DONE_COOKIE, DONE_COOKIE_OPTIONS, doneToday, writeDone } from "@/lib/free-practice/visitor";
import { gradeReadingAttempt, gradeReadingTest, type GradableQuestion } from "@/lib/reading/grade";
import { READING_DISCLAIMER } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";

// Objective marking only — no model call. Node runtime for the service-role
// client, which is the only way to read answer keys (and a visitor has no
// session for RLS to use anyway).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/public/practice/reading — marks today's free Reading practice.
 * Body: { testId, answers } for a full test, { passageId, answers } for one
 * passage; `answers` is { [questionId]: string }.
 *
 * No auth, and nothing stored: there is no account to own an attempt. What
 * guards it is the rotation itself — the practice must be on THIS visitor's
 * list today, and today's free practice must not be used already — so the
 * route cannot be used to mark, and so read the keys of, anything in the
 * library by id. Success returns the same review the signed-in route does and
 * marks the day done.
 *
 * ⚠️ THE FORMAT MUST MATCH THE LIST. A test id is only ever marked as the full
 * test the list offers, and a passage id only as the one passage: otherwise a
 * visitor offered one passage of a test could post its test id and take the
 * other two passages' keys with it.
 */
export async function POST(req: Request): Promise<Response> {
  const { testId, passageId, answers } = await readBody(req);
  const key = testId ?? passageId;
  const today = key ? await onTodaysList("reading", key) : null;
  if (!today || today.item.format !== (testId ? "full" : "part")) return fail(409, "not_today");
  if (today.done) return fail(429, "daily_done");

  const res = testId ? await markTest(today.item.source, answers) : await markPassage(today.item.source, answers);
  if (res.status === 200) {
    res.cookies.set(DONE_COOKIE, writeDone(await doneToday(today.day), "reading", today.day), DONE_COOKIE_OPTIONS);
  }
  return res;
}

/** A full library test — the signed-in /api/reading/test/[id]/submit's marking and review. */
async function markTest(testId: string, answers: Record<string, string>): Promise<NextResponse> {
  const admin = createAdminClient();
  const { data: passages, error: pErr } = await admin
    .from("reading_passages")
    .select("id, title, order_in_test")
    .eq("test_id", testId)
    .eq("is_library", true)
    .order("order_in_test", { ascending: true });
  if (pErr) return fail(500, "load_failed");
  if (!passages || passages.length === 0) return fail(404, "test_not_found");

  const meta = new Map(
    passages.map((p) => [p.id as string, { order: (p.order_in_test as number | null) ?? 1, title: (p.title as string) ?? "" }]),
  );
  const { data: rows, error } = await admin
    .from("reading_questions")
    .select("id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation, passage_id")
    .in("passage_id", [...meta.keys()])
    .is("organization_id", null)
    .order("order_index", { ascending: true });
  if (error) return fail(500, "load_failed");
  if (!rows || rows.length === 0) return fail(422, "no_questions");

  const grade = gradeReadingTest(
    rows.map((q) => ({
      ...(q as GradableQuestion),
      passage_order: meta.get(q.passage_id as string)?.order,
      passage_title: meta.get(q.passage_id as string)?.title,
    })),
    answers,
  );
  return NextResponse.json({
    result: {
      total: grade.total,
      correctCount: grade.correctCount,
      percent: grade.percent,
      band: grade.band,
      passages: grade.passages,
      typeBreakdown: grade.typeBreakdown,
      items: grade.items,
    },
    disclaimer: READING_DISCLAIMER,
  });
}

/** One passage — the signed-in /api/reading/[id]/submit's marking and review. */
async function markPassage(passageId: string, answers: Record<string, string>): Promise<NextResponse> {
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
  if (error) return fail(500, "load_failed");
  if (!passage) return fail(404, "passage_not_found");
  if (!rows || rows.length === 0) return fail(422, "no_questions");

  const grade = gradeReadingAttempt(rows as GradableQuestion[], answers);
  return NextResponse.json({
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
}

/** Tolerate a missing or garbage body: no practice, and no answers (all wrong). */
async function readBody(
  req: Request,
): Promise<{ testId: string | null; passageId: string | null; answers: Record<string, string> }> {
  try {
    const body = (await req.json()) as { testId?: unknown; passageId?: unknown; answers?: unknown };
    const answers: Record<string, string> = {};
    if (body && typeof body.answers === "object" && body.answers !== null) {
      for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
        if (typeof v === "string") answers[k] = v;
      }
    }
    return {
      testId: typeof body?.testId === "string" ? body.testId : null,
      passageId: typeof body?.passageId === "string" ? body.passageId : null,
      answers,
    };
  } catch {
    return { testId: null, passageId: null, answers: {} };
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
