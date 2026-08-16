import { describe, expect, it } from "vitest";

import { markCounts } from "./salary";

/**
 * `excused` is a salary bug, not just an attendance nicety.
 *
 * payroll.ts counted attendance as `status !== "absent"`, which was exactly
 * "present or late" for as long as those were the only three marks. Phase 1
 * added `excused` and silently changed the meaning of three figures at once:
 *
 *   - `studentLessons` is a salary basis paid per student-lesson, so the
 *     teacher was paid for lessons nobody sat.
 *   - `attendanceRatePct` = studentLessons / attendanceMarks, so the payroll
 *     page reported a DIFFERENT attendance rate from the attendance page for
 *     the same class. One number with two definitions is what this whole
 *     restructure exists to remove.
 *   - `studentsAttended` counted a student excused every week as somebody who
 *     turned up.
 */

describe("markCounts", () => {
  it("counts present and late as attended", () => {
    expect(markCounts("present")).toEqual({ inDenominator: true, attended: true });
    expect(markCounts("late")).toEqual({ inDenominator: true, attended: true });
  });

  it("counts absent against them, but counts it", () => {
    expect(markCounts("absent")).toEqual({ inDenominator: true, attended: false });
  });

  it("drops excused out of the denominator entirely", () => {
    // Not a softer absence. A lesson somebody was excused from is not a lesson
    // they failed to attend, so it counts against nobody — the same rule
    // v_student_attendance uses.
    expect(markCounts("excused")).toEqual({ inDenominator: false, attended: false });
  });

  it("agrees with the attendance view's rate on a mixed register", () => {
    // 10 marks: 6 present, 1 late, 2 absent, 1 excused.
    const register = [
      ...Array(6).fill("present"),
      "late",
      "absent",
      "absent",
      "excused",
    ];
    let denominator = 0;
    let attended = 0;
    for (const status of register) {
      const c = markCounts(status);
      if (!c.inDenominator) continue;
      denominator += 1;
      if (c.attended) attended += 1;
    }
    // 7 of 9, not 8 of 10 — the old rule scored the excused student as present.
    expect(denominator).toBe(9);
    expect(attended).toBe(7);
    expect(Math.round((100 * attended) / denominator)).toBe(78);
  });

  it("treats an unknown mark as present in the denominator but not attended", () => {
    // A status nobody has added yet must not silently become "attended" and
    // start paying somebody — which is exactly how `excused` broke this.
    expect(markCounts("holiday")).toEqual({ inDenominator: true, attended: false });
  });
});
