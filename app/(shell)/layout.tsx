import { cookies } from "next/headers";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { OnboardingTakeover } from "@/app/(app)/onboarding/onboarding-takeover";
import { PlanCard } from "@/components/app-shell/plan-card";
import { QuotaBar } from "@/components/app-shell/quota-bar";
import { AppShell } from "@/components/app-shell/shell";
import { NotificationBell } from "@/components/app-shell/notification-bell";
import { isHomeworkOnlyStudent, requireOrgUser, roleHome } from "@/lib/auth";
import { loadInbox } from "@/lib/notifications/load";
import { loadStudyPlan } from "@/lib/plan/service";
import { getUsageSummary } from "@/lib/quota";

// The two families every shell page actually renders. The surface-specific ones
// moved to the segment that uses them — DM Sans to ./listen/layout.tsx, and
// Bricolage/Jakarta/JetBrains to ./speak/layout.tsx. Loading all six here meant
// a Reading or Writing page downloaded sixteen weights it never drew a glyph
// with; the runners themselves are unchanged.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });

const ROLE_LABEL: Record<string, string> = { center_admin: "Center admin", teacher: "Teacher", student: "Student" };

/**
 * Persistent app-shell wrapper for the Reading & Writing HUBS (the library/chooser
 * pages). The shell (header + sidebar) is owned here, so navigating between hubs —
 * and to/from the rest of the app — keeps the sidebar mounted and only the content
 * area streams a skeleton (see ./loading.tsx). It mirrors the (app) layout but runs
 * the content full-bleed (`contentClassName=""`) because the hubs paint their own
 * edge-to-edge surface. The full-screen studio RUNNERS (/read/[id], /write/[id], …)
 * stay in the chrome-free (studio) group and never mount this shell.
 */
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireOrgUser();

  // First-run gate: a student without a study plan sees only the onboarding
  // takeover (matches the (app)/(studio) layouts), whatever hub they aimed for.
  if (profile.role === "student") {
    const plan = await loadStudyPlan(profile.id);
    if (!plan) return <OnboardingTakeover />;
  }

  let sidebarFooter: React.ReactNode = null;
  let quotaBar: React.ReactNode = null;
  if (profile.role === "student") {
    const usage = await getUsageSummary(profile.organization_id);
    sidebarFooter = <PlanCard usage={usage} />;
    quotaBar = <QuotaBar usage={usage} />;
  }

  // Loaded here, not in the client bell, so the unread badge is correct on the
  // first paint rather than after a fetch.
  const inbox = await loadInbox();
  const collapsed = (await cookies()).get("sb_collapsed")?.value === "1";

  return (
    <div
      className={`${hanken.variable} ${newsreader.variable} lp-root`}
    >
      <AppShell
        role={profile.role}
        homeworkOnly={isHomeworkOnlyStudent(profile)}
        home={roleHome(profile.role)}
        name={profile.full_name ?? user.email ?? "Account"}
        roleLabel={ROLE_LABEL[profile.role] ?? profile.role}
        email={user.email}
        contentClassName=""
        sidebarFooter={sidebarFooter}
        quotaBar={quotaBar}
        bell={<NotificationBell inbox={inbox} />}
        initialCollapsed={collapsed}
      >
        {children}
      </AppShell>
    </div>
  );
}
