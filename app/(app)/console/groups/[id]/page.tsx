import { notFound, redirect } from "next/navigation";

import {
  AMBER,
  Bar,
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  KindBadge,
  LINE,
  ListRow,
  MeterRow,
  PageHead,
  PersonCell,
  RED,
  SANS,
  SOFT,
  Stack,
  Table,
  Tabs,
  Tag,
  TD,
  TextLink,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { Drawer } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroupAssignments } from "@/lib/console/assignments";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";
import { loadGroupActivity } from "@/lib/console/student-report";
import { loadClassMoney } from "@/lib/finance/class-money";
import { formatMoney, toMajor } from "@/lib/finance/money";
import { monthLabel, monthStart, prettyDate, today } from "@/lib/finance/period";
import { describeProration } from "@/lib/finance/tuition";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { AssignTeacherForm, DeleteGroupButton, RemoveMemberButton } from "../group-forms";
import { InviteMemberPanel } from "../invite-member-panel";
import { AddStudentPanel } from "./add-student-panel";
import { TelegramPanel } from "./telegram-panel";
import { AssignPanel } from "./assign-panel";
import { BulkAddPanel } from "./bulk-add-panel";
import { PricingPanel } from "./pricing-panel";
import { StudentsManager } from "./students-manager";

export const dynamic = "force-dynamic";

const TABS = ["roster", "practice", "progress", "attendance", "money", "manage"] as const;
type Tab = (typeof TABS)[number];

const ROSTER_COLS = "2.2fr 1.2fr .8fr 1.2fr 1.2fr .7fr";
const MONEY_COLS = "2fr 1.4fr 1.1fr 1.1fr 1.1fr";
const KIND_LABEL: Record<string, string> = { writing: "W", reading: "R", listening: "L" };

/** One group: its roster, practice, progress and settings. RLS decides
 *  visibility — a teacher who doesn't own this group can't read its
 *  membership, so it 404s. */
export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as Tab) : "roster";

  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  const isOwner = isAdmin || group.teacherId === profile.id;
  if (!isOwner) notFound();

  const memberIds = group.members.map((m) => m.id);

  // The shared reading library lives in its own org, so it's read with the
  // service-role client (exactly as the student read hub does).
  const admin = createAdminClient();
  const supabase = await createClient();
  const [{ teachers }, assignments, activity, libTestsRes, estimatesRes] = await Promise.all([
    isAdmin
      ? loadGroups(profile)
      : Promise.resolve({ teachers: [] as { id: string; name: string }[] }),
    loadGroupAssignments(group.id),
    loadGroupActivity(memberIds),
    admin
      .from("reading_tests")
      .select("id, target_band")
      .eq("organization_id", READING_LIBRARY_ORG_ID)
      .eq("is_library", true)
      .order("target_band", { ascending: true })
      .limit(12),
    memberIds.length > 0
      ? supabase
          .from("skill_estimates")
          .select("student_id, skill, current_band, target_band")
          .in("student_id", memberIds)
      : Promise.resolve({ data: null }),
  ]);

  // ── the money side of the class ────────────────────────────────────────────
  // Owner only: a teacher must not read what the center charges, and RLS on
  // finance_settings would refuse anyway. Loaded here rather than inside the tab
  // so the whole page is one round of queries.
  const thisMonth = monthStart(today());
  const moneyData = isAdmin ? await loadClassMoney(group.id, thisMonth) : null;

  // The class's Telegram channel, if the handshake completed.
  const { data: tgRow } = await supabase
    .from("telegram_links")
    .select("chat_title, verified_at")
    .eq("group_id", group.id)
    .maybeSingle();
  const telegramLinked =
    tgRow?.verified_at != null ? { chatTitle: (tgRow.chat_title as string | null) ?? null } : null;

  // The last dozen registers for this class, oldest-to-newest across the row so
  // the strip reads left to right like a calendar.
  const { data: sessionRows } = await supabase
    .from("attendance_sessions")
    .select("id, held_on")
    .eq("group_id", group.id)
    .order("held_on", { ascending: false })
    .limit(12);
  const sessions = ((sessionRows ?? []) as { id: string; held_on: string }[]).reverse();
  const marks = new Map<string, Map<string, string>>();
  if (sessions.length > 0) {
    const { data: markRows } = await supabase
      .from("attendance_marks")
      .select("session_id, student_id, status")
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    for (const m of (markRows ?? []) as {
      session_id: string;
      student_id: string;
      status: string;
    }[]) {
      const row = marks.get(m.student_id) ?? new Map<string, string>();
      row.set(m.session_id, m.status);
      marks.set(m.student_id, row);
    }
  }
  const attendanceRate = (studentId: string) => {
    const row = marks.get(studentId);
    if (!row || row.size === 0) return null;
    const attended = [...row.values()].filter((s) => s !== "absent").length;
    return Math.round((attended / row.size) * 100);
  };

  const libraryTests = (libTestsRes.data ?? []).map((t, i) => ({
    id: t.id as string,
    label: t.target_band ? `Test ${i + 1} — band ${t.target_band} level` : `Test ${i + 1}`,
  }));

  // Per-student bands. The weakest measured skill, never a cross-skill mean —
  // an averaged "overall band" would be a number we invented.
  const bands = new Map<string, { skill: string; band: number }[]>();
  const targets = new Map<string, number>();
  for (const e of (estimatesRes.data ?? []) as {
    student_id: string;
    skill: string;
    current_band: number | null;
    target_band: number | null;
  }[]) {
    if (e.target_band != null) {
      targets.set(e.student_id, Math.max(targets.get(e.student_id) ?? 0, Number(e.target_band)));
    }
    if (e.current_band == null) continue;
    bands.set(e.student_id, [
      ...(bands.get(e.student_id) ?? []),
      { skill: e.skill, band: Number(e.current_band) },
    ]);
  }
  const weakestOf = (studentId: string) => {
    const measured = bands.get(studentId) ?? [];
    return measured.length ? measured.reduce((lo, m) => (m.band < lo.band ? m : lo)) : null;
  };

  const measuredMembers = group.members
    .map((m) => ({ ...m, weakest: weakestOf(m.id), target: targets.get(m.id) ?? null }))
    .filter((m) => m.weakest != null);
  const atTarget = measuredMembers.filter(
    (m) => m.target != null && (m.weakest as { band: number }).band >= m.target,
  ).length;
  const activeCount = group.members.filter((m) => (activity.get(m.id)?.count30d ?? 0) > 0).length;
  const totalCompleted = assignments.reduce((n, a) => n + a.completed, 0);
  const completionPct =
    assignments.length > 0 && group.members.length > 0
      ? Math.round((totalCompleted / (assignments.length * group.members.length)) * 100)
      : null;

  const tabHref = (t: Tab) =>
    t === "roster" ? `/console/groups/${id}` : `/console/groups/${id}?tab=${t}`;

  return (
    <div>
      <PageHead
        back={{ href: "/console/groups", label: "All groups" }}
        title={group.name}
        subtitle={
          <>
            {group.teacherName ? group.teacherName : "No teacher assigned"} · {group.members.length}{" "}
            student{group.members.length === 1 ? "" : "s"} · {assignments.length} practice
            {assignments.length === 1 ? "" : "s"} set
          </>
        }
        actions={
          <TextLink href={`/console/groups/${id}?tab=manage`}>
            Add students & set practice →
          </TextLink>
        }
      />

      <KpiRow>
        <Kpi
          label="Students"
          value={group.members.length}
          sub={`${activeCount} active in 30 days`}
        />
        <Kpi label="Practice set" value={assignments.length} />
        <Kpi
          label="Completion"
          value={completionPct == null ? "—" : `${completionPct}%`}
          sub={
            assignments.length === 0
              ? "nothing set yet"
              : `${totalCompleted} of ${assignments.length * group.members.length} finished`
          }
        />
        <Kpi
          label="Measured"
          value={`${measuredMembers.length}/${group.members.length}`}
          sub="have a graded band"
        />
        <Kpi
          label="At target"
          value={atTarget}
          sub="on their weakest skill"
          deltaTone={atTarget > 0 ? "good" : "flat"}
        />
      </KpiRow>

      <Tabs
        tabs={[
          { href: tabHref("roster"), label: "Roster", active: tab === "roster" },
          {
            href: tabHref("practice"),
            label: `Practice (${assignments.length})`,
            active: tab === "practice",
          },
          { href: tabHref("progress"), label: "Progress", active: tab === "progress" },
          { href: tabHref("attendance"), label: "Attendance", active: tab === "attendance" },
          ...(moneyData
            ? [{ href: tabHref("money"), label: "Money", active: tab === "money" }]
            : []),
          { href: tabHref("manage"), label: "Manage", active: tab === "manage" },
        ]}
      />

      {/* ── roster ──────────────────────────────────────────────────────────── */}
      {tab === "roster" ? (
        <Card flush>
          <Table cols={ROSTER_COLS} minWidth={780}>
            <THead
              cols={ROSTER_COLS}
              labels={["Student", "Weakest skill", "Target", "Practice (30d)", "Last active", ""]}
            />
            {group.members.map((m) => {
              const act = activity.get(m.id);
              const weakest = weakestOf(m.id);
              const target = targets.get(m.id) ?? null;
              const behind = weakest && target != null ? weakest.band - target : null;
              return (
                <TRow key={m.id} cols={ROSTER_COLS}>
                  <PersonCell
                    name={m.name}
                    photoUrl={m.photoUrl}
                    meta={`joined ${new Date(m.joinedAt).toLocaleDateString()}`}
                  />
                  <TD>
                    {weakest ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color: behind == null || behind >= 0 ? GREEN : behind >= -1 ? AMBER : RED,
                        }}
                      >
                        {weakest.band.toFixed(1)}{" "}
                        <span
                          style={{ fontWeight: 400, color: FAINT, textTransform: "capitalize" }}
                        >
                          {weakest.skill}
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: FAINT }}>not measured</span>
                    )}
                  </TD>
                  <TD tone="soft">{target?.toFixed(1) ?? "—"}</TD>
                  <TD tone={(act?.count30d ?? 0) === 0 ? "faint" : "body"}>{act?.count30d ?? 0}</TD>
                  <TD tone="soft">
                    {act?.lastActive
                      ? new Date(act.lastActive).toLocaleDateString()
                      : "never practised"}
                  </TD>
                  <TD align="right">
                    <span style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <TextLink href={`/console/groups/${group.id}/students/${m.id}`}>
                        Report
                      </TextLink>
                      <RemoveMemberButton groupId={group.id} studentId={m.id} />
                    </span>
                  </TD>
                </TRow>
              );
            })}
            {group.members.length === 0 ? (
              <Empty>No students yet — add them from the Manage tab.</Empty>
            ) : null}
          </Table>
        </Card>
      ) : null}

      {/* ── practice ────────────────────────────────────────────────────────── */}
      {tab === "practice" ? (
        <Card flush>
          <CardHead
            title="Practice set for this class"
            divided
            note="everyone gets identical content, so the bands compare"
          />
          {assignments.map((a) => {
            const pct =
              group.members.length > 0 ? Math.round((a.completed / group.members.length) * 100) : 0;
            return (
              <ListRow
                key={a.id}
                href={`/console/groups/${group.id}/assignments/${a.id}`}
                lead={
                  <KindBadge
                    tone={
                      a.kind === "writing" ? "indigo" : a.kind === "reading" ? "green" : "amber"
                    }
                  >
                    {KIND_LABEL[a.kind] ?? "?"}
                  </KindBadge>
                }
                title={a.title}
                meta={
                  <>
                    <span style={{ textTransform: "capitalize" }}>{a.kind}</span> · set{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ""}
                  </>
                }
                trail={
                  <div style={{ width: 170 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: SANS,
                        fontSize: 11.5,
                        color: SOFT,
                        marginBottom: 5,
                      }}
                    >
                      <span>
                        {a.completed}/{group.members.length} submitted
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <Bar pct={pct} fill={pct >= 60 ? GREEN : INDIGO} />
                  </div>
                }
              />
            );
          })}
          {assignments.length === 0 ? (
            <Empty>Nothing assigned yet — set the first practice from the Manage tab.</Empty>
          ) : null}
        </Card>
      ) : null}

      {/* ── progress ────────────────────────────────────────────────────────── */}
      {tab === "progress" ? (
        <Card>
          <CardHead title="Distance to target" />
          <CardNote>
            Each student&apos;s weakest measured skill against their own target. The bar is the band
            itself on the 0–9 scale; the figure on the right is how far short they are.
          </CardNote>
          {measuredMembers.map((m) => {
            const w = m.weakest as { skill: string; band: number };
            const behind = m.target != null ? w.band - m.target : null;
            return (
              <MeterRow
                key={m.id}
                label={m.name}
                labelWidth={150}
                pct={(w.band / 9) * 100}
                value={w.band.toFixed(1)}
                fill={behind == null || behind >= 0 ? GREEN : behind >= -1 ? AMBER : RED}
                trail={
                  <span
                    style={{
                      color: behind == null ? FAINT : behind >= 0 ? GREEN : RED,
                      fontWeight: 600,
                      width: 96,
                      display: "inline-block",
                      textAlign: "right",
                      textTransform: "capitalize",
                    }}
                  >
                    {behind == null
                      ? w.skill
                      : behind >= 0
                        ? `at target · ${w.skill}`
                        : `${behind.toFixed(1)} · ${w.skill}`}
                  </span>
                }
              />
            );
          })}
          {measuredMembers.length === 0 ? (
            <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
              Nobody in this class has a graded band yet. Set some practice and it fills in.
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* ── attendance ──────────────────────────────────────────────────────── */}
      {tab === "attendance" ? (
        <Card>
          <CardHead
            title={`Last ${sessions.length || 12} sessions`}
            note="a late arrival still counts as attended"
            actions={
              <TextLink href={`/console/attendance?group=${group.id}`}>Mark today →</TextLink>
            }
          />
          {sessions.length === 0 ? (
            <p style={{ fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
              No registers taken for this class yet. Open Attendance and mark one — the strip fills
              in from there.
            </p>
          ) : (
            <>
              {group.members.map((m) => {
                const row = marks.get(m.id);
                const rate = attendanceRate(m.id);
                return (
                  <div
                    key={m.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}
                  >
                    <div
                      style={{
                        width: 150,
                        flex: "0 0 150px",
                        fontFamily: SANS,
                        fontSize: 12.5,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.name}
                    </div>
                    <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
                      {sessions.map((s) => {
                        const status = row?.get(s.id);
                        const color =
                          status === "present"
                            ? GREEN
                            : status === "late"
                              ? "#E5A85C"
                              : status === "absent"
                                ? "#E0A9A3"
                                : "#EFEDE8";
                        return (
                          <span
                            key={s.id}
                            title={`${new Date(`${s.held_on}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · ${status ?? "not marked"}`}
                            style={{ width: 18, height: 18, borderRadius: 5, background: color }}
                          />
                        );
                      })}
                    </div>
                    <div
                      style={{
                        width: 50,
                        textAlign: "right",
                        fontFamily: SANS,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: rate == null ? FAINT : INK,
                      }}
                    >
                      {rate == null ? "—" : `${rate}%`}
                    </div>
                  </div>
                );
              })}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 16,
                  fontFamily: SANS,
                  fontSize: 11.5,
                  color: SOFT,
                  flexWrap: "wrap",
                }}
              >
                {[
                  ["Present", GREEN],
                  ["Late", "#E5A85C"],
                  ["Absent", "#E0A9A3"],
                  ["Not marked", "#EFEDE8"],
                ].map(([text, color]) => (
                  <span key={text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <i
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: color,
                        display: "inline-block",
                      }}
                    />
                    {text}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      ) : null}

      {/* ── money ───────────────────────────────────────────────────────────── */}
      {tab === "money" && moneyData ? (
        <Stack>
          <Card>
            <CardHead title={`What this class costs — ${monthLabel(thisMonth)}`} />
            <CardNote>
              {moneyData.lessonsThisMonth > 0
                ? `${moneyData.lessonsThisMonth} lessons this month, from the timetable. A student who joined part-way through pays for the ones that were left, and the teacher is paid for the same ones.`
                : `This class isn't on the timetable yet, so a month is assumed to be ${moneyData.fallbackLessons} lessons. Book it into a room and the real count is used instead.`}
            </CardNote>
            <PricingPanel
              groupId={group.id}
              currency={moneyData.currency}
              lessonsThisMonth={
                moneyData.lessonsThisMonth > 0
                  ? moneyData.lessonsThisMonth
                  : moneyData.fallbackLessons
              }
              feeMajor={
                moneyData.monthlyFeeMinor == null
                  ? ""
                  : String(toMajor(moneyData.monthlyFeeMinor, moneyData.currency))
              }
              rateMajor={
                moneyData.teacherRateMinor == null
                  ? ""
                  : String(toMajor(moneyData.teacherRateMinor, moneyData.currency))
              }
            />
          </Card>

          <KpiRow>
            <Kpi
              label="Tuition this month"
              value={formatMoney(moneyData.expectedMinor, moneyData.currency)}
              sub={`${group.members.length} student${group.members.length === 1 ? "" : "s"} at the current price`}
            />
            <Kpi
              label="Invoiced"
              value={formatMoney(moneyData.invoicedMinor, moneyData.currency)}
              sub={
                moneyData.invoicedMinor === 0
                  ? "nothing raised yet"
                  : `${formatMoney(moneyData.paidMinor, moneyData.currency)} collected`
              }
            />
            <Kpi
              label="Teacher earns"
              value={formatMoney(moneyData.teacherTotalMinor, moneyData.currency)}
              sub={
                moneyData.teacherRateMinor == null
                  ? "no rate set on this class"
                  : `${moneyData.studentsProrated} student${moneyData.studentsProrated === 1 ? "" : "s"} once part-months are counted`
              }
            />
            <Kpi
              label="Center keeps"
              value={formatMoney(
                moneyData.expectedMinor - moneyData.teacherTotalMinor,
                moneyData.currency,
              )}
              sub="before rent, tax and everything else"
              deltaTone={
                moneyData.expectedMinor - moneyData.teacherTotalMinor >= 0 ? "good" : "bad"
              }
            />
          </KpiRow>

          <Card flush>
            <Table cols={MONEY_COLS} minWidth={760}>
              <THead
                cols={MONEY_COLS}
                labels={["Student", "This month", "Invoiced", "Paid", "Teacher earns"]}
              />
              {group.members.map((m) => {
                const row = moneyData.rows.get(m.id);
                const tuition = row?.tuition ?? null;
                const explain = tuition ? describeProration(tuition, prettyDate) : null;
                const outstanding = (row?.invoicedMinor ?? 0) - (row?.paidMinor ?? 0);
                return (
                  <TRow key={m.id} cols={MONEY_COLS}>
                    <PersonCell
                      name={m.name}
                      photoUrl={m.photoUrl}
                      meta={`joined ${new Date(m.joinedAt).toLocaleDateString()}`}
                    />
                    <TD>
                      {tuition ? (
                        <span>
                          <span style={{ fontWeight: 600 }}>
                            {formatMoney(tuition.amountMinor, moneyData.currency)}
                          </span>
                          {explain ? (
                            <span style={{ display: "block", fontSize: 11.5, color: FAINT }}>
                              {explain}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span style={{ color: FAINT }}>no fee set</span>
                      )}
                    </TD>
                    <TD tone="soft">
                      {row?.invoicedMinor == null
                        ? "—"
                        : formatMoney(row.invoicedMinor, moneyData.currency)}
                    </TD>
                    <TD>
                      {row?.invoicedMinor == null ? (
                        <span style={{ color: FAINT }}>—</span>
                      ) : (
                        <span style={{ color: outstanding > 0 ? RED : GREEN, fontWeight: 600 }}>
                          {formatMoney(row.paidMinor, moneyData.currency)}
                        </span>
                      )}
                    </TD>
                    <TD tone="soft">
                      {row?.teacherPay
                        ? formatMoney(row.teacherPay.amountMinor, moneyData.currency)
                        : "—"}
                    </TD>
                  </TRow>
                );
              })}
              {group.members.length === 0 ? (
                <Empty>Nobody is enrolled, so there is nothing to charge.</Empty>
              ) : null}
            </Table>
          </Card>

          <CardNote>
            Invoiced is what was actually raised, which may be at an older price — changing the fee
            above never rewrites an invoice that has already gone out. Raise this month&apos;s
            invoices from <TextLink href="/console/finance/invoices">Invoices</TextLink>.
          </CardNote>
        </Stack>
      ) : null}

      {/* ── manage ──────────────────────────────────────────────────────────── */}
      {tab === "manage" ? (
        <Stack>
          {/* The roster leads, and the two ways of adding to it are buttons on
              top of it. The old layout opened with two permanently-expanded
              forms and never showed who was already in the class. */}
          <Card>
            <CardHead
              title={`Students (${group.members.length})`}
              note="Everyone here signs in with their own login — that is how homework is handed in and graded."
              actions={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Drawer
                    label="+ Add student"
                    eyebrow="Roster"
                    title="Add a student"
                    note="Type their name. The login and password are made for you and shown once."
                  >
                    <AddStudentPanel groupId={group.id} />
                  </Drawer>
                  <Drawer
                    label="Import a list"
                    eyebrow="Roster"
                    variant="ghost"
                    width={620}
                    title="Add a whole class"
                    note="Upload the Excel or CSV register you already keep, or paste the names."
                  >
                    <BulkAddPanel groupId={group.id} />
                  </Drawer>
                </div>
              }
            />
            <StudentsManager
              groupId={group.id}
              students={group.members.map((m) => ({
                id: m.id,
                name: m.name,
                login: m.login,
                contactEmail: m.contactEmail,
                joinedAt: m.joinedAt,
                photoUrl: m.photoUrl,
              }))}
            />
          </Card>

          {/* Only the class's own teacher sets practice — see createAssignment. */}
          {group.teacherId === profile.id ? (
            <Card>
              <CardHead title="Assign practice" />
              <CardNote>
                Everyone in the group gets the same prompt or test, so their results are comparable.
                You can also set practice from the Writing, Reading or Listening screens themselves.
              </CardNote>
              <AssignPanel groupId={group.id} libraryTests={libraryTests} />
            </Card>
          ) : null}

          <Card>
            <CardHead title="Invite a student to this group" />
            <CardNote>They join {group.name} automatically when they accept the link.</CardNote>
            <InviteMemberPanel fixedGroupId={group.id} canInviteTeachers={false} />
          </Card>

          {group.pendingInvites.length > 0 ? (
            <Card flush>
              <CardHead
                title="Pending invites"
                divided
                note={`${group.pendingInvites.length} awaiting acceptance`}
              />
              {group.pendingInvites.map((inv) => (
                <ListRow
                  key={inv.email}
                  title={inv.email}
                  trail={
                    <Tag tone="neutral">expires {new Date(inv.expiresAt).toLocaleDateString()}</Tag>
                  }
                />
              ))}
            </Card>
          ) : null}

          <Card>
            <CardHead title="Telegram channel" />
            <CardNote>
              Announce new practice where the class already talks. One channel per class.
            </CardNote>
            <TelegramPanel
              groupId={group.id}
              linked={telegramLinked}
              botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
            />
          </Card>

          {isAdmin ? (
            <Card>
              <CardHead title="Group settings" />
              <AssignTeacherForm
                groupId={group.id}
                teacherId={group.teacherId}
                teachers={teachers}
              />
              <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 18, paddingTop: 16 }}>
                <DeleteGroupButton groupId={group.id} />
              </div>
            </Card>
          ) : null}
        </Stack>
      ) : null}
    </div>
  );
}
