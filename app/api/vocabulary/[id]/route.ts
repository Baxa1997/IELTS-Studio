import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/vocabulary/[id] — remove one saved word. RLS guarantees a student
 * can only delete their OWN rows, so no extra ownership check is needed here.
 */
export async function DELETE(_req: Request, { params }: RouteCtx): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  if (session.profile.role !== "student") return fail(403, "forbidden");

  const { id } = await params;
  if (!id) return fail(400, "bad_request");

  const supabase = await createClient();
  const { error } = await supabase.from("vocabulary_items").delete().eq("id", id);
  if (error) {
    console.error("[vocabulary/delete]", error);
    return fail(500, "delete_failed", "Couldn't remove that word — try again.");
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
