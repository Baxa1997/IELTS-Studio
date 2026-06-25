"use server";

import { cookies } from "next/headers";

import { requireOrgUser } from "@/lib/auth";
import {
  PENDING_PLAN_COOKIE,
  PENDING_PLAN_MAX_AGE,
  serializePendingPlan,
} from "@/lib/plan/pending";
import { saveStudyPlan } from "@/lib/plan/service";
import { studyPlanInputSchema, type StudyPlanInput } from "@/lib/plan/types";

/**
 * Stash the wizard's answers in an httpOnly cookie just before the learner
 * signs up. After Google OAuth / email confirmation, `applyPendingPlan` reads it
 * back and saves the real study plan. SameSite=Lax so the cookie survives the
 * top-level redirect back from the auth provider.
 */
export async function stashOnboarding(input: StudyPlanInput): Promise<void> {
  const parsed = studyPlanInputSchema.parse(input);
  const store = await cookies();
  store.set(PENDING_PLAN_COOKIE, serializePendingPlan(parsed), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_PLAN_MAX_AGE,
  });
}

/**
 * Persist the plan for an already-authenticated learner (the post-login takeover).
 * Returns instead of redirecting, so the client controls navigation — avoiding a
 * detached server-action redirect that never fires from an onClick handler.
 */
export async function savePlanForCurrentUser(input: StudyPlanInput): Promise<void> {
  const { profile } = await requireOrgUser();
  const parsed = studyPlanInputSchema.parse(input);
  await saveStudyPlan({ studentId: profile.id, organizationId: profile.organization_id }, parsed);
}
