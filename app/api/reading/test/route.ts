import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { generateReadingTestForStudent, ReadingServiceError } from "@/lib/reading/service";

// Generates a full 3-passage test (three passages in parallel, each two model
// calls) and writes via service-role — Node runtime, evaluated per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reading/test
 *
 * B2C on-demand full reading test: generates 3 original passages + ~40 validated
 * questions for the signed-in learner (level-matched, difficulty rising P1→P3),
 * stores them approved under one test, and returns the test id to navigate to.
 * No teacher gate — content is auto-served (CLAUDE.md: B2C, content on demand).
 */
export async function POST(): Promise<Response> {
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org content

  try {
    const { test } = await generateReadingTestForStudent({
      userId: session.profile.id,
      organizationId: session.profile.organization_id,
      role: session.profile.role,
    });
    return NextResponse.json({ id: test.id }, { status: 200 });
  } catch (err) {
    if (err instanceof ReadingServiceError) {
      return fail(STATUS_FOR[err.code] ?? 500, err.code, err.message);
    }
    console.error("[reading/test] unexpected:", err);
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
