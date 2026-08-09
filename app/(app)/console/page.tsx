import { redirect } from "next/navigation";

import {
  AMBER,
  Bar,
  BtnLink,
  Card,
  CardHead,
  CardNote,
  Columns,
  Empty,
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
  Table,
  Tag,
  TD,
  TextLink,
  THead,
  TINT,
  TRow,
  type Tone,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadCenterReport } from "@/lib/console/reports";
import { createClient } from "@/lib/supabase/server";

import { PendingInvites, type PendingInvite } from "./pending-invites";

export const dynamic = "force-dynamic";

/**
 * The center Overview — the CRM design's landing screen.
 *
 * Every figure is measured, never modelled: the design's tuition, attendance and
 * seat panels are missing because the product has no such data, and inventing it
 * on the owner's home screen is exactly the kind of number that destroys trust
 * the first time someone checks it. What replaces them is the same shape of
 * information built from graded practice, which is what this product actually
 * knows.
 */
export default async function ConsolePage() {
  const { profile } = await requireOrgUser();
  // Students don't belong here — send them to their dashboard.
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const isAdmin = profile.role === "center_admin";

  // RLS scopes every query to this admin/teacher's own organization — and, for
  // groups, to the ones a teacher actually owns.
  let groupsQuery = supabase.from("groups").select("id");
  if (!isAdmin) groupsQuery = groupsQuery.eq("teacher_id", profile.id);

  const [membersRes, invitesRes, groupsRes, orgRes, assignmentsRes, report] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase
      .from("v_pending_invites")
      .select("id, email, role, expires_at")
      .order("created_at", { ascending: false }),
    groupsQuery,
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
    // Only ever used as "has any" — RLS already narrows a teacher to their own.
    supabase.from("assignments").select("id", { count: "exact", head: true }),
    loadCenterReport({ role: profile.role, profileId: profile.id }),
  ]);

  const groupIds = (groupsRes.data ?? []).map((g) => g.id as string);
  const groupCount = groupIds.length;
  const teachers = (membersRes.data ?? []).filter((m) => m.role === "teacher").length;
  const teachersWithGroup = new Set(
    (report.groups.map((g) => g.teacherName).filter(Boolean) as string[]) ?? [],
  ).size;

  // An admin counts every learner in the center. A teacher counts the learners
  // in their own classes — `profiles` is readable org-wide by any staff member,
  // so counting it here would have shown a teacher the whole center's total on
  // this page while /console/students showed them only their own.
  let students: number;
  if (isAdmin) {
    students = (membersRes.data ?? []).filter((m) => m.role === "student").length;
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

  // The four things that have to exist before a center is actually running. The
  // panel disappears for good once they all do, so an established center never
  // sees it — it exists to cure the first-day empty console.
  const steps = [
    ...(isAdmin
      ? [
          {
            label: "Add a teacher",
            meta: "They create their own classes and see their own students.",
            href: "/console/teachers",
            done: teachers > 0,
          },
        ]
      : []),
    {
      label: "Create a group",
      meta: "A class is how practice gets set and results get compared.",
      href: "/console/groups",
      done: groupCount > 0,
    },
    {
      label: "Add students",
      meta: "One at a time, or paste the whole register at once.",
      href: "/console/groups",
      done: students > 0,
    },
    {
      label: "Set the first practice",
      meta: "Everyone in the group gets the same prompt, so the bands compare.",
      href: "/console/groups",
      done: assignmentCount > 0,
    },
  ];
  const setupDone = steps.every((s) => s.done);

  // "Needs attention" — only things that are true right now and have one obvious
  // next click. An empty list is a real state and says so.
  const idleTeachers = isAdmin ? teachers - teachersWithGroup : 0;
  const classesNoPractice = report.groups.filter((g) => g.assignments === 0).length;
  const lowCompletion = report.groups.filter(
    (g) => g.completionPct != null && g.completionPct < 50,
  ).length;
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
          icon: String(report.atRisk.length),
          tone: "red" as Tone,
          title: `${report.atRisk.length} student${report.atRisk.length === 1 ? " has" : "s have"} gone quiet`,
          detail: "No graded practice in the last 14 days.",
          cta: "Review",
          href: "/console/reports",
        }
      : null,
    idleTeachers > 0
      ? {
          icon: String(idleTeachers),
          tone: "amber" as Tone,
          title: `${idleTeachers} teacher${idleTeachers === 1 ? "" : "s"} without a class`,
          detail: "They can't set practice until they run a group.",
          cta: "Open",
          href: "/console/teachers",
        }
      : null,
    classesNoPractice > 0
      ? {
          icon: String(classesNoPractice),
          tone: "amber" as Tone,
          title: `${classesNoPractice} class${classesNoPractice === 1 ? " has" : "es have"} no practice set`,
          detail: "Nothing to grade means nothing to report on.",
          cta: "Open",
          href: "/console/groups",
        }
      : null,
    lowCompletion > 0
      ? {
          icon: String(lowCompletion),
          tone: "amber" as Tone,
          title: `${lowCompletion} class${lowCompletion === 1 ? "" : "es"} under 50% completion`,
          detail: "Most of the set homework hasn't been finished.",
          cta: "Report",
          href: "/console/reports",
        }
      : null,
    pendingInvites.length > 0
      ? {
          icon: String(pendingInvites.length),
          tone: "indigo" as Tone,
          title: `${pendingInvites.length} invite${pendingInvites.length === 1 ? "" : "s"} unaccepted`,
          detail: "They expire on their own if nobody signs up.",
          cta: "See",
          href: "/console/groups",
        }
      : null,
  ].filter((a) => a !== null);

  const measured = report.skillAverages.filter((s) => s.samples > 0);
  const topBucket = Math.max(1, ...report.bandBuckets.map((b) => b.value));
  const bestClass = [...report.groups]
    .filter((g) => g.averageBand != null)
    .sort((a, b) => (b.averageBand ?? 0) - (a.averageBand ?? 0))
    .slice(0, 5);

  const COLS = "1.8fr .9fr .9fr 1.1fr";

  return (
    <div>
      <PageHead
        eyebrow={isAdmin ? "Center admin" : "Teaching"}
        title={isAdmin ? centerName : "Your classes"}
        subtitle={
          <>
            {groupCount} class{groupCount === 1 ? "" : "es"} · {students} student
            {students === 1 ? "" : "s"} · {report.totals.gradedPractices} graded practice
            {report.totals.gradedPractices === 1 ? "" : "s"} in the last 90 days.
          </>
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

      <KpiRow>
        {isAdmin ? (
          <Kpi label="Teachers" value={teachers} sub={`${teachersWithGroup} running a class`} />
        ) : null}
        <Kpi
          label={isAdmin ? "Groups" : "Your groups"}
          value={groupCount}
          sub={`${assignmentCount} practice${assignmentCount === 1 ? "" : "s"} set`}
        />
        <Kpi label="Students" value={students} sub={`${report.totals.students} in a class`} />
        <Kpi
          label="Graded practices"
          value={report.totals.gradedPractices}
          sub="last 90 days"
        />
        <Kpi
          label="Gone quiet"
          value={report.atRisk.length}
          delta={report.atRisk.length > 0 ? "needs a nudge" : "all active"}
          deltaTone={report.atRisk.length > 0 ? "bad" : "good"}
          sub="no practice in 14 days"
        />
      </KpiRow>

      <Stack>
        <Split>
          {/* ── needs attention ───────────────────────────────────────────── */}
          <Card flush>
            <CardHead
              title="Needs attention"
              divided
              badge={
                alerts.length > 0 ? (
                  <Tag tone="red">{alerts.length} open</Tag>
                ) : (
                  <Tag tone="green">clear</Tag>
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
                trail={<TextLink href={a.href}>{a.cta} →</TextLink>}
              />
            ))}
            {alerts.length === 0 ? (
              <Empty>
                Nothing needs you right now — every class has practice set and everyone has
                practised in the last two weeks.
              </Empty>
            ) : null}
          </Card>

          {/* ── setup checklist, or the strongest classes once it's done ──── */}
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
                  meta={s.meta}
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
                title="Strongest classes"
                divided
                actions={<TextLink href="/console/reports">All classes →</TextLink>}
              />
              <Table cols={COLS} minWidth={420}>
                <THead cols={COLS} labels={["Class", "Students", "Avg band", "Completion"]} />
                {bestClass.map((g) => (
                  <TRow key={g.id} cols={COLS} href={`/console/groups/${g.id}`}>
                    <TD tone="ink" weight={500}>
                      {g.name}
                    </TD>
                    <TD>{g.students}</TD>
                    <TD tone="ink" weight={600}>
                      {g.averageBand?.toFixed(1) ?? "—"}
                    </TD>
                    <TD>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bar pct={g.completionPct ?? 0} width={54} />
                        <span style={{ fontSize: 12 }}>
                          {g.completionPct == null ? "—" : `${g.completionPct}%`}
                        </span>
                      </span>
                    </TD>
                  </TRow>
                ))}
                {bestClass.length === 0 ? (
                  <Empty>No class has a graded band yet.</Empty>
                ) : null}
              </Table>
            </Card>
          )}
        </Split>

        <Split>
          {/* ── bands awarded ─────────────────────────────────────────────── */}
          <Card>
            <CardHead
              title="Bands awarded"
              note="graded practice only, last 90 days"
              actions={<TextLink href="/console/reports">Full report →</TextLink>}
            />
            {report.bandBuckets.length > 0 ? (
              <Columns
                bars={report.bandBuckets.map((b) => ({
                  label: b.label,
                  cap: b.value,
                  pct: (b.value / topBucket) * 100,
                  fill: INDIGO,
                }))}
              />
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: 0 }}>
                Nothing graded in this window yet. Set a class some practice and the distribution
                appears here.
              </p>
            )}
          </Card>

          <Stack>
            {/* ── average by skill ───────────────────────────────────────── */}
            <Card>
              <CardHead title="Average by skill" />
              {measured.map((s) => (
                <MeterRow
                  key={s.skill}
                  label={s.skill}
                  // Bands run 0–9, so the bar is the band as a share of 9.
                  pct={((s.band ?? 0) / 9) * 100}
                  value={s.band?.toFixed(1) ?? "—"}
                  fill={(s.band ?? 0) >= 6.5 ? GREEN : (s.band ?? 0) >= 5.5 ? AMBER : RED}
                  labelWidth={70}
                />
              ))}
              {measured.length === 0 ? (
                <CardNote>No graded practice yet — nothing to average.</CardNote>
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
                  }}
                >
                  {report.writingCaps[0].label} is the criterion capping the most essays.
                </div>
              ) : null}
            </Card>

            {/* ── the dark summary card. The design puts tuition here; we have
                 no ledger, so it carries the thing a center IS measured on. ── */}
            <Card tone="dark">
              <div style={{ fontFamily: SANS, fontSize: 12, color: RAIL.light }}>
                Graded practice · last 90 days
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700 }}>
                  {report.totals.gradedPractices.toLocaleString()}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: RAIL.light }}>
                  across {report.totals.students} student
                  {report.totals.students === 1 ? "" : "s"}
                </div>
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
                    width: `${activeShare(report.totals.students, report.atRisk.length)}%`,
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
                <span>{report.totals.students - report.atRisk.length} practising</span>
                <span>{report.atRisk.length} gone quiet</span>
              </div>
            </Card>
          </Stack>
        </Split>

        {pendingInvites.length > 0 ? (
          <Card>
            <CardHead title="Pending invites" note={`${pendingInvites.length} awaiting acceptance`} />
            <CardNote>
              Expired invites are not listed — they stop working on their own.
            </CardNote>
            <PendingInvites invites={pendingInvites} />
          </Card>
        ) : null}
      </Stack>
    </div>
  );
}

/** Share of students who have practised recently, as a percentage. */
function activeShare(total: number, quiet: number): number {
  if (total <= 0) return 0;
  return Math.round(((total - quiet) / total) * 100);
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
