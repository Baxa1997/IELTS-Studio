import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

import { OnboardingTakeover } from "@/app/(app)/onboarding/onboarding-takeover";
import { getSession } from "@/lib/auth";
import { loadStudyPlan } from "@/lib/plan/service";

// Speaking "Lucida" runner surface (exam + tutor live sessions). See
// app/(shell)/speak/lucida.tsx for the scoped token layer these feed.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-bricolage", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

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
  return (
    <div className={`${bricolage.variable} ${jakarta.variable} bg-background text-foreground min-h-screen`}>
      {children}
    </div>
  );
}
