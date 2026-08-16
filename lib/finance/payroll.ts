import "server-only";

import { createClient } from "@/lib/supabase/server";

import { loadFinanceSettings } from "./load";
import { nameMap, peopleMap } from "./names";
import { monthEnd, monthStart } from "./period";
import { loadLessonDates } from "./schedule";
import { chargeClass, teacherBillForClass, type ClassMember } from "./tuition";
import {
  emptyGroupFacts,
  type GroupFacts,
  markCounts,
  parseComponents,
  type PayrollComputation,
  type SalaryRule,
  type TeacherFacts,
} from "./salary";

/**
 * Measuring the month, so the salary engine has something real to multiply.
 *
 * Everything here is a fact the center already records for another reason — the
 * roster, the register, the till, the invoice book. Payroll deliberately adds
 * no new data entry: a center that has to type its teaching hours in twice will
 * stop doing it in one of the two places, and then the payslips are wrong.
 */

/* ── rules ────────────────────────────────────────────────────────────────── */

/**
 * Any custom pay rules the center still has.
 *
 * The rule BUILDER is gone — a class carries its teacher's rate beside the
 * student's fee, and that is the arrangement for every center we have. This
 * loader stays because rules already written are still honoured: a center that
 * set up a revenue share before the change keeps being paid on it, and
 * `computeTeacherPay` falls back to the class rate only where no rule speaks.
 * Nothing can create new ones.
 */
export async function loadSalaryRules(): Promise<SalaryRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("salary_rules")
    .select("id, name, scope, group_id, teacher_id, components, floor_minor, cap_minor, active")
    .eq("active", true);

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    scope: r.scope as SalaryRule["scope"],
    groupId: (r.group_id as string | null) ?? null,
    teacherId: (r.teacher_id as string | null) ?? null,
    components: parseComponents(r.components),
    floorMinor: r.floor_minor == null ? null : Number(r.floor_minor),
    capMinor: r.cap_minor == null ? null : Number(r.cap_minor),
  }));
}

/* ── facts ────────────────────────────────────────────────────────────────── */

/**
 * Everything the engine needs about one month, for every teacher who owns a
 * class.
 *
 * Five queries, then tallied in memory: a center's month is thousands of rows
 * at most, and doing it per teacher would be dozens of round trips to compute
 * one page.
 */
export async function gatherPayrollFacts(periodMonthInput: string): Promise<TeacherFacts[]> {
  const supabase = await createClient();
  const from = monthStart(periodMonthInput);
  const to = monthEnd(from);

  const { data: groupRows } = await supabase
    .from("groups")
    .select("id, name, teacher_id, teacher_rate_minor")
    .not("teacher_id", "is", null)
    .order("name", { ascending: true });

  const rawGroups = (groupRows ?? []) as Record<string, unknown>[];
  const teacherName = await peopleMap(
    supabase,
    rawGroups.map((g) => g.teacher_id as string),
  );
  const groups = rawGroups.map((g) => ({
    id: g.id as string,
    name: g.name as string,
    teacherId: g.teacher_id as string,
    teacherName: teacherName.get(g.teacher_id as string) ?? "—",
    teacherRateMinor: g.teacher_rate_minor == null ? null : Number(g.teacher_rate_minor),
  }));
  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  const [membersRes, paymentsRes, invoicesRes, sessionsRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id, student_id, joined_at")
      .in("group_id", groupIds),
    supabase
      .from("finance_transactions")
      .select("group_id, student_id, amount_minor")
      .eq("direction", "in")
      .in("group_id", groupIds)
      .gte("occurred_on", from)
      .lte("occurred_on", to),
    supabase
      .from("student_invoices")
      .select("group_id, amount_minor, discount_minor")
      .eq("period_month", from)
      .eq("voided", false)
      .in("group_id", groupIds),
    supabase
      .from("attendance_sessions")
      .select("id, group_id")
      .eq("state", "marked")
      .in("group_id", groupIds)
      .gte("held_on", from)
      .lte("held_on", to),
  ]);

  const facts = new Map<string, GroupFacts>(
    groups.map((g) => [g.id, emptyGroupFacts(g.id, g.name)]),
  );

  // Roster as it stood during the month, both ends of it.
  //
  // THIS USED TO SAY "there is no leave date on group_members, so a student who
  // left mid-month still counts — the honest limitation". There is one now:
  // Phase 1 added profiles.member_status and status_changed_at. Until this was
  // wired up a teacher was paid a per-student rate for students who had left
  // the centre months earlier, every month, for ever.
  const rosterIds = ((membersRes.data ?? []) as Record<string, unknown>[]).map(
    (m) => m.student_id as string,
  );
  const { data: people } = rosterIds.length
    ? await supabase
        .from("profiles")
        .select("id, member_status, status_changed_at")
        .in("id", rosterIds)
    : { data: [] as Record<string, unknown>[] };
  const statusOf = new Map(
    ((people ?? []) as Record<string, unknown>[]).map((p) => [
      p.id as string,
      {
        status: (p.member_status as string | null) ?? "active",
        changedOn: p.status_changed_at ? String(p.status_changed_at).slice(0, 10) : null,
      },
    ]),
  );

  const roster = new Map<string, ClassMember[]>();
  for (const m of (membersRes.data ?? []) as Record<string, unknown>[]) {
    const joined = String(m.joined_at ?? "").slice(0, 10);
    if (joined && joined > to) continue;
    const gid = m.group_id as string;
    const f = facts.get(gid);
    if (!f) continue;
    const id = m.student_id as string;
    const s = statusOf.get(id);
    // `studentsEnrolled` is the NAMES on the roster and stays the headcount a
    // teacher would recognise; `studentsProrated` below is what the money says.
    // The two differ exactly when somebody left, which is the point.
    f.studentsEnrolled += 1;
    if (!roster.has(gid)) roster.set(gid, []);
    roster.get(gid)!.push({
      studentId: id,
      joinedOn: joined || null,
      status: s?.status ?? "active",
      statusChangedOn: s?.changedOn ?? null,
    });
  }

  // What each class's own teacher rate comes to, prorated by the lessons each
  // student was there for. Measured here rather than in the engine because it
  // needs the timetable and the center's fallback figure — the engine stays a
  // pure function over facts.
  const [lessonDates, settings] = await Promise.all([
    loadLessonDates(groupIds, from),
    loadFinanceSettings(),
  ]);
  for (const g of groups) {
    const f = facts.get(g.id);
    if (!f) continue;
    const dates = lessonDates.get(g.id) ?? [];
    f.teacherRateMinor = g.teacherRateMinor;
    f.lessonsPlanned = dates.length > 0 ? dates.length : settings.lessonsPerMonth;
    if (g.teacherRateMinor == null) continue;
    const bill = teacherBillForClass(
      chargeClass({
        members: roster.get(g.id) ?? [],
        monthlyFeeMinor: null,
        teacherRateMinor: g.teacherRateMinor,
        lessonDates: dates,
        month: from,
        fallbackLessons: settings.lessonsPerMonth,
      }),
    );
    f.classRatePayMinor = bill.amountMinor;
    f.studentsProrated = bill.studentsProrated;
  }

  const payers = new Map<string, Set<string>>();
  for (const t of (paymentsRes.data ?? []) as Record<string, unknown>[]) {
    const gid = t.group_id as string;
    const f = facts.get(gid);
    if (!f) continue;
    f.collectedMinor += Number(t.amount_minor ?? 0);
    const student = t.student_id as string | null;
    if (student) {
      if (!payers.has(gid)) payers.set(gid, new Set());
      payers.get(gid)!.add(student);
    }
  }
  for (const [gid, set] of payers) {
    const f = facts.get(gid);
    if (f) f.studentsPaid = set.size;
  }

  for (const i of (invoicesRes.data ?? []) as Record<string, unknown>[]) {
    const f = facts.get(i.group_id as string);
    if (f) f.invoicedMinor += Number(i.amount_minor ?? 0) - Number(i.discount_minor ?? 0);
  }

  const sessions = (sessionsRes.data ?? []) as Record<string, unknown>[];
  const sessionGroup = new Map(sessions.map((s) => [s.id as string, s.group_id as string]));
  for (const s of sessions) {
    const f = facts.get(s.group_id as string);
    if (f) f.lessonsHeld += 1;
  }

  if (sessions.length > 0) {
    const { data: marks } = await supabase
      .from("attendance_marks")
      .select("session_id, student_id, status")
      .in(
        "session_id",
        sessions.map((s) => s.id as string),
      );
    // EXCUSED IS NOT ATTENDED, AND IT IS NOT ABSENT EITHER.
    //
    // This used to read `if (m.status !== "absent")`, which was exactly
    // "present or late" for as long as those were the only three marks. Phase 1
    // added `excused` (20260816120000) and silently changed the meaning of
    // every line below it: a student whose mother phoned ahead started counting
    // as a student-lesson taught.
    //
    // Three things went wrong at once. `studentLessons` is a salary basis paid
    // per student-lesson, so the teacher was paid for lessons nobody sat.
    // `attendanceRatePct` divides it by `attendanceMarks`, so payroll reported
    // a different attendance rate from the attendance page for the same class —
    // and one number with two definitions is the thing this restructure exists
    // to remove. And `studentsAttended` counted a student who was excused every
    // week as somebody who turned up.
    //
    // The definition here is now the one `v_student_attendance` uses, because
    // there should only be one: attended means present or late, and an excused
    // lesson leaves the denominator altogether rather than counting against
    // anybody.
    const attended = new Map<string, Set<string>>();
    for (const m of (marks ?? []) as Record<string, unknown>[]) {
      const gid = sessionGroup.get(m.session_id as string);
      if (!gid) continue;
      const f = facts.get(gid);
      if (!f) continue;
      const counted = markCounts(m.status as string);
      if (!counted.inDenominator) continue;
      f.attendanceMarks += 1;
      if (counted.attended) {
        f.studentLessons += 1;
        if (!attended.has(gid)) attended.set(gid, new Set());
        attended.get(gid)!.add(m.student_id as string);
      }
    }
    for (const [gid, set] of attended) {
      const f = facts.get(gid);
      if (f) f.studentsAttended = set.size;
    }
  }

  // Group the classes under the teacher who owns them.
  const byTeacher = new Map<string, TeacherFacts>();
  for (const g of groups) {
    if (!byTeacher.has(g.teacherId)) {
      byTeacher.set(g.teacherId, {
        teacherId: g.teacherId,
        teacherName: g.teacherName,
        groups: [],
      });
    }
    byTeacher.get(g.teacherId)!.groups.push(facts.get(g.id)!);
  }

  return [...byTeacher.values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
}

/* ── stored runs ──────────────────────────────────────────────────────────── */

export interface PayrollItemRow {
  id: string;
  teacherId: string;
  teacherName: string;
  grossMinor: number;
  adjustmentMinor: number;
  adjustmentNote: string | null;
  netMinor: number;
  paidMinor: number;
  breakdown: PayrollComputation["lines"];
  ruleName: string | null;
}

export interface PayrollRunRow {
  id: string;
  periodMonth: string;
  status: "draft" | "approved" | "paid";
  grossMinor: number;
  netMinor: number;
  computedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  note: string | null;
  items: PayrollItemRow[];
}

/** The saved run for a month, with what has actually been paid out against it. */
export async function loadPayrollRun(periodMonthInput: string): Promise<PayrollRunRow | null> {
  const supabase = await createClient();
  const period = monthStart(periodMonthInput);

  const { data: run } = await supabase
    .from("payroll_runs")
    .select(
      "id, period_month, status, gross_minor, net_minor, computed_at, approved_at, paid_at, note",
    )
    .eq("period_month", period)
    .maybeSingle();
  if (!run) return null;

  const [itemsRes, paymentsRes] = await Promise.all([
    supabase
      .from("payroll_items")
      .select(
        "id, teacher_id, rule_id, gross_minor, adjustment_minor, adjustment_note, net_minor, breakdown",
      )
      .eq("run_id", run.id as string),
    supabase
      .from("finance_transactions")
      .select("payroll_item_id, amount_minor")
      .eq("direction", "out")
      .not("payroll_item_id", "is", null),
  ]);

  const paid = new Map<string, number>();
  for (const p of (paymentsRes.data ?? []) as Record<string, unknown>[]) {
    const key = p.payroll_item_id as string;
    paid.set(key, (paid.get(key) ?? 0) + Number(p.amount_minor ?? 0));
  }

  const rawItems = (itemsRes.data ?? []) as Record<string, unknown>[];
  const [teacherName, ruleName] = await Promise.all([
    peopleMap(
      supabase,
      rawItems.map((i) => i.teacher_id as string),
    ),
    nameMap(
      supabase,
      "salary_rules",
      rawItems.map((i) => i.rule_id as string | null),
    ),
  ]);

  const items: PayrollItemRow[] = rawItems
    .map((i) => ({
      id: i.id as string,
      teacherId: i.teacher_id as string,
      teacherName: teacherName.get(i.teacher_id as string) ?? "—",
      grossMinor: Number(i.gross_minor ?? 0),
      adjustmentMinor: Number(i.adjustment_minor ?? 0),
      adjustmentNote: (i.adjustment_note as string | null) ?? null,
      netMinor: Number(i.net_minor ?? 0),
      paidMinor: paid.get(i.id as string) ?? 0,
      breakdown: Array.isArray(i.breakdown) ? (i.breakdown as PayrollComputation["lines"]) : [],
      ruleName: i.rule_id ? (ruleName.get(i.rule_id as string) ?? null) : null,
    }))
    .sort((a, b) => b.netMinor - a.netMinor || a.teacherName.localeCompare(b.teacherName));

  return {
    id: run.id as string,
    periodMonth: run.period_month as string,
    status: run.status as PayrollRunRow["status"],
    grossMinor: Number(run.gross_minor ?? 0),
    netMinor: Number(run.net_minor ?? 0),
    computedAt: run.computed_at as string,
    approvedAt: (run.approved_at as string | null) ?? null,
    paidAt: (run.paid_at as string | null) ?? null,
    note: (run.note as string | null) ?? null,
    items,
  };
}

/** Every month that has a run, for the period switcher. */
export async function loadPayrollHistory(): Promise<
  { periodMonth: string; status: string; netMinor: number }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payroll_runs")
    .select("period_month, status, net_minor")
    .order("period_month", { ascending: false })
    .limit(24);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    periodMonth: r.period_month as string,
    status: r.status as string,
    netMinor: Number(r.net_minor ?? 0),
  }));
}
