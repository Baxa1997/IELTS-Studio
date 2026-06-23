import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { isCefrLevel } from "@/lib/cefr/levels";
import {
  generateCefrReadingForStudent,
  ReadingServiceError,
  type ReadingActor,
} from "@/lib/reading/service";

// Generate one short, level-graded CEFR reading passage and return its id. Students
// only. A short passage + ~6 questions is two model calls but fits the serverless
// window (unlike full Academic generation, which runs browser-direct to the engine).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cefr/reading/next
 * Body: { level }  (A1..C2)
 * Returns { id } — the new passage; open it at /read/[id] (same reader).
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  if (session.profile.role !== "student") return fail(403, "forbidden");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_request");
  }

  const level = typeof body.level === "string" && isCefrLevel(body.level) ? body.level : null;
  if (!level) return fail(400, "bad_level", "Choose a CEFR level (A1–C2).");

  try {
    const set = await generateCefrReadingForStudent(
      {
        userId: session.profile.id,
        organizationId: session.profile.organization_id,
        role: session.profile.role as ReadingActor["role"],
      },
      level,
    );
    return NextResponse.json({ id: set.passage.id });
  } catch (err) {
    console.error("[cefr.reading.next] failed:", err);
    const code = err instanceof ReadingServiceError ? err.code : "generation_failed";
    return fail(502, code, "Couldn't generate a CEFR reading. Please try again.");
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
