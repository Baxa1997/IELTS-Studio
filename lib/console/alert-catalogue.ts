import "server-only";

import { type Profile } from "@/lib/auth";
import { loadDay } from "@/lib/console/attendance";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { loadMarkingQueue, OVERDUE_HOURS } from "@/lib/console/marking";
import { loadPracticeBoard } from "@/lib/console/practice-board";
import { loadCenterReport } from "@/lib/console/reports";
import { centerNow, minutesOf } from "@/lib/console/schedule";
import { createClient } from "@/lib/supabase/server";

/**
 * The nine things that can be wrong, defined once.
 *
 * WHY A CATALOGUE RATHER THAN A LIST OF `if`s ON THE PAGE. The Overview grew
 * its alerts one at a time, so nothing agreed on what an alert was: some had a
 * count and some did not, the destinations were list pages that left the reader
 * to find the thing again, and there was no order beyond the order they were
 * written in. §4 of the restructure spells out the rules, and they only work if
 * the alerts are data:
 *
 *   * ONE ROW PER TYPE WITH A COUNT, never one row per instance. Six students
 *     gone quiet is one line, not six.
 *   * SORTED BY SEVERITY, THEN AGE. What is on fire, then what has been
 *     smouldering longest.
 *   * EVERY ROW RESOLVES TO A SPECIFIC DESTINATION. Not "Students" but students
 *     filtered to the ones this alert is about — otherwise the reader has to
 *     redo the query the alert already ran.
 *   * MAX SIX. A panel of nine is a list; a list is not attention.
 */

export type Severity = "high" | "medium" | "low";

export interface Alert {
  /** Stable across renders and releases — dismissals are keyed on it. */
  key: string;
  severity: Severity;
  /** Already carries its count: "3 students have gone quiet". */
  title: string;
  detail: string;
  cta: string;
  href: string;
  count: number;
  /** How long the oldest instance has been true, in hours. Breaks ties. */
  ageHours: number;
  icon: string;
}

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** §4: six rows. The seventh is where a panel becomes a page. */
export const MAX_ALERTS = 6;

/** A register is not chased the moment the lesson ends — people pack up. */
const REGISTER_GRACE_HOURS = 2;

/** "No practice" means none set recently, not none ever. */
const PRACTICE_STALE_DAYS = 14;

const hoursSince = (iso: string | null): number =>
  iso ? Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 3600_000)) : 0;

export interface AlertBoard {
  /** What to show, already sorted, trimmed and with dismissals removed. */
  shown: Alert[];
  /** Everything that fired, so a count can be honest about what was trimmed. */
  all: Alert[];
  /** Alert keys currently silenced, with when they come back. */
  dismissed: { key: string; until: string }[];
  canDismiss: boolean;
}

export async function loadAlerts(profile: Profile): Promise<AlertBoard> {
  const supabase = await createClient();
  const settings = await loadCenterSettings();
  const clock = centerNow(settings.timezone);

  const [report, queue, day, board, dismissRes, estimatesRes] = await Promise.all([
    loadCenterReport({ role: profile.role, profileId: profile.id }),
    loadMarkingQueue(profile),
    loadDay(profile, clock.date),
    loadPracticeBoard(profile),
    supabase.from("alert_dismissals").select("alert_key, expires_at").gt("expires_at", new Date().toISOString()),
    supabase.from("skill_estimates").select("student_id, skill, current_band, target_band, sample_count"),
  ]);

  const alerts: Alert[] = [];
  const push = (a: Alert | null) => {
    if (a && a.count > 0) alerts.push(a);
  };

  /* ── high ─────────────────────────────────────────────────────────────── */

  push({
    key: "gone_quiet",
    severity: "high",
    count: report.atRisk.length,
    title: `${report.atRisk.length} student${report.atRisk.length === 1 ? " has" : "s have"} gone quiet`,
    detail: `${report.atRisk.slice(0, 2).map((s) => s.name).join(", ")}${report.atRisk.length > 2 ? "…" : ""} — nothing handed in for 14 days.`,
    cta: "See them",
    href: "/console/students?filter=never",
    ageHours: hoursSince(report.atRisk[0]?.lastActive ?? null),
    icon: "!",
  });

  const overdueMarking = queue.filter((q) => q.waitingHours >= OVERDUE_HOURS);
  push({
    key: "unmarked_submissions",
    severity: "high",
    count: overdueMarking.length,
    title: `${overdueMarking.length} submission${overdueMarking.length === 1 ? "" : "s"} waiting over 48 hours`,
    detail: `Graded by the AI, nobody has signed off. Longest: ${overdueMarking[0]?.studentName ?? ""}.`,
    cta: "Mark",
    href: "/console/marking",
    ageHours: overdueMarking[0]?.waitingHours ?? 0,
    icon: "!",
  });

  // A register is chased once the lesson finished AND a grace period passed.
  const unmarked = day.holiday
    ? []
    : day.lessons.filter((l) => {
        if (!l.scheduled || l.cancelledReason || l.state === "marked" || l.locked) return false;
        if (!l.endsAt) return false;
        return minutesOf(l.endsAt) + REGISTER_GRACE_HOURS * 60 <= clock.minutes;
      });
  push({
    key: "register_not_marked",
    severity: "high",
    count: unmarked.length,
    title: `${unmarked.length} register${unmarked.length === 1 ? "" : "s"} not marked`,
    detail: `${unmarked.map((l) => l.groupName).slice(0, 2).join(", ")} finished over ${REGISTER_GRACE_HOURS} hours ago.`,
    cta: "Mark",
    href:
      unmarked.length === 1
        ? `/console/attendance/${unmarked[0].groupId}?date=${clock.date}`
        : `/console/attendance?date=${clock.date}`,
    ageHours: REGISTER_GRACE_HOURS,
    icon: "◷",
  });

  const noTeacher = report.groups.filter((g) => g.teacherId == null);
  push({
    key: "group_no_teacher",
    severity: "high",
    count: noTeacher.length,
    title: `${noTeacher.length} group${noTeacher.length === 1 ? " has" : "s have"} no teacher`,
    detail: `${noTeacher.map((g) => g.name).slice(0, 2).join(", ")} — nobody can mark their register or set them practice.`,
    cta: "Assign",
    href: "/console/groups?filter=noteacher",
    ageHours: 0,
    icon: "!",
  });

  /* ── medium ───────────────────────────────────────────────────────────── */

  // Set nothing in a fortnight, not "set nothing ever": a group that had a
  // task last week is not neglected.
  const staleSince = Date.now() - PRACTICE_STALE_DAYS * 86400_000;
  const recentlySet = new Set(
    board.rows.filter((r) => Date.parse(r.setOn) >= staleSince).map((r) => r.groupId),
  );
  const noPractice = board.groups.filter((g) => !recentlySet.has(g.id));
  push({
    key: "group_no_practice",
    severity: "medium",
    count: noPractice.length,
    title: `${noPractice.length} group${noPractice.length === 1 ? " has" : "s have"} had no practice set`,
    detail: `Nothing in ${PRACTICE_STALE_DAYS} days — nothing to grade means nothing to report on.`,
    cta: "Open",
    href: "/console/practice",
    ageHours: PRACTICE_STALE_DAYS * 24,
    icon: "◷",
  });

  const lowCompletion = report.groups.filter(
    (g) => g.completionPct != null && g.completionPct < 50 && g.assignments >= 3,
  );
  push({
    key: "low_completion",
    severity: "medium",
    count: lowCompletion.length,
    title: `${lowCompletion.length} group${lowCompletion.length === 1 ? "" : "s"} under 50% completion`,
    detail: `${lowCompletion.map((g) => g.name).slice(0, 2).join(", ")} — most of the homework set has not come back.`,
    cta: "Chase",
    href: "/console/practice?status=overdue",
    ageHours: 0,
    icon: "%",
  });

  const consecutive = await twoAbsencesInARow(supabase);
  push({
    key: "two_absences",
    severity: "medium",
    count: consecutive.length,
    title: `${consecutive.length} student${consecutive.length === 1 ? " has" : "s have"} missed two lessons in a row`,
    detail: `${consecutive.slice(0, 2).map((s) => s.name).join(", ")} — excused absences are not counted.`,
    cta: "See them",
    href: "/console/attendance",
    ageHours: hoursSince(consecutive[0]?.lastAbsence ?? null),
    icon: "◐",
  });

  /* ── low ──────────────────────────────────────────────────────────────── */

  // A full band or more below what they are aiming for, on at least two
  // measurements. One bad essay is a bad day, not a trend.
  const behind = new Set<string>();
  for (const e of (estimatesRes.data ?? []) as {
    student_id: string;
    current_band: number | null;
    target_band: number | null;
    sample_count: number | null;
  }[]) {
    if (e.current_band == null || e.target_band == null) continue;
    if ((e.sample_count ?? 0) < 2) continue;
    if (Number(e.current_band) <= Number(e.target_band) - 1) behind.add(e.student_id);
  }
  push({
    key: "far_below_target",
    severity: "low",
    count: behind.size,
    title: `${behind.size} student${behind.size === 1 ? " is" : "s are"} a band below target`,
    detail: "On at least two measurements — worth resetting the target or the plan.",
    cta: "Review",
    href: "/console/students",
    ageHours: 0,
    icon: "↓",
  });

  const idleTeachers = await teachersWithNoGroup(supabase, profile);
  push({
    key: "teacher_no_group",
    severity: "low",
    count: idleTeachers,
    title: `${idleTeachers} teacher${idleTeachers === 1 ? " has" : "s have"} no group`,
    detail: "They cannot set practice or mark a register until they run one.",
    cta: "Assign",
    href: "/console/teachers",
    ageHours: 0,
    icon: "◐",
  });

  /* ── order, silence, trim ─────────────────────────────────────────────── */

  alerts.sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.ageHours - a.ageHours);

  const dismissed = ((dismissRes.data ?? []) as { alert_key: string; expires_at: string }[]).map(
    (d) => ({ key: d.alert_key, until: d.expires_at }),
  );
  const silenced = new Set(dismissed.map((d) => d.key));

  return {
    all: alerts,
    shown: alerts.filter((a) => !silenced.has(a.key)).slice(0, MAX_ALERTS),
    dismissed,
    canDismiss: profile.role === "center_admin",
  };
}

type Db = Awaited<ReturnType<typeof createClient>>;

/**
 * Students absent from their two most recent marked registers.
 *
 * EXCUSED DOES NOT COUNT, which is the entire reason `excused` was added in
 * Phase 1: without it this alert fires on the student whose mother rang ahead
 * twice, and a centre switches the alerts off within a fortnight.
 */
async function twoAbsencesInARow(
  supabase: Db,
): Promise<{ id: string; name: string; lastAbsence: string }[]> {
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, group_id, held_on")
    .eq("state", "marked")
    .order("held_on", { ascending: false })
    .limit(200);
  if (!sessions?.length) return [];

  const { data: marks } = await supabase
    .from("attendance_marks")
    .select("session_id, student_id, status")
    .in("session_id", sessions.map((s) => s.id as string));
  if (!marks?.length) return [];

  const heldOn = new Map(sessions.map((s) => [s.id as string, s.held_on as string]));
  const byStudent = new Map<string, { on: string; status: string }[]>();
  for (const m of marks as { session_id: string; student_id: string; status: string }[]) {
    const on = heldOn.get(m.session_id);
    if (!on) continue;
    byStudent.set(m.student_id, [...(byStudent.get(m.student_id) ?? []), { on, status: m.status }]);
  }

  const flagged: { id: string; lastAbsence: string }[] = [];
  for (const [studentId, rows] of byStudent) {
    // Excused lessons drop out entirely, so "in a row" means the lessons they
    // were actually expected at.
    const counted = rows
      .filter((r) => r.status !== "excused")
      .sort((a, b) => b.on.localeCompare(a.on));
    if (counted.length >= 2 && counted[0].status === "absent" && counted[1].status === "absent") {
      flagged.push({ id: studentId, lastAbsence: counted[0].on });
    }
  }
  if (flagged.length === 0) return [];

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, member_status")
    .in("id", flagged.map((f) => f.id));
  const person = new Map(
    ((people ?? []) as { id: string; full_name: string | null; member_status: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );

  return flagged
    // A paused student is not skipping lessons; someone already knows why.
    .filter((f) => (person.get(f.id)?.member_status ?? "active") === "active")
    .map((f) => ({
      id: f.id,
      name: person.get(f.id)?.full_name ?? "Unnamed",
      lastAbsence: f.lastAbsence,
    }));
}

/** Teachers on staff who own no active group. Admin's question, not a teacher's. */
async function teachersWithNoGroup(supabase: Db, profile: Profile): Promise<number> {
  if (profile.role !== "center_admin" && profile.role !== "administrator") return 0;
  const [{ data: staff }, { data: groups }] = await Promise.all([
    supabase.from("profiles").select("id, member_status").eq("role", "teacher"),
    supabase.from("groups").select("teacher_id").eq("status", "active"),
  ]);
  const owning = new Set(
    ((groups ?? []) as { teacher_id: string | null }[])
      .map((g) => g.teacher_id)
      .filter((id): id is string => id != null),
  );
  return ((staff ?? []) as { id: string; member_status: string | null }[]).filter(
    (t) => (t.member_status ?? "active") === "active" && !owning.has(t.id),
  ).length;
}
