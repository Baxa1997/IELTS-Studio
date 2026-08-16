/*
 * Pure, and NOT `server-only`. The loader lives in `people.ts` beside
 * `loadTeachers`, because the last time a rule like this sat behind
 * `server-only` no test could reach it and a false claim shipped to every
 * teacher for weeks. `median` in particular is the whole argument of this file.
 */

/**
 * Marking turnaround — §7's answer to "how do you measure a teacher fairly?"
 *
 * WHY THIS AND NOT A BAND AVERAGE. The teachers table used to carry AVG BAND,
 * which averaged whatever skills a teacher's students happened to practise,
 * across as few as one essay, and printed it next to their name as if it were a
 * performance rating. It measured the students, not the teacher, and it
 * punished anyone given a weaker class. R2 removed it.
 *
 * Turnaround measures something the teacher actually controls: how long work
 * sat between a student handing it in and a human signing off the band. A
 * teacher cannot make a student write better this week, but they can mark
 * within a day — and a centre whose marking takes a fortnight loses students
 * regardless of how good the marking is.
 *
 * MEDIAN, NOT MEAN. One essay marked three weeks late after a holiday drags a
 * mean into meaninglessness, and it is exactly the kind of outlier a teacher
 * would rightly argue about. The median says what a student can normally
 * expect, which is the thing worth reporting.
 */

export interface Turnaround {
  /** Median hours from submission to a signed final band. Null with no data. */
  medianHours: number | null;
  /** How many reviews it rests on — R3 applies to this figure too. */
  reviews: number;
  /** Under this, the median is one or two marks and says little. */
  provisional: boolean;
}

/** Under this many marks, a median says little. R3 applies here too. */
export const PROVISIONAL_UNDER = 3;

export const NO_TURNAROUND: Turnaround = {
  medianHours: null,
  reviews: 0,
  provisional: true,
};

/** Median of a non-empty list, averaging the middle pair when even. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

/** `4h` / `2 days` / `—`. A number a person can act on, not 51.7. */
export function describeTurnaround(t: Turnaround): string {
  if (t.medianHours == null) return "—";
  if (t.medianHours < 1) return "under an hour";
  if (t.medianHours < 48) return `${Math.round(t.medianHours)}h`;
  const days = t.medianHours / 24;
  return `${days < 10 ? Math.round(days * 10) / 10 : Math.round(days)} days`;
}
