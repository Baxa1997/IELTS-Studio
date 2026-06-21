import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { generate } from "@/lib/ai";

// Calls the AI service (server-only, usage-logged) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION = 1500;
const MAX_DRAFT = 6000;

interface ChatMessage {
  role?: unknown;
  content?: unknown;
}

/**
 * POST /api/writing/tutor
 *
 * The in-studio coaching chat. Coaching-only: while the student is still writing
 * (`phase !== "results"`) the prompt withholds sample/model answers so the grade
 * stays their own work. All model access goes through the single AI service, which
 * logs usage — never client → model (CLAUDE.md).
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

  const question = String(body.question ?? "").trim().slice(0, MAX_QUESTION);
  if (!question) return fail(422, "empty", "Type a question for the coach.");

  const taskType = String(body.taskType ?? "task2");
  const promptText = String(body.promptText ?? "").slice(0, 4000);
  const draft = String(body.draft ?? "").slice(0, MAX_DRAFT);
  const phase = body.phase === "results" ? "results" : "writing";
  const history = Array.isArray(body.history)
    ? (body.history as ChatMessage[])
        .slice(-6)
        .map((m) => `${m.role === "assistant" ? "Coach" : "Student"}: ${String(m.content ?? "").slice(0, 800)}`)
        .join("\n")
    : "";

  try {
    const { content } = await generate({
      kind: "writing_tutor",
      spec: { task_type: taskType, prompt: promptText, draft, phase, history, question },
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });
    return NextResponse.json({ reply: content }, { status: 200 });
  } catch (err) {
    console.error("[writing/tutor]", err);
    return fail(502, "tutor_failed", "The coach is busy right now — try again in a moment.");
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
