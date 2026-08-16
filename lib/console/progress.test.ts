import { describe, expect, it } from "vitest";

import { bandWithProgress, progressSince } from "./progress";

/**
 * The claim a centre puts in front of a parent.
 *
 * Every one of these is about not overstating. A progress figure is the most
 * quotable number the product produces and the easiest one to inflate by
 * accident — by comparing against a throwaway first attempt, by calling one
 * measurement a trend, or by rounding floating-point noise into a band.
 */

describe("progressSince", () => {
  it("says nothing from a single measurement", () => {
    // One reading is a position, not a journey. The old baseline column freezes
    // on the first attempt, so without this guard every brand-new student would
    // show "+0.0 since baseline" as though they had been measured twice.
    expect(progressSince(5.5, 5.5, "placement", 1).moved).toBeNull();
    expect(progressSince(6, 5, "first_attempt", 1).moved).toBeNull();
  });

  it("names the starting point, because it is what the number is worth", () => {
    expect(progressSince(6.5, 5.5, "placement", 4).label).toBe("+1.0 since placement");
    expect(progressSince(6.5, 5.5, "first_attempt", 4).label).toBe(
      "+1.0 since their first attempt",
    );
  });

  it("marks a placement baseline as measured and a first attempt as indicative", () => {
    expect(progressSince(6.5, 5.5, "placement", 4).confidence).toBe("measured");
    expect(progressSince(6.5, 5.5, "first_attempt", 4).confidence).toBe("indicative");
  });

  it("reports a fall as plainly as a rise", () => {
    // A centre that only ever shows gains is one whose reports nobody believes.
    const p = progressSince(5, 6, "placement", 3);
    expect(p.moved).toBe(-1);
    expect(p.label).toBe("-1.0 since placement");
  });

  it("says level rather than +0.0", () => {
    expect(progressSince(6, 6, "placement", 3).label).toBe("level since placement");
  });

  it("rounds to the half band the product actually reports in", () => {
    // 6.4 - 5.5 is 0.8999999999999995 in binary floating point; printed raw it
    // would read "+0.9000000000000004 since placement".
    expect(progressSince(6.4, 5.5, "placement", 3).moved).toBe(0.9);
  });

  it("stays silent when there is nothing to compare", () => {
    expect(progressSince(null, 5.5, "placement", 5).label).toBeNull();
    expect(progressSince(6.5, null, "placement", 5).confidence).toBe("none");
  });
});

describe("bandWithProgress", () => {
  it("is §6's line", () => {
    expect(bandWithProgress("Writing", 5.5, progressSince(5.5, 4.5, "placement", 3))).toBe(
      "Writing 5.5 · +1.0 since placement",
    );
  });

  it("drops the clause rather than inventing one", () => {
    expect(bandWithProgress("Reading", 6, progressSince(6, null, "first_attempt", 3))).toBe(
      "Reading 6.0",
    );
  });

  it("says not measured instead of a zero", () => {
    expect(bandWithProgress("Speaking", null, progressSince(null, null, "placement", 0))).toBe(
      "Speaking not measured yet",
    );
  });
});
