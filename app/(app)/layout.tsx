import { cookies } from "next/headers";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { PlanCard } from "@/components/app-shell/plan-card";
import { QuotaBar } from "@/components/app-shell/quota-bar";
import { AppShell } from "@/components/app-shell/shell";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadStudyPlan } from "@/lib/plan/service";
import { getUsageSummary } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

import { OnboardingTakeover } from "./onboarding/onboarding-takeover";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });

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
  let quotaBar: React.ReactNode = null;
  // Center students (i.e. in a group) get the Assignments nav item; solo B2C
  // learners never see it — RLS returns nothing for them anyway.
  let showAssignments = false;
  let pendingAssignments = 0;
  if (profile.role === "student") {
    const supabase = await createClient();
    const [usage, membership] = await Promise.all([
      getUsageSummary(profile.organization_id),
      supabase.from("group_members").select("group_id", { count: "exact", head: true }),
    ]);
    sidebarFooter = <PlanCard usage={usage} />;
    quotaBar = <QuotaBar usage={usage} />;
    showAssignments = (membership.count ?? 0) > 0;
    // Only center students pay for this lookup; it drives the homework badge.
    if (showAssignments) {
      const assignments = await loadStudentAssignments(profile.id);
      pendingAssignments = assignments.filter((a) => !a.done).length;
    }
  }

  const collapsed = (await cookies()).get("sb_collapsed")?.value === "1";

  return (
    <div className={`${hanken.variable} ${newsreader.variable} lp-root`}>
      <AppShell
        role={profile.role}
        showAssignments={showAssignments}
        pendingAssignments={pendingAssignments}
        home={roleHome(profile.role)}
        name={profile.full_name ?? user.email ?? "Account"}
        roleLabel={ROLE_LABEL[profile.role] ?? profile.role}
        email={user.email}
        sidebarFooter={sidebarFooter}
        quotaBar={quotaBar}
        initialCollapsed={collapsed}
      >
        {children}
      </AppShell>
    </div>
  );
}
