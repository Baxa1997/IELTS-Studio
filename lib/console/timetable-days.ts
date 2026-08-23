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
 * These are presets on the form, not a stored type — picking "Odd days" ticks
 * Mon/Wed/Fri and the rows that get written are three ordinary days. That is
 * the whole point: the preset is a shortcut for the human, never a second
 * version of the truth for the database. The column that used to store it
 * could contradict the weekday beside it, and did.
 *
 * The labels are the Uzbek market's own terms translated — "toq kunlar" is
 * literally odd days, "juft kunlar" even days. They read in English until the
 * app is properly translated, at which point these are four strings to look up
 * rather than four hard-coded words in one language.
 */
export const DAY_PRESETS = [
  { key: "odd", label: "Odd days", note: "Mon · Wed · Fri", days: [1, 3, 5] },
  { key: "even", label: "Even days", note: "Tue · Thu · Sat", days: [2, 4, 6] },
  { key: "daily", label: "Every weekday", note: "Mon–Sat", days: [1, 2, 3, 4, 5, 6] },
  { key: "weekend", label: "Weekend", note: "Sat · Sun", days: [6, 0] },
] as const;

/**
 * "Mon · Wed · Fri", or "Mon–Sat" for a run of consecutive days.
 *
 * In the reading order of the week, and never the preset's name: a block on
 * the grid has to say which days it actually is.
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

/* ── reading a schedule out of a sentence ─────────────────────────────────────

   THE ASSISTANT NEEDS THIS AND THE FORM DOES NOT. A person ticks boxes; a
   person TALKING to the console says "dushanba, chorshanba, juma, 15:30 dan
   17:00 gacha" and expects the class to come out with three lessons on it. The
   assistant used to drop every word of that — the class was created with no
   timetable at all, which is the number every prorated fee and salary divides
   by — so the parsing has to live somewhere both it and the tests can reach.

   Three languages because that is what gets typed into this product: English,
   Uzbek (Latin and Cyrillic) and Russian. */

/** Day names, longest first so `dushanba` is never read as `shanba`. */
const DAY_ALIASES: readonly (readonly [string, number])[] = (
  [
    ["sunday", 0],
    ["sun", 0],
    ["yakshanba", 0],
    ["якшанба", 0],
    ["воскресенье", 0],
    ["вс", 0],
    ["monday", 1],
    ["mon", 1],
    ["dushanba", 1],
    ["душанба", 1],
    ["понедельник", 1],
    ["пн", 1],
    ["tuesday", 2],
    ["tues", 2],
    ["tue", 2],
    ["seshanba", 2],
    ["сешанба", 2],
    ["вторник", 2],
    ["вт", 2],
    ["wednesday", 3],
    ["weds", 3],
    ["wed", 3],
    ["chorshanba", 3],
    ["чоршанба", 3],
    ["среда", 3],
    ["ср", 3],
    ["thursday", 4],
    ["thurs", 4],
    ["thur", 4],
    ["thu", 4],
    ["payshanba", 4],
    ["пайшанба", 4],
    ["четверг", 4],
    ["чт", 4],
    ["friday", 5],
    ["fri", 5],
    ["juma", 5],
    ["жума", 5],
    ["пятница", 5],
    ["пт", 5],
    ["saturday", 6],
    ["sat", 6],
    ["shanba", 6],
    ["шанба", 6],
    ["суббота", 6],
    ["сб", 6],
  ] as [string, number][]
).sort((a, b) => b[0].length - a[0].length);

/** Whole-string rhythms, in the words a centre actually sells them in. */
const DAY_PHRASES: readonly (readonly [string, readonly number[]])[] = [
  ["odd day", [1, 3, 5]],
  ["toq kun", [1, 3, 5]],
  ["нечет", [1, 3, 5]],
  ["even day", [2, 4, 6]],
  ["juft kun", [2, 4, 6]],
  ["чет", [2, 4, 6]],
  ["weekend", [6, 0]],
  ["dam olish", [6, 0]],
  ["выходн", [6, 0]],
  ["every weekday", [1, 2, 3, 4, 5, 6]],
  ["har kuni", [1, 2, 3, 4, 5, 6]],
  ["ежедневно", [1, 2, 3, 4, 5, 6]],
];

/**
 * "Monday, Wednesday and Friday" → `[1, 3, 5]`.
 *
 * Returns an empty array when nothing in the text is a day, which the callers
 * read as "no schedule was asked for" — never as a schedule of no days.
 *
 * Matching is per WORD and longest-alias-first, not a bare substring sweep:
 * `shanba` is Saturday but it is also the tail of four other Uzbek day names,
 * so a sweep would put every class on a Saturday.
 */
export function parseWeekdays(input: string): number[] {
  const text = input.toLowerCase();
  if (!text.trim()) return [];

  const found = new Set<number>();
  for (const [phrase, days] of DAY_PHRASES) {
    if (text.includes(phrase)) for (const d of days) found.add(d);
  }
  for (const token of text.split(/[^\p{L}]+/u)) {
    if (!token) continue;
    const hit = DAY_ALIASES.find(([alias]) => token.startsWith(alias));
    if (hit) found.add(hit[1]);
  }
  return [...found].sort((a, b) => WEEK_ORDER.indexOf(a as never) - WEEK_ORDER.indexOf(b as never));
}

/** `[1, 3, 5]` → "Monday, Wednesday, Friday" — the editable form of a day list.
 *  Long names rather than `describeDays`' "Mon · Wed · Fri", because this one
 *  goes in a text box somebody may retype. */
export function listDays(days: number[]): string {
  return days.map((d) => WEEKDAYS[d]?.long ?? "?").join(", ");
}

/**
 * A time, however it was written, as `HH:MM` — or null if it is not one.
 *
 * `15:30`, `15.30`, `1530`, `3:30 pm`, `9am` all land as a 24-hour clock,
 * because the confirm card's field is typed by hand and refusing `15.30` for
 * the sake of a colon is the kind of pedantry that sends people back to the
 * form they were trying to avoid.
 */
export function parseClockTime(input: string): string | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const m = /^(\d{1,2})(?:[:.\s]?(\d{2}))?\s*(am|pm)?$/.exec(text);
  if (!m) return null;

  // `1530` needs no special case: the leading group caps at two digits, so it
  // backtracks to 15 + 30 on its own.
  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3];

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return clock(hour, minute);
}

function clock(hour: number, minute: number): string | null {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
