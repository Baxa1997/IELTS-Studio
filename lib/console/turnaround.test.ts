import { describe, expect, it } from "vitest";

import { describeTurnaround, median, NO_TURNAROUND } from "./turnaround";

/**
 * The number that replaced AVG BAND on the teachers table.
 *
 * It goes next to a person's name on a page their employer reads, so the two
 * things that matter are that it cannot be dragged around by one outlier, and
 * that it says how much evidence is behind it.
 */

describe("median", () => {
  it("is not the mean, which is the entire point", () => {
    // One essay marked three weeks late after a holiday. The mean says 108
    // hours and the teacher is right to argue; the median says 4.
    const hours = [3, 4, 4, 5, 520];
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    expect(median(hours)).toBe(4);
    expect(mean).toBeGreaterThan(100);
  });

  it("averages the middle pair when the count is even", () => {
    expect(median([2, 4, 6, 8])).toBe(5);
  });

  it("says nothing from nothing", () => {
    expect(median([])).toBeNull();
  });

  it("does not leave floating-point noise in a reported figure", () => {
    // (4.1 + 4.2) / 2 is 4.15000000000000036 in binary floating point.
    expect(median([4.1, 4.2])).toBe(4.2);
  });
});

describe("describeTurnaround", () => {
  const at = (medianHours: number | null, reviews = 5) => ({
    medianHours,
    reviews,
    provisional: reviews < 3,
  });

  it("reads in units a person acts on", () => {
    expect(describeTurnaround(at(4))).toBe("4h");
    expect(describeTurnaround(at(0.5))).toBe("under an hour");
    expect(describeTurnaround(at(72))).toBe("3 days");
  });

  it("switches to days only when hours stop being useful", () => {
    // 47h is still "how long until I get it back". 49h is "two days".
    expect(describeTurnaround(at(47))).toBe("47h");
    expect(describeTurnaround(at(49))).toBe("2 days");
  });

  it("keeps one decimal on short spans of days and drops it on long ones", () => {
    expect(describeTurnaround(at(60))).toBe("2.5 days");
    expect(describeTurnaround(at(24 * 14))).toBe("14 days");
  });

  it("shows a dash rather than a zero when nothing has been marked", () => {
    // 0h would read as instant marking. Nobody has marked anything.
    expect(describeTurnaround(NO_TURNAROUND)).toBe("—");
  });
});
