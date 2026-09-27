import { describe, expect, it } from "vitest";

import { dayNumber, pickIndex, practiceDay, recentDays } from "./rotation";

describe("the free practice rotation", () => {
  it("never repeats a practice for one visitor until the whole pool is used", () => {
    const size = 25;
    const seen = new Set<number>();
    const days = recentDays("2026-12-31", size);
    for (const d of days) seen.add(pickIndex(size, "visitor-a", "reading", d));
    expect(seen.size).toBe(size);
  });

  it("gives a visitor something new every day", () => {
    const [today, yesterday] = recentDays("2026-09-27", 2);
    expect(pickIndex(76, "v", "writing", today)).not.toBe(pickIndex(76, "v", "writing", yesterday));
  });

  it("gives different visitors a different mix on the same day", () => {
    // Not a guarantee for any two — a mix across many. With 140 practices and
    // 200 visitors, almost all of them should land somewhere different.
    const picks = new Set(
      Array.from({ length: 200 }, (_, i) => pickIndex(140, `visitor-${i}`, "listening", "2026-09-27")),
    );
    expect(picks.size).toBeGreaterThan(100);
  });

  it("rotates each skill independently for the same visitor", () => {
    const day = "2026-09-27";
    const w = pickIndex(1000, "v", "writing", day);
    const r = pickIndex(1000, "v", "reading", day);
    expect(w).not.toBe(r);
  });

  it("stays inside the pool, and admits an empty one", () => {
    for (const d of recentDays("2026-09-27", 40)) {
      const i = pickIndex(7, "x", "reading", d);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(7);
    }
    expect(pickIndex(0, "x", "reading", "2026-09-27")).toBe(-1);
  });

  it("turns the day over at midnight in Tashkent, not UTC", () => {
    // 19:30 UTC on the 26th is already 00:30 on the 27th in Tashkent (UTC+5).
    expect(practiceDay(new Date("2026-09-26T19:30:00Z"))).toBe("2026-09-27");
    expect(practiceDay(new Date("2026-09-26T18:30:00Z"))).toBe("2026-09-26");
  });

  it("counts days and walks back through them", () => {
    expect(dayNumber("1970-01-02")).toBe(1);
    expect(recentDays("2026-03-01", 3)).toEqual(["2026-03-01", "2026-02-28", "2026-02-27"]);
  });
});
