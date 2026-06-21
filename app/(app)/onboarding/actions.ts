"use server";

import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { saveStudyPlan } from "@/lib/plan/service";
import { studyPlanInputSchema, type StudyPlanInput } from "@/lib/plan/types";

/**
 * Persist the learner's self-report / target / exam date, then route on:
 * first-time setup → the diagnostic (confirm the real baseline); an edit → /plan.
 */
export async function saveOnboarding(input: StudyPlanInput, redirectTo: string): Promise<void> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const parsed = studyPlanInputSchema.parse(input);
  await saveStudyPlan({ studentId: profile.id, organizationId: profile.organization_id }, parsed);

  redirect(redirectTo === "/plan" ? "/plan" : "/diagnostic");
}
