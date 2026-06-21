import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { AppShell } from "@/components/app-shell/shell";
import { TargetCard } from "@/components/app-shell/target-card";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { loadStudyPlan } from "@/lib/plan/service";

import { OnboardingTakeover } from "./onboarding/onboarding-takeover";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

const ROLE_LABEL: Record<string, string> = { center_admin: "Center admin", teacher: "Teacher", student: "Student" };

/**
 * Authenticated app shell wrapper (Option A brand). Resolves the session and hands
 * primitives to the client <AppShell>. Students also get a "Your target" card
 * pinned to the sidebar. The distraction-free studio runner pages are separate and
 * render full-screen without this shell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireOrgUser();

  // First-run gate: a student without a study plan sees ONLY the full-screen
  // onboarding takeover (no shell, no nav) until they complete it — whatever route
  // they're on. The page underneath renders nothing (see each page's plan guard).
  if (profile.role === "student") {
    const plan = await loadStudyPlan(profile.id);
    if (!plan) return <OnboardingTakeover />;
  }

  let sidebarFooter: React.ReactNode = null;
  if (profile.role === "student") {
    const est = await loadStudentEstimates(profile.id);
    const target = Math.max(est.bySkill.reading.targetBand, est.bySkill.writing.targetBand);
    sidebarFooter = <TargetCard target={target} done={est.diagnosticComplete} />;
  }

  return (
    <div className={`${hanken.variable} ${newsreader.variable} lp-root`}>
      <AppShell
        role={profile.role}
        home={roleHome(profile.role)}
        name={profile.full_name ?? user.email ?? "Account"}
        roleLabel={ROLE_LABEL[profile.role] ?? profile.role}
        sidebarFooter={sidebarFooter}
      >
        {children}
      </AppShell>
    </div>
  );
}
