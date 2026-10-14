import { NextResponse } from "next/server";

import { engineConfigured, EngineUnavailable, multilevelPublic } from "@/lib/free-practice/engine";
import {
  CEFR_MAX_WORDS,
  CEFR_MIN_WORDS,
  isCefrTaskId,
  resolveCefrTask,
  type CefrWritingGrade,
} from "@/lib/public-grader/cefr";
import { countWords } from "@/lib/public-grader/prompts";
import { checkAndRecord, clientIp, hashIp } from "@/lib/public-grader/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

// A writing grade is a model call on the engine; give it the full window.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/public/grade/cefr — the no-login checker's CEFR Writing tab.
 * Body: { task: "1.1" | "1.2" | "2", sampleId? | customTask?, answer }
 *
 * The visitor's OWN task (or one of ours, or none) and their answer, graded by
 * the engine's Multilevel grader — the same rubric call a signed-in learner's
 * paper gets — reached server to server with the internal key. Nothing is
 * stored: there is no account and no paper.
 *
 * The same three defences as the IELTS tabs, in the same order: the bounds
 * (checked before anything is spent), then the public grader's per-IP and
 * global ceilings in the database — one budget across every tab and the daily
 * practice, because the visitor is one visitor whichever tab they write in.
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const task = resolveCefrTask(body);
  if (!task) return fail(422, isCefrTaskId(body.task) ? "prompt_too_long" : "bad_task");

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const words = countWords(answer);
  if (words < CEFR_MIN_WORDS) return fail(422, "too_short");
  if (words > CEFR_MAX_WORDS) return fail(422, "too_long");
  // No engine (a local machine without AI_ENGINE_*): say so before the ceiling
  // records the attempt, or every try would spend one of the visitor's grades.
  if (!engineConfigured()) return fail(503, "unavailable");

  const decision = await checkAndRecord(createAdminClient(), hashIp(clientIp(req.headers)));
  if (!decision.allowed) {
    return NextResponse.json(
      { error: decision.reason === "global" ? "busy" : "rate_limited" },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  try {
    const grade = await multilevelPublic<CefrWritingGrade>("writing/grade-own", {
      task_id: task.task,
      task: task.taskText,
      answer,
    });
    return NextResponse.json({ grade });
  } catch (err) {
    console.error("[public/grade/cefr] grading failed:", err);
    return fail(err instanceof EngineUnavailable ? 503 : 502, err instanceof EngineUnavailable ? "unavailable" : "grade_failed");
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
