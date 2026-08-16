/**
 * What happens on a given day — the single definition.
 *
 * WHY THIS MODULE EXISTS. The Overview and the Attendance page disagreed. The
 * Overview listed every group in the center and called them "today's classes",
 * so it reported "3 registers still open today" while Attendance, which reads
 * the timetable, said nothing was scheduled. Two definitions of the same word
 * is not a display bug — it is the reason nobody trusts either number. There is
 * now one function, and both pages call it.
 *
 * Deliberately NOT `server-only`: everything above the loader is pure date
 * arithmetic that the timetable form and the tests need too.
 */

/* ── the pure part ─────────────────────────────────────────────────────────── */

export interface SlotRow {
  groupId: string;
  roomId: string | null;
  /** 0 = Sunday, matching JS `getDay()` and what the column stores. */
  weekday: number;
  /** `18:00` */
  startsAt: string;
  endsAt: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface HolidayRow {
  name: string;
  startsOn: string;
  endsOn: string;
}

/** The weekday of an ISO date, read in UTC so it can't drift by a day. */
export const weekdayOf = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();

/**
 * Does this timetable row put a lesson on this date?
 *
 * Weekday plus the effective window, and nothing else. The `pattern` column
 * (weekly/odd/even) is dead — a group that meets Mon/Wed/Fri is three rows, so
 * a row's weekday IS the rule. Honouring the column as well is what let a slot
 * contradict the day printed beside it.
 */
export function slotRuns(slot: SlotRow, date: string): boolean {
  if (slot.weekday !== weekdayOf(date)) return false;
  if (slot.effectiveFrom > date) return false;
  if (slot.effectiveTo && slot.effectiveTo < date) return false;
  return true;
}

/** The holiday covering a date, or null. Overlapping entries are fine — the
 *  first match wins and they all mean the same thing: the center is shut. */
export function holidayOn(holidays: HolidayRow[], date: string): HolidayRow | null {
  return holidays.find((h) => h.startsOn <= date && date <= h.endsOn) ?? null;
}

/** Registers close a week after the lesson. Mirrors `attendance_is_locked` in
 *  the database, which is the enforcing copy — this one is for the interface. */
export const LOCK_AFTER_DAYS = 7;

export function lockDateFor(heldOn: string): string {
  const d = new Date(`${heldOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + LOCK_AFTER_DAYS);
  return d.toISOString().slice(0, 10);
}

export function registerIsLocked(
  heldOn: string,
  unlockedUntil: string | null,
  now: Date,
): boolean {
  if (lockDateFor(heldOn) > now.toISOString().slice(0, 10)) return false;
  if (unlockedUntil && new Date(unlockedUntil) > now) return false;
  return true;
}

/* ── the center's own clock ────────────────────────────────────────────────── */

/**
 * The date and wall-clock minute it is *at the center*.
 *
 * Everything else in this app takes the UTC day, which for the market it sells
 * into means the console shows yesterday until 05:00 and thinks an 18:00 lesson
 * has not started at 20:00 local. Both of those make a "registers to mark"
 * count that a center owner can disprove by looking out of the window.
 */
export function centerNow(timezone: string, now: Date = new Date()): {
  date: string;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export const minutesOf = (hhmm: string): number =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/* ── the loader ────────────────────────────────────────────────────────────── */

export interface DayLesson {
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  roomName: string | null;
  /** Where the timetable puts it. Null when this group isn't scheduled today. */
  startsAt: string | null;
  endsAt: string | null;
  timeLabel: string | null;
  /** The timetable says this group meets on this date. */
  scheduled: boolean;
  /** Set when the lesson was written off. Excluded from every count. */
  cancelledReason: string | null;
  sessionId: string | null;
  state: "open" | "marked";
  /** Past its lock date, and not reopened. */
  locked: boolean;
  /** Students on the roster who still count — paused and left are excluded. */
  students: number;
  /** Running attendance rate for the group, or null when nothing is recorded. */
  ratePct: number | null;
  presentToday: number | null;
}

export interface DaySchedule {
  date: string;
  /** The center's own timezone, so callers can format consistently. */
  timezone: string;
  holiday: HolidayRow | null;
  /** Every group the caller may mark, scheduled ones first. */
  lessons: DayLesson[];
}

/** Lessons that finished and whose register nobody saved — the day's real queue. */
export function registersToMark(day: DaySchedule, timezone: string, now: Date = new Date()): DayLesson[] {
  if (day.holiday) return [];
  const clock = centerNow(timezone, now);
  return day.lessons.filter((l) => {
    if (!l.scheduled || l.cancelledReason || l.state === "marked" || l.locked) return false;
    // A lesson still in progress is not late. Only past its end time counts.
    if (day.date > clock.date) return false;
    if (day.date === clock.date && l.endsAt && minutesOf(l.endsAt) > clock.minutes) return false;
    return true;
  });
}
