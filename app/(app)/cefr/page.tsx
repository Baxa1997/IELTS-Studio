import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { loadRecentCefrAttempts } from "@/lib/cefr/store";
import { loadStudyPlan } from "@/lib/plan/service";
import { createClient } from "@/lib/supabase/server";

import { CefrHub } from "./cefr-hub";

export const dynamic = "force-dynamic";

/**
 * CEFR practice hub — the distinct, level-graded track (A1–C2) that sits alongside
 * the IELTS-band track. ONE surface: pick a level, flip between Writing/Reading,
 * tasks appear inline (the old per-skill launcher pages redirect here). Students
 * only; the onboarding gate lives in the layout, so this returns null until a plan
 * exists. `?level=` and `?skill=` seed the initial selection (used by the redirects).
 */
export default async function CefrPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; skill?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const sp = await searchParams;
  const level: CefrLevel = sp.level && isCefrLevel(sp.level) ? sp.level : "B1";
  const skill: "writing" | "reading" = sp.skill === "reading" ? "reading" : "writing";

  const supabase = await createClient();
  const recent = await loadRecentCefrAttempts(supabase);

  return <CefrHub recent={recent} initialLevel={level} initialSkill={skill} />;
}
