import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { generate } from "@/lib/ai";

// Calls the AI service (server-only, usage-logged) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WORD = 120;
const MAX_CONTEXT = 600;
const MAX_LANGUAGE = 60;

interface Translation {
  translation: string;
  part_of_speech: string;
  definition: string;
  example: string;
}

/**
 * POST /api/vocabulary/translate
 *
 * A student selected a word while practicing and wants its meaning in their own
 * language. Returns a short dictionary entry (translation + part of speech +
 * definition + example), sense-disambiguated by the sentence it appeared in. All
 * model access goes through the single AI service, which logs usage — never
 * client → model (CLAUDE.md). This only looks the word up; saving is a separate call.
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

  const word = String(body.word ?? "").trim().slice(0, MAX_WORD);
  if (!word) return fail(422, "empty", "Select a word to translate.");
  const language = String(body.language ?? "").trim().slice(0, MAX_LANGUAGE);
  if (!language) return fail(422, "no_language", "Choose a language.");
  const context = String(body.context ?? "").trim().slice(0, MAX_CONTEXT);

  try {
    const { content } = await generate({
      kind: "vocabulary_translate",
      spec: { word, language, context },
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });
    const parsed = parse(content);
    if (!parsed) return fail(502, "bad_reply", "Couldn't read the translation — try again.");
    return NextResponse.json({ ...parsed, word, language }, { status: 200 });
  } catch (err) {
    console.error("[vocabulary/translate]", err);
    return fail(502, "translate_failed", "Translation is busy right now — try again in a moment.");
  }
}

/** Tolerant parse of the model's JSON (handles a stray ```json fence). */
function parse(raw: string): Translation | null {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  try {
    const obj = JSON.parse(fence ? fence[1] : trimmed) as Partial<Translation>;
    if (typeof obj.translation !== "string") return null;
    return {
      translation: obj.translation,
      part_of_speech: typeof obj.part_of_speech === "string" ? obj.part_of_speech : "",
      definition: typeof obj.definition === "string" ? obj.definition : "",
      example: typeof obj.example === "string" ? obj.example : "",
    };
  } catch {
    return null;
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
