import { NextResponse } from "next/server";

import { onTodaysList } from "@/lib/free-practice/assignment";
import { EngineUnavailable, listeningPublic } from "@/lib/free-practice/engine";
import { DONE_COOKIE, DONE_COOKIE_OPTIONS, doneToday, writeDone } from "@/lib/free-practice/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/public/practice/listening — marks today's free Listening part.
 * Body: { key: "libraryId_part", answers: { [questionNumber]: string } }
 *
 * No auth and nothing stored. The guard is the rotation: `key` must be on THIS
 * visitor's list today, and today's free practice must not be used — so the
 * route cannot be used to mark any part in the library on demand. Marking itself is the
 * engine's (deterministic, no model spend), reached server to server; success
 * returns its review and marks the day done.
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { key?: unknown; answers?: unknown };
  const key = typeof body.key === "string" ? body.key : null;
  const answers: Record<string, string> = {};
  if (body.answers && typeof body.answers === "object") {
    for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
      if (typeof v === "string") answers[k] = v;
    }
  }

  const today = key ? await onTodaysList("listening", key) : null;
  if (!today || !key) return fail(409, "not_today");
  if (today.done) return fail(429, "daily_done");

  // The id is a UUID (hyphens, no underscore), so the LAST underscore is the part.
  const sep = key.lastIndexOf("_");
  const libraryId = key.slice(0, sep);
  const part = key.slice(sep + 1);
  try {
    const grade = await listeningPublic<Record<string, unknown>>("grade", {
      library_id: libraryId,
      part: Number(part),
      answers,
    });
    const res = NextResponse.json({ grade });
    res.cookies.set(DONE_COOKIE, writeDone(await doneToday(today.day), "listening", today.day), DONE_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("[public/practice/listening] grade failed:", err);
    return fail(err instanceof EngineUnavailable ? 503 : 500, "grade_failed");
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
