import { describe, expect, it } from "vitest";

import { mixSlots } from "./mix";
import { FREE_LIST_SIZE } from "./rotation";

/** Every window of `size` consecutive slots, wrapping — which is what a
 *  visitor's list is (see `listIndices`). */
function windows<T>(pool: T[], size: number): T[][] {
  return pool.map((_, s) => Array.from({ length: Math.min(size, pool.length) }, (_, k) => pool[(s + k) % pool.length]));
}

describe("the full-and-part mix (owner, 2026-09-27: full practice, some parts mixed in)", () => {
  const reading = mixSlots(Array(50).fill(3)); // 50 tests of three passages
  const listening = mixSlots(Array(35).fill(4)); // 35 tests of four parts

  it("has every test whole, exactly once, in the library's order", () => {
    for (const [pool, n] of [[reading, 50], [listening, 35]] as const) {
      expect(pool.filter((s) => s.part === null).map((s) => s.test)).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });

  it("is mostly full tests, with parts mixed through every list a visitor sees", () => {
    for (const pool of [reading, listening]) {
      for (const w of windows(pool, FREE_LIST_SIZE)) {
        const parts = w.filter((s) => s.part !== null).length;
        expect(parts).toBeGreaterThanOrEqual(5);
        expect(w.length - parts).toBeGreaterThan(parts * 1.5);
      }
    }
  });

  it("never lists a part beside its own full test", () => {
    for (const pool of [reading, listening]) {
      for (const w of windows(pool, FREE_LIST_SIZE)) {
        const whole = new Set(w.filter((s) => s.part === null).map((s) => s.test));
        expect(w.filter((s) => s.part !== null && whole.has(s.test))).toEqual([]);
      }
    }
  });

  it("uses every part of the exam, and only parts that exist", () => {
    expect(new Set(reading.flatMap((s) => (s.part ? [s.part] : [])))).toEqual(new Set([1, 2, 3]));
    expect(new Set(listening.flatMap((s) => (s.part ? [s.part] : [])))).toEqual(new Set([1, 2, 3, 4]));
  });

  it("never repeats an entry", () => {
    for (const pool of [reading, listening]) {
      expect(new Set(pool.map((s) => `${s.test}:${s.part}`)).size).toBe(pool.length);
    }
  });

  it("skips a part from a test that has none, and admits an empty library", () => {
    const pool = mixSlots([3, 0, 3, 0]);
    expect(pool.filter((s) => s.part !== null).every((s) => s.test % 2 === 0)).toBe(true);
    expect(mixSlots([])).toEqual([]);
  });
});
