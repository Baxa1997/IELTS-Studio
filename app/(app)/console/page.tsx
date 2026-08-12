import { redirect } from "next/navigation";

import {
  AMBER,
  BtnLink,
  Card,
  CardHead,
  ChipLink,
  Columns,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  ListRow,
  MeterRow,
  MUTED,
  PageHead,
  RAIL,
  RED,
  SANS,
  SERIF,
  Split,
  Stack,
  Tag,
  TextLink,
  TINT,
  type Tone,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadCenterReport } from "@/lib/console/reports";
import { createClient } from "@/lib/supabase/server";

import { PendingInvites, type PendingInvite } from "./pending-invites";

export const dynamic = "force-dynamic";

/**
 * The center Overview, built to the CRM design: hero, five KPIs, "Needs
 * attention" beside the day's activity, then the band trend beside the skill
 * meters and a dark summary card.
 *
 * Where the design shows tuition, seats and a class timetable, this shows what
 * the product actually measures. Those three need tables that do not exist, and
 * a modelled number on the owner's home screen is the one thing that would make
 * every other number on it suspect.
 */
export default async function ConsolePage() {
  const { profile } = await requireOrgUser();
  // Students don't belong here — send them to their dashboard.
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const isAdmin = profile.role === "center_admin";
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  // RLS scopes every query to this admin/teacher's own organization — and, for
  // groups, to the ones a teacher actually owns.
  let groupsQuery = supabase.from("groups").select("id");
  if (!isAdmin) groupsQuery = groupsQuery.eq("teacher_id", profile.id);

  const [
    membersRes,
    invitesRes,
    groupsRes,
    orgRes,
    assignmentsRes,
    report,
    todayGroupsRes,
    sessionsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role"),
    supabase
      .from("v_pending_invites")
      .select("id, email, role, expires_at")
      .order("created_at", { ascending: false }),
    groupsQuery,
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
    // Only ever used as "has any" — RLS already narrows a teacher to their own.
    supabase.from("assignments").select("id", { count: "exact", head: true }),
    loadCenterReport({ role: profile.role, profileId: profile.id }),
    // The design's "Today" panel. There is no timetable, so instead of
    // inventing session times this lists the classes and whether their
    // register has been marked — which is the question that panel answers.
    supabase.from("groups").select("id, name, teacher_id").order("name"),
    supabase.from("attendance_sessions").select("group_id, state").eq("held_on", todayIso),
  ]);

  const people = membersRes.data ?? [];
  const nameOf = new Map(
    people.map((p) => [p.id as string, (p.full_name as string | null) ?? "Unnamed"]),
  );
  const groupIds = (groupsRes.data ?? []).map((g) => g.id as string);
  const groupCount = groupIds.length;
  const teachers = people.filter((m) => m.role === "teacher").length;
  const teachersWithGroup = new Set(
    report.groups.map((g) => g.teacherId).filter((id): id is string => id != null),
  ).size;

  // An admin counts every learner in the center. A teacher counts the learners
  // in their own classes — `profiles` is readable org-wide by any staff member,
  // so counting it here would have shown a teacher the whole center's total on
  // this page while /console/students showed them only their own.
  let students: number;
  if (isAdmin) {
    students = people.filter((m) => m.role === "student").length;
  } else if (groupIds.length === 0) {
    students = 0;
  } else {
    const { data: roster } = await supabase
      .from("group_members")
      .select("student_id")
      .in("group_id", groupIds);
    students = new Set((roster ?? []).map((r) => r.student_id as string)).size;
  }

  // A pending invite is unaccepted AND unexpired — the view is the definition
  // (this card used to count expired invites, the group page did not).
  const pendingInvites: PendingInvite[] = (invitesRes.data ?? []).map((i) => ({
    id: i.id as string,
    email: i.email as string,
    role: i.role as string,
    expiresAt: i.expires_at as string,
  }));

  const centerName = (orgRes.data?.name as string | null) ?? "Your center";
  const assignmentCount = assignmentsRes.count ?? 0;
  const idleTeachers = isAdmin ? Math.max(0, teachers - teachersWithGroup) : 0;
  const classesNoPractice = report.groups.filter((g) => g.assignments === 0).length;
  const lowCompletion = report.groups.filter(
    (g) => g.completionPct != null && g.completionPct < 50,
  ).length;

  // Today's classes with their register state. A teacher sees only their own,
  // because `groups` is already RLS-scoped and this filters to what they own.
  const sessionState = new Map(
    ((sessionsRes.data ?? []) as { group_id: string; state: string }[]).map((r) => [
      r.group_id,
      r.state,
    ]),
  );
  const todayClasses = (
    (todayGroupsRes.data ?? []) as {
      id: string;
      name: string;
      teacher_id: string | null;
    }[]
  )
    .filter((g) => isAdmin || g.teacher_id === profile.id)
    .slice(0, 6)
    .map((g) => ({
      id: g.id,
      name: g.name,
      teacher: g.teacher_id ? (nameOf.get(g.teacher_id) ?? "Unassigned") : "No teacher",
      marked: sessionState.get(g.id) === "marked",
    }));
  const openRegisters = todayClasses.filter((c) => !c.marked).length;

  // The four things that have to exist before a center is running. Once they all
  // do, the checklist never comes back — it exists to cure the empty console.
  const steps = [
    ...(isAdmin ? [{ label: "Add a teacher", href: "/console/teachers", done: teachers > 0 }] : []),
    { label: "Create a group", href: "/console/groups", done: groupCount > 0 },
    { label: "Add students", href: "/console/groups", done: students > 0 },
    { label: "Set the first practice", href: "/console/groups", done: assignmentCount > 0 },
  ];
  const setupDone = steps.every((s) => s.done);

  const alerts: {
    icon: string;
    tone: Tone;
    title: string;
    detail: string;
    cta: string;
    href: string;
  }[] = [
    report.atRisk.length > 0
      ? {
          icon: "!",
          tone: "red" as Tone,
          title: `${report.atRisk.length} student${report.atRisk.length === 1 ? " has" : "s have"} gone quiet for 14 days`,
          detail: report.atRisk
            .slice(0, 2)
            .map((s) => s.name)
            .join(", "),
          cta: "See list",
          href: "/console/reports",
        }
      : null,
    idleTeachers > 0
      ? {
          icon: "◐",
          tone: "indigo" as Tone,
          title: `${idleTeachers} teacher${idleTeachers === 1 ? " has" : "s have"} no group assigned`,
          detail: "They can't set practice until they run a class.",
          cta: "Assign",
          href: "/console/teachers",
        }
      : null,
    classesNoPractice > 0
      ? {
          icon: "◷",
          tone: "amber" as Tone,
          title: `${classesNoPractice} class${classesNoPractice === 1 ? " has" : "es have"} no practice set`,
          detail: "Nothing to grade means nothing to report on.",
          cta: "Open",
          href: "/console/groups",
        }
      : null,
    lowCompletion > 0
      ? {
          icon: "%",
          tone: "amber" as Tone,
          title: `${lowCompletion} class${lowCompletion === 1 ? "" : "es"} under 50% completion`,
          detail: "Most of the homework set hasn't been finished.",
          cta: "Report",
          href: "/console/reports",
        }
      : null,
    openRegisters > 0
      ? {
          icon: "◷",
          tone: "amber" as Tone,
          title: `${openRegisters} register${openRegisters === 1 ? "" : "s"} still open today`,
          detail: todayClasses
            .filter((c) => !c.marked)
            .slice(0, 2)
            .map((c) => c.name)
            .join(", "),
          cta: "Open",
          href: "/console/attendance",
        }
      : null,
    pendingInvites.length > 0
      ? {
          icon: "✉",
          tone: "neutral" as Tone,
          title: `${pendingInvites.length} invite${pendingInvites.length === 1 ? "" : "s"} unaccepted`,
          detail: "They expire on their own if nobody signs up.",
          cta: "See",
          href: "/console/groups",
        }
      : null,
  ].filter((a) => a !== null);

  const measured = report.skillAverages.filter((s) => s.samples > 0);
  const trend = report.bandTrend.filter((t) => t.band != null);
  const trendLow = Math.min(...trend.map((t) => t.band ?? 0), 9);
  const trendHigh = Math.max(...trend.map((t) => t.band ?? 0), 0);
  const drift =
    trend.length >= 2 ? (trend[trend.length - 1].band ?? 0) - (trend[0].band ?? 0) : null;
  const activeStudents = report.totals.students - report.atRisk.length;

  return (
    <div>
      <PageHead
        eyebrow={isAdmin ? "Center admin" : "Teaching"}
        title={isAdmin ? centerName : "Your classes"}
        subtitle={
          report.totals.gradedPractices > 0
            ? `${report.totals.gradedPractices} graded practices in the last 90 days, and ${report.atRisk.length} student${report.atRisk.length === 1 ? " has" : "s have"} gone quiet.`
            : "Nothing has been graded yet — set a class some practice and this fills in."
        }
        actions={
          <>
            <BtnLink href="/console/reports" variant="ghost">
              Open reports
            </BtnLink>
            <BtnLink href="/console/groups" variant="green">
              New group
            </BtnLink>
          </>
        }
      />

      {/* ══ KPI strip — five across, exactly as drawn ══ */}
      <KpiRow min={165}>
        <Kpi
          label={isAdmin ? "Active students" : "Your students"}
          value={students.toLocaleString()}
          delta={activeStudents > 0 ? `${activeStudents} active` : undefined}
          deltaTone="good"
          sub="in a class"
        />
        <Kpi
          label="Groups running"
          value={groupCount}
          delta={classesNoPractice > 0 ? `${classesNoPractice} idle` : undefined}
          deltaTone="bad"
          sub={`${assignmentCount} practice${assignmentCount === 1 ? "" : "s"} set`}
        />
        {isAdmin ? (
          <Kpi
            label="Teachers"
            value={teachers}
            delta={idleTeachers > 0 ? `${idleTeachers} idle` : undefined}
            deltaTone="bad"
            sub={`${teachersWithGroup} running a class`}
          />
        ) : null}
        <Kpi
          label="Graded practices"
          value={report.totals.gradedPractices.toLocaleString()}
          delta={drift != null ? `${drift >= 0 ? "+" : ""}${drift.toFixed(1)} band` : undefined}
          deltaTone={drift != null && drift >= 0 ? "good" : "bad"}
          sub="last 90 days"
        />
        <Kpi
          label="Gone quiet"
          value={report.atRisk.length}
          delta={report.atRisk.length > 0 ? "worth a call" : "nobody"}
          deltaTone={report.atRisk.length > 0 ? "bad" : "good"}
          sub="14 days idle"
        />
      </KpiRow>

      <Stack>
        {/* ══ needs attention │ recent activity ══ */}
        <Split>
          <Card flush>
            <CardHead
              title="Needs attention"
              divided
              badge={
                alerts.length > 0 ? (
                  <Tag tone="red">{alerts.length} open</Tag>
                ) : (
                  <Tag tone="green">all clear</Tag>
                )
              }
            />
            {alerts.map((a) => (
              <ListRow
                key={a.title}
                lead={
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      flex: "0 0 30px",
                      borderRadius: 8,
                      background: TINT[a.tone].bg,
                      color: TINT[a.tone].fg,
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {a.icon}
                  </div>
                }
                title={a.title}
                meta={a.detail}
                trail={<ChipLink href={a.href}>{a.cta}</ChipLink>}
              />
            ))}
            {alerts.length === 0 ? (
              <Empty>
                Nothing needs you right now — every class has practice set and everyone has
                practised in the last two weeks.
              </Empty>
            ) : null}
          </Card>

          {!setupDone ? (
            <Card flush>
              <CardHead
                title="Set your center up"
                divided
                note={`${steps.filter((s) => s.done).length} of ${steps.length} done`}
              />
              {steps.map((s) => (
                <ListRow
                  key={s.label}
                  lead={<Tick done={s.done} />}
                  title={<span style={{ color: s.done ? MUTED : INK }}>{s.label}</span>}
                  trail={
                    s.done ? (
                      <span style={{ fontFamily: SANS, fontSize: 12, color: GREEN }}>Done</span>
                    ) : (
                      <TextLink href={s.href}>Do it →</TextLink>
                    )
                  }
                />
              ))}
            </Card>
          ) : (
            <Card flush>
              <CardHead
                title={`Today · ${today.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`}
                divided
                actions={<TextLink href="/console/attendance">Attendance →</TextLink>}
              />
              {todayClasses.map((c) => (
                <ListRow
                  key={c.id}
                  href={`/console/attendance?group=${c.id}`}
                  title={c.name}
                  meta={c.teacher}
                  trail={
                    <Tag tone={c.marked ? "green" : "amber"}>
                      {c.marked ? "Marked" : "Register open"}
                    </Tag>
                  }
                />
              ))}
              {todayClasses.length === 0 ? (
                <Empty>No classes yet — create one and it appears here to mark.</Empty>
              ) : null}
            </Card>
          )}
        </Split>

        {/* ══ band trend │ skills + dark card ══ */}
        <Split>
          <Card>
            <CardHead
              title="Average band across the center"
              note="graded practice only"
              actions={
                drift != null ? (
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: drift >= 0 ? GREEN : RED,
                    }}
                  >
                    {drift >= 0 ? "+" : ""}
                    {drift.toFixed(1)} since {trend[0]?.label}
                  </span>
                ) : null
              }
            />
            {trend.length > 0 ? (
              <Columns
                height={180}
                bars={trend.map((t, i) => ({
                  label: t.label,
                  cap: t.band?.toFixed(1),
                  // Scaled against the range actually observed, not 0–9, or
                  // every month would look identical.
                  pct: scale(t.band ?? 0, trendLow, trendHigh),
                  fill: i >= trend.length - 2 ? INDIGO : "#C6C4EE",
                }))}
              />
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: 0 }}>
                Nothing graded in this window yet. Set a class some practice and the trend appears
                here.
              </p>
            )}
          </Card>

          <Stack>
            <Card>
              <CardHead title="Average by skill" />
              {measured.map((s) => (
                <MeterRow
                  key={s.skill}
                  label={s.skill}
                  pct={((s.band ?? 0) / 9) * 100}
                  value={s.band?.toFixed(1) ?? "—"}
                  fill={(s.band ?? 0) >= 6.5 ? GREEN : (s.band ?? 0) >= 5.5 ? AMBER : RED}
                  labelWidth={66}
                />
              ))}
              {measured.length === 0 ? (
                <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
                  No graded practice yet — nothing to average.
                </p>
              ) : null}
              {report.writingCaps.length > 0 ? (
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11.5,
                    color: "#93919F",
                    marginTop: 12,
                    borderTop: "1px solid #F0EEE9",
                    paddingTop: 10,
                    lineHeight: 1.5,
                  }}
                >
                  {report.writingCaps[0].label} is the lowest criterion in{" "}
                  {report.writingCaps[0].hint}.
                </div>
              ) : null}
            </Card>

            {/* The design's tuition card. There is no ledger, so it carries the
                figure a center IS accountable for: who is actually practising. */}
            <Card tone="dark">
              <div style={{ fontFamily: SANS, fontSize: 12, color: RAIL.light }}>
                Graded practice · last 90 days
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700 }}>
                  {report.totals.gradedPractices.toLocaleString()}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: RAIL.light }}>practices</div>
                {drift != null ? (
                  <div
                    style={{
                      marginLeft: "auto",
                      fontFamily: SANS,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: drift >= 0 ? RAIL.mint : "#F0A9A3",
                    }}
                  >
                    {drift >= 0 ? "+" : ""}
                    {drift.toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  height: 6,
                  background: "#2B2A63",
                  borderRadius: 4,
                  margin: "14px 0 8px",
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${share(activeStudents, report.totals.students)}%`,
                    background: RAIL.mint,
                  }}
                />
                <div style={{ flex: 1, background: RAIL.gold }} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: SANS,
                  fontSize: 11.5,
                  color: RAIL.light,
                }}
              >
                <span>{activeStudents} practising</span>
                <span>{report.atRisk.length} gone quiet</span>
              </div>
            </Card>
          </Stack>
        </Split>

        {pendingInvites.length > 0 ? (
          <Card>
            <CardHead
              title="Pending invites"
              note={`${pendingInvites.length} awaiting acceptance — expired ones aren't listed`}
            />
            <PendingInvites invites={pendingInvites} />
          </Card>
        ) : null}
      </Stack>
    </div>
  );
}

/** Position a value in an observed range, floored so the shortest bar is visible. */
function scale(value: number, low: number, high: number): number {
  if (high <= low) return 70;
  const pad = (high - low) * 0.35;
  return 25 + ((value - (low - pad)) / (high + pad * 0.2 - (low - pad))) * 70;
}

function share(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Checklist marker: a filled indigo dot when done, a hollow ring when not. */
function Tick({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        flex: "0 0 20px",
        width: 20,
        height: 20,
        borderRadius: 999,
        border: `1.5px solid ${done ? INDIGO : "#E4E2DC"}`,
        background: done ? INDIGO : "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {done ? "✓" : ""}
    </span>
  );
}
