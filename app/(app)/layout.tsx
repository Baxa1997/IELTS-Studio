import { cookies } from "next/headers";
import { Hanken_Grotesk, Manrope, Newsreader, Source_Serif_4 } from "next/font/google";

import { PlanCard } from "@/components/app-shell/plan-card";
import { QuotaBar } from "@/components/app-shell/quota-bar";
import { AppShell } from "@/components/app-shell/shell";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { NotificationBell } from "@/components/app-shell/notification-bell";
import { contactLabel, isHomeworkOnlyStudent, requireOrgUser, roleHome } from "@/lib/auth";
import { loadNavCounts } from "@/lib/console/nav";
import { loadInbox } from "@/lib/notifications/load";
import { loadStudyPlan } from "@/lib/plan/service";
import { getUsageSummary } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

import { OnboardingTakeover } from "./onboarding/onboarding-takeover";

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
/* Source Serif 4 draws the Practice AI lesson headings (`.lp-section-h`,
   `.lp-lesson .lp-idea` in globals.css) and the console's headings, so it has to
   be declared at this level — but only those two surfaces use it. preload:false
   keeps every OTHER student route from fetching it before first paint; the
   browser goes and gets it when a page actually asks for the family.

   Work Sans used to live here too, for the console's body type. It moved down to
   `console/layout.tsx`, which is the only subtree that draws with it — a student
   was downloading the staff console's typeface on every page. */
const serif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif4",
  display: "swap",
  preload: false,
});
/* Practice AI's sans. The 300 is load-bearing: the library hero sets "Where
   lessons" at 300 against "come to life" at 700 on one line, and a stack
   without a light weight collapses both to 400 and loses the headline. */
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

const ROLE_LABEL: Record<string, string> = {
  center_admin: "Center admin",
  teacher: "Teacher",
  student: "Student",
};

/**
 * Authenticated app shell wrapper (Option A brand). Resolves the session and hands
 * primitives to the client <AppShell>. Students also get a "Your target" card
 * pinned to the sidebar. The distraction-free studio runner pages are separate and
 * render full-screen without this shell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireOrgUser();

  // First-run gate: a student without a study plan sees ONLY the full-screen
  // onboarding takeover (no shell, no nav) until they complete it — whatever route
  // they're on. The page underneath renders nothing (see each page's plan guard).
  // Onboarding asks a learner for their target band and builds them a study
  // plan. A center student is taught to their class's plan, not their own, and
  // does not choose their own practice — so the takeover would ask them to set
  // up something that never gets used. Solo learners still get it.
  if (profile.role === "student" && !isHomeworkOnlyStudent(profile)) {
    const plan = await loadStudyPlan(profile.id);
    if (!plan) return <OnboardingTakeover />;
  }

  // Staff keep THIS shell — the same collapsible rail every role uses. Only the
  // canvas and the menu change (variant="console"): the CRM design applies to
  // the content area, not to the app's own chrome.
  const isStaff = profile.role === "center_admin" || profile.role === "teacher";
  const navCounts = isStaff ? await loadNavCounts(profile) : undefined;

  let sidebarFooter: React.ReactNode = null;
  let quotaBar: React.ReactNode = null;
  // A student in a group gets the Assignments nav item; a solo B2C learner
  // never does — RLS returns nothing for them anyway. This is computed for
  // EVERY student, including center ones: homework is the whole menu for them,
  // so gating it behind the billing branch below would hide the one item they
  // actually need.
  let showAssignments = false;
  let pendingAssignments = 0;
  if (profile.role === "student") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("group_members")
      .select("group_id", { count: "exact", head: true });
    showAssignments = (count ?? 0) > 0;
    if (showAssignments) {
      const assignments = await loadStudentAssignments(profile.id);
      pendingAssignments = assignments.filter((a) => !a.done).length;
    }
  }

  // Plan card and quota bar are billing surfaces. A center pays per seat, not
  // per essay (organizations.billing_enforced is false for them), so showing a
  // center student a usage meter would quote a limit nobody enforces.
  if (profile.role === "student" && !isHomeworkOnlyStudent(profile)) {
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
      className={`${hanken.variable} ${newsreader.variable} ${serif4.variable} ${manrope.variable} lp-root`}
    >
      <AppShell
        role={profile.role}
        homeworkOnly={isHomeworkOnlyStudent(profile)}
        variant={isStaff ? "console" : "learner"}
        navCounts={navCounts}
        showAssignments={showAssignments}
        pendingAssignments={pendingAssignments}
        home={roleHome(profile.role)}
        name={profile.full_name ?? contactLabel(profile) ?? "Account"}
        roleLabel={ROLE_LABEL[profile.role] ?? profile.role}
        // The real inbox or the login — never the synthetic auth address.
        email={contactLabel(profile) ?? undefined}
        sidebarFooter={sidebarFooter}
        quotaBar={quotaBar}
        bell={<NotificationBell inbox={inbox} />}
        unread={inbox.unread}
        initialCollapsed={collapsed}
      >
        {children}
      </AppShell>
    </div>
  );
}
