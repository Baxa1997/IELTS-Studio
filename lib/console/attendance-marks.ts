/**
 * What one attendance mark means — the single definition.
 *
 * FOUR PLACES USED TO ANSWER THIS DIFFERENTLY. `v_student_attendance` had it
 * right in SQL; payroll.ts, the group page and the roster each carried their own
 * `status !== "absent"`, which WAS exactly "present or late" for as long as
 * those were the only three marks. Phase 1 added `excused` (20260816120000) and
 * silently changed the meaning of every one of them at once — without touching
 * a line of their code, and without anything failing.
 *
 * What it broke, in ascending order of cost:
 *
 *   - the group page and the payroll page reported DIFFERENT attendance rates
 *     for the same class, which is the "one number, two definitions" problem
 *     the whole restructure exists to remove;
 *   - `studentsAttended` counted a student excused every week as somebody who
 *     turned up;
 *   - `studentLessons` is a salary basis paid per student-lesson, so the
 *     teacher was paid for lessons nobody sat.
 *
 * THE RULE: attended means present or late. Excused is neither attended nor
 * absent — it leaves the denominator, because a lesson somebody was excused
 * from is not a lesson they failed to attend. An unknown status counts as
 * not-attended rather than attended, so the next mark somebody adds cannot
 * repeat this by default.
 *
 * Pure and not `server-only`: the roster renders this in the browser and the
 * payroll run uses it on the server, and they must not be able to disagree.
 */

export interface MarkWeight {
  /** Does this mark count towards the denominator at all? */
  inDenominator: boolean;
  /** Does it count as having turned up? */
  attended: boolean;
}

export function markCounts(status: string): MarkWeight {
  if (status === "excused") return { inDenominator: false, attended: false };
  return { inDenominator: true, attended: status === "present" || status === "late" };
}

/**
 * An attendance percentage from a list of marks, or null when there is nothing
 * to divide by.
 *
 * Null rather than 0 matters: a class whose every mark was `excused` has no
 * attendance rate, and printing 0% would accuse a room full of people of not
 * turning up to a lesson they were excused from.
 */
export function attendanceRateFrom(statuses: Iterable<string>): number | null {
  let denominator = 0;
  let attended = 0;
  for (const status of statuses) {
    const weight = markCounts(status);
    if (!weight.inDenominator) continue;
    denominator += 1;
    if (weight.attended) attended += 1;
  }
  return denominator === 0 ? null : Math.round((attended / denominator) * 100);
}
