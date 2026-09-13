import { notFound, redirect } from "next/navigation";

import { PageHead } from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupSummary } from "@/lib/console/groups";

import { GroupTabs } from "./tabs-nav";

/**
 * The chrome every group tab shares: who this group is, and the row of tabs.
 *
 * ── WHY THIS IS A LAYOUT AND NOT THE TOP OF A PAGE ──────────────────────────
 * This screen used to be ONE 1,400-line page that loaded every tab's data on
 * every request — the roster, the assignment board, twelve registers of
 * attendance marks, the month's invoices, the practice library, the timetable
 * and the Telegram link — and then threw away four fifths of it, because only
 * one `?tab=` branch ever rendered. Opening a class to check who was in it paid
 * for the finance query.
 *
 * As a layout it is fetched ONCE and then preserved: Next keeps a layout
 * mounted while you move between its child segments, so switching tabs re-runs
 * only the tab you switched to. The header and the tab row do not flicker and
 * do not re-query.
 *
 * ⚠️ WHICH MEANS THIS FILE MUST STAY CHEAP. Everything here is paid on every
 * tab. `loadGroupSummary` is deliberately counts-and-flags only — no roster, no
 * marks, no money — and anything that needs a real dataset belongs in the tab
 * that shows it. Two things were moved OUT of this header for exactly that
 * reason and should not come back:
 *
 *   - the five-KPI strip, which needed the assignment board, the skill
 *     estimates and 30-day activity to fill in. It lives on the overview tab
 *     (page.tsx), which loads all three anyway.
 *   - the "Set practice" button, which needed the whole practice library. It
 *     lives on the Homework tab, which is both where the library is already
 *     loaded and where the action belongs.
 */
export default async function GroupTabsLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const group = await loadGroupSummary(id);
  if (!group) notFound();

  /* The same gate the page had. A layout is not a security boundary on its own
     — RLS is — but a teacher who is not this group's teacher should get the
     404, not a header with empty tabs under it. Each tab checks again, because
     a layout cannot stop a child from rendering. */
  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && group.teacherId !== profile.id) notFound();

  const base = `/console/groups/${id}`;

  return (
    <div>
      <PageHead
        back={{ href: "/console/groups", label: "All groups" }}
        title={group.name}
        subtitle={
          <>
            {group.teacherName ? group.teacherName : "No teacher assigned"} · {group.memberCount}{" "}
            student{group.memberCount === 1 ? "" : "s"}
            {group.weeklyLessons > 0 ? (
              <>
                {" "}
                · {group.weeklyLessons} weekly slot{group.weeklyLessons === 1 ? "" : "s"}
              </>
            ) : null}
          </>
        }
      />

      {/* Tabs are route segments now, not `?tab=` on one page — that is what
          lets each one load only its own data and carry its own skeleton.
          The homework count comes from the summary's cheap COUNT, not from
          loading the board. */}
      <GroupTabs
        tabs={[
          { href: base, label: "Students", exact: true },
          {
            href: `${base}/homework`,
            label: `Homework (${group.homeworkCount})`,
            // The heavy three. Not prefetched: hovering the tab row should not
            // fire the assignment board, twelve registers of marks, or the
            // month's invoices for somebody who is only reading the roster.
            prefetch: false,
          },
          { href: `${base}/attendance`, label: "Attendance", prefetch: false },
          ...(isAdmin ? [{ href: `${base}/money`, label: "Money", prefetch: false }] : []),
          { href: `${base}/settings`, label: "Settings" },
        ]}
      />

      {children}
    </div>
  );
}
