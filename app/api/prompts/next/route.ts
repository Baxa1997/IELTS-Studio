import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { loadStudyPlan } from "@/lib/plan/service";
import { pitchDifficulty } from "@/lib/plan/types";
import { pickNextPromptForStudent, PromptServiceError } from "@/lib/prompts/service";

// Reads/writes via the RLS client and may call the AI usage path — Node runtime,
// evaluated per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/prompts/next
 *
 * Serves the signed-in student a fresh, approved Task 2 prompt they've never seen
 * and records the assignment so it never repeats. Optional JSON body narrows the
 * pool: { category?, topicFamily?, difficulty? }. 404 when the approved pool is
 * exhausted for those filters.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org content

  const filters = await readFilters(req);

  // Level-match: pitch task difficulty at the learner's working band (nudged toward
  // their target) unless the caller already pinned a difficulty. Server-side so the
  // client never decides level (CLAUDE.md: never derive level from the client).
  if (filters.difficulty == null) {
    const [est, plan] = await Promise.all([
      loadStudentEstimates(session.profile.id),
      loadStudyPlan(session.profile.id),
    ]);
    filters.difficulty = pitchDifficulty({
      measuredBand: est.bySkill.writing.currentBand,
      selfReportedBand: plan?.selfReportedBand ?? null,
      targetBand: plan?.targetBand ?? est.bySkill.writing.targetBand,
    });
  }

  try {
    const prompt = await pickNextPromptForStudent(
      {
        userId: session.profile.id,
        organizationId: session.profile.organization_id,
        role: session.profile.role,
      },
      filters,
    );
    return NextResponse.json({ prompt }, { status: 200 });
  } catch (err) {
    if (err instanceof PromptServiceError) {
      return fail(STATUS_FOR[err.code] ?? 500, err.code, err.message);
    }
    console.error("[prompts/next] unexpected:", err);
    return fail(500, "internal_error");
  }
}

const STATUS_FOR: Record<PromptServiceError["code"], number> = {
  forbidden: 403,
  invalid_input: 422,
  not_found: 404,
  no_prompt_available: 404,
  store_failed: 500,
};

/** Tolerate an empty/missing/garbage body — all filters are optional. */
async function readFilters(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
