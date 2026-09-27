import { NextResponse } from "next/server";

import { gradeEssay, type GradeEssayInput } from "@/lib/ai";
import { onTodaysList } from "@/lib/free-practice/assignment";
import { DONE_COOKIE, DONE_COOKIE_OPTIONS, doneToday, writeDone } from "@/lib/free-practice/visitor";
import { countWords, PUBLIC_ORG_ID } from "@/lib/public-grader/prompts";
import { checkAndRecord, clientIp, hashIp } from "@/lib/public-grader/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { figureToText, parseFigure } from "@/lib/writing/figure";

// The grader is a model call with a thinking budget — give it the full window,
// as the signed-in grade route does.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/public/practice/writing — grades one free Writing practice.
 * Body: { promptId, content }
 *
 * THE SAME GRADE A SIGNED-IN LEARNER GETS (owner, 2026-09-27): the same
 * `gradeEssay` — skill, anchors, strictness — with the figure's data for
 * Academic Task 1, returned in the shape /api/essays/[id]/grade returns, so the
 * studio's feedback screen renders it unchanged. Nothing is stored (there is no
 * account to own an essay); usage is logged against the public grader's org.
 *
 * Three guards, because this is the one free practice that spends money:
 *  1. the prompt must be on THIS visitor's list today;
 *  2. today's free practice must not be used already (the signed cookie);
 *  3. the public grader's per-IP and global ceilings, in the database — the
 *     cookie alone could be cleared, the database cannot.
 */

const MIN_WORDS = 40;
/** Far above any real exam answer; a ceiling on what one free grade can cost. */
const MAX_WORDS = 900;

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { promptId?: unknown; content?: unknown };
  const promptId = typeof body.promptId === "string" ? body.promptId : null;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  const today = promptId ? await onTodaysList("writing", promptId) : null;
  if (!today) return fail(409, "not_today");
  if (today.done) return fail(429, "daily_done");

  const words = countWords(content);
  if (words < MIN_WORDS) return fail(422, "too_short");
  if (words > MAX_WORDS) return fail(422, "too_long");

  const admin = createAdminClient();
  const { data: prompt } = await admin
    .from("writing_prompts")
    .select("task_type, prompt_text, figure")
    .eq("id", today.item.key)
    .is("organization_id", null)
    .maybeSingle();
  if (!prompt) return fail(409, "not_today");

  const decision = await checkAndRecord(admin, hashIp(clientIp(req.headers)));
  if (!decision.allowed) {
    return NextResponse.json(
      { error: decision.reason === "global" ? "busy" : "rate_limited" },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  // Academic Task 1: the grader checks the reported numbers against the figure.
  const figure = parseFigure(prompt.figure);
  try {
    const grade = await gradeEssay({
      taskType: prompt.task_type as GradeEssayInput["taskType"],
      promptText: prompt.prompt_text as string,
      ...(figure ? { figure: figureToText(figure) } : {}),
      essayText: content,
      meta: { organizationId: PUBLIC_ORG_ID, userId: null },
    });
    const res = NextResponse.json({
      grading: {
        overall_band: grade.overall_band,
        band_with_fixes: grade.band_with_fixes,
        criteria: grade.criteria,
        score_blocker: grade.score_blocker,
        annotations: grade.annotations ?? [],
        model: grade.model,
      },
      disclaimer: grade.disclaimer,
    });
    res.cookies.set(DONE_COOKIE, writeDone(await doneToday(today.day), "writing", today.day), DONE_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("[public/practice/writing] grade failed:", err);
    return fail(502, "grade_failed");
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
