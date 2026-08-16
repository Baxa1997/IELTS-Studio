import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Bar,
  Card,
  CardHead,
  Empty,
  FAINT,
  Glyph,
  Identity,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  Notice,
  Pill,
  SERIF,
  SOFT,
  Split,
  Surface,
  TableHead,
  TableRow,
  TONE,
  clip,
} from "@/components/admin/ui";
import { MenuIcon } from "@/components/admin/menu-icons";
import { OverflowMenu } from "@/components/admin/menu";
import { loadCenterActivity } from "@/lib/admin/activity";
import { loadCenterDetail } from "@/lib/admin/platform";
import { ago, daysSince } from "@/lib/admin/time";
import { requireSuperAdmin } from "@/lib/auth";

import { CenterActions } from "./center-actions";

export const dynamic = "force-dynamic";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

const STUDENT_COLS = "2fr 1.1fr 1.4fr .7fr";

/**
 * One centre, in enough detail to answer "is this working?".
 *
 * The idle warning at the top is the whole reason this page is worth opening:
 * a centre approved a week ago with staff, groups and zero practice is a trial
 * about to churn, and that is invisible in a list of healthy-looking counts.
 */
export default async function CenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const [detail, activity] = await Promise.all([loadCenterDetail(id), loadCenterActivity(id)]);
  if (!detail) notFound();

  const { center, staff, groups, students, practice30d, ungroupedStudents } = detail;
  const teachers = staff.filter((s) => s.role === "teacher");
  const admins = staff.filter((s) => s.role === "center_admin");

  const skills = [
    { name: "Writing", n: practice30d.writing },
    { name: "Reading", n: practice30d.reading },
    { name: "Listening", n: practice30d.listening },
    { name: "Speaking", n: practice30d.speaking },
  ];
  const skillMax = Math.max(1, ...skills.map((s) => s.n));

  // "Approved a while ago and still nothing" — the churn signal.
  const since = center.approvedAt ?? center.createdAt;
  const idleDays = daysSince(since);
  const stalled = center.status === "active" && center.practice30d === 0 && idleDays >= 3;

  return (
    <Surface>
      <Link
        href="/admin/centers"
        style={{
          fontSize: 13,
          color: MUTED,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
        }}
      >
        ← All centers
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, margin: "12px 0 20px" }}>
        <Glyph tone="indigo" size={52}>
          {initials(center.name)}
        </Glyph>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: 30,
                fontWeight: 700,
                margin: 0,
                color: INK,
                letterSpacing: "-.01em",
              }}
            >
              {center.name}
            </h1>
            <Pill
              tone={center.status === "active" ? "green" : center.status === "pending" ? "amber" : "red"}
            >
              {center.status}
            </Pill>
            {!center.billingEnforced ? (
              <Pill tone="indigo" title="Quota and seat checks are skipped for this centre">
                unmetered
              </Pill>
            ) : null}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: MUTED }}>
            {center.contactEmail ?? "no contact email"} · {center.plan} ·{" "}
            {center.approvedAt
              ? `approved ${dateFmt(center.approvedAt)}`
              : `applied ${dateFmt(center.createdAt)}`}
          </p>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
          <CenterActions
            orgId={center.id}
            name={center.name}
            suspended={center.status === "suspended"}
            memberCount={staff.length + center.students}
          />
          <OverflowMenu
            label="Center actions"
            items={[
              ...(center.contactEmail
                ? [
                    {
                      label: "Email the admin",
                      href: `mailto:${center.contactEmail}`,
                      icon: MenuIcon.mail,
                      tone: "indigo" as const,
                    },
                  ]
                : []),
              {
                label: "Change plan & limits",
                href: `/admin/users?q=${encodeURIComponent(center.name)}`,
                icon: MenuIcon.card,
                tone: "indigo" as const,
              },
              {
                label: "Export centers (Excel)",
                href: "/api/admin/export?kind=centers",
                icon: MenuIcon.sheet,
                tone: "green" as const,
                download: true,
              },
            ]}
          />
        </div>
      </div>

      <KpiRow cols={5}>
        <Kpi label="Teachers" value={teachers.length} sub={`${admins.length} admin${admins.length === 1 ? "" : "s"}`} />
        <Kpi label="Groups" value={groups.length} sub={`${groups.filter((g) => !g.teacherName).length} unassigned`} />
        <Kpi label="Students" value={center.students} sub={`${ungroupedStudents} in no group`} />
        <Kpi
          label="Practices 30d"
          value={center.practice30d}
          sub={center.practice30d === 0 ? "nothing graded" : "all four skills"}
        />
        <Kpi
          label="Practising students"
          value={students.filter((s) => s.practiceCount > 0).length}
          sub={`of ${students.length}`}
        />
      </KpiRow>

      {stalled ? (
        <Notice
          tone="amber"
          title={`${center.approvedAt ? "Approved" : "Applied"} ${idleDays} day${idleDays === 1 ? "" : "s"} ago, still nothing graded`}
          detail={`${teachers.length} teacher${teachers.length === 1 ? "" : "s"}, ${groups.length} group${groups.length === 1 ? "" : "s"}, ${center.students} student${center.students === 1 ? "" : "s"}, zero practice. A trial that stalls in week one rarely converts.`}
          action={
            center.contactEmail ? (
              <a
                href={`mailto:${center.contactEmail}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#fff",
                  border: `1px solid ${TONE.amber.border}`,
                  borderRadius: 8,
                  padding: "8px 13px",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "#8A5B12",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Email the admin
              </a>
            ) : undefined
          }
        />
      ) : null}

      <Split>
        <Card>
          <CardHead
            title="Staff"
            note="Student counts are what each teacher can actually see — those in the groups they own."
          />
          {[...admins, ...teachers].map((s) => (
            <div
              key={s.id}
              className="ad-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 18px",
                borderBottom: "1px solid #F5F4F0",
              }}
            >
              <Identity
                glyph={initials(s.name)}
                tone={s.role === "center_admin" ? "indigo" : "green"}
                round
                name={
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {s.name}
                    <Pill tone={s.role === "center_admin" ? "indigo" : "neutral"}>
                      {s.role === "center_admin" ? "admin" : "teacher"}
                    </Pill>
                  </span>
                }
                meta={
                  s.role === "teacher"
                    ? `${s.groups} group${s.groups === 1 ? "" : "s"} · ${s.students} student${s.students === 1 ? "" : "s"}${s.username ? ` · ${s.username}` : ""}`
                    : (s.username ?? "—")
                }
              />
            </div>
          ))}
          {staff.length === 0 ? <Empty>Nobody has accepted an invite yet.</Empty> : null}
        </Card>

        <Card>
          <CardHead title="Groups" note="Ordered by size." />
          {groups.map((g) => (
            <div
              key={g.id}
              className="ad-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 18px",
                borderBottom: "1px solid #F5F4F0",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: INK, ...clip }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: FAINT, marginTop: 3, ...clip }}>
                  {g.teacherName ?? "no teacher assigned"} · {g.students} student
                  {g.students === 1 ? "" : "s"} · {g.assignments} assignment
                  {g.assignments === 1 ? "" : "s"}
                </div>
              </div>
              {!g.teacherName ? (
                <Pill tone="amber">unassigned</Pill>
              ) : g.assignments === 0 ? (
                <Pill tone="amber">no activity</Pill>
              ) : null}
            </div>
          ))}
          {groups.length === 0 ? <Empty>No groups yet.</Empty> : null}
        </Card>
      </Split>

      <Split ratio="1fr 1fr">
        <Card pad>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0, color: INK }}>
              Practice by skill
            </h2>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: SOFT }}>last 30 days</span>
          </div>
          {skills.map((s) => (
            <div key={s.name} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: INK }}>{s.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 600, color: INK }}>
                  {s.n}
                </span>
              </div>
              <Bar
                width={`${(s.n / skillMax) * 100}%`}
                fill={s.n === 0 ? "#E0DED8" : INDIGO}
                height={9}
              />
            </div>
          ))}
        </Card>

        <Card>
          <CardHead
            title="Students"
            note="Ordered by how much they have practised, so an idle roll shows itself."
          />
          <div className="ad-scroll" style={{ maxHeight: 340, overflowY: "auto" }}>
            <div>
              <TableHead cols={STUDENT_COLS}>
                <div>NAME</div>
                <div>LOGIN</div>
                <div>GROUP</div>
                <div style={{ textAlign: "right" }}>PRACTICE</div>
              </TableHead>
              {students.map((s) => (
                <TableRow key={s.id} cols={STUDENT_COLS}>
                  <div style={clip}>{s.name}</div>
                  <div style={{ color: SOFT, fontSize: 12.5, ...clip }}>{s.username ?? "—"}</div>
                  <div style={{ color: SOFT, fontSize: 12.5, ...clip }}>
                    {s.groups.length > 0 ? s.groups.join(", ") : <Pill tone="amber">no group</Pill>}
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: s.practiceCount === 0 ? FAINT : INK,
                    }}
                  >
                    {s.practiceCount}
                  </div>
                </TableRow>
              ))}
              {students.length === 0 ? <Empty>No students yet.</Empty> : null}
            </div>
          </div>
        </Card>
      </Split>

      {ungroupedStudents > 0 ? (
        <Notice
          tone="amber"
          title={`${ungroupedStudents} student${ungroupedStudents === 1 ? "" : "s"} in no group`}
          detail="They belong to this centre but no class, so they are invisible to every teacher report. They can still practise on their own."
        />
      ) : null}

      <Card>
        <CardHead
          title="Recent activity in this center"
          note="Assembled from when things were created — there is no event log behind it, so removals leave no line."
        />
        {activity.map((row, i) => (
          <div
            key={`${row.when}-${i}`}
            style={{
              display: "flex",
              gap: 14,
              padding: "12px 18px",
              borderBottom: "1px solid #F5F4F0",
              fontSize: 12.5,
            }}
          >
            <span style={{ color: FAINT, width: 100, flexShrink: 0 }}>{ago(row.when)}</span>
            <span style={{ flex: 1, minWidth: 0, color: INK }}>{row.what}</span>
            <span style={{ color: SOFT, whiteSpace: "nowrap", ...clip }}>{row.who}</span>
          </div>
        ))}
        {activity.length === 0 ? (
          <Empty>Nothing has happened in this centre yet.</Empty>
        ) : null}
      </Card>
    </Surface>
  );
}
