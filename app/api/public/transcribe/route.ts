import { NextResponse } from "next/server";

import { transcribeWriting } from "@/lib/ai";
import { PUBLIC_ORG_ID } from "@/lib/public-grader/prompts";
import { checkAndRecord, clientIp, hashIp } from "@/lib/public-grader/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

// Multimodal model call (reads an uploaded image/PDF) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

/**
 * POST /api/public/transcribe  (multipart form, field "file")
 *
 * The no-login twin of /api/writing/transcribe: turns a photo/PDF of an essay into
 * editable text for the public grader. A transcribe is a real AI call, so it draws
 * from the SAME per-IP + global budget as a public grading (public_grade_events) —
 * upload + grade costs two slots, which keeps anonymous OCR from becoming a free
 * unlimited service. The model transcribes faithfully (no correcting) so the
 * grader still sees the visitor's real writing.
 */
export async function POST(req: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "bad_request");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "no_file");
  const type = file.type || "";
  if (!ALLOWED.has(type)) return fail(415, "unsupported_type");
  if (file.size === 0) return fail(400, "empty_file");
  if (file.size > MAX_BYTES) return fail(413, "too_large");

  const admin = createAdminClient();

  // Same ledger as the public grader — one shared anonymous AI budget per IP.
  const ipHash = hashIp(clientIp(req.headers));
  const decision = await checkAndRecord(admin, ipHash);
  if (!decision.allowed) {
    const error = decision.reason === "global" ? "busy" : "rate_limited";
    return NextResponse.json(
      { error },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const { text } = await transcribeWriting({
      file: { mimeType: type, data },
      meta: { organizationId: PUBLIC_ORG_ID, userId: null },
    });
    if (!text.trim()) return fail(422, "no_text");
    return NextResponse.json({ text }, { status: 200 });
  } catch (err) {
    console.error("[public.transcribe] failed:", err);
    return fail(502, "transcribe_failed");
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
