import { NextResponse } from "next/server";

import { requireOrgUser } from "@/lib/auth";
import { countPendingAssignments } from "@/lib/assignments/student";

/**
 * Secondary shell data: deliberately fetched after the authenticated rail is
 * visible. Only the assignment identity and completion fields are loaded here;
 * the full assignment loader remains reserved for assignment pages.
 */
export async function GET() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") return NextResponse.json({ count: 0 });

  const count = await countPendingAssignments(profile.id);
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
