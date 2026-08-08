import { notFound } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  List,
  PageHead,
  Panel,
  Pill,
  Row,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { loadCenterDetail } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const detail = await loadCenterDetail(id);
  if (!detail) notFound();

  const { center, staff, groups, practice30d, ungroupedStudents } = detail;
  const teachers = staff.filter((s) => s.role === "teacher");
  const admins = staff.filter((s) => s.role === "center_admin");

  return (
    <div>
      <PageHead
        back={{ href: "/admin/centers", label: "All centers" }}
        eyebrow="Center"
        title={center.name}
        subtitle={
          <>
            {center.contactEmail ?? "no contact email"} · {center.plan} ·{" "}
            {center.approvedAt
              ? `approved ${dateFmt(center.approvedAt)}`
              : `applied ${dateFmt(center.createdAt)}`}
          </>
        }
        actions={
          <span style={{ display: "flex", gap: 6 }}>
            <Pill
              tone={
                center.status === "active" ? "good" : center.status === "pending" ? "warn" : "bad"
              }
            >
              {center.status}
            </Pill>
            {!center.billingEnforced ? <Pill tone="indigo">unmetered</Pill> : null}
          </span>
        }
      />

      <StatRow>
        <StatTile value={teachers.length} label="Teachers" tone="indigo" />
        <StatTile value={groups.length} label="Groups" />
        <StatTile value={center.students} label="Students" />
        <StatTile value={center.practice30d} label="Practices (30d)" />
      </StatRow>

      <Panel title="Practice by skill" description="Last 30 days, this center only.">
        <StatRow>
          <StatTile value={practice30d.writing} label="Writing" />
          <StatTile value={practice30d.reading} label="Reading" />
          <StatTile value={practice30d.listening} label="Listening" />
          <StatTile value={practice30d.speaking} label="Speaking" />
        </StatRow>
      </Panel>

      <Panel
        title="Staff"
        description="Admins run the center; teachers own groups. Student counts are the students a teacher can actually see — those in the groups they own."
      >
        <List>
          {[...admins, ...teachers].map((s, i) => (
            <Row key={s.id} first={i === 0}>
              <RowText
                title={
                  <>
                    {s.name}{" "}
                    <Pill tone={s.role === "center_admin" ? "indigo" : "neutral"}>
                      {s.role === "center_admin" ? "admin" : "teacher"}
                    </Pill>
                  </>
                }
                meta={
                  s.role === "teacher"
                    ? `${s.groups} group${s.groups === 1 ? "" : "s"} · ${s.students} student${s.students === 1 ? "" : "s"}${s.username ? ` · ${s.username}` : ""}`
                    : (s.username ?? "—")
                }
              />
            </Row>
          ))}
          {staff.length === 0 ? (
            <EmptyRow>Nobody has accepted an invite yet.</EmptyRow>
          ) : null}
        </List>
      </Panel>

      <Panel title="Groups" description="Ordered by size.">
        <List>
          {groups.map((g, i) => (
            <Row key={g.id} first={i === 0}>
              <RowText
                title={g.name}
                meta={
                  <>
                    {g.teacherName ?? "no teacher assigned"} · {g.students} student
                    {g.students === 1 ? "" : "s"} · {g.assignments} assignment
                    {g.assignments === 1 ? "" : "s"}
                  </>
                }
              />
              {!g.teacherName ? (
                <span style={{ flex: "none" }}>
                  <Pill tone="warn">unassigned</Pill>
                </span>
              ) : null}
            </Row>
          ))}
          {groups.length === 0 ? <EmptyRow>No groups yet.</EmptyRow> : null}
        </List>
      </Panel>

      {ungroupedStudents > 0 ? (
        <Panel tone="flag" title="Students in no group">
          <p style={{ fontFamily: SANS, fontSize: 14, color: FAINT, margin: 0 }}>
            {ungroupedStudents} student{ungroupedStudents === 1 ? " belongs" : "s belong"} to this
            center but no group, so {ungroupedStudents === 1 ? "they are" : "they are"} invisible to
            every teacher report. They can still practise on their own.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
