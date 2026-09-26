import { cookies } from "next/headers";

import { LocaleProvider } from "@/shared/components/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/server";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";

import { OnboardingTakeover } from "@/shared/components/onboarding/onboarding-takeover";
import { PlanCard } from "@/shared/components/app-shell/plan-card";
import { QuotaBar } from "@/shared/components/app-shell/quota-bar";
import { AppShell } from "@/shared/components/app-shell/shell";
import { NotificationBell } from "@/shared/components/app-shell/notification-bell";
import { contactLabel, isHomeworkOnlyStudent, requireOrgUser, roleHome } from "@/lib/auth";
import { loadInbox } from "@/lib/notifications/load";
import { loadStudyPlan } from "@/lib/plan/service";
import { getUsageSummary } from "@/lib/quota";

// The families every shell page actually renders. The surface-specific ones
// moved to the segment that uses them — DM Sans to ./listen/layout.tsx, and
// Bricolage/Jakarta to ./speak/layout.tsx. Loading all six here meant a Reading
// or Writing page downloaded sixteen weights it never drew a glyph with; the
// runners themselves are unchanged.
//
// JetBrains Mono came back here (speak/layout.tsx keeps its own copy — separate
// layout trees, and next/font dedupes the files at build time) because the
// redesigned practice card draws its small-caps eyebrow in it on all three
// hubs. Two weights only, which is what the card uses.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-newsreader",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-data",
  display: "swap",
});

const ROLE_LABEL: Record<string, string> = {
  center_admin: "Center admin",
  administrator: "Administrator",
  teacher: "Teacher",
  student: "Student",
};

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
  const { profile } = await requireOrgUser();

  let sidebarFooter: React.ReactNode = null;
  let quotaBar: React.ReactNode = null;
  const isSoloLearner = profile.role === "student" && !isHomeworkOnlyStudent(profile);
  const [plan, usage, inbox, cookieStore] = await Promise.all([
    isSoloLearner ? loadStudyPlan(profile.id) : Promise.resolve(null),
    isSoloLearner ? getUsageSummary(profile.organization_id) : Promise.resolve(null),
    // Loaded here, not in the client bell, so the unread badge is correct on the
    // first paint rather than after a fetch.
    loadInbox(),
    cookies(),
  ]);

  // First-run gate: a student without a study plan sees only the onboarding
  // takeover, whatever hub they aimed for.
  if (isSoloLearner && !plan) return <OnboardingTakeover />;

  // No plan card or quota bar for a center student — see the (app) layout.
  if (usage) {
    sidebarFooter = <PlanCard usage={usage} />;
    quotaBar = <QuotaBar usage={usage} />;
  }

  const collapsed = cookieStore.get("sb_collapsed")?.value === "1";

  // Free here: this layout already reads cookies for the session, so the tree is
  // dynamic either way and the locale costs nothing extra. Passing it down is
  // what makes the shell's chrome render in the right language on the FIRST
  // paint rather than swapping after hydration.
  const locale = await getLocale();

  return (
    <LocaleProvider initial={locale}>
      <div className={`${hanken.variable} ${newsreader.variable} ${jetbrains.variable} lp-root`}>
        <AppShell
          role={profile.role}
          homeworkOnly={isHomeworkOnlyStudent(profile)}
          home={roleHome(profile.role)}
          name={profile.full_name ?? contactLabel(profile) ?? "Account"}
          roleLabel={ROLE_LABEL[profile.role] ?? profile.role}
          // The real inbox or the login — never the synthetic auth address.
          email={contactLabel(profile) ?? undefined}
          contentClassName=""
          sidebarFooter={sidebarFooter}
          quotaBar={quotaBar}
          bell={<NotificationBell inbox={inbox} />}
          initialCollapsed={collapsed}
        >
          {children}
        </AppShell>
      </div>
    </LocaleProvider>
  );
}
