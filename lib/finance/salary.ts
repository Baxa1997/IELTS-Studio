import { z } from "zod";

import { percentOf } from "./money";

/**
 * The salary engine: how a center's own pay arrangement becomes a number.
 *
 * WHY THIS IS DATA AND NOT CODE. No two education centers pay teachers the same
 * way. The arrangements seen in this market, all of them common:
 *
 *   • a share of what the class actually collected (35–50%)
 *   • a flat amount per enrolled head, sometimes only per head who PAID
 *   • a rate per lesson taught, from the attendance register
 *   • a rate per student-lesson (headcount × lessons — pays for a full room)
 *   • a base salary plus any of the above
 *   • a percentage that steps up once the teacher passes 20 / 30 students
 *   • all of it floored by a guaranteed minimum, or capped
 *
 * Hard-coding any one of those makes the product unsellable to the next center
 * through the door. So a rule is an ordered list of COMPONENTS stored as JSON,
 * and this file evaluates them against FACTS measured from the month's real
 * data. Nothing here reads the database; it is a pure function, which is what
 * makes a payslip reproducible and the whole thing testable.
 *
 * TWO LEVELS, deliberately. A teacher usually teaches several classes, and the
 * arrangement can differ per class ("40% of the IELTS group, 500k flat for the
 * kids club"). So:
 *
 *   GROUP-LEVEL components (per_student, revenue_share, per_lesson,
 *   per_student_lesson, tiered_*) are evaluated once PER CLASS, against that
 *   class's own facts, using the rule that resolves for that teacher+class.
 *
 *   TEACHER-LEVEL components (fixed, attendance_bonus) are evaluated ONCE, from
 *   the teacher's own rule, against their totals — otherwise a base salary
 *   would be paid once per class, which is the bug this split exists to make
 *   impossible.
 *
 * Rule resolution is most-specific-wins:
 *     (teacher + group) → (teacher) → (group) → (org default)
 *
 * Every component emits a LINE carrying its basis and its rate, not just an
 * amount. A payslip a teacher can argue with is a payslip a teacher trusts, and
 * "40% of 12 400 000 collected in IELTS-Evening" is arguable in a way that
 * "4 960 000" is not.
 */

/* ── what a component can measure ─────────────────────────────────────────── */

/** Which headcount a per-student rate is paid on. */
export const COUNT_BASIS = ["enrolled", "paid", "attended"] as const;
export type CountBasis = (typeof COUNT_BASIS)[number];

/** Whether a share is of money in the till, or of money billed. */
export const REVENUE_BASIS = ["collected", "invoiced"] as const;
export type RevenueBasis = (typeof REVENUE_BASIS)[number];

/** Whole: crossing a threshold re-rates everything. Marginal: only the excess. */
export const TIER_MODE = ["whole", "marginal"] as const;
export type TierMode = (typeof TIER_MODE)[number];

/* ── the component schema ─────────────────────────────────────────────────── */

const money = z.number().int().min(0);
const label = z.string().trim().max(80).optional();

const fixed = z.object({
  kind: z.literal("fixed"),
  label,
  amountMinor: money,
});

const perStudent = z.object({
  kind: z.literal("per_student"),
  label,
  amountMinor: money,
  count: z.enum(COUNT_BASIS).default("enrolled"),
});

const revenueShare = z.object({
  kind: z.literal("revenue_share"),
  label,
  percent: z.number().min(0).max(100),
  of: z.enum(REVENUE_BASIS).default("collected"),
});

const perLesson = z.object({
  kind: z.literal("per_lesson"),
  label,
  amountMinor: money,
});

const perStudentLesson = z.object({
  kind: z.literal("per_student_lesson"),
  label,
  amountMinor: money,
});

const tieredPerStudent = z.object({
  kind: z.literal("tiered_per_student"),
  label,
  count: z.enum(COUNT_BASIS).default("enrolled"),
  mode: z.enum(TIER_MODE).default("whole"),
  /** Thresholds in students. The `from: 0` band is the base rate. */
  tiers: z.array(z.object({ from: z.number().int().min(0), amountMinor: money })).min(1),
  /** Count the threshold across all the teacher's classes, or within this one. */
  across: z.enum(["teacher", "group"]).default("teacher"),
});

const tieredRevenueShare = z.object({
  kind: z.literal("tiered_revenue_share"),
  label,
  of: z.enum(REVENUE_BASIS).default("collected"),
  mode: z.enum(TIER_MODE).default("whole"),
  /** What the threshold is measured in. */
  by: z.enum(["students", "revenue"]).default("students"),
  tiers: z.array(z.object({ from: z.number().min(0), percent: z.number().min(0).max(100) })).min(1),
  across: z.enum(["teacher", "group"]).default("teacher"),
});

const attendanceBonus = z.object({
  kind: z.literal("attendance_bonus"),
  label,
  /** Paid only if the teacher's classes kept attendance at or above this. */
  minRatePct: z.number().min(0).max(100),
  amountMinor: money,
});

export const salaryComponentSchema = z.discriminatedUnion("kind", [
  fixed,
  perStudent,
  revenueShare,
  perLesson,
  perStudentLesson,
  tieredPerStudent,
  tieredRevenueShare,
  attendanceBonus,
]);

export type SalaryComponent = z.infer<typeof salaryComponentSchema>;
export type SalaryComponentKind = SalaryComponent["kind"];

export const salaryComponentsSchema = z.array(salaryComponentSchema).max(12);

/** Components stored in the DB are untrusted JSON; bad ones are dropped, not thrown. */
export function parseComponents(raw: unknown): SalaryComponent[] {
  if (!Array.isArray(raw)) return [];
  const out: SalaryComponent[] = [];
  for (const item of raw) {
    const parsed = salaryComponentSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** Which level a component is paid at. See the two-levels note above. */
export function componentLevel(kind: SalaryComponentKind): "teacher" | "group" {
  return kind === "fixed" || kind === "attendance_bonus" ? "teacher" : "group";
}

/* ── the rule ─────────────────────────────────────────────────────────────── */

export interface SalaryRule {
  id: string;
  name: string;
  scope: "org" | "group" | "teacher";
  groupId: string | null;
  teacherId: string | null;
  components: SalaryComponent[];
  floorMinor: number | null;
  capMinor: number | null;
}

/**
 * Most-specific-wins. Returns undefined only when the center has no org default
 * at all, which the caller surfaces as "nobody has been given a pay rule yet"
 * rather than silently paying zero.
 */
export function resolveRule(
  rules: SalaryRule[],
  teacherId: string,
  groupId: string | null,
): SalaryRule | undefined {
  const active = rules;
  return (
    (groupId
      ? active.find(
          (r) => r.scope === "teacher" && r.teacherId === teacherId && r.groupId === groupId,
        )
      : undefined) ??
    active.find((r) => r.scope === "teacher" && r.teacherId === teacherId && r.groupId === null) ??
    (groupId ? active.find((r) => r.scope === "group" && r.groupId === groupId) : undefined) ??
    active.find((r) => r.scope === "org")
  );
}

/* ── the facts ────────────────────────────────────────────────────────────── */

/** What one class actually did in the period. Measured, never estimated. */
export interface GroupFacts {
  groupId: string;
  groupName: string;
  /** On the roster at the end of the period. */
  studentsEnrolled: number;
  /** Distinct students who paid something towards this class in the period. */
  studentsPaid: number;
  /** Distinct students who turned up at least once. */
  studentsAttended: number;
  /** Tuition banked for this class in the period. */
  collectedMinor: number;
  /** Tuition billed for this class in the period, paid or not. */
  invoicedMinor: number;
  /** Registers marked. */
  lessonsHeld: number;
  /** Present-or-late marks — headcount × lessons, actually attended. */
  studentLessons: number;
  /** Every mark, including absences. The denominator of the attendance rate. */
  attendanceMarks: number;
}

export interface TeacherFacts {
  teacherId: string;
  teacherName: string;
  groups: GroupFacts[];
}

export function emptyGroupFacts(groupId: string, groupName: string): GroupFacts {
  return {
    groupId,
    groupName,
    studentsEnrolled: 0,
    studentsPaid: 0,
    studentsAttended: 0,
    collectedMinor: 0,
    invoicedMinor: 0,
    lessonsHeld: 0,
    studentLessons: 0,
    attendanceMarks: 0,
  };
}

function headcount(g: GroupFacts, basis: CountBasis): number {
  if (basis === "paid") return g.studentsPaid;
  if (basis === "attended") return g.studentsAttended;
  return g.studentsEnrolled;
}

function revenue(g: GroupFacts, basis: RevenueBasis): number {
  return basis === "invoiced" ? g.invoicedMinor : g.collectedMinor;
}

export function teacherTotals(facts: TeacherFacts) {
  const t = facts.groups.reduce(
    (a, g) => ({
      studentsEnrolled: a.studentsEnrolled + g.studentsEnrolled,
      studentsPaid: a.studentsPaid + g.studentsPaid,
      studentsAttended: a.studentsAttended + g.studentsAttended,
      collectedMinor: a.collectedMinor + g.collectedMinor,
      invoicedMinor: a.invoicedMinor + g.invoicedMinor,
      lessonsHeld: a.lessonsHeld + g.lessonsHeld,
      studentLessons: a.studentLessons + g.studentLessons,
      attendanceMarks: a.attendanceMarks + g.attendanceMarks,
    }),
    {
      studentsEnrolled: 0,
      studentsPaid: 0,
      studentsAttended: 0,
      collectedMinor: 0,
      invoicedMinor: 0,
      lessonsHeld: 0,
      studentLessons: 0,
      attendanceMarks: 0,
    },
  );
  return {
    ...t,
    attendanceRatePct:
      t.attendanceMarks > 0 ? Math.round((100 * t.studentLessons) / t.attendanceMarks) : null,
  };
}

/* ── the result ───────────────────────────────────────────────────────────── */

export type BasisUnit = "money" | "students" | "lessons" | "student-lessons" | "percent" | "none";

/** One explainable line of a payslip. */
export interface PayrollLine {
  kind: SalaryComponentKind | "floor" | "cap" | "adjustment";
  label: string;
  groupId?: string;
  groupName?: string;
  /** The measured quantity this line was paid on. */
  basisValue: number;
  basisUnit: BasisUnit;
  /** How it was paid: a rate per unit, or a percentage. */
  rateMinor?: number;
  ratePercent?: number;
  amountMinor: number;
  ruleId?: string;
  ruleName?: string;
  /** Set when the engine had to pay zero for a reason worth showing. */
  note?: string;
}

export interface PayrollComputation {
  teacherId: string;
  teacherName: string;
  lines: PayrollLine[];
  grossMinor: number;
  /** The rule that governed the teacher-level part, for the payslip header. */
  ruleId?: string;
  ruleName?: string;
  /** No rule resolved at all — the owner has to fix this before approving. */
  unruled: boolean;
}

/* ── tier lookup ──────────────────────────────────────────────────────────── */

function sortedTiers<T extends { from: number }>(tiers: T[]): T[] {
  return [...tiers].sort((a, b) => a.from - b.from);
}

/** The band a measurement lands in. */
function bandFor<T extends { from: number }>(tiers: T[], value: number): T | undefined {
  const sorted = sortedTiers(tiers);
  let hit: T | undefined;
  for (const t of sorted) if (value >= t.from) hit = t;
  return hit ?? sorted[0];
}

/**
 * Marginal tiering: each slice of the measurement is paid at its own band's
 * rate. `rateOf` turns a band into an amount-per-unit (money) or a percentage.
 */
function marginalSlices<T extends { from: number }>(
  tiers: T[],
  value: number,
): { band: T; units: number }[] {
  const sorted = sortedTiers(tiers);
  const out: { band: T; units: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].from;
    if (value <= start) break;
    const end = i + 1 < sorted.length ? Math.min(sorted[i + 1].from, value) : value;
    const units = end - start;
    if (units > 0) out.push({ band: sorted[i], units });
  }
  return out;
}

/* ── evaluation ───────────────────────────────────────────────────────────── */

function defaultLabel(c: SalaryComponent): string {
  if (c.label) return c.label;
  switch (c.kind) {
    case "fixed":
      return "Base salary";
    case "per_student":
      return `Per student (${c.count})`;
    case "revenue_share":
      return `${c.percent}% of tuition ${c.of}`;
    case "per_lesson":
      return "Per lesson taught";
    case "per_student_lesson":
      return "Per student-lesson";
    case "tiered_per_student":
      return "Per student, tiered";
    case "tiered_revenue_share":
      return "Share of tuition, tiered";
    case "attendance_bonus":
      return `Attendance bonus (${c.minRatePct}%+)`;
  }
}

/** One group-level component against one class. */
function evaluateGroupComponent(
  c: SalaryComponent,
  group: GroupFacts,
  totals: ReturnType<typeof teacherTotals>,
  rule: SalaryRule,
): PayrollLine | null {
  const base = {
    kind: c.kind,
    label: defaultLabel(c),
    groupId: group.groupId,
    groupName: group.groupName,
    ruleId: rule.id,
    ruleName: rule.name,
  } as const;

  switch (c.kind) {
    case "per_student": {
      const n = headcount(group, c.count);
      return {
        ...base,
        basisValue: n,
        basisUnit: "students",
        rateMinor: c.amountMinor,
        amountMinor: n * c.amountMinor,
      };
    }

    case "revenue_share": {
      const rev = revenue(group, c.of);
      return {
        ...base,
        basisValue: rev,
        basisUnit: "money",
        ratePercent: c.percent,
        amountMinor: percentOf(rev, c.percent),
      };
    }

    case "per_lesson":
      return {
        ...base,
        basisValue: group.lessonsHeld,
        basisUnit: "lessons",
        rateMinor: c.amountMinor,
        amountMinor: group.lessonsHeld * c.amountMinor,
        note:
          group.lessonsHeld === 0 ? "No register was marked for this class this month." : undefined,
      };

    case "per_student_lesson":
      return {
        ...base,
        basisValue: group.studentLessons,
        basisUnit: "student-lessons",
        rateMinor: c.amountMinor,
        amountMinor: group.studentLessons * c.amountMinor,
        note:
          group.studentLessons === 0
            ? "No attendance recorded for this class this month."
            : undefined,
      };

    case "tiered_per_student": {
      const inGroup = headcount(group, c.count);
      const measured =
        c.across === "teacher"
          ? c.count === "paid"
            ? totals.studentsPaid
            : c.count === "attended"
              ? totals.studentsAttended
              : totals.studentsEnrolled
          : inGroup;

      if (c.mode === "marginal" && c.across === "group") {
        const slices = marginalSlices(c.tiers, inGroup);
        const amount = slices.reduce((a, s) => a + s.units * s.band.amountMinor, 0);
        return {
          ...base,
          basisValue: inGroup,
          basisUnit: "students",
          amountMinor: amount,
          note: "Tiered per slice of headcount.",
        };
      }
      // Whole-tier (and marginal-across-teacher, where the threshold is a
      // property of the teacher's total but the payment is per class head):
      // the band the measurement lands in re-rates every student in the class.
      const band = bandFor(c.tiers, measured);
      const rate = band?.amountMinor ?? 0;
      return {
        ...base,
        basisValue: inGroup,
        basisUnit: "students",
        rateMinor: rate,
        amountMinor: inGroup * rate,
        note:
          c.across === "teacher"
            ? `Rate set by the teacher's ${measured} students in total.`
            : undefined,
      };
    }

    case "tiered_revenue_share": {
      const rev = revenue(group, c.of);
      const measured =
        c.by === "revenue"
          ? c.across === "teacher"
            ? c.of === "invoiced"
              ? totals.invoicedMinor
              : totals.collectedMinor
            : rev
          : c.across === "teacher"
            ? totals.studentsEnrolled
            : group.studentsEnrolled;

      if (c.mode === "marginal" && c.by === "revenue" && c.across === "group") {
        const slices = marginalSlices(c.tiers, rev);
        const amount = slices.reduce((a, s) => a + percentOf(s.units, s.band.percent), 0);
        return {
          ...base,
          basisValue: rev,
          basisUnit: "money",
          amountMinor: amount,
          note: "Tiered per slice of revenue.",
        };
      }
      const band = bandFor(c.tiers, measured);
      const pct = band?.percent ?? 0;
      return {
        ...base,
        basisValue: rev,
        basisUnit: "money",
        ratePercent: pct,
        amountMinor: percentOf(rev, pct),
        note:
          c.by === "students"
            ? `Rate set by ${measured} student${measured === 1 ? "" : "s"}${c.across === "teacher" ? " in total" : " in this class"}.`
            : undefined,
      };
    }

    default:
      return null;
  }
}

/** One teacher-level component against the teacher's totals. */
function evaluateTeacherComponent(
  c: SalaryComponent,
  totals: ReturnType<typeof teacherTotals>,
  rule: SalaryRule,
): PayrollLine | null {
  const base = {
    kind: c.kind,
    label: defaultLabel(c),
    ruleId: rule.id,
    ruleName: rule.name,
  } as const;

  if (c.kind === "fixed") {
    return { ...base, basisValue: 1, basisUnit: "none", amountMinor: c.amountMinor };
  }

  if (c.kind === "attendance_bonus") {
    const rate = totals.attendanceRatePct;
    if (rate == null) {
      return {
        ...base,
        basisValue: 0,
        basisUnit: "percent",
        amountMinor: 0,
        note: "No attendance recorded — bonus not paid.",
      };
    }
    const earned = rate >= c.minRatePct;
    return {
      ...base,
      basisValue: rate,
      basisUnit: "percent",
      amountMinor: earned ? c.amountMinor : 0,
      note: earned
        ? undefined
        : `Attendance ${rate}% is under the ${c.minRatePct}% the bonus needs.`,
    };
  }

  return null;
}

/**
 * Compute one teacher's pay for the period.
 *
 * Pure: the same facts and the same rules always produce the same payslip,
 * which is what lets an approved run be re-checked months later.
 */
export function computeTeacherPay(facts: TeacherFacts, rules: SalaryRule[]): PayrollComputation {
  const totals = teacherTotals(facts);
  const lines: PayrollLine[] = [];

  const teacherRule = resolveRule(rules, facts.teacherId, null);

  // Group-level: each class under the rule that resolves for it.
  for (const group of facts.groups) {
    const rule = resolveRule(rules, facts.teacherId, group.groupId);
    if (!rule) continue;
    for (const c of rule.components) {
      if (componentLevel(c.kind) !== "group") continue;
      const line = evaluateGroupComponent(c, group, totals, rule);
      if (line) lines.push(line);
    }
  }

  // Teacher-level: once, from the teacher's own rule.
  if (teacherRule) {
    for (const c of teacherRule.components) {
      if (componentLevel(c.kind) !== "teacher") continue;
      const line = evaluateTeacherComponent(c, totals, teacherRule);
      if (line) lines.push(line);
    }
  }

  let gross = lines.reduce((a, l) => a + l.amountMinor, 0);

  // Floor and cap belong to the teacher's rule: they are a promise about the
  // month as a whole, not about one class.
  const floor = teacherRule?.floorMinor ?? null;
  const cap = teacherRule?.capMinor ?? null;
  if (floor != null && gross < floor) {
    lines.push({
      kind: "floor",
      label: "Top-up to the guaranteed minimum",
      basisValue: floor,
      basisUnit: "money",
      amountMinor: floor - gross,
      ruleId: teacherRule?.id,
      ruleName: teacherRule?.name,
    });
    gross = floor;
  }
  if (cap != null && gross > cap) {
    lines.push({
      kind: "cap",
      label: "Held to the agreed ceiling",
      basisValue: cap,
      basisUnit: "money",
      amountMinor: cap - gross,
      ruleId: teacherRule?.id,
      ruleName: teacherRule?.name,
    });
    gross = cap;
  }

  return {
    teacherId: facts.teacherId,
    teacherName: facts.teacherName,
    lines,
    grossMinor: gross,
    ruleId: teacherRule?.id,
    ruleName: teacherRule?.name,
    unruled: lines.length === 0 && !teacherRule,
  };
}

export function computePayroll(facts: TeacherFacts[], rules: SalaryRule[]): PayrollComputation[] {
  return facts.map((f) => computeTeacherPay(f, rules));
}

/* ── describing a rule in words ───────────────────────────────────────────── */

/**
 * One plain sentence per component, for the rule list and the payslip header.
 * `money` is injected so this file stays currency-agnostic.
 */
export function describeComponent(c: SalaryComponent, money: (minor: number) => string): string {
  switch (c.kind) {
    case "fixed":
      return `${money(c.amountMinor)} base salary each month`;
    case "per_student":
      return `${money(c.amountMinor)} per ${c.count === "enrolled" ? "enrolled" : c.count === "paid" ? "paying" : "attending"} student`;
    case "revenue_share":
      return `${c.percent}% of tuition ${c.of === "collected" ? "collected" : "invoiced"}`;
    case "per_lesson":
      return `${money(c.amountMinor)} per lesson taught`;
    case "per_student_lesson":
      return `${money(c.amountMinor)} per student per lesson attended`;
    case "tiered_per_student": {
      const bands = sortedTiers(c.tiers)
        .map((t) => `${t.from}+ → ${money(t.amountMinor)}`)
        .join(", ");
      return `per student, tiered by ${c.across === "teacher" ? "total" : "class"} headcount (${bands})`;
    }
    case "tiered_revenue_share": {
      const bands = sortedTiers(c.tiers)
        .map((t) => `${c.by === "revenue" ? money(t.from) : `${t.from}`}+ → ${t.percent}%`)
        .join(", ");
      return `share of tuition ${c.of}, tiered by ${c.by === "revenue" ? "revenue" : `${c.across === "teacher" ? "total" : "class"} headcount`} (${bands})`;
    }
    case "attendance_bonus":
      return `${money(c.amountMinor)} bonus when attendance is ${c.minRatePct}% or better`;
  }
}

export function describeRule(rule: SalaryRule, money: (minor: number) => string): string {
  if (rule.components.length === 0) return "No components yet — this rule pays nothing.";
  const parts = rule.components.map((c) => describeComponent(c, money));
  const tail: string[] = [];
  if (rule.floorMinor != null) tail.push(`at least ${money(rule.floorMinor)}`);
  if (rule.capMinor != null) tail.push(`at most ${money(rule.capMinor)}`);
  return parts.join(" + ") + (tail.length ? `, ${tail.join(" and ")}` : "");
}

/** The unit suffix a payslip line reads with. */
export function basisSuffix(unit: BasisUnit, value: number): string {
  switch (unit) {
    case "students":
      return `${value} student${value === 1 ? "" : "s"}`;
    case "lessons":
      return `${value} lesson${value === 1 ? "" : "s"}`;
    case "student-lessons":
      return `${value} student-lesson${value === 1 ? "" : "s"}`;
    case "percent":
      return `${value}%`;
    default:
      return String(value);
  }
}
