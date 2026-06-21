import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { generate } from "@/lib/ai";

// Calls the AI service (server-only, usage-logged) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION = 1500;
const MAX_PASSAGE = 8000;
const MAX_QUESTIONS_BLOCK = 4000;

interface ChatMessage {
  role?: unknown;
  content?: unknown;
}

/**
 * POST /api/reading/tutor
 *
 * The in-test reading coach. Strategy-only while the test is live (`phase !==
 * "results"`): the prompt withholds any specific answer so the score stays the
 * student's own work; after submit it may explain anything. All model access goes
 * through the single AI service, which logs usage — never client → model (CLAUDE.md).
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

  const passageTitle = String(body.passageTitle ?? "").slice(0, 200);
  const passageBody = String(body.passageBody ?? "").slice(0, MAX_PASSAGE);
  const currentQuestion = String(body.currentQuestion ?? "").slice(0, 1000);
  const questions = String(body.questions ?? "").slice(0, MAX_QUESTIONS_BLOCK);
  const phase = body.phase === "results" ? "results" : "reading";
  const history = Array.isArray(body.history)
    ? (body.history as ChatMessage[])
        .slice(-6)
        .map((m) => `${m.role === "assistant" ? "Coach" : "Student"}: ${String(m.content ?? "").slice(0, 800)}`)
        .join("\n")
    : "";

  try {
    const { content } = await generate({
      kind: "reading_tutor",
      spec: {
        passage_title: passageTitle,
        passage_body: passageBody,
        current_question: currentQuestion,
        questions,
        phase,
        history,
        question,
      },
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });
    return NextResponse.json({ reply: content }, { status: 200 });
  } catch (err) {
    console.error("[reading/tutor]", err);
    return fail(502, "tutor_failed", "The coach is busy right now — try again in a moment.");
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
