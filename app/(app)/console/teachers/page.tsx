import { redirect } from "next/navigation";

import { EmptyTableRow, ScrollTable, TD, TH, THead, TR } from "@/components/admin/table";
import { PageHead, Panel, Pill, StatRow, StatTile } from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadTeachers } from "@/lib/console/people";

import { AddTeacherPanel } from "./add-teacher-panel";

export default async function TeachersPage() {
  const { profile } = await requireOrgUser();
  // Teachers manage classes, not colleagues.
  if (profile.role !== "center_admin") redirect("/console");

  const teachers = await loadTeachers();
  const withoutGroups = teachers.filter((t) => t.groups === 0).length;

  return (
    <div>
      <PageHead
        eyebrow="Center"
        title="Teachers"
        subtitle="The staff who run your classes. Each teacher creates their own groups and adds their own students."
      />

      <StatRow>
        <StatTile value={teachers.length} label="Teachers" tone="indigo" />
        <StatTile value={teachers.reduce((n, t) => n + t.groups, 0)} label="Groups they run" />
        <StatTile value={withoutGroups} label="Without a group yet" />
      </StatRow>

      <Panel
        title="Add a teacher"
        description="Creates the account immediately. Give an email and the sign-in details are sent; leave it out and you hand them over yourself."
      >
        <AddTeacherPanel />
      </Panel>

      <Panel
        title="Your teachers"
        description="Students counted here are the ones each teacher can actually see — those in the groups they own."
      >
        <ScrollTable maxHeight={480}>
          <THead>
            <TH>Name</TH>
            <TH>Login</TH>
            <TH align="right">Groups</TH>
            <TH align="right">Students</TH>
          </THead>
          <tbody>
            {teachers.map((t, i) => (
              <TR key={t.id} first={i === 0}>
                <TD>
                  {t.name}
                  {t.groups === 0 ? (
                    <span style={{ marginLeft: 8 }}>
                      <Pill tone="warn">no group yet</Pill>
                    </span>
                  ) : null}
                </TD>
                <TD muted>{t.username ?? "—"}</TD>
                <TD align="right" numeric>
                  {t.groups}
                </TD>
                <TD align="right" numeric muted={t.students === 0}>
                  {t.students}
                </TD>
              </TR>
            ))}
            {teachers.length === 0 ? (
              <EmptyTableRow colSpan={4}>
                No teachers yet. Add one above and they can start building classes.
              </EmptyTableRow>
            ) : null}
          </tbody>
        </ScrollTable>
      </Panel>
    </div>
  );
}
