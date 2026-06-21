import { OnboardingTakeover } from "@/app/(app)/onboarding/onboarding-takeover";
import { getSession } from "@/lib/auth";
import { loadStudyPlan } from "@/lib/plan/service";

/**
 * Distraction-free shell for the writing/reading studio — deliberately no global
 * nav or account chrome, so the only thing on screen is the prompt, the timer, and
 * the page. Auth is still enforced by the proxy and each page's requireOrgUser.
 *
 * First-run gate: a student without a study plan can't slip into a studio page by
 * URL — they get the same mandatory onboarding takeover as the rest of the app.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.profile?.role === "student") {
    const plan = await loadStudyPlan(session.profile.id);
    if (!plan) return <OnboardingTakeover />;
  }
  return <div className="bg-background text-foreground min-h-screen">{children}</div>;
}
