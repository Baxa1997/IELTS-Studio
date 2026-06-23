import { NextResponse } from "next/server";

import { gradeCefrWriting } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { saveCefrAttempt } from "@/lib/cefr/store";
import { getCefrTask } from "@/lib/cefr/writing-tasks";

// Grades a CEFR writing task through the single server-side AI service (CEFR
// examiner prompt + usage logging). Students only. Node runtime; a CEFR grade is a
// single model call, but give it the full serverless window to be safe.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TEXT = 12000;

/**
 * POST /api/cefr/grade
 * Body: { taskId, text }  (taskId resolves the authoritative level/genre/prompt)
 *   — or { level, genre, prompt, text } as a fallback.
 *
 * Returns { grade } — the estimated CEFR level + four-subscale feedback. Stateless:
 * nothing is persisted (CEFR history is a later add).
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

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return fail(422, "empty", "Write something before submitting.");
  if (text.length > MAX_TEXT) return fail(422, "too_long", "That answer is longer than this practice supports.");

  // Prefer the authoritative authored task; fall back to validated client fields.
  let targetLevel: CefrLevel;
  let genre: string;
  let prompt: string;
  let taskId: string | null = null;
  let taskTitle: string | null = null;

  const task = typeof body.taskId === "string" ? getCefrTask(body.taskId) : undefined;
  if (task) {
    targetLevel = task.level;
    genre = task.genre;
    prompt = task.prompt;
    taskId = task.id;
    taskTitle = task.title;
  } else {
    const lvl = resolveLevel(body.level);
    if (!lvl) return fail(400, "bad_level");
    targetLevel = lvl;
    genre = (typeof body.genre === "string" ? body.genre : "essay").slice(0, 40) || "essay";
    prompt = (typeof body.prompt === "string" ? body.prompt : "").trim().slice(0, 4000);
    if (!prompt) return fail(400, "bad_prompt", "Missing the task prompt.");
    // Dynamically generated tasks carry their own title/id (not in the static set).
    taskTitle = typeof body.taskTitle === "string" ? body.taskTitle.slice(0, 200) : null;
    taskId = typeof body.taskId === "string" ? body.taskId.slice(0, 80) : null;
  }

  try {
    const grade = await gradeCefrWriting({
      targetLevel,
      genre,
      prompt,
      text,
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });

    // Save to the learner's CEFR history (best-effort — never blocks the grade).
    const attemptId = await saveCefrAttempt({
      organizationId: session.profile.organization_id,
      studentId: session.profile.id,
      taskId,
      taskTitle,
      targetLevel,
      genre,
      prompt,
      response: text,
      grade,
    });

    return NextResponse.json({ grade, attemptId });
  } catch (err) {
    console.error("[cefr.grade] failed:", err);
    return fail(502, "grade_failed", "Couldn't grade your writing. Please try again.");
  }
}

function resolveLevel(v: unknown) {
  return typeof v === "string" && isCefrLevel(v) ? v : null;
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
