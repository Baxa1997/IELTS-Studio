import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = { word: 120, language: 60, translation: 300, definition: 400, example: 400, context: 600 } as const;
const SOURCES = new Set(["reading", "writing", "manual"]);

/**
 * POST /api/vocabulary
 *
 * Save a word the student looked up while practicing into their personal list.
 * RLS scopes the row to the student + their org; re-adding the same word in the
 * same language updates the stored translation rather than duplicating (the
 * unique index on (student_id, lower(word), language)).
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

  const word = String(body.word ?? "").trim().slice(0, MAX.word);
  const language = String(body.language ?? "").trim().slice(0, MAX.language);
  if (!word) return fail(422, "no_word", "Nothing to save.");
  if (!language) return fail(422, "no_language", "Choose a language.");

  const translation = String(body.translation ?? "").trim().slice(0, MAX.translation);
  const definition = String(body.definition ?? "").trim().slice(0, MAX.definition) || null;
  const example = String(body.example ?? "").trim().slice(0, MAX.example) || null;
  const context = String(body.context ?? "").trim().slice(0, MAX.context) || null;
  const sourceRaw = String(body.source ?? "reading");
  const source = SOURCES.has(sourceRaw) ? sourceRaw : "reading";

  const supabase = await createClient();
  const row = {
    organization_id: session.profile.organization_id,
    student_id: session.profile.id,
    word,
    language,
    translation,
    definition,
    example,
    context_sentence: context,
    source,
  };

  const { data, error } = await supabase.from("vocabulary_items").insert(row).select("id").maybeSingle();
  if (error) {
    // Already saved in this language → refresh the stored translation.
    if (error.code === "23505") {
      const { data: upd } = await supabase
        .from("vocabulary_items")
        .update({ translation, definition, example, context_sentence: context, source })
        .eq("student_id", session.profile.id)
        .eq("language", language)
        .ilike("word", word)
        .select("id")
        .maybeSingle();
      return NextResponse.json({ id: upd?.id ?? null, duplicate: true }, { status: 200 });
    }
    console.error("[vocabulary/save]", error);
    return fail(500, "save_failed", "Couldn't save that word — try again.");
  }
  return NextResponse.json({ id: data?.id ?? null }, { status: 201 });
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
