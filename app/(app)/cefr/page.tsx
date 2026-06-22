import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { loadRecentCefrAttempts } from "@/lib/cefr/store";
import { loadStudyPlan } from "@/lib/plan/service";
import { createClient } from "@/lib/supabase/server";

import { CefrHub } from "./cefr-hub";

export const dynamic = "force-dynamic";

/**
 * CEFR practice hub — the distinct, level-graded track (A1–C2) that sits alongside
 * the IELTS-band track. Students only; renders inside the (app) shell. The
 * onboarding gate lives in the layout, so this returns null until a plan exists.
 */
export default async function CefrPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const supabase = await createClient();
  const recent = await loadRecentCefrAttempts(supabase);

  return <CefrHub recent={recent} />;
}
