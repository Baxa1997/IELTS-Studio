import { describe, expect, it } from "vitest";

import {
  billableUntil,
  chargeClass,
  describeProration,
  lessonDatesInMonth,
  prorate,
  teacherBillForClass,
  type ClassMember,
} from "./tuition";

/**
 * The arithmetic that decides what a parent is charged and what a teacher is
 * paid. Two people in the same room read the two halves of it, so a mistake
 * here does not stay a bug for long — it becomes an argument.
 *
 * Most of this file is about the END of a student's month, which proration
 * never had. payroll.ts said so out loud: "there is no leave date on
 * group_members, so a student who left mid-month still counts". Phase 1 gave us
 * one; until this change, a student who left in March was still being invoiced
 * in August and still inflating their old teacher's headcount.
 */

/** Mon/Wed/Fri, running all month. */
const MWF = [
  { weekday: 1, effectiveFrom: "2026-01-01", effectiveTo: null },
  { weekday: 3, effectiveFrom: "2026-01-01", effectiveTo: null },
  { weekday: 5, effectiveFrom: "2026-01-01", effectiveTo: null },
];

const AUG = "2026-08-01";
const augustDates = lessonDatesInMonth(MWF, AUG);
const FEE = 600_000; // 600 000 minor units

const at = (over: Partial<Parameters<typeof prorate>[0]> = {}) =>
  prorate({
    fullMinor: FEE,
    lessonDates: augustDates,
    month: AUG,
    fallbackLessons: 12,
    ...over,
  });

describe("lessonDatesInMonth", () => {
  it("counts the class's own meetings, not days", () => {
    // August 2026: 1st is a Saturday. Mon/Wed/Fri gives 13 dates.
    expect(augustDates.length).toBe(13);
    expect(augustDates[0]).toBe("2026-08-03");
    expect(augustDates.at(-1)).toBe("2026-08-31");
  });
});

describe("prorate — leaving mid-month", () => {
  it("charges a full month for someone who was there throughout", () => {
    const p = at();
    expect(p.billed).toBe(13);
    expect(p.amountMinor).toBe(FEE);
    expect(p.partial).toBe(false);
  });

  it("stops charging at the day they left", () => {
    // Left on the 17th (a Monday). Lessons on the 3rd–14th are billed; the
    // 17th itself is not — the status is set when somebody stops coming, so
    // that day's lesson is the one they were not at.
    const p = at({ leftOn: "2026-08-17" });
    expect(p.billed).toBe(6);
    expect(p.planned).toBe(13);
    expect(p.amountMinor).toBe(Math.round((FEE * 6) / 13));
    expect(p.partial).toBe(true);
  });

  it("charges nothing at all for someone who left before the month began", () => {
    // THE BUG THIS FIXES. A student marked left in March was being invoiced a
    // full 600 000 every month afterwards, for ever.
    const p = at({ leftOn: "2026-03-14" });
    expect(p.billed).toBe(0);
    expect(p.amountMinor).toBe(0);
  });

  it("charges a full month for someone who leaves after it ends", () => {
    const p = at({ leftOn: "2026-09-04" });
    expect(p.billed).toBe(13);
    expect(p.amountMinor).toBe(FEE);
  });

  it("bills only the middle when they joined late AND left early", () => {
    const p = at({ joinedOn: "2026-08-10", leftOn: "2026-08-21" });
    // 10th, 12th, 14th, 17th, 19th — the 21st is excluded.
    expect(p.billed).toBe(5);
    expect(p.joinedOn).toBe("2026-08-10");
    expect(p.leftOn).toBe("2026-08-21");
  });

  it("never bills a negative amount when the dates are back to front", () => {
    // A left date before the join date is nonsense, and it must resolve to
    // "nothing", not to a credit note nobody asked for.
    const p = at({ joinedOn: "2026-08-20", leftOn: "2026-08-05" });
    expect(p.billed).toBe(0);
    expect(p.amountMinor).toBe(0);
  });

  it("still rounds once, at the end", () => {
    // 600 000 × 6 / 13 = 276 923.07…  Rounding a per-lesson rate first
    // (46 154 × 6 = 276 924) drifts, and drift on a fee is what a parent
    // notices.
    const p = at({ leftOn: "2026-08-17" });
    expect(p.amountMinor).toBe(276_923);
    expect(p.perLessonMinor).toBe(46_154);
  });
});

describe("prorate — a class with no timetable", () => {
  const noTimetable = (over: Partial<Parameters<typeof prorate>[0]> = {}) =>
    prorate({ fullMinor: FEE, lessonDates: [], month: AUG, fallbackLessons: 12, ...over });

  it("falls back to the house figure and says so", () => {
    const p = noTimetable();
    expect(p.planned).toBe(12);
    expect(p.estimated).toBe(true);
    expect(p.amountMinor).toBe(FEE);
  });

  it("still stops at the leaving date", () => {
    // Roughly half of August.
    const p = noTimetable({ leftOn: "2026-08-16" });
    expect(p.billed).toBeLessThan(12);
    expect(p.billed).toBeGreaterThan(0);
    expect(p.partial).toBe(true);
  });

  it("charges nothing for someone who left months ago", () => {
    const p = noTimetable({ leftOn: "2026-03-01" });
    expect(p.billed).toBe(0);
    expect(p.amountMinor).toBe(0);
  });
});

describe("billableUntil", () => {
  const member = (over: Partial<ClassMember> = {}): ClassMember => ({
    studentId: "s1",
    joinedOn: null,
    ...over,
  });

  it("keeps billing an active student", () => {
    expect(billableUntil(member({ status: "active" }))).toBeNull();
    expect(billableUntil(member())).toBeNull();
  });

  it("stops billing a paused student, not only one who left", () => {
    // §6: "Paused students are excluded from gone-quiet alerts, attendance
    // denominators, and invoices." A centre that keeps charging a paused
    // student has decided to hold their place and billed for it silently.
    expect(billableUntil(member({ status: "paused", statusChangedOn: "2026-08-11" }))).toBe(
      "2026-08-11",
    );
    expect(billableUntil(member({ status: "left", statusChangedOn: "2026-08-11" }))).toBe(
      "2026-08-11",
    );
  });

  it("treats a status with no date as long gone rather than fully billable", () => {
    // Of the two guesses available for a row that predates the trigger, this is
    // the one nobody has to be refunded for.
    const until = billableUntil(member({ status: "left" }));
    expect(until).toBe("1970-01-01");
    expect(at({ leftOn: until }).amountMinor).toBe(0);
  });
});

describe("chargeClass", () => {
  const members: ClassMember[] = [
    { studentId: "stays", joinedOn: null },
    { studentId: "joined-late", joinedOn: "2026-08-10" },
    { studentId: "paused", joinedOn: null, status: "paused", statusChangedOn: "2026-08-17" },
    { studentId: "left-in-march", joinedOn: null, status: "left", statusChangedOn: "2026-03-02" },
  ];

  const charges = chargeClass({
    members,
    monthlyFeeMinor: FEE,
    teacherRateMinor: 200_000,
    lessonDates: augustDates,
    month: AUG,
    fallbackLessons: 12,
  });

  it("bills each student for their own share of the month", () => {
    const by = new Map(charges.map((c) => [c.studentId, c]));
    expect(by.get("stays")!.tuition!.amountMinor).toBe(FEE);
    expect(by.get("joined-late")!.tuition!.partial).toBe(true);
    expect(by.get("paused")!.tuition!.billed).toBe(6);
    expect(by.get("left-in-march")!.tuition!.amountMinor).toBe(0);
  });

  it("moves the teacher's pay by exactly the same fraction", () => {
    // The two halves are the same fraction of two different rates. If they
    // could disagree, a payslip and an invoice could not be shown to two people
    // in the same room.
    for (const c of charges) {
      expect(c.tuition!.billed, c.studentId).toBe(c.teacherPay!.billed);
      expect(c.tuition!.planned, c.studentId).toBe(c.teacherPay!.planned);
    }
  });

  it("does not pay a teacher for students who left months ago", () => {
    const bill = teacherBillForClass(charges);
    // Four names on the roster, 2.23 students' worth of money: one full month,
    // ten of thirteen lessons for the late joiner, six for the paused one, and
    // nothing at all for the one who left in March. Before this change the
    // teacher was paid as though all four were there all month.
    expect(bill.studentsFull).toBe(4);
    expect(bill.studentsProrated).toBeCloseTo(1 + 10 / 13 + 6 / 13, 2);
    expect(bill.studentsProrated).toBeLessThan(3);
  });
});

describe("describeProration", () => {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = (s: string) =>
    `${Number(s.slice(8))} ${MONTHS[Number(s.slice(5, 7)) - 1]}`;

  it("says nothing when there is nothing to explain", () => {
    expect(describeProration(at(), d)).toBeNull();
  });

  it("names both ends when both apply", () => {
    const p = at({ joinedOn: "2026-08-10", leftOn: "2026-08-21" });
    expect(describeProration(p, d)).toBe("5 of 13 lessons — joined 10 Aug, left 21 Aug");
  });

  it("says plainly that nothing is owed", () => {
    // "0 of 13 lessons" on an invoice line reads like a mistake. It is not one.
    expect(describeProration(at({ leftOn: "2026-03-01" }), d)).toBe("Not billed — left 1 Mar");
  });
});
