import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { AttemptRow } from "@/lib/dashboard/compute";

import { FOCUSABLE_TYPES, MIN_ATTEMPTED, weakSpot } from "./weak-spot";

const attempt = (breakdown: Record<string, { attempted: number; correct: number }>): AttemptRow => ({
  band: 6,
  type_breakdown: breakdown,
  submitted_at: "2026-11-14T10:00:00Z",
  created_at: "2026-11-14T10:00:00Z",
});

describe("the reading weak spot", () => {
  it("names the least accurate type once there is enough evidence", () => {
    const spot = weakSpot([
      attempt({ true_false_not_given: { attempted: 5, correct: 2 }, multiple_choice: { attempted: 5, correct: 4 } }),
      attempt({ true_false_not_given: { attempted: 5, correct: 2 }, multiple_choice: { attempted: 5, correct: 5 } }),
    ]);
    expect(spot).toMatchObject({ type: "true_false_not_given", attempted: 10, correct: 4 });
  });

  it("says nothing on thin evidence — one bad passage is not a pattern", () => {
    expect(weakSpot([attempt({ true_false_not_given: { attempted: MIN_ATTEMPTED - 1, correct: 0 } })])).toBeNull();
    expect(weakSpot([])).toBeNull();
  });

  it("says nothing when the weakest type is still strong", () => {
    expect(weakSpot([attempt({ multiple_choice: { attempted: 10, correct: 9 } })])).toBeNull();
  });

  /**
   * THE BROKEN PROMISE THIS PREVENTS. The engine cannot build a single passage
   * around matching headings, and it ignores a focus it cannot honour — so a
   * card offering it would generate an ordinary passage under a false label.
   */
  it("never names a type the engine cannot build a passage around", () => {
    const spot = weakSpot([
      attempt({ matching_headings: { attempted: 20, correct: 1 }, summary_completion: { attempted: 10, correct: 5 } }),
    ]);
    expect(spot?.type).toBe("summary_completion");
    expect(weakSpot([attempt({ matching_headings: { attempted: 20, correct: 1 } })])).toBeNull();
  });

  it("agrees with the engine about which types can be focused", () => {
    // Read across the repo boundary, as lib/billing/library-limit.test.ts does:
    // a copy of the engine's list here would pass while the engine did otherwise.
    let source: string;
    try {
      source = readFileSync(
        fileURLToPath(new URL("../../../ielts-ai-engine/reading/types.py", import.meta.url)),
        "utf8",
      );
    } catch {
      return; // The engine is a separate checkout and may not be beside this one.
    }
    const block = /^READING_TYPE_SETS[^=]*=\s*\[([\s\S]*?)^\]/m.exec(source);
    expect(block, "READING_TYPE_SETS not found in the engine").not.toBeNull();
    const engine = new Set([...block![1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]));
    expect([...engine].sort()).toEqual([...FOCUSABLE_TYPES].sort());
  });
});
