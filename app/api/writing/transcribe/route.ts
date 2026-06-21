import { NextResponse } from "next/server";

import { transcribeWriting } from "@/lib/ai";
import { getSession } from "@/lib/auth";

// Multimodal model call (reads an uploaded image/PDF) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

/**
 * POST /api/writing/transcribe  (multipart form, field "file")
 *
 * Turns a photo/PDF of a handwritten or typed answer into editable text for the
 * studio: the student wrote on paper (like the real exam), uploads it, reviews the
 * transcript, then grades as normal. The model transcribes faithfully (no
 * correcting) so the grader still sees the student's real writing. AI runs only on
 * the server, through the single AI service, with usage logging (CLAUDE.md).
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  if (session.profile.role !== "student") return fail(403, "forbidden");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "bad_request", "Expected a file upload.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "no_file", "No file was uploaded.");
  const type = file.type || "";
  if (!ALLOWED.has(type)) return fail(415, "unsupported_type", "Upload a PNG, JPG, or WEBP image, or a PDF.");
  if (file.size === 0) return fail(400, "empty_file", "That file is empty.");
  if (file.size > MAX_BYTES) return fail(413, "too_large", "File is too large — keep it under 8 MB.");

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const { text } = await transcribeWriting({
      file: { mimeType: type, data },
      meta: { organizationId: session.profile.organization_id, userId: session.profile.id },
    });
    if (!text.trim()) {
      return fail(422, "no_text", "Couldn't find any readable writing in that file — try a clearer photo.");
    }
    return NextResponse.json({ text }, { status: 200 });
  } catch (err) {
    console.error("[writing/transcribe] failed:", err);
    return fail(502, "transcribe_failed", "Couldn't read that file — please try a clearer photo or PDF.");
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
