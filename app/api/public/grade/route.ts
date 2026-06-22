import { NextResponse } from "next/server";

import { gradeEssay } from "@/lib/ai";
import {
  countWords,
  getPublicPrompt,
  MAX_WORDS,
  MIN_WORDS,
  PUBLIC_ORG_ID,
} from "@/lib/public-grader/prompts";
import { checkAndRecord, clientIp, hashIp } from "@/lib/public-grader/rate-limit";
import { toPublicTeaser } from "@/lib/public-grader/teaser";
import { createAdminClient } from "@/lib/supabase/admin";

// Grades through the same server-side AI service as the app (skill + anchors +
// usage logging), then caps the output depth for the anonymous preview.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gemini 3 Pro + a thinking budget makes a grade heavier than flash; give it the
// full serverless window.
export const maxDuration = 60;

/**
 * POST /api/public/grade  — the no-login grader.
 * Body: { promptId, essay }
 *
 * No auth. Defended by (1) a DB-backed per-IP + global rate limit, (2) word-count
 * bounds, and (3) a fixed prompt allow-list. Returns a depth-capped teaser, never
 * the full grade.
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { promptId?: unknown; essay?: unknown };

  const prompt = typeof body.promptId === "string" ? getPublicPrompt(body.promptId) : undefined;
  if (!prompt) return fail(400, "invalid_prompt");

  const essay = typeof body.essay === "string" ? body.essay.trim() : "";
  const words = countWords(essay);
  if (words < MIN_WORDS) {
    return fail(422, "too_short", { minWords: MIN_WORDS, words });
  }
  if (words > MAX_WORDS) {
    return fail(422, "too_long", { maxWords: MAX_WORDS, words });
  }

  const admin = createAdminClient();

  // --- Rate limit (per-IP + global) ----------------------------------------
  const ipHash = hashIp(clientIp(req.headers));
  const decision = await checkAndRecord(admin, ipHash);
  if (!decision.allowed) {
    const error = decision.reason === "global" ? "busy" : "rate_limited";
    return NextResponse.json(
      { error },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  // --- Grade through the single AI service ---------------------------------
  try {
    const grade = await gradeEssay({
      taskType: prompt.taskType,
      promptText: prompt.prompt,
      essayText: essay,
      meta: { organizationId: PUBLIC_ORG_ID, userId: null },
    });
    return NextResponse.json({ teaser: toPublicTeaser(grade) });
  } catch (err) {
    console.error("[public.grade] failed:", err);
    return fail(502, "grade_failed");
  }
}

function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}
