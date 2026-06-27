import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { generate } from "@/lib/ai";

// Calls the AI service (server-only, usage-logged) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION = 1500;
const MAX_CONTEXT = 1200;

interface ChatMessage {
  role?: unknown;
  content?: unknown;
}

/**
 * POST /api/coach
 *
 * The dashboard study coach — a general IELTS mentor (planning, what to practise
 * next, strategy, hitting the target band). The client passes the learner's
 * dashboard context (target, current bands, weak areas, days to test) so advice is
 * grounded. All model access goes through the single AI service, which logs usage —
 * never client → model (CLAUDE.md).
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

  const context = String(body.context ?? "").slice(0, MAX_CONTEXT);
  const history = Array.isArray(body.history)
    ? (body.history as ChatMessage[])
        .slice(-6)
        .map((m) => `${m.role === "assistant" ? "Coach" : "Student"}: ${String(m.content ?? "").slice(0, 800)}`)
        .join("\n")
    : "";

  try {
    const { content } = await generate({
      kind: "study_coach",
      spec: { question, context, history },
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });
    return NextResponse.json({ reply: content }, { status: 200 });
  } catch (err) {
    console.error("[coach]", err);
    return fail(502, "coach_failed", "The coach is busy right now — try again in a moment.");
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
