import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  clearReadingProgress,
  readProgressBody,
  saveReadingProgress,
} from "@/lib/reading/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reading/test/[id]/progress — save an UNFINISHED full test. id = test id.
 * Body: { answers, cursorIndex, secondsLeft }
 *
 * The autosave behind the hub's "Paused · Passage 2 of 3" card. All the real work,
 * and the reasoning about races and cleanup, is in lib/reading/progress.ts — this
 * route is the auth gate and nothing else. The single-passage twin is
 * ../../../[id]/progress.
 */
export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
  const { id: testId } = await ctx.params;

  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden");
  if (session.profile.role !== "student") return fail(403, "students_only");
  const { id: studentId, organization_id: organizationId } = session.profile;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail(400, "bad_body");
  }

  // Access gate: RLS hands back the test only if it is approved and in the
  // learner's own org — the same check ./submit makes before grading.
  const supabase = await createClient();
  const { data: test, error: tErr } = await supabase
    .from("reading_tests")
    .select("id")
    .eq("id", testId)
    .maybeSingle();
  if (tErr) return fail(500, "load_failed");
  if (!test) return fail(404, "test_not_found");

  const saved = await saveReadingProgress(
    createAdminClient(),
    { testId },
    {
      studentId,
      organizationId,
      ...readProgressBody(raw),
    },
  );
  if (!saved.ok) {
    return fail(saved.reason === "failed" ? 500 : 409, saved.reason);
  }
  return NextResponse.json({ id: saved.id }, { status: saved.created ? 201 : 200 });
}

/**
 * DELETE /api/reading/test/[id]/progress — discard an unfinished run.
 *
 * The learner abandoning a test on purpose, so the hub stops offering to resume
 * it. Submitting does NOT come through here: ./submit clears the row in the same
 * request that grades it, so a marked test can never also look paused.
 */
export async function DELETE(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id: testId } = await ctx.params;

  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden");

  const res = await clearReadingProgress(createAdminClient(), { testId }, session.profile.id);
  if (!res.ok) return fail(500, "delete_failed");
  return NextResponse.json({ cleared: res.cleared }, { status: 200 });
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
