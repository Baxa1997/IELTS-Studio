import Link from "next/link";

import { AddTeacherPanel } from "@/app/(app)/console/teachers/add-teacher-panel";
import { InviteMemberPanel } from "@/app/(app)/console/groups/invite-member-panel";
import { type Profile } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadNavCounts } from "@/lib/console/nav";
import { createClient } from "@/lib/supabase/server";

import { CrmShell, type NavSection } from "./crm-shell";
import { EnrolStudentPanel } from "./enrol-student-panel";

/**
 * Assembles the CRM chrome for a signed-in staff member: the center's identity,
 * the nav counts, and the three panels the top bar opens. Server component, so
 * the forms inside the slide-overs stay server-rendered and the shell itself
 * stays the only client boundary.
 */
export async function StaffShell({
  profile,
  userName,
  children,
}: {
  profile: Profile;
  userName: string;
  children: React.ReactNode;
}) {
  const isAdmin = profile.role === "center_admin";
  const supabase = await createClient();

  const [orgRes, counts, { groups }] = await Promise.all([
    supabase.from("organizations").select("name, plan").eq("id", profile.organization_id).maybeSingle(),
    loadNavCounts(profile),
    loadGroups(profile),
  ]);

  const orgName = (orgRes.data?.name as string | null) ?? "Your center";
  const groupCount = counts.groups ?? 0;
  const studentCount = counts.students ?? 0;

  const sections: NavSection[] = isAdmin
    ? [
        {
          title: "Center",
          items: [
            { label: "Overview", href: "/console", icon: "grid" },
            { label: "Teachers", href: "/console/teachers", icon: "cap", count: counts.teachers },
            { label: "Groups", href: "/console/groups", icon: "people", count: groupCount },
            { label: "Students", href: "/console/students", icon: "person", count: studentCount },
            { label: "Attendance", href: "/console/attendance", icon: "calendar" },
          ],
        },
        {
          title: "Insight",
          items: [
            { label: "Reports", href: "/console/reports", icon: "bars" },
            { label: "Certificates", href: "/console/certificates", icon: "medal" },
            { label: "Announcements", href: "/console/announcements", icon: "megaphone" },
          ],
        },
        {
          title: "Admin",
          items: [
            { label: "Billing & plan", href: "/console/billing", icon: "card" },
            { label: "Settings & roles", href: "/console/settings", icon: "gear" },
          ],
        },
      ]
    : [
        {
          title: "Teaching",
          items: [
            { label: "Overview", href: "/console", icon: "grid" },
            { label: "Groups", href: "/console/groups", icon: "people", count: groupCount },
            { label: "Students", href: "/console/students", icon: "person", count: studentCount },
            { label: "Practice", href: "/console/practices", icon: "pencil" },
            { label: "Attendance", href: "/console/attendance", icon: "calendar" },
          ],
        },
        {
          title: "Insight",
          items: [
            { label: "Reports", href: "/console/reports", icon: "bars" },
            { label: "Certificates", href: "/console/certificates", icon: "medal" },
          ],
        },
      ];

  const enrolGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    meta: g.teacherName ? `${g.teacherName}` : "No teacher assigned",
    students: g.memberCount,
  }));

  return (
    <CrmShell
      orgName={orgName}
      orgMeta={`${groupCount} class${groupCount === 1 ? "" : "es"} · ${studentCount} student${studentCount === 1 ? "" : "s"}`}
      sections={sections}
      userName={userName}
      windowLabel="Last 90 days"
      footer={<RailFooter isAdmin={isAdmin} students={studentCount} groups={groupCount} />}
      enrolPanel={<EnrolStudentPanel groups={enrolGroups} />}
      teacherPanel={isAdmin ? <AddTeacherPanel /> : undefined}
      invitePanel={<InviteMemberPanel groups={groups} canInviteTeachers={isAdmin} />}
    >
      {children}
    </CrmShell>
  );
}

/**
 * The card pinned to the bottom of the rail.
 *
 * The design puts a seat meter here ("1,284 / 1,500 · Add seats"). Centers run
 * unmetered on purpose — `organizations.billing_enforced` is false for them —
 * so there is no ceiling to draw against, and a bar filling toward an invented
 * cap would be the one number on screen that isn't true. It carries the roll
 * instead, in the same shape.
 */
function RailFooter({
  isAdmin,
  students,
  groups,
}: {
  isAdmin: boolean;
  students: number;
  groups: number;
}) {
  return (
    <div style={{ background: "#1D1C4C", borderRadius: 10, padding: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 11.5, color: "#A8A6D0" }}>
          {isAdmin ? "Students enrolled" : "Your students"}
        </span>
        <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 600 }}>
          {students.toLocaleString()}
        </span>
      </div>
      <div style={{ height: 5, background: "#2B2A63", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            // No seat cap to fill, so the bar shows how much of the roll is
            // actually in a class rather than a share of a plan limit.
            width: students > 0 ? "100%" : "0%",
            height: "100%",
            background: "#E5A85C",
            borderRadius: 4,
          }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: "#7C7AA8", marginTop: 7 }}>
        across {groups} class{groups === 1 ? "" : "es"} · unmetered plan
      </div>
      {isAdmin ? (
        <Link
          href="/console/billing"
          className="crm-btn-primary"
          style={{
            marginTop: 10,
            display: "block",
            width: "100%",
            background: "#4340CB",
            color: "#fff",
            border: 0,
            borderRadius: 7,
            padding: 7,
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Billing & plan
        </Link>
      ) : null}
    </div>
  );
}
