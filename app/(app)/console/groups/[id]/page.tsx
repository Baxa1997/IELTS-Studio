import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  GREEN,
  Kpi,
  KpiRow,
  ListRow,
  PageHead,
  PersonCell,
  RED,
  SANS,
  SERIF,
  Stack,
  Table,
  Tabs,
  Tag,
  TD,
  TextLink,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { type AssignmentKind, loadGroupAssignments } from "@/lib/console/assignments";
import { attendanceRateFrom } from "@/lib/console/attendance-marks";
import { loadGroupDetail, loadGroups } from "@/lib/console/groups";
import { ENROLLED, STUDENT_STATUS_LABEL } from "@/lib/console/status";
import { loadGroupActivity } from "@/lib/console/student-report";
import { loadClassMoney } from "@/lib/finance/class-money";
import { formatMoney, toMajor } from "@/lib/finance/money";
import { phoneKey } from "@/lib/phone";
import { monthLabel, monthStart, prettyDate, today } from "@/lib/finance/period";
import { describeProration } from "@/lib/finance/tuition";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { AssignTeacherForm, CloseGroupButton, DeleteGroupButton } from "../group-forms";
import { AddStudentPanel } from "./add-student-panel";
import { InviteClassPanel } from "./invite-class-panel";
import { TelegramPanel } from "./telegram-panel";
import { loadLibrary } from "@/lib/console/practice-library";

import { AssignSheet } from "./assign-sheet";
import { BulkAddPanel } from "./bulk-add-panel";
import { PricingPanel } from "./pricing-panel";
import { SchedulePanel } from "./schedule-panel";
import { RosterToolbar, StudentsManager } from "./students-manager";
import {
  Board,
  BoardHead,
  CheckRow,
  FilterPill,
  MiniBar,
  Pill,
  PipeTile,
  SectionCard,
  SkillChip,
  serifHead,
  V2,
  card as v2card,
} from "./ui";

export const dynamic = "force-dynamic";

const TABS = ["students", "practice", "attendance", "money", "settings"] as const;
type Tab = (typeof TABS)[number];

const FLOWS = ["open", "overdue", "done"] as const;
type Flow = (typeof FLOWS)[number];
const SKILLS = ["writing", "reading", "listening", "lesson"] as const;

const FLOW_LABEL: Record<Flow, string> = {
  open: "Open",
  overdue: "Overdue",
  done: "Done",
};
const FLOW_TONE: Record<Flow, "open" | "overdue" | "done"> = {
  open: "open",
  overdue: "overdue",
  done: "done",
};
const SKILL_LABEL: Record<AssignmentKind, string> = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  lesson: "Lesson",
};

/** The practice board's columns, shared by its head and its rows so the two
 *  can never drift apart. */
const BOARD_COLS =
  "minmax(0, 2.4fr) minmax(0, 96px) minmax(0, 112px) minmax(0, 118px) minmax(0, 64px) minmax(0, 104px)";

const MONEY_COLS = "2fr 1.4fr 1.1fr 1.1fr 1.1fr";

/** The register's columns: a name, one square per session, a rate. */
const REGISTER_COLS = (sessions: number) =>
  `minmax(0, 1.4fr) repeat(${sessions}, minmax(0, 46px)) minmax(0, 72px)`;

/** A mark says its letter as well as its colour — colour alone is not a label,
 *  and on a touch screen the tooltip that carried the meaning never opens. */
const MARK: Record<string, { letter: string; bg: string; fg: string }> = {
  present: { letter: "P", bg: "#eaf5ee", fg: "#1f6b45" },
  late: { letter: "L", bg: "#fdf1e3", fg: "#9a5b16" },
  absent: { letter: "A", bg: "#fdeceb", fg: "#a13a2c" },
  excused: { letter: "E", bg: "#eceaf4", fg: "#413a63" },
  none: { letter: "·", bg: "#f4f3ee", fg: "#8b91a0" },
};

/** One group: its roster, practice, progress and settings. RLS decides
 *  visibility — a teacher who doesn't own this group can't read its
 *  membership, so it 404s. */
export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; flow?: string; skill?: string; q?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? "")
    ? (sp.tab as Tab)
    : "students";

  const group = await loadGroupDetail(id);
  if (!group) notFound();

  const isAdmin = profile.role === "center_admin";
  const isOwner = isAdmin || group.teacherId === profile.id;
  if (!isOwner) notFound();

  // DENOMINATORS ARE THE ENROLLED ROSTER. A student who left keeps their marks,
  // their registers and their invoices — but counting them as a member makes
  // every completion percentage and every "measured out of" look worse than the
  // group is doing, for as long as the center exists.
  const roster = group.members.filter((m) => ENROLLED.includes(m.status));
  const alumni = group.members.filter((m) => m.status === "left");
  const memberIds = roster.map((m) => m.id);

  // The shared reading library lives in its own org, so it's read with the
  // service-role client (exactly as the student read hub does).
  const admin = createAdminClient();
  const supabase = await createClient();
  // Loaded for everyone now, not only the owner: a teacher needs the list of
  // their OWN groups to move a student between them. `teachers` stays gated in
  // the UI below, and RLS scopes both to what this person may touch anyway.
  const [{ teachers, groups: manageable }, assignments, activity, libTestsRes, estimatesRes] =
    await Promise.all([
      loadGroups(profile),
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

  // ── the money side of the group ────────────────────────────────────────────
  // Owner only: a teacher must not read what the center charges, and RLS on
  // finance_settings would refuse anyway. Loaded here rather than inside the tab
  // so the whole page is one round of queries.
  const thisMonth = monthStart(today());
  const moneyData = isAdmin ? await loadClassMoney(group.id, thisMonth) : null;

  // ── when the group meets ───────────────────────────────────────────────────
  // Its own row rather than loadGroups', because a teacher's loadGroups is
  // narrowed to their groups and this page is already proven to be one of them.
  const [{ data: groupRow }, { data: slotRows }, { rooms: allRooms }] = await Promise.all([
    supabase.from("groups").select("branch_id").eq("id", group.id).maybeSingle(),
    supabase
      .from("lesson_slots")
      .select("series_id, weekday, starts_at, ends_at, room_id")
      .eq("group_id", group.id),
    // "all": this page has to open for a closed group too.
    loadGroups(profile, { include: "all" }),
  ]);
  // A group can hold SEVERAL independent bookings — the same group at 08:00 and
  // again at 15:30 is two series, four rows. Grouping by series_id keeps them
  // apart; a single flattened weekday list would merge two real bookings into
  // one and lose a time.
  const slots = (slotRows ?? []) as Record<string, unknown>[];
  const seriesMap = new Map<
    string,
    {
      seriesId: string;
      weekdays: number[];
      startsAt: string;
      endsAt: string;
      roomId: string | null;
    }
  >();
  for (const r of slots) {
    const key = String(r.series_id);
    const entry = seriesMap.get(key) ?? {
      seriesId: key,
      weekdays: [],
      // Every row in one series shares its time and room, so the first speaks
      // for all of them.
      startsAt: String(r.starts_at).slice(0, 5),
      endsAt: String(r.ends_at).slice(0, 5),
      roomId: (r.room_id as string | null) ?? null,
    };
    entry.weekdays.push(Number(r.weekday));
    seriesMap.set(key, entry);
  }
  const series = [...seriesMap.values()]
    .map((e) => ({ ...e, weekdays: [...new Set(e.weekdays)].sort() }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // The group's Telegram channel, if the handshake completed.
  const { data: tgRow } = await supabase
    .from("telegram_links")
    .select("chat_title, verified_at")
    .eq("group_id", group.id)
    .maybeSingle();
  const telegramLinked =
    tgRow?.verified_at != null ? { chatTitle: (tgRow.chat_title as string | null) ?? null } : null;

  // THE CLASS INVITE MATCHES A STUDENT BY PHONE. A roster with blanks in it is
  // the single reason that flow fails, and a teacher should learn it before
  // sending thirty students a message that cannot work for some of them —
  // not afterwards, from the ones who complain. Counted with `phoneKey`, the
  // same function the bot matches on, so this cannot claim a number is usable
  // when the matcher would reject it.
  const { data: phoneRows } =
    memberIds.length > 0
      ? await supabase.from("profiles").select("id, phone").in("id", memberIds)
      : { data: [] as { id: string; phone: string | null }[] };
  const withPhone = ((phoneRows ?? []) as { id: string; phone: string | null }[]).filter(
    (r) => phoneKey(r.phone) != null,
  ).length;

  // The last dozen registers for this group, oldest-to-newest across the row so
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
  // The shared definition, not a fourth one. This used to be
  // `s !== "absent"`, which counted an excused lesson as attended and left it
  // in the denominator — so this page and the payroll page reported different
  // rates for the same group.
  const attendanceRate = (studentId: string) => {
    const row = marks.get(studentId);
    if (!row || row.size === 0) return null;
    return attendanceRateFrom(row.values());
  };

  const libraryTests = (libTestsRes.data ?? []).map((t, i) => ({
    id: t.id as string,
    label: t.target_band ? `Test ${i + 1} — band ${t.target_band} level` : `Test ${i + 1}`,
  }));

  // §9's shelf, offered here so setting practice can reuse rather than
  // regenerate. Kept to what is unarchived and current.
  const shelf = (await loadLibrary()).map((item) => ({
    id: item.id,
    title: item.title,
    skill: item.skill,
    level: item.level,
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

  const measuredMembers = roster
    .map((m) => ({ ...m, weakest: weakestOf(m.id), target: targets.get(m.id) ?? null }))
    .filter((m) => m.weakest != null);
  const atTarget = measuredMembers.filter(
    (m) => m.target != null && (m.weakest as { band: number }).band >= m.target,
  ).length;
  const activeCount = roster.filter((m) => (activity.get(m.id)?.count30d ?? 0) > 0).length;
  const totalCompleted = assignments.reduce((n, a) => n + a.completed, 0);
  const completionPct =
    assignments.length > 0 && roster.length > 0
      ? Math.round((totalCompleted / (assignments.length * roster.length)) * 100)
      : null;

  // The group list, learning data and account data joined into one shape —
  // both the table and the CSV export read this, so what you download is
  // exactly what you were looking at.
  // An address given twice in one roster is a shared parent inbox, which the
  // enrolment form deliberately allows. Counted once so the row can say so.
  const emailUses = new Map<string, number>();
  for (const m of roster) {
    const key = (m.contactEmail ?? "").toLowerCase();
    if (key) emailUses.set(key, (emailUses.get(key) ?? 0) + 1);
  }

  // The other groups this person manages — the destinations a student can be
  // moved to. RLS already scopes `loadGroups` to what they may touch, so an
  // empty list genuinely means there is nowhere to move anybody.
  const siblingGroups = manageable
    .filter((g) => g.id !== group.id)
    .map((g) => ({ id: g.id, name: g.name }));

  // What each student still owes for this month, for the Move-or-remove sheet.
  // Only the owner sees money on this page, so a teacher's sheet simply omits
  // the line rather than showing them a figure they are not shown anywhere else.
  const owedByStudent = new Map<string, string>();
  if (moneyData) {
    for (const [studentId, row] of moneyData.rows) {
      const owed = (row.invoicedMinor ?? 0) - row.paidMinor;
      if (owed > 0) {
        owedByStudent.set(studentId, `${formatMoney(owed, moneyData.currency)} owed`);
      }
    }
  }

  const studentRows = roster.map((m) => {
    const weakest = weakestOf(m.id);
    const act = activity.get(m.id);
    return {
      id: m.id,
      name: m.name,
      login: m.login,
      contactEmail: m.contactEmail,
      sharesEmail: (emailUses.get((m.contactEmail ?? "").toLowerCase()) ?? 0) > 1,
      joinedAt: m.joinedAt,
      photoUrl: m.photoUrl,
      weakestSkill: weakest?.skill ?? null,
      weakestBand: weakest?.band ?? null,
      targetBand: targets.get(m.id) ?? null,
      practice30d: act?.count30d ?? 0,
      lastActive: act?.lastActive ?? null,
      status: m.status ?? "active",
      owedLabel: owedByStudent.get(m.id) ?? null,
    };
  });

  // How many lessons a week the timetable actually holds. `series` groups the
  // bookings, so a series that meets twice a week is two slots, not one.
  const weeklyLessons = series.reduce((n, e) => n + e.weekdays.length, 0);

  // ── the practice board ─────────────────────────────────────────────────────
  // Every assignment gets a state a teacher would recognise on sight. There is
  // deliberately NO "to mark" bucket: this product marks with a model the
  // moment work is handed in, so a queue waiting on a human would read zero for
  // ever and teach everybody to ignore the strip above the board.
  const flowOf = (a: { completed: number; dueAt: string | null }): Flow => {
    if (roster.length > 0 && a.completed >= roster.length) return "done";
    // Compared by DATE, not by instant: something due today is not late until
    // tomorrow, and `today()` is the clock the rest of this page already reads.
    if (a.dueAt && a.dueAt.slice(0, 10) < today()) return "overdue";
    return "open";
  };
  const board = assignments.map((a) => ({ ...a, flow: flowOf(a) }));
  const openCount = board.filter((a) => a.flow === "open").length;
  const overdueCount = board.filter((a) => a.flow === "overdue").length;
  const doneCount = board.filter((a) => a.flow === "done").length;

  const flowFilter = (FLOWS as readonly string[]).includes(sp.flow ?? "")
    ? (sp.flow as Flow)
    : null;
  const skillFilter = (SKILLS as readonly string[]).includes(sp.skill ?? "")
    ? (sp.skill as AssignmentKind)
    : null;
  const query = (sp.q ?? "").trim();
  const needle = query.toLowerCase();
  const visible = board.filter(
    (a) =>
      (!flowFilter || a.flow === flowFilter) &&
      (!skillFilter || a.kind === skillFilter) &&
      (!needle || a.title.toLowerCase().includes(needle)),
  );

  /** A board link that keeps the filters you already have and changes one of
   *  them. Filters in the URL rather than in component state, so "what is
   *  overdue in this class" is a link a teacher can bookmark or send on. */
  const boardHref = (patch: { flow?: Flow | null; skill?: AssignmentKind | null; q?: string }) => {
    const next = new URLSearchParams({ tab: "practice" });
    const flow = patch.flow === undefined ? flowFilter : patch.flow;
    const skill = patch.skill === undefined ? skillFilter : patch.skill;
    const text = patch.q === undefined ? query : patch.q;
    if (flow) next.set("flow", flow);
    if (skill) next.set("skill", skill);
    if (text) next.set("q", text);
    return `/console/groups/${id}?${next.toString()}`;
  };

  const tabHref = (t: Tab) =>
    t === "students" ? `/console/groups/${id}` : `/console/groups/${id}?tab=${t}`;

  return (
    <div>
      <PageHead
        back={{ href: "/console/groups", label: "All groups" }}
        title={group.name}
        subtitle={
          <>
            {group.teacherName ? group.teacherName : "No teacher assigned"} · {roster.length}{" "}
            student{roster.length === 1 ? "" : "s"}
            {weeklyLessons > 0 ? (
              <>
                {" "}
                · {weeklyLessons} weekly slot{weeklyLessons === 1 ? "" : "s"}
              </>
            ) : null}
          </>
        }
        actions={
          /* SETTINGS IS A TAB, not a drawer.

             A drawer has no URL, so nothing anywhere could send a teacher to
             it — every prompt to "go and connect Telegram" had to describe
             the route in words and hope. It was also invisible: three of the
             four things in there are set once and then needed again months
             later, by which time nobody remembers there is a button in the
             header. A tab is both addressable and on the page.

             What DOES belong up here is the one thing a teacher opens this
             page to do. Only the group's own teacher may set practice —
             createAssignment refuses anyone else, so an admin is not shown a
             button that will turn them away. */
          group.teacherId === profile.id ? (
            <AssignSheet groupId={group.id} libraryTests={libraryTests} library={shelf} />
          ) : null
        }
      />

      <KpiRow>
        <Kpi label="Students" value={roster.length} sub={`${activeCount} active in 30 days`} />
        <Kpi
          label="Practice set"
          value={assignments.length}
          sub={openCount > 0 ? `${openCount} still open` : "nothing outstanding"}
        />
        <Kpi
          label="Completion"
          value={completionPct == null ? "—" : `${completionPct}%`}
          sub={
            assignments.length === 0
              ? "nothing set yet"
              : `${totalCompleted} of ${assignments.length * roster.length} finished`
          }
        />
        <Kpi
          label="Measured"
          value={`${measuredMembers.length}/${roster.length}`}
          sub="have a graded band"
        />
        <Kpi
          label="At target"
          value={atTarget}
          sub="on their weakest skill"
          deltaTone={atTarget > 0 ? "good" : "flat"}
        />
      </KpiRow>

      {/* Four tabs, from six. "Roster" and "Manage" both listed the same
          students and neither just showed the group; they are one Students tab
          now, and the single Progress card folded into its columns. */}
      <Tabs
        tabs={[
          { href: tabHref("students"), label: "Students", active: tab === "students" },
          {
            href: tabHref("practice"),
            label: `Practice (${assignments.length})`,
            active: tab === "practice",
          },
          { href: tabHref("attendance"), label: "Attendance", active: tab === "attendance" },
          ...(moneyData
            ? [{ href: tabHref("money"), label: "Money", active: tab === "money" }]
            : []),
          { href: tabHref("settings"), label: "Settings", active: tab === "settings" },
        ]}
      />

      {tab === "settings" ? (
        /* TWO COLUMNS, NOT ONE 760px STACK. Settings holds two unrelated jobs:
           how the class runs (times, who teaches it, whether it still exists)
           and how the class gets reached (its channel, and getting everyone
           signed in). Stacked, the second job sat below the fold behind the
           first, which is why nobody found it. */
        <div className="cn-settings-grid" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <SectionCard
              title="When it meets"
              note="Fills the register, decides which lessons can be marked, and is the lesson count a part-month fee is divided by."
              aside={
                weeklyLessons > 0 ? (
                  <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>
                    {weeklyLessons} slot{weeklyLessons === 1 ? "" : "s"} a week
                  </span>
                ) : null
              }
            >
              <SchedulePanel
                groupId={group.id}
                rooms={allRooms}
                branchId={(groupRow?.branch_id as string) ?? ""}
                series={series}
              />
            </SectionCard>

            {isAdmin ? (
              <SectionCard
                title="Teacher"
                note="Who owns this group — they are the only person who can set it practice."
              >
                <AssignTeacherForm
                  groupId={group.id}
                  teacherId={group.teacherId}
                  teachers={teachers}
                />
              </SectionCard>
            ) : null}

            {isAdmin ? (
              <section
                style={{
                  ...v2card,
                  background: "#fdfbf8",
                  borderColor: "#e9d9d3",
                  padding: "18px 22px",
                  display: "grid",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: V2.ink }}>
                    Closing and deleting
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: "#8b7f7a", marginTop: 2 }}>
                    Closing keeps every report, band and invoice and takes the group out of
                    timetables and assigning. Deleting is only for a group created by mistake.
                  </div>
                </div>
                <CloseGroupButton groupId={group.id} status={group.status} />
                <DeleteGroupButton groupId={group.id} />
              </section>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <SectionCard
              title="Telegram group"
              note="One channel per group — where new practice is announced and sign-in links are delivered."
              aside={
                <Pill tone={telegramLinked ? "done" : "idle"}>
                  {telegramLinked ? "Connected" : "Not connected"}
                </Pill>
              }
            >
              <TelegramPanel
                groupId={group.id}
                linked={telegramLinked}
                botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
              />
            </SectionCard>

            {/* THIS SLOT USED TO HOLD "Invite link" — a tokenised link a
                person accepts to create their own account and join. It is gone
                rather than sitting beside this one, because two things called
                "invite" on one screen, doing different jobs, is how a teacher
                picks the wrong one. The capability is not lost: the same panel
                is in the console chrome's own Invite, which is where an invite
                that is not about a specific class belongs.

                This is the path that matches how a centre actually onboards —
                accounts already exist from the register, and what is missing is
                getting each student their own login. */}
            <SectionCard
              title="Get the class signed in"
              note="One message to the channel; each student taps it, confirms their phone number and receives their own login privately. No passwords in the channel, nothing for you to hand out."
            >
              <CheckRow
                ok={telegramLinked != null}
                label="Channel linked"
                note={
                  telegramLinked
                    ? (telegramLinked.chatTitle ?? "connected")
                    : "without one the invite has nowhere to be posted"
                }
              />
              <CheckRow
                ok={roster.length > 0 && withPhone >= roster.length}
                label="Phone numbers on the roster"
                note={
                  roster.length === 0
                    ? "nobody in the group yet"
                    : `${withPhone} of ${roster.length} students — logins are matched by phone`
                }
                action={
                  withPhone < roster.length
                    ? { href: `/console/groups/${id}`, label: "Fix roster" }
                    : undefined
                }
              />
              <InviteClassPanel groupId={group.id} />
            </SectionCard>
          </div>
        </div>
      ) : null}

      {tab === "practice" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
          {/* The strip is a filter, not decoration. A teacher opening this tab
              is nearly always answering one of three questions — what is late,
              what is still out, what is finished — and each is one tap. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            <PipeTile
              href={boardHref({ flow: "overdue", skill: null, q: "" })}
              label="Overdue"
              value={overdueCount}
              note="past the deadline"
              active={flowFilter === "overdue"}
            />
            <PipeTile
              href={boardHref({ flow: "open", skill: null, q: "" })}
              label="Open"
              value={openCount}
              note="still with the students"
              active={flowFilter === "open"}
            />
            <PipeTile
              href={boardHref({ flow: "done", skill: null, q: "" })}
              label="Done"
              value={doneCount}
              note="everyone marked"
              active={flowFilter === "done"}
            />
            <PipeTile
              href={`/console/groups/${id}?tab=practice`}
              label="All practice"
              value={board.length}
              note="clear the filters"
              active={!flowFilter && !skillFilter && !query}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* A GET form, so a search is a URL like every other filter here. */}
            <form action={`/console/groups/${id}`} style={{ margin: 0 }}>
              <input type="hidden" name="tab" value="practice" />
              {flowFilter ? <input type="hidden" name="flow" value={flowFilter} /> : null}
              {skillFilter ? <input type="hidden" name="skill" value={skillFilter} /> : null}
              <input
                name="q"
                defaultValue={query}
                placeholder="Search practice by title"
                aria-label="Search practice by title"
                style={{
                  width: 280,
                  maxWidth: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `1px solid ${V2.field}`,
                  background: "#fff",
                  fontFamily: SANS,
                  fontSize: 14,
                  color: V2.ink,
                  outline: "none",
                }}
              />
            </form>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <FilterPill href={boardHref({ skill: null })} label="All" active={!skillFilter} />
              {SKILLS.map((k) => (
                <FilterPill
                  key={k}
                  href={boardHref({ skill: k })}
                  label={SKILL_LABEL[k]}
                  active={skillFilter === k}
                />
              ))}
            </div>
            <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 13, color: V2.faint }}>
              {visible.length === board.length
                ? `${board.length} set in total`
                : `${visible.length} of ${board.length} shown`}
            </span>
          </div>

          <Board>
            <BoardHead
              cols={BOARD_COLS}
              labels={["Practice", "Skill", "Set / due", "Submitted", "Band", "Status"]}
            />
            {visible.map((a) => {
              const pct = roster.length > 0 ? Math.round((a.completed / roster.length) * 100) : 0;
              const row = (
                <>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <SkillChip kind={a.kind} />
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: 15,
                          fontWeight: 600,
                          color: V2.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.title}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: V2.body, minWidth: 0 }}>
                    {SKILL_LABEL[a.kind]}
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      color: V2.body,
                      minWidth: 0,
                      lineHeight: 1.35,
                    }}
                  >
                    <div>set {new Date(a.createdAt).toLocaleDateString()}</div>
                    <div style={{ color: V2.faint }}>
                      {a.dueAt ? `due ${new Date(a.dueAt).toLocaleDateString()}` : "no deadline"}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 13, color: V2.body }}>
                      {a.completed} / {roster.length}
                    </div>
                    <MiniBar pct={pct} />
                  </div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 700,
                      fontSize: 19,
                      color: a.band == null ? V2.faint : V2.ink,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {a.band == null ? "—" : a.band.toFixed(1)}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 0 }}>
                    <Pill tone={FLOW_TONE[a.flow]}>{FLOW_LABEL[a.flow]}</Pill>
                  </div>
                </>
              );
              const rowStyle: React.CSSProperties = {
                display: "grid",
                gridTemplateColumns: BOARD_COLS,
                alignItems: "center",
                gap: 12,
                padding: "15px 20px",
                borderBottom: `1px solid ${V2.hair}`,
                textDecoration: "none",
                color: "inherit",
              };
              return (
                <Link
                  key={a.id}
                  href={`/console/groups/${group.id}/assignments/${a.id}`}
                  className="cn-boardrow"
                  style={rowStyle}
                >
                  {row}
                </Link>
              );
            })}
            {visible.length === 0 ? (
              <div
                style={{
                  padding: "44px 20px",
                  textAlign: "center",
                  fontFamily: SANS,
                  fontSize: 14,
                  color: V2.faint,
                }}
              >
                {board.length === 0 ? "Nothing assigned yet." : "No practice matches this filter."}
              </div>
            ) : null}
            {group.teacherId === profile.id ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 20px",
                  background: V2.wash,
                  flexWrap: "wrap",
                }}
              >
                <AssignSheet
                  groupId={group.id}
                  libraryTests={libraryTests}
                  library={shelf}
                  label="+ Assign practice"
                  variant="quiet"
                />
                <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>
                  Everyone in the group receives identical content, so the bands stay comparable.
                </span>
              </div>
            ) : null}
          </Board>
        </div>
      ) : null}

      {/* ── attendance ──────────────────────────────────────────────────────── */}
      {tab === "attendance" ? (
        <div style={{ marginTop: 18 }}>
          {/* THE REGISTER NOW SAYS WHAT IT MEANS. It was a row of coloured
              squares with no dates on them and no letters in them, so which
              lesson a mark belonged to, and what the colour stood for, were
              both only available on hover — and on a touch screen, not at all. */}
          <Board min={Math.max(640, 260 + sessions.length * 50 + 90)}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                borderBottom: `1px solid ${V2.rule}`,
                flexWrap: "wrap",
              }}
            >
              <h3 style={serifHead}>Register</h3>
              <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>
                P present · L late · A absent · E excused. A late arrival still counts as attended;
                an excused lesson counts as neither.
              </span>
              <Link
                href={`/console/attendance?group=${group.id}`}
                style={{
                  marginLeft: "auto",
                  padding: "11px 18px",
                  borderRadius: 12,
                  background: V2.indigo,
                  color: "#fff",
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Mark today
              </Link>
            </div>

            {sessions.length === 0 ? (
              <div
                style={{
                  padding: "44px 20px",
                  textAlign: "center",
                  fontFamily: SANS,
                  fontSize: 14,
                  color: V2.faint,
                }}
              >
                No registers taken for this group yet — mark one and it fills in from there.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: REGISTER_COLS(sessions.length),
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 20px",
                    borderBottom: `1px solid ${V2.rule}`,
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: ".07em",
                    textTransform: "uppercase",
                    color: V2.faint,
                  }}
                >
                  <span>Student</span>
                  {sessions.map((sn) => (
                    <span key={sn.id} title={sn.held_on}>
                      {sn.held_on.slice(8, 10)}
                    </span>
                  ))}
                  <span style={{ textAlign: "right" }}>Rate</span>
                </div>
                {roster.map((m) => {
                  const row = marks.get(m.id);
                  const rate = attendanceRate(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: REGISTER_COLS(sessions.length),
                        alignItems: "center",
                        gap: 8,
                        padding: "14px 20px",
                        borderBottom: `1px solid ${V2.hair}`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: 15,
                          fontWeight: 600,
                          color: V2.ink,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.name}
                      </span>
                      {sessions.map((sn) => {
                        const status = row?.get(sn.id);
                        const mk = MARK[status ?? "none"] ?? MARK.none;
                        return (
                          <span
                            key={sn.id}
                            title={`${new Date(`${sn.held_on}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · ${status ?? "not marked"}`}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 10,
                              display: "grid",
                              placeItems: "center",
                              fontFamily: SANS,
                              fontSize: 12,
                              fontWeight: 700,
                              background: mk.bg,
                              color: mk.fg,
                            }}
                          >
                            {mk.letter}
                          </span>
                        );
                      })}
                      <span
                        style={{
                          textAlign: "right",
                          fontFamily: SANS,
                          fontSize: 15,
                          fontWeight: 700,
                          color: rate == null ? V2.faint : V2.ink,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {rate == null ? "—" : `${rate}%`}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </Board>
        </div>
      ) : null}

      {/* ── money ───────────────────────────────────────────────────────────── */}
      {tab === "money" && moneyData ? (
        <Stack>
          <Card>
            <CardHead title={`What this group costs — ${monthLabel(thisMonth)}`} />
            <CardNote>
              {moneyData.lessonsThisMonth > 0
                ? `${moneyData.lessonsThisMonth} lessons this month, from the timetable. A student who joined part-way through pays for the ones that were left, and the teacher is paid for the same ones.`
                : `This group isn't on the timetable yet, so a month is assumed to be ${moneyData.fallbackLessons} lessons. Book it into a room and the real count is used instead.`}
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
              sub={`${roster.length} student${roster.length === 1 ? "" : "s"} at the current price`}
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
                  ? "no rate set on this group"
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
            <Table cols={MONEY_COLS}>
              <THead
                cols={MONEY_COLS}
                labels={["Student", "This month", "Invoiced", "Paid", "Teacher earns"]}
              />
              {roster.map((m) => {
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
              {roster.length === 0 ? (
                <Empty action={{ href: `/console/groups/${group.id}`, label: "Add students →" }}>
                  Nobody is enrolled, so there is nothing to charge.
                </Empty>
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
      {/* ── students ────────────────────────────────────────────────────────── */}
      {tab === "students" ? (
        <Stack>
          {/* The roster on the same surface as the practice board: same card,
              same column rule, same row rhythm. They are the two boards a
              teacher moves between all day. */}
          <div style={{ ...v2card, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                borderBottom: `1px solid ${V2.rule}`,
                flexWrap: "wrap",
              }}
            >
              <h3 style={serifHead}>
                {group.capacity
                  ? `Students (${roster.length}/${group.capacity})`
                  : `Students (${roster.length})`}
              </h3>
              <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint, flex: "1 1 240px" }}>
                {group.capacity && roster.length >= group.capacity
                  ? `This group is full — ${roster.length} of ${group.capacity} seats. You can still add, it just won't fit the room.`
                  : "Everyone here signs in with their own login — that is how homework is handed in and graded."}
              </span>
              <div style={{ marginLeft: "auto" }}>
                <RosterToolbar
                  students={studentRows}
                  groupName={group.name}
                  addForm={<AddStudentPanel groupId={group.id} />}
                  importForm={<BulkAddPanel groupId={group.id} />}
                />
              </div>
            </div>
            <StudentsManager
              groupId={group.id}
              students={studentRows}
              otherGroups={siblingGroups}
            />
          </div>

          {/* Students who left. Kept on the page and out of every count above
              it — someone asks about last term's student, and "we deleted
              them" is not an answer a center can give a parent. */}
          {alumni.length > 0 ? (
            <Card flush>
              <CardHead
                title={`Left this group (${alumni.length})`}
                divided
                note="their marks, registers and invoices are untouched"
              />
              {alumni.map((m) => (
                <ListRow
                  key={m.id}
                  href={`/console/students/${m.id}`}
                  title={m.name}
                  meta={m.login ?? "no login"}
                  trail={<Tag tone="neutral">{STUDENT_STATUS_LABEL[m.status]}</Tag>}
                />
              ))}
            </Card>
          ) : null}

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
        </Stack>
      ) : null}
    </div>
  );
}
