import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { loadStudyPlan } from "@/lib/plan/service";

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

  return <CefrHub />;
}
