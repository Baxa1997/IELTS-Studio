import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/essays/discard?promptId=<uuid>
 *
 * Resets the writing studio on exit: deletes the student's UNSUBMITTED draft(s)
 * for one prompt so reopening starts from a blank page and abandoned attempts
 * never count as "practised" or surface in Activities.
 *
 * Called two ways from the studio: a keepalive fetch on the Library button and a
 * navigator.sendBeacon on pagehide (browser back / refresh / tab close).
 *
 * Safety: keyed by prompt (race-free vs. a late autosave) and guarded so it can
 * only ever remove rows that are still `status='draft'` AND have ZERO gradings —
 * a graded essay (even one reverted to draft mid-revision) is always kept. All
 * writes go through the RLS client, so a student can only touch their own essays.
 */
export async function POST(req: Request): Promise<Response> {
  const promptId = new URL(req.url).searchParams.get("promptId");
  if (!promptId) return NextResponse.json({ error: "missing_prompt" }, { status: 400 });

  const session = await getSession();
  if (!session?.profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.profile.role !== "student") return NextResponse.json({ ok: true });

  const supabase = await createClient();

  // The student's draft attempts against this prompt (RLS already scopes to them).
  const { data: drafts } = await supabase
    .from("essays")
    .select("id")
    .eq("student_id", session.profile.id)
    .eq("prompt_id", promptId)
    .eq("status", "draft");
  const draftIds = (drafts ?? []).map((d) => d.id as string);
  if (draftIds.length === 0) return NextResponse.json({ ok: true, discarded: 0 });

  // Keep anything that has ever been graded (e.g. a graded essay reverted to draft
  // while revising) — only truly unsubmitted attempts are discarded.
  const { data: graded } = await supabase
    .from("gradings")
    .select("essay_id")
    .in("essay_id", draftIds);
  const gradedIds = new Set((graded ?? []).map((g) => g.essay_id as string));
  const removable = draftIds.filter((id) => !gradedIds.has(id));
  if (removable.length === 0) return NextResponse.json({ ok: true, discarded: 0 });

  // Re-assert status='draft' in the delete itself so a concurrent grade can't be
  // clobbered between the read above and here.
  await supabase.from("essays").delete().in("id", removable).eq("status", "draft");

  return NextResponse.json({ ok: true, discarded: removable.length });
}
