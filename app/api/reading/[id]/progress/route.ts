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
 * POST /api/reading/[id]/progress — save an UNFINISHED single-passage run.
 * id = passage id. Body: { answers, secondsLeft }
 *
 * The single-passage twin of ../../test/[id]/progress. A passage has no cursor —
 * there is only one text — so its hub card tracks answered/total instead, and
 * `cursorIndex` stays null. Everything else, including the one-live-row rule, is
 * shared in lib/reading/progress.ts.
 */
export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
  const { id: passageId } = await ctx.params;

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

  // Access gate: RLS hands back the passage only if it is in the learner's org.
  const supabase = await createClient();
  const { data: passage, error: pErr } = await supabase
    .from("reading_passages")
    .select("id")
    .eq("id", passageId)
    .maybeSingle();
  if (pErr) return fail(500, "load_failed");
  if (!passage) return fail(404, "passage_not_found");

  const body = readProgressBody(raw);
  const saved = await saveReadingProgress(
    createAdminClient(),
    { passageId },
    {
      studentId,
      organizationId,
      ...body,
      // One text, so there is nothing to be "on".
      cursorIndex: null,
    },
  );
  if (!saved.ok) {
    return fail(saved.reason === "failed" ? 500 : 409, saved.reason);
  }
  return NextResponse.json({ id: saved.id }, { status: saved.created ? 201 : 200 });
}

/** DELETE — discard an unfinished single-passage run. */
export async function DELETE(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id: passageId } = await ctx.params;

  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden");

  const res = await clearReadingProgress(createAdminClient(), { passageId }, session.profile.id);
  if (!res.ok) return fail(500, "delete_failed");
  return NextResponse.json({ cleared: res.cleared }, { status: 200 });
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
