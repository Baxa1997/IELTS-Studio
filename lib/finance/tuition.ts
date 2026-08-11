import { addDays, monthEnd, monthStart } from "./period";

/**
 * What a month of one class costs, and what it pays — worked out by the lesson.
 *
 * A CLASS HAS ONE PRICE, AND EVERYONE PAYS IT. That is the rule this file
 * exists to keep. The old model let an invoice be raised for any amount, so two
 * students in the same room could quietly be on different money and nobody
 * would find out until one of them mentioned it. Now the price is a property of
 * the class (`groups.monthly_fee_minor`), the teacher's rate is a property of
 * the same class (`groups.teacher_rate_minor`), and the only thing that varies
 * between students is HOW MUCH OF THE MONTH THEY WERE THERE FOR.
 *
 * A LESSON IS THE UNIT, NOT A DAY. A student who joins on the 12th has not had
 * "60% of a month" — they have had five of this month's twelve lessons. Which
 * is why the denominator comes from the timetable: a Mon/Wed/Fri class meets 12
 * times in one month and 14 in another, and dividing by 30 days would charge
 * them for lessons that were never taught. `lessonDatesInMonth` walks the
 * class's actual bookings; `prorate` then charges the ones from their join date
 * onwards.
 *
 * BOTH SIDES USE THE SAME COUNT. The student's share and the teacher's share
 * are the same fraction of two different rates, so they can never disagree
 * about how much month happened — which is the only reason a payslip and an
 * invoice can be shown to two people in the same room.
 *
 * Pure and client-safe on purpose: the group form previews the arithmetic live
 * while the owner is typing the fee, and it has to be the same arithmetic the
 * invoice run uses, not a lookalike.
 */

/** A class's standing booking, as much of it as proration needs. */
export interface LessonSlotLite {
  /** JS `getDay()`: 0 = Sunday. */
  weekday: number;
  /** First date this booking runs. */
  effectiveFrom: string;
  /** Last date it runs, or null for open-ended. */
  effectiveTo: string | null;
}

/**
 * Every date the class actually meets inside a month, in order.
 *
 * Reads the same `effective_from` / `effective_to` window the timetable draws
 * with, so a course that finished in July contributes nothing to August without
 * anyone having to delete it.
 */
export function lessonDatesInMonth(slots: LessonSlotLite[], month: string): string[] {
  const from = monthStart(month);
  const to = monthEnd(from);
  if (slots.length === 0) return [];

  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const weekday = new Date(`${d}T00:00:00Z`).getUTCDay();
    const meets = slots.some(
      (s) =>
        s.weekday === weekday &&
        s.effectiveFrom <= d &&
        (s.effectiveTo == null || s.effectiveTo >= d),
    );
    if (meets) dates.push(d);
  }
  return dates;
}

/** How a month's charge was arrived at — every number a payslip or invoice shows. */
export interface Proration {
  /** Lessons the class held this month. The denominator. */
  planned: number;
  /** Lessons this student was enrolled for. Equals `planned` for a full month. */
  billed: number;
  /** The full monthly rate, before the student's share is taken. */
  fullMinor: number;
  /** What they actually owe (or what the teacher actually earns for them). */
  amountMinor: number;
  /** `fullMinor / planned`, for the "≈ 16 667 per lesson" line. */
  perLessonMinor: number;
  /** True when they missed part of the month and the amount was reduced. */
  partial: boolean;
  /** The date the count started from, when it wasn't the 1st. */
  joinedOn: string | null;
  /** True when there was no timetable and `planned` is the house assumption. */
  estimated: boolean;
}

/**
 * One student's share of one month.
 *
 * Rounding is applied ONCE, to the final amount — `round(full × billed /
 * planned)` — rather than to a per-lesson rate that is then multiplied. Rounding
 * first is how a full month of 12 lessons at "16 667" comes to 200 004 instead
 * of the 200 000 the parent was quoted. `perLessonMinor` is reported for the
 * human, never used in the arithmetic.
 */
export function prorate(opts: {
  /** The class's monthly rate in minor units. */
  fullMinor: number;
  /** Dates the class meets this month, from `lessonDatesInMonth`. */
  lessonDates: string[];
  /** When this student joined. Anything on or before the 1st means a full month. */
  joinedOn?: string | null;
  /** The month being billed, `YYYY-MM-01`. */
  month: string;
  /** Lessons to assume when the class has nothing on the timetable. */
  fallbackLessons: number;
}): Proration {
  const from = monthStart(opts.month);
  const to = monthEnd(from);
  const joined =
    opts.joinedOn && opts.joinedOn > from && opts.joinedOn <= to ? opts.joinedOn : null;

  // No timetable: fall back to the center's house figure and prorate by the
  // days left in the month. Less honest than counting lessons, but it is only
  // reached by a class nobody has booked a room for, and the caller says so.
  if (opts.lessonDates.length === 0) {
    const planned = Math.max(1, opts.fallbackLessons);
    const daysInMonth = Number(to.slice(8));
    const daysLeft = joined ? daysInMonth - Number(joined.slice(8)) + 1 : daysInMonth;
    const billed = joined ? Math.max(1, Math.round((planned * daysLeft) / daysInMonth)) : planned;
    return {
      planned,
      billed,
      fullMinor: opts.fullMinor,
      amountMinor: share(opts.fullMinor, billed, planned),
      perLessonMinor: Math.round(opts.fullMinor / planned),
      partial: billed < planned,
      joinedOn: joined,
      estimated: true,
    };
  }

  const planned = opts.lessonDates.length;
  const billed = joined ? opts.lessonDates.filter((d) => d >= joined).length : planned;
  return {
    planned,
    billed,
    fullMinor: opts.fullMinor,
    amountMinor: share(opts.fullMinor, billed, planned),
    perLessonMinor: Math.round(opts.fullMinor / planned),
    partial: billed < planned,
    joinedOn: joined,
    estimated: false,
  };
}

function share(fullMinor: number, billed: number, planned: number): number {
  if (planned <= 0) return 0;
  if (billed >= planned) return fullMinor;
  if (billed <= 0) return 0;
  return Math.round((fullMinor * billed) / planned);
}

/**
 * "5 of 12 lessons — joined 12 Aug". The sentence under a prorated amount.
 *
 * Says nothing at all for a full month: a line that explains itself when there
 * is nothing to explain is noise, and it is the exceptions the owner needs to
 * be able to spot.
 */
export function describeProration(p: Proration, prettyDate: (d: string) => string): string | null {
  if (!p.partial)
    return p.estimated ? `${p.planned} lessons assumed — this class has no timetable yet.` : null;
  const joined = p.joinedOn ? ` — joined ${prettyDate(p.joinedOn)}` : "";
  const estimated = p.estimated ? ", estimated" : "";
  return `${p.billed} of ${p.planned} lessons${joined}${estimated}`;
}

/**
 * A whole class's month, both sides of the money at once.
 *
 * Returned per student rather than as a total so the roster can show each
 * person their own number — the owner's actual question is "why is this one
 * paying less than that one", and a total cannot answer it.
 */
export interface StudentCharge {
  studentId: string;
  /** What the student owes for the month. */
  tuition: Proration | null;
  /** What the teacher earns for having them. */
  teacherPay: Proration | null;
}

export function chargeClass(opts: {
  members: { studentId: string; joinedOn: string | null }[];
  monthlyFeeMinor: number | null;
  teacherRateMinor: number | null;
  lessonDates: string[];
  month: string;
  fallbackLessons: number;
}): StudentCharge[] {
  return opts.members.map((m) => ({
    studentId: m.studentId,
    tuition:
      opts.monthlyFeeMinor == null
        ? null
        : prorate({
            fullMinor: opts.monthlyFeeMinor,
            lessonDates: opts.lessonDates,
            joinedOn: m.joinedOn,
            month: opts.month,
            fallbackLessons: opts.fallbackLessons,
          }),
    teacherPay:
      opts.teacherRateMinor == null
        ? null
        : prorate({
            fullMinor: opts.teacherRateMinor,
            lessonDates: opts.lessonDates,
            joinedOn: m.joinedOn,
            month: opts.month,
            fallbackLessons: opts.fallbackLessons,
          }),
  }));
}

/**
 * The teacher's whole bill for a class: the sum of every student's share, and
 * the fractional headcount that produced it.
 *
 * The headcount is reported as a fraction ("11.4 students") because that is
 * what the money says, and a payslip claiming 12 students while paying for 11.4
 * is the kind of small lie that costs an argument later.
 */
export function teacherBillForClass(charges: StudentCharge[]): {
  amountMinor: number;
  studentsFull: number;
  studentsProrated: number;
} {
  let amountMinor = 0;
  let studentsProrated = 0;
  let studentsFull = 0;
  for (const c of charges) {
    if (!c.teacherPay) continue;
    studentsFull += 1;
    amountMinor += c.teacherPay.amountMinor;
    studentsProrated += c.teacherPay.planned > 0 ? c.teacherPay.billed / c.teacherPay.planned : 0;
  }
  return { amountMinor, studentsFull, studentsProrated: Math.round(studentsProrated * 100) / 100 };
}
