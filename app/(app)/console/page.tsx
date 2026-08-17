import { redirect } from "next/navigation";

import {
  AMBER,
  BtnLink,
  Card,
  CardHead,
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
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadDay } from "@/lib/console/attendance";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { loadAlerts } from "@/lib/console/alert-catalogue";
import { loadCenterReport, SKILL_UNIT } from "@/lib/console/reports";
import { centerNow, registersToMark } from "@/lib/console/schedule";
import { createClient } from "@/lib/supabase/server";

import { NeedsAttention } from "./needs-attention";
import { PendingInvites, type PendingInvite } from "./pending-invites";

export const dynamic = "force-dynamic";

/**
 * The center Overview, built to the CRM design: hero, five KPIs, "Needs
 * attention" beside the day's activity, then the band trend beside the skill
 * meters and a dark summary card.
 *
 * Where the design shows tuition, seats and a group timetable, this shows what
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
  const settings = await loadCenterSettings();
  // The CENTER's today, not the server's. `new Date()` on Vercel is UTC, which
  // in this market means the console shows yesterday's lessons until 05:00.
  const clock = centerNow(settings.timezone);
  const todayIso = clock.date;

  // RLS scopes every query to this admin/teacher's own organization — and, for
  // groups, to the ones a teacher actually owns.
  let groupsQuery = supabase.from("groups").select("id").eq("status", "active");
  if (!isAdmin) groupsQuery = groupsQuery.eq("teacher_id", profile.id);

  const [membersRes, invitesRes, groupsRes, orgRes, assignmentsRes, report, day, alertBoard] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, role, member_status"),
      supabase
        .from("v_pending_invites")
        .select("id, email, role, expires_at")
        .order("created_at", { ascending: false }),
      groupsQuery,
      supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
      // Only ever used as "has any" — RLS already narrows a teacher to their own.
      supabase.from("assignments").select("id", { count: "exact", head: true }),
      loadCenterReport({ role: profile.role, profileId: profile.id }),
      // THE SAME QUERY THE ATTENDANCE PAGE RUNS. This panel used to list every
      // group in the center and call them today's lessons, so the Overview
      // reported open registers on days the timetable had nothing on and
      // Attendance said "nothing is timetabled". One function now answers it.
      loadDay(profile, todayIso),
      loadAlerts(profile),
    ]);

  const people = (membersRes.data ?? []) as {
    id: string;
    full_name: string | null;
    role: string;
    member_status: string | null;
  }[];
  const groupIds = (groupsRes.data ?? []).map((g) => g.id as string);
  const groupCount = groupIds.length;
  const teachers = people.filter(
    (m) => m.role === "teacher" && (m.member_status ?? "active") !== "left",
  ).length;

  // An admin counts every learner in the center. A teacher counts the learners
  // in their own groups — `profiles` is readable org-wide by any staff member,
  // so counting it here would have shown a teacher the whole center's total on
  // this page while /console/students showed them only their own.
  //
  // Students who have LEFT are not enrolled and are not counted anywhere here.
  let students: number;
  if (isAdmin) {
    students = people.filter(
      (m) => m.role === "student" && (m.member_status ?? "active") !== "left",
    ).length;
  } else if (groupIds.length === 0) {
    students = 0;
  } else {
    const { data: roster } = await supabase
      .from("group_members")
      .select("student_id")
      .in("group_id", groupIds);
    const gone = new Set(
      people.filter((p) => (p.member_status ?? "active") === "left").map((p) => p.id),
    );
    students = new Set(
      (roster ?? []).map((r) => r.student_id as string).filter((id) => !gone.has(id)),
    ).size;
  }
  const withoutGroup = Math.max(0, students - report.totals.students);

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

  // What is on today, in time order — cancelled lessons and groups that aren't
  // timetabled today are not "today". `loadDay` already filtered to the groups
  // this person may mark.
  const todayLessons = day.lessons.filter((l) => l.scheduled && !l.cancelledReason);
  // Finished, and nobody saved the register. Not "unmarked" — a lesson that
  // starts at 18:00 is not late at lunchtime, and an alert that fires all day
  // for something you cannot do yet is an alert people learn to close.
  const overdueRegisters = registersToMark(day, day.timezone);
  // The four things that have to exist before a center is running. Once they all
  // do, the checklist never comes back — it exists to cure the empty console.
  const steps = [
    ...(isAdmin ? [{ label: "Add a teacher", href: "/console/teachers", done: teachers > 0 }] : []),
    { label: "Create a group", href: "/console/groups", done: groupCount > 0 },
    { label: "Add students", href: "/console/groups", done: students > 0 },
    { label: "Set the first practice", href: "/console/groups", done: assignmentCount > 0 },
  ];
  const setupDone = steps.every((s) => s.done);

  const measured = report.skillAverages.filter((s) => s.attempts > 0);
  // WRITING, NAMED. This panel used to plot every skill's bands in one line and
  // call it "average band across the center" — a 6.5 reading test and a 5.0
  // essay averaged into a number that moves when a student changes which skill
  // they practise. One skill, said out loud, with the count under it.
  const writing = report.skillAverages.find((s) => s.skill === "Writing");
  const trend = report.bandTrend.Writing.filter((t) => t.band != null);
  const trendLow = Math.min(...trend.map((t) => t.band ?? 0), 9);
  const trendHigh = Math.max(...trend.map((t) => t.band ?? 0), 0);
  const drift =
    trend.length >= 2 ? (trend[trend.length - 1].band ?? 0) - (trend[0].band ?? 0) : null;

  return (
    <div>
      <PageHead
        eyebrow={isAdmin ? "Center admin" : "Teaching"}
        title={isAdmin ? centerName : "Your groups"}
        subtitle={
          report.totals.gradedPractices > 0
            ? `${report.totals.gradedPractices} graded practice${report.totals.gradedPractices === 1 ? "" : "s"} ${report.window.label.toLowerCase()}, and ${report.atRisk.length} student${report.atRisk.length === 1 ? " has" : "s have"} gone quiet.`
            : "Nothing has been graded yet — set a group some practice and this fills in."
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

      {/* ══ Four counters, and each label means one thing ══
          The old strip put "Active students 3" above "1 active" and "Groups
          running 3" above "2 idle" — a KPI that contradicts its own sub-line
          teaches the reader to stop reading the strip. Each of these is one
          definition, stated in the label. */}
      <KpiRow min={165}>
        <Kpi
          label={isAdmin ? "Students enrolled" : "Your students"}
          value={students.toLocaleString()}
          delta={withoutGroup > 0 ? `${withoutGroup} in no group` : undefined}
          deltaTone={withoutGroup > 0 ? "bad" : "flat"}
          sub="active and paused"
        />
        <Kpi
          label="Practised this week"
          value={`${report.practisedThisWeek.students} of ${report.practisedThisWeek.of}`}
          sub="since Monday · always current"
        />
        <Kpi
          label="Gone quiet"
          value={report.atRisk.length}
          delta={report.atRisk.length > 0 ? "worth a call" : "nobody"}
          deltaTone={report.atRisk.length > 0 ? "bad" : "good"}
          sub="14 days · always current"
        />
        <Kpi
          label="Registers to mark"
          value={overdueRegisters.length}
          deltaTone={overdueRegisters.length > 0 ? "bad" : "good"}
          sub={
            day.holiday
              ? `${day.holiday.name} — closed`
              : `${todayLessons.length} lesson${todayLessons.length === 1 ? "" : "s"} today`
          }
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
                alertBoard.shown.length > 0 ? (
                  <Tag tone="red">{alertBoard.shown.length} open</Tag>
                ) : (
                  <Tag tone="green">all clear</Tag>
                )
              }
              note="one row per kind of problem, worst first"
            />
            <NeedsAttention
              alerts={alertBoard.shown}
              dismissed={alertBoard.dismissed}
              canDismiss={alertBoard.canDismiss}
              hiddenCount={Math.max(
                0,
                alertBoard.all.length - alertBoard.shown.length - alertBoard.dismissed.length,
              )}
            />
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
                title={`Today · ${prettyDay(todayIso)}`}
                divided
                actions={<TextLink href={`/console/attendance?date=${todayIso}`}>Attendance →</TextLink>}
              />
              {day.holiday ? (
                <Empty>
                  {day.holiday.name} — the center is closed, so nothing is timetabled.
                </Empty>
              ) : null}
              {todayLessons.map((l) => (
                <ListRow
                  key={l.groupId}
                  href={`/console/attendance/${l.groupId}?date=${todayIso}`}
                  title={l.groupName}
                  meta={[l.timeLabel, l.teacherName ?? "No teacher", l.roomName]
                    .filter(Boolean)
                    .join(" · ")}
                  trail={
                    <Tag tone={l.state === "marked" ? "green" : l.locked ? "neutral" : "amber"}>
                      {l.state === "marked" ? "Marked" : l.locked ? "Closed" : "Mark"}
                    </Tag>
                  }
                />
              ))}
              {/* A lesson that was written off still belongs on the day — it
                  explains the gap, and hiding it is how someone marks a
                  register for a lesson that never happened. */}
              {day.lessons
                .filter((l) => l.cancelledReason)
                .map((l) => (
                  <ListRow
                    key={l.groupId}
                    title={
                      <span style={{ color: MUTED, textDecoration: "line-through" }}>
                        {l.groupName}
                      </span>
                    }
                    meta={l.cancelledReason ?? undefined}
                    trail={<Tag tone="neutral">Cancelled</Tag>}
                  />
                ))}
              {todayLessons.length === 0 && !day.holiday ? (
                <Empty action={{ href: "/console/calendar", label: "Open the timetable →" }}>
                  Nothing is timetabled today.
                </Empty>
              ) : null}
            </Card>
          )}
        </Split>

        {/* ══ band trend │ skills + dark card ══ */}
        <Split>
          <Card>
            <CardHead
              title="Writing band across the center"
              note={
                writing && writing.attempts > 0
                  ? `${writing.attempts} essay${writing.attempts === 1 ? "" : "s"} from ${writing.students} student${writing.students === 1 ? "" : "s"}${writing.provisional ? " · provisional" : ""}`
                  : "graded essays only"
              }
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
              <Empty action={{ href: "/console/groups", label: "Set the first practice →" }}>
                No essays graded in this window yet.
              </Empty>
            )}
          </Card>

          <Stack>
            <Card>
              <CardHead title="Band by skill" note="each skill on its own" />
              {measured.map((s) => (
                <MeterRow
                  key={s.skill}
                  label={s.skill}
                  pct={((s.band ?? 0) / 9) * 100}
                  // The count travels with the band. `5.5` is a claim; `5.5 ·
                  // 12 essays` is evidence, and two essays says so.
                  value={
                    <span style={{ opacity: s.provisional ? 0.55 : 1 }}>
                      {s.band?.toFixed(1) ?? "—"}
                      <span style={{ fontSize: 11, color: FAINT, fontWeight: 400 }}>
                        {" "}
                        {s.attempts} {SKILL_UNIT[s.skill]}
                        {s.provisional ? " · provisional" : ""}
                      </span>
                    </span>
                  }
                  fill={
                    s.provisional
                      ? "#C9C7C1"
                      : (s.band ?? 0) >= 6.5
                        ? GREEN
                        : (s.band ?? 0) >= 5.5
                          ? AMBER
                          : RED
                  }
                  labelWidth={66}
                />
              ))}
              {measured.length === 0 ? (
                <Empty action={{ href: "/console/groups", label: "Set the first practice →" }}>
                  Nothing graded yet.
                </Empty>
              ) : null}
            </Card>

            {/* ══ The reason a center owner logs in ══
                Not "your center averages 5.6" — that converts into nothing. This
                converts into "run a Coherence workshop on Thursday", which is
                the only insight on this page anyone can act on before lunch. */}
            <Card>
              <CardHead title="Where the center loses marks" note="lowest criterion, by student" />
              {report.writingCaps.slice(0, 3).map((c) => (
                <MeterRow
                  key={c.label}
                  label={c.label}
                  pct={report.writersGraded > 0 ? (c.students / report.writersGraded) * 100 : 0}
                  value={
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {c.students} of {report.writersGraded}
                    </span>
                  }
                  fill={RED}
                  labelWidth={150}
                />
              ))}
              {report.writingCaps.length === 0 ? (
                <Empty action={{ href: "/console/groups", label: "Set a writing task →" }}>
                  No essays graded yet, so nothing is capping anyone.
                </Empty>
              ) : null}
            </Card>

            {/* The design's tuition card. There is no ledger, so it carries the
                figure a center IS accountable for: who is actually practising. */}
            <Card tone="dark">
              <div style={{ fontFamily: SANS, fontSize: 12, color: RAIL.light }}>
                Graded practice · {report.window.label.toLowerCase()}
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
                    width: `${share(report.practisedThisWeek.students, report.practisedThisWeek.of)}%`,
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
                <span>{report.practisedThisWeek.students} practised this week</span>
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

/** `Mon 16 Aug`, read in UTC so the label matches the ISO date it names. */
function prettyDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
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
        border: `1.5px solid ${done ? INDIGO : "#C5C4BE"}`,
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
