import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { instantiateLibraryPassage, ReadingServiceError } from "@/lib/reading/service";

// Clones a shared library passage into the learner's org (a row copy, no model call).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reading/library/passage  body: { id }
 *
 * "Start" on a ready-made sample passage: instantiates the learner's own copy of
 * the shared library passage `id` (idempotent) and returns the copy's id to open.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org content

  const body = (await req.json().catch(() => ({}))) as { id?: unknown };
  const libraryPassageId = typeof body.id === "string" ? body.id : "";
  if (!libraryPassageId) return fail(422, "invalid_input", "Missing passage id.");

  try {
    const id = await instantiateLibraryPassage(
      {
        userId: session.profile.id,
        organizationId: session.profile.organization_id,
        role: session.profile.role,
      },
      libraryPassageId,
    );
    return NextResponse.json({ id }, { status: 200 });
  } catch (err) {
    if (err instanceof ReadingServiceError) {
      return fail(STATUS_FOR[err.code] ?? 500, err.code, err.message);
    }
    console.error("[reading/library/passage] unexpected:", err);
    return fail(500, "internal_error");
  }
}

const STATUS_FOR: Record<ReadingServiceError["code"], number> = {
  forbidden: 403,
  invalid_input: 422,
  generation_failed: 502,
  not_found: 404,
  store_failed: 500,
};

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
