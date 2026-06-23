import { NextResponse } from "next/server";

import { generateCefrWritingTask } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { isCefrLevel } from "@/lib/cefr/levels";

// Generates ONE original CEFR writing task pitched to the requested level, through
// the single server-side AI service (usage-logged). Students only. A single model
// call, but give it the full serverless window to be safe.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cefr/writing/generate
 * Body: { level }  (A1–C2)
 * Returns { task } — a full CefrWritingTask the studio can render and then grade
 * (the grade route resolves it via its level/genre/prompt fallback path).
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  if (session.profile.role !== "student") return fail(403, "forbidden");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const level = typeof body.level === "string" && isCefrLevel(body.level) ? body.level : null;
  if (!level) return fail(400, "bad_level", "Pick a CEFR level first.");

  try {
    const task = await generateCefrWritingTask({
      level,
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });
    return NextResponse.json({ task });
  } catch (err) {
    console.error("[cefr.writing.generate] failed:", err);
    return fail(502, "generate_failed", "Couldn't create a task. Please try again.");
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
