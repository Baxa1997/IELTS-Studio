import { NextResponse } from "next/server";

import { onTodaysList } from "@/lib/free-practice/assignment";
import { EngineUnavailable, multilevelPublic } from "@/lib/free-practice/engine";
import {
  DONE_COOKIE,
  DONE_COOKIE_OPTIONS,
  doneToday,
  SPENT_ON_COOKIE,
  spentOnToday,
  writeDone,
  writeSpentOn,
} from "@/lib/free-practice/visitor";
import { countWords } from "@/lib/public-grader/prompts";
import { checkAndRecord, clientIp, hashIp } from "@/lib/public-grader/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

// Writing is a model call on the engine; give it the full window.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/public/practice/cefr — marks today's free CEFR (Multilevel) paper.
 * Body: { key, answers } for a Reading paper — `answers` is
 * { [questionNumber]: string } — or { key, taskId, answer } for one task of a
 * Writing paper.
 *
 * No auth, and nothing stored: there is no account to own an attempt. The
 * marking is the engine's — the same `_mark_reading` / `_mark_writing` a
 * signed-in learner's paper goes through — reached server to server.
 *
 * The guards, in order:
 *  1. `key` must be on THIS visitor's list today — the list is the boundary
 *     that keeps any other paper's keys out of reach;
 *  2. today's free practice must not be used — EXCEPT on the paper the day
 *     went on, so a Writing paper's three tasks can each be graded (see
 *     SPENT_ON_COOKIE in lib/free-practice/visitor);
 *  3. Writing only, because it spends model money: a word ceiling, and the
 *     public grader's per-IP and global limits in the database — the cookies
 *     alone could be cleared, the database cannot.
 * Which paper, and which kind, come from the list's entry — never from what
 * the browser sent.
 */

const WRITING_TASKS = new Set(["1.1", "1.2", "2"]);
/** Below this there is nothing for the grader to say. Task 1.1 asks for 45–60. */
const MIN_WORDS = 20;
/** The engine refuses past 600 (PUBLIC_MAX_WORDS); checked here first so a
 *  refusal costs no round trip. */
const MAX_WORDS = 600;

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const key = typeof body.key === "string" ? body.key : null;

  const today = key ? await onTodaysList("cefr", key) : null;
  if (!today || !key) return fail(409, "not_today");
  if (today.done && (await spentOnToday(today.day, "cefr")) !== key) return fail(429, "daily_done");

  try {
    if (today.item.paper === "reading") {
      const answers: Record<string, string> = {};
      if (body.answers && typeof body.answers === "object") {
        for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
          if (typeof v === "string") answers[k] = v;
        }
      }
      const grade = await multilevelPublic<Record<string, unknown>>("reading/grade", {
        item_id: today.item.source,
        answers,
      });
      return spend(NextResponse.json(grade), today.day, key);
    }

    if (today.item.paper === "writing") {
      const taskId = typeof body.taskId === "string" ? body.taskId : "";
      const answer = typeof body.answer === "string" ? body.answer.trim() : "";
      if (!WRITING_TASKS.has(taskId)) return fail(422, "bad_task");
      const words = countWords(answer);
      if (words < MIN_WORDS) return fail(422, "too_short");
      if (words > MAX_WORDS) return fail(422, "too_long");

      const decision = await checkAndRecord(createAdminClient(), hashIp(clientIp(req.headers)));
      if (!decision.allowed) {
        return NextResponse.json(
          { error: decision.reason === "global" ? "busy" : "rate_limited" },
          { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
        );
      }

      const grade = await multilevelPublic<{ gradable?: boolean }>("writing/grade", {
        item_id: today.item.source,
        task_id: taskId,
        answer,
      });
      // An answer the grader could not grade has not used the day.
      return grade.gradable ? spend(NextResponse.json(grade), today.day, key) : NextResponse.json(grade);
    }

    return fail(409, "not_today");
  } catch (err) {
    console.error("[public/practice/cefr] marking failed:", err);
    return fail(err instanceof EngineUnavailable ? 503 : 500, "unavailable");
  }
}

/** Mark the day done, on this paper. */
async function spend(res: NextResponse, day: string, key: string): Promise<NextResponse> {
  res.cookies.set(DONE_COOKIE, writeDone(await doneToday(day), "cefr", day), DONE_COOKIE_OPTIONS);
  res.cookies.set(SPENT_ON_COOKIE, writeSpentOn(day, "cefr", key), DONE_COOKIE_OPTIONS);
  return res;
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
