/**
 * Weekdays and the rhythms a center sells them in.
 *
 * Deliberately NOT `server-only`: the timetable form is a client component and
 * needs the same day list and the same presets the loader uses. Everything here
 * is pure data and pure functions, so both sides can share one definition
 * rather than keeping two in step.
 */

export const WEEKDAYS = [
  { index: 0, short: "Sun", long: "Sunday", uz: "Yak" },
  { index: 1, short: "Mon", long: "Monday", uz: "Du" },
  { index: 2, short: "Tue", long: "Tuesday", uz: "Se" },
  { index: 3, short: "Wed", long: "Wednesday", uz: "Chor" },
  { index: 4, short: "Thu", long: "Thursday", uz: "Pa" },
  { index: 5, short: "Fri", long: "Friday", uz: "Ju" },
  { index: 6, short: "Sat", long: "Saturday", uz: "Sha" },
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

/** "Toq kunlar" when the days match a preset, otherwise "Mon · Wed". */
export function describeDays(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const preset = DAY_PRESETS.find(
    (p) =>
      p.days.length === sorted.length &&
      [...p.days].sort((a, b) => a - b).every((d, i) => d === sorted[i]),
  );
  if (preset) return preset.label;
  return sorted.map((d) => WEEKDAYS[d]?.short ?? "?").join(" · ");
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

export const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** `09:00:00` from Postgres, `09:00` from a form — both land as `09:00`. */
export const trimTime = (t: string): string => t.slice(0, 5);
