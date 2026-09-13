import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { canOpenLibraryItem } from "@/lib/quota";
import { instantiateLibraryTest, ReadingServiceError } from "@/lib/reading/service";

// Clones a shared library test into the learner's org (a row copy, no model call).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reading/library/test  body: { id }
 *
 * "Start" on a ready-made sample test: instantiates the learner's own copy of the
 * shared library test `id` (idempotent — one copy per learner) and returns the
 * copy's id to open in the runner. No waiting for generation.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org content

  const body = (await req.json().catch(() => ({}))) as { id?: unknown };
  const libraryTestId = typeof body.id === "string" ? body.id : "";
  if (!libraryTestId) return fail(422, "invalid_input", "Missing test id.");

  /* ⭐ THE FREE-PLAN SHELF, ENFORCED HERE AND NOWHERE ELSE THAT MATTERS.
     Client-side dimming is decoration — this is the copy being made, so this is
     where it has to be refused. Deliberately NOT inside `instantiateLibraryTest`
     itself: staff assigning homework call that same function, and a teacher
     setting practice for a class is not a learner spending an unlock. */
  const gate = await canOpenLibraryItem(session.profile.organization_id, libraryTestId);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        message: `You've opened all ${gate.quota.limit} free practices — upgrade to Pro to open the whole library.`,
        used: gate.quota.used,
        limit: gate.quota.limit,
      },
      { status: 402 },
    );
  }

  try {
    const id = await instantiateLibraryTest(
      {
        userId: session.profile.id,
        organizationId: session.profile.organization_id,
        role: session.profile.role,
      },
      libraryTestId,
    );
    return NextResponse.json({ id }, { status: 200 });
  } catch (err) {
    if (err instanceof ReadingServiceError) {
      return fail(STATUS_FOR[err.code] ?? 500, err.code, err.message);
    }
    console.error("[reading/library/test] unexpected:", err);
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
