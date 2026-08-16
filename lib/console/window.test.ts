import { describe, expect, it } from "vitest";

import { DEFAULT_RANGE, RANGES, overWindow, resolveWindow } from "./window";

/**
 * R1 has two halves and the second is the one that gets forgotten: a page-wide
 * picker is only trustworthy if the figures that IGNORE it are labelled. These
 * tests pin the first half; the second is enforced by `ALWAYS_CURRENT` being
 * the only way a caption is allowed to say so.
 */

const now = new Date("2026-08-16T12:00:00Z");

describe("resolveWindow", () => {
  it("defaults to 90 days when nothing is asked for", () => {
    expect(resolveWindow(undefined, now).key).toBe(DEFAULT_RANGE);
    expect(resolveWindow(undefined, now).days).toBe(90);
  });

  it("falls back to the default rather than trusting a URL", () => {
    // `?range=` is user input; an unknown value must not produce a window of
    // NaN days, which would silently filter everything out and render an empty
    // report that looks like a center doing no work.
    expect(resolveWindow("all-time", now).key).toBe(DEFAULT_RANGE);
    expect(resolveWindow("'; drop table --", now).days).toBe(90);
    expect(Number.isFinite(Date.parse(resolveWindow("nonsense", now).since))).toBe(true);
  });

  it("measures back from now, to the day", () => {
    expect(resolveWindow("30d", now).since).toBe("2026-07-17T12:00:00.000Z");
    expect(resolveWindow("365d", now).since).toBe("2025-08-16T12:00:00.000Z");
  });

  it("offers every range with a distinct length", () => {
    const days = RANGES.map((r) => r.days);
    expect(new Set(days).size).toBe(days.length);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("names itself the same way everywhere", () => {
    expect(overWindow(resolveWindow("90d", now))).toBe("in the last 90 days");
    expect(overWindow(resolveWindow("180d", now))).toBe("in the last 6 months");
  });
});
