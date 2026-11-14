import { NextResponse } from "next/server";

import { challengeToday, recordScore, todaysChallenge } from "@/lib/challenge/daily";
import { markLibraryPassage } from "@/lib/reading/mark-library-passage";
import { READING_DISCLAIMER } from "@/lib/reading/types";

// Service-role reads (answer keys, the board) — Node, and never cached: the
// board differs per visitor ("you") and by the minute.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" };

/**
 * GET /api/public/practice/challenge — today's challenge and its board, for
 * the landing page's section. A route for the same reason the picks have one
 * (../picks/route.ts): the front door is static, and whose row is "you" comes
 * from the visitor's cookie.
 */
export async function GET() {
  try {
    return NextResponse.json(await challengeToday(), { headers: PRIVATE });
  } catch (err) {
    console.error("[practice/challenge] failed:", err);
    // The section renders nothing without a challenge.
    return NextResponse.json({ challenge: null, board: null }, { status: 503, headers: PRIVATE });
  }
}

/**
 * POST /api/public/practice/challenge — marks today's challenge passage and
 * keeps the visitor's first score. Body: { passageId, answers, durationSeconds }
 * — what the passage runner posts in public mode.
 *
 * ⚠️ ONLY TODAY'S PASSAGE. This returns answer keys, like every reading
 * marking route; the free practice guards them with the visitor's own list,
 * and this guards them with the one id the day offers. Any other id is refused
 * before anything is read — otherwise the route would mark, and so hand over
 * the keys of, any passage in the library.
 *
 * It does NOT set the free practice's done cookie: the challenge is its own
 * allowance, and a visitor who sits it still has today's free Reading.
 */
export async function POST(req: Request): Promise<Response> {
  const { passageId, answers, durationSeconds } = await readBody(req);
  const today = await todaysChallenge();
  if (!today || !passageId || passageId !== today.item.key) return fail(409, "not_today");

  const marked = await markLibraryPassage(today.item.source, answers);
  if (!marked.ok) return fail(marked.status, marked.error);

  await recordScore({
    day: today.day,
    practiceKey: today.item.key,
    score: marked.result.correctCount,
    total: marked.result.total,
    durationSeconds,
  });
  return NextResponse.json({ result: marked.result, disclaimer: READING_DISCLAIMER }, { headers: PRIVATE });
}

/** Tolerate a missing or garbage body: no passage, and no answers (all wrong). */
async function readBody(
  req: Request,
): Promise<{ passageId: string | null; answers: Record<string, string>; durationSeconds: number | null }> {
  try {
    const body = (await req.json()) as { passageId?: unknown; answers?: unknown; durationSeconds?: unknown };
    const answers: Record<string, string> = {};
    if (body && typeof body.answers === "object" && body.answers !== null) {
      for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
        if (typeof v === "string") answers[k] = v;
      }
    }
    const seconds = typeof body?.durationSeconds === "number" && Number.isFinite(body.durationSeconds) ? body.durationSeconds : null;
    return {
      passageId: typeof body?.passageId === "string" ? body.passageId : null,
      answers,
      // Kept for our own reading of the data, never for ranking (lib/challenge/board.ts).
      durationSeconds: seconds === null ? null : Math.min(86_400, Math.max(0, Math.round(seconds))),
    };
  } catch {
    return { passageId: null, answers: {}, durationSeconds: null };
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: PRIVATE });
}
