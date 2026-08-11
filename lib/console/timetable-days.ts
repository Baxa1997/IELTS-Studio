/**
 * Weekdays and the rhythms a center sells them in.
 *
 * Deliberately NOT `server-only`: the timetable form is a client component and
 * needs the same day list and the same presets the loader uses. Everything here
 * is pure data and pure functions, so both sides can share one definition
 * rather than keeping two in step.
 */

export const WEEKDAYS = [
  { index: 0, short: "Sun", long: "Sunday" },
  { index: 1, short: "Mon", long: "Monday" },
  { index: 2, short: "Tue", long: "Tuesday" },
  { index: 3, short: "Wed", long: "Wednesday" },
  { index: 4, short: "Thu", long: "Thursday" },
  { index: 5, short: "Fri", long: "Friday" },
  { index: 6, short: "Sat", long: "Saturday" },
] as const;

/**
 * The rhythms a center actually sells, as day sets.
 *
 * These are presets on the form, not a stored type — picking "Toq kunlar"
 * ticks Mon/Wed/Fri and the rows that get written are three ordinary days.
 * That is the whole point: the preset is a shortcut for the human, never a
 * second version of the truth for the database. The column that used to store
 * it could contradict the weekday beside it, and did.
 */
export const DAY_PRESETS = [
  { key: "odd", label: "Toq kunlar", note: "Mon · Wed · Fri", days: [1, 3, 5] },
  { key: "even", label: "Juft kunlar", note: "Tue · Thu · Sat", days: [2, 4, 6] },
  { key: "daily", label: "Har kuni", note: "Mon–Sat", days: [1, 2, 3, 4, 5, 6] },
  { key: "weekend", label: "Dam olish", note: "Sat · Sun", days: [6, 0] },
] as const;

/**
 * "Mon · Wed · Fri", or "Mon–Sat" for a run of consecutive days.
 *
 * English, in the reading order of the week, and never the preset's name. The
 * preset buttons keep their Uzbek labels because "toq kunlar" is the thing the
 * center sells; a block on the grid has to say which days it actually is.
 */
export function describeDays(days: number[]): string {
  const sorted = [...new Set(days)].sort(
    (a, b) => WEEK_ORDER.indexOf(a as never) - WEEK_ORDER.indexOf(b as never),
  );
  if (sorted.length === 7) return "Every day";
  const name = (d: number) => WEEKDAYS[d]?.short ?? "?";
  const consecutive = sorted.every(
    (d, i) =>
      i === 0 || WEEK_ORDER.indexOf(d as never) === WEEK_ORDER.indexOf(sorted[i - 1] as never) + 1,
  );
  if (sorted.length > 2 && consecutive)
    return `${name(sorted[0])}–${name(sorted[sorted.length - 1])}`;
  return sorted.map(name).join(" · ");
}

/**
 * The order a week is read in here: Monday first, Sunday last.
 *
 * The indexes stay JS `getDay()` numbers — 0 is Sunday — because that is what
 * the database stores and what `new Date().getDay()` returns. This is display
 * order only. A center that teaches Mon–Sat and rests on Sunday should not have
 * to look past its day off to find Monday.
 */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const orderedWeekdays = () => WEEK_ORDER.map((index) => WEEKDAYS[index]);

/* ── dates ────────────────────────────────────────────────────────────────── */

/** `2026-08-11`, in UTC, matching how every other date in this app is stored. */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
};

/** The Monday on or before a date — the week a timetable page is showing. */
export function startOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7; // Sunday counts as the 7th day, not the 1st
  return addDays(iso, -back);
}

/** The seven dates of a week, in `WEEK_ORDER`, keyed by weekday index. */
export function datesOfWeek(monday: string): Map<number, string> {
  return new Map(WEEK_ORDER.map((index, offset) => [index, addDays(monday, offset)]));
}

/** `11 – 17 Aug` / `28 Jul – 3 Aug`, the label above the day tabs. */
export function weekLabel(monday: string): string {
  const end = addDays(monday, 6);
  const fmt = (iso: string, withMonth: boolean) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      ...(withMonth ? { month: "short" } : {}),
      timeZone: "UTC",
    });
  const sameMonth = monday.slice(0, 7) === end.slice(0, 7);
  return `${fmt(monday, !sameMonth)} – ${fmt(end, true)}`;
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

export const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** `09:00:00` from Postgres, `09:00` from a form — both land as `09:00`. */
export const trimTime = (t: string): string => t.slice(0, 5);
