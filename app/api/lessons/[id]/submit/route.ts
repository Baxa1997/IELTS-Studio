import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { gradeClosed, mergeOpenResults, type Answers } from "@/lib/lessons/grade";
import { markOpenAnswers } from "@/lib/lessons/grade-open";
import { loadLesson } from "@/lib/lessons/load";
import { isOpen, type OpenExercise } from "@/lib/lessons/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// One batched marking call for every open answer. Comfortably inside the cap;
// the closed score is already stored before it runs, so a timeout costs the
// feedback, never the attempt.
export const maxDuration = 60;

/**
 * POST /api/lessons/[id]/submit — a student hands in a lesson.
 *
 * ORDER MATTERS. The closed half is marked in code and the attempt is STORED
 * first, then the open half goes to a model. A learner who loses their
 * connection, or a model call that fails, must never cost them the work they
 * did — so the row exists before anything fallible is attempted, and open
 * results are merged into it afterwards.
 *
 * The marking here is the same function the browser ran, so what is recorded
 * cannot drift from what they were shown. It is re-run rather than trusted:
 * a client that posts its own score is a client that can post 10/10.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  const profile = session.profile;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    answers?: Answers;
    durationSeconds?: number;
  };
  const answers: Answers = body.answers ?? {};

  // Reads through RLS, so this is the access check: a student can only load a
  // lesson set to a class they are in.
  const lesson = await loadLesson(id);
  if (!lesson) return fail(404, "not_found");

  // Mark the closed half. Open items count toward the ceiling because a signed-in
  // learner here IS getting them marked — the public page is the surface that
  // excludes them, and it never reaches this route.
  const outcome = gradeClosed(lesson.content, answers, { includeOpenInMax: true });

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("lesson_attempts")
    .insert({
      lesson_id: lesson.id,
      student_id: profile.id,
      organization_id: profile.organization_id,
      source: "assignment",
      answers,
      results: outcome.results,
      tag_breakdown: outcome.tagBreakdown,
      score: outcome.score,
      max_score: outcome.maxScore,
      grading_status: outcome.pendingOpenIds.length > 0 ? "pending" : "complete",
      duration_seconds: body.durationSeconds ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[lessons/submit] could not store attempt:", id, error?.message);
    return fail(500, "store_failed");
  }
  const attemptId = created.id as string;

  // Nothing open — they are done.
  if (outcome.pendingOpenIds.length === 0) {
    return NextResponse.json({
      attemptId,
      score: outcome.score,
      maxScore: outcome.maxScore,
      results: outcome.results,
      gradingStatus: "complete",
    });
  }

  // ---- the open half ----------------------------------------------------
  const openItems = lesson.content.exercises.filter(isOpen) as OpenExercise[];
  const requests = openItems
    .filter((e) => outcome.pendingOpenIds.includes(e.id))
    .map((exercise) => ({
      exercise,
      answer: String((answers[exercise.id] as string | undefined) ?? ""),
    }));

  try {
    const marked = await markOpenAnswers(requests, {
      organizationId: profile.organization_id,
      userId: profile.id,
      lessonTitle: lesson.title,
    });
    const merged = mergeOpenResults(outcome, lesson.content, marked);

    await supabase
      .from("lesson_attempts")
      .update({
        results: merged.results,
        tag_breakdown: merged.tagBreakdown,
        score: merged.score,
        max_score: merged.maxScore,
        grading_status: "complete",
      })
      .eq("id", attemptId)
      .select("id"); // RLS-filtered updates report success without this

    return NextResponse.json({
      attemptId,
      score: merged.score,
      maxScore: merged.maxScore,
      results: merged.results,
      gradingStatus: "complete",
    });
  } catch (err) {
    // The attempt survives: their closed score stands and the written answers
    // are stored, which is why the row is written before this call rather than
    // after.
    //
    // BUT NOTHING RETRIES IT. There is no drainer for lesson_attempts — the
    // reading and writing queues do not cover this table — so 'failed' is
    // final and those answers get no feedback ever. `markOpenAnswers` retries
    // once internally for that reason; if it still fails, a teacher marking by
    // hand is the only remaining path, which is what the notice below promises.
    // A drainer is the real fix and does not exist yet.
    console.error("[lessons/submit] open marking failed:", attemptId, err);
    await supabase
      .from("lesson_attempts")
      .update({ grading_status: "failed" })
      .eq("id", attemptId)
      .select("id");

    return NextResponse.json({
      attemptId,
      score: outcome.score,
      maxScore: outcome.maxScore,
      results: outcome.results,
      gradingStatus: "failed",
      notice: "Your written answers couldn't be checked just now — your teacher will see them.",
    });
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
