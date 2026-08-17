import { Bricolage_Grotesque, JetBrains_Mono, Manrope, Newsreader, Plus_Jakarta_Sans } from "next/font/google";

import { OnboardingTakeover } from "@/app/(app)/onboarding/onboarding-takeover";
import { getSession } from "@/lib/auth";
import { loadStudyPlan } from "@/lib/plan/service";

// Speaking "Lucida" runner surface (exam + tutor live sessions). See
// app/(shell)/speak/lucida.tsx for the scoped token layer these feed.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-bricolage", display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap", preload: false });
// Every NUMBER and small caps label in the speaking redesign — timers, bands,
// wpm, section kickers. A proportional font makes a running clock jitter as the
// digits change width; this is why the design specifies a mono for them.
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono-data", display: "swap", preload: false });
// The lesson runner at /learn/[id]. Its type has to match the teacher's lesson
// page one route group away — a student and the teacher who set the work are
// looking at the same lesson, and it should not change typeface between them.
const manrope = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-manrope", display: "swap", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap", preload: false });

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
    <div className={`${bricolage.variable} ${jakarta.variable} ${jetbrains.variable} ${manrope.variable} ${newsreader.variable} bg-background text-foreground min-h-screen`}>
      {children}
    </div>
  );
}
