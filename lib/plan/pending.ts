/**
 * The "pending plan" cookie — how the pre-auth onboarding wizard (`/start`)
 * carries a learner's answers across the sign-up round-trip (Google OAuth or
 * email confirmation both leave and re-enter the app). The wizard stashes the
 * answers here before authenticating; `applyPendingPlan` reads them back once a
 * session exists and persists them as the real study plan. No server-only / I/O
 * imports, so both the client-facing serialize side and the server reader share
 * this one definition.
 */

import { studyPlanInputSchema, type StudyPlanInput } from "./types";

/** httpOnly cookie name. Short-lived (set just before sign-up, cleared on apply). */
export const PENDING_PLAN_COOKIE = "ielts_onb_plan";

/** Seconds the stash survives — long enough for an OAuth/email round-trip. */
export const PENDING_PLAN_MAX_AGE = 60 * 60; // 1 hour

/** Only the learner-set fields the wizard collects (never weeklyGoal etc.). */
export function serializePendingPlan(input: StudyPlanInput): string {
  return JSON.stringify({
    selfReportedBand: input.selfReportedBand,
    targetBand: input.targetBand,
    examDate: input.examDate,
  });
}

/** Parse + validate a stashed plan; null on missing/garbage/tampered cookie. */
export function parsePendingPlan(raw: string | undefined | null): StudyPlanInput | null {
  if (!raw) return null;
  try {
    const parsed = studyPlanInputSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
