/**
 * WHEN A LEARNER IS TOLD ABOUT THEIR ALLOWANCE — executed, not source-read.
 *
 * The thresholds decide who gets an email at 03:00, so they are pinned with the
 * real function: the heads-up at 80% only where 80% means something, "none
 * left" at the limit, and silence for unlimited plans and for an admin's
 * deliberate zero.
 */

import { describe, expect, it } from "vitest";

import { quotaLevel } from "./quota-levels";

describe("quotaLevel", () => {
  it("says nothing about an unlimited allowance", () => {
    expect(quotaLevel({ limit: null, used: 999 })).toBeNull();
  });

  it("says nothing about a limit of 0 — that is an admin blocking it, not a spent allowance", () => {
    expect(quotaLevel({ limit: 0, used: 0 })).toBeNull();
  });

  it("warns at 80% of the free plan's five gradings — the fourth", () => {
    expect(quotaLevel({ limit: 5, used: 3 })).toBeNull();
    expect(quotaLevel({ limit: 5, used: 4 })).toBe("warning");
    expect(quotaLevel({ limit: 5, used: 5 })).toBe("exhausted");
  });

  it("rounds the 80% mark up, so the warning never fires early", () => {
    // 25 × 0.8 = 20 exactly; 8 × 0.8 = 6.4 → the 7th.
    expect(quotaLevel({ limit: 25, used: 19 })).toBeNull();
    expect(quotaLevel({ limit: 25, used: 20 })).toBe("warning");
    expect(quotaLevel({ limit: 8, used: 6 })).toBeNull();
    expect(quotaLevel({ limit: 8, used: 7 })).toBe("warning");
  });

  it("skips the heads-up for tiny allowances and only says when they are gone", () => {
    // One mock a month: 80% of it IS the limit.
    expect(quotaLevel({ limit: 1, used: 0 })).toBeNull();
    expect(quotaLevel({ limit: 1, used: 1 })).toBe("exhausted");
    expect(quotaLevel({ limit: 2, used: 1 })).toBeNull();
    expect(quotaLevel({ limit: 4, used: 3 })).toBeNull();
    expect(quotaLevel({ limit: 4, used: 4 })).toBe("exhausted");
  });

  it("treats going over the limit as exhausted, not as something new", () => {
    expect(quotaLevel({ limit: 5, used: 7 })).toBe("exhausted");
  });
});
