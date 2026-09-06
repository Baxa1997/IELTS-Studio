import { NextResponse } from "next/server";

import { requireOrgUser } from "@/lib/auth";
import { recomputeSkillEstimate } from "@/lib/estimates/service";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Submission follow-up for derived listening/speaking estimates. This keeps
 * the dashboard read-only while still updating the tracker after new graded
 * work is available. The caller can only recompute their own student rows.
 */
export async function POST(request: Request) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") {
    return NextResponse.json({ error: "Only students can refresh their estimates." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { skill?: unknown };
  const skill = body.skill;
  if (skill !== "listening" && skill !== "speaking") {
    return NextResponse.json({ error: "Unsupported estimate skill." }, { status: 400 });
  }

  await recomputeSkillEstimate(createAdminClient(), {
    studentId: profile.id,
    organizationId: profile.organization_id,
    skill,
  });

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
