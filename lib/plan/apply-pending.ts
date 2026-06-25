import "server-only";

import { cookies } from "next/headers";

import { getSession } from "@/lib/auth";

import { PENDING_PLAN_COOKIE, parsePendingPlan } from "./pending";
import { loadStudyPlan, saveStudyPlan } from "./service";

/**
 * If the pre-auth onboarding wizard stashed a plan in a cookie before sign-up,
 * persist it for the now-authenticated student and clear the cookie. Returns
 * true only when a brand-new plan was saved (so the caller can route into the
 * diagnostic). No-ops — and never clobbers — for an existing plan, a non-student,
 * or a missing/invalid stash, in which case the post-auth onboarding takeover
 * remains the guaranteed gate.
 *
 * Must be called from a Server Action or Route Handler (it mutates the cookie),
 * never during a Server Component render.
 */
export async function applyPendingPlan(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(PENDING_PLAN_COOKIE)?.value;
  if (!raw) return false;

  // Consume the stash regardless of outcome — it's single-use.
  store.delete(PENDING_PLAN_COOKIE);

  const pending = parsePendingPlan(raw);
  if (!pending) return false;

  const session = await getSession();
  if (!session?.profile || session.role !== "student") return false;

  // Don't overwrite a plan they already have (e.g. returning learner).
  if (await loadStudyPlan(session.profile.id)) return false;

  await saveStudyPlan(
    { studentId: session.profile.id, organizationId: session.profile.organization_id },
    pending,
  );
  return true;
}
