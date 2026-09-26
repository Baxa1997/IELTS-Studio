import { NextResponse } from "next/server";

import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/quota";

/**
 * The plan dialog's numbers, read when it opens (shared/components/app-shell/plan-card.tsx).
 *
 * The rail's copy comes from the layout, and a layout does not re-render on a
 * client-side navigation — so after a practice or a mock it still shows the
 * counts from whenever the shell last loaded. A dialog whose whole job is
 * "what is left" asks again instead.
 *
 * Solo learners only, exactly like the plan card: a center pays per seat, so a
 * center student is never quoted a meter nobody enforces (see the (app) layout).
 */
export async function GET() {
  const { profile } = await requireOrgUser();
  const soloLearner = profile.role === "student" && !isHomeworkOnlyStudent(profile);
  const usage = soloLearner ? await getUsageSummary(profile.organization_id) : null;
  return NextResponse.json({ usage }, { headers: { "Cache-Control": "private, no-store" } });
}
