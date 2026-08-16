import { describe, expect, it } from "vitest";

import { weakestCriteria } from "./criteria";

/**
 * The tie-breaking bug, pinned.
 *
 * The old rule kept the first strict minimum from `Object.entries`, and the
 * grader always writes its criteria in the order CC, LR, TR, GRA. So every tie
 * silently resolved to Coherence & Cohesion, and on the real corpus that
 * produced "Coherence & Cohesion is the lowest criterion for 20 of 22
 * students" — printed at the top of Results as the single thing worth teaching
 * next. It was a fact about JSON key order.
 *
 * These tests exist because that failure was SILENT AND CONFIDENT: no error, no
 * empty state, just a plausible sentence that happened to be false. The only
 * thing that catches its return is a test that knows what key order the grader
 * uses — which is also why the function had to leave `reports.ts`, a
 * `server-only` module a test cannot import at all.
 */

/** The exact order the grader stores — the whole bug lived in this. */
const graderOrder = (cc: number, lr: number, tr: number, gra: number) => ({
  CC: { band: cc },
  LR: { band: lr },
  TR: { band: tr },
  GRA: { band: gra },
});

describe("weakestCriteria", () => {
  it("names nothing when every criterion ties", () => {
    // 49 of 76 real gradings look like this. A uniformly 5.0 essay has no weak
    // spot; naming one invents a finding.
    expect(weakestCriteria(graderOrder(5, 5, 5, 5))).toEqual([]);
    expect(weakestCriteria(graderOrder(6.5, 6.5, 6.5, 6.5))).toEqual([]);
  });

  it("does not favour whichever key is stored first", () => {
    // The regression itself: CC leads the object, so the old rule returned it.
    // Here CC ties with LR and TR at 5.0 while GRA is higher — three are
    // capping, and CC is not special among them.
    const caps = weakestCriteria(graderOrder(5, 5, 5, 6));
    expect(caps).toHaveLength(3);
    expect(caps).toContain("Coherence & Cohesion");
    expect(caps).toContain("Lexical Resource");
    expect(caps).toContain("Task Response");
    expect(caps).not.toContain("Grammatical Range & Accuracy");
  });

  it("names the one criterion that is genuinely lowest", () => {
    expect(weakestCriteria(graderOrder(6, 6, 6, 5))).toEqual([
      "Grammatical Range & Accuracy",
    ]);
    // ...including when it is the first key, which must still work.
    expect(weakestCriteria(graderOrder(4.5, 6, 6, 6))).toEqual(["Coherence & Cohesion"]);
  });

  it("returns every criterion at the minimum, not just one", () => {
    // An essay held back equally by two things is held back by two things, and
    // a teacher planning a lesson needs to know it is both.
    const caps = weakestCriteria(graderOrder(5, 5, 6.5, 6));
    expect(caps.sort()).toEqual(["Coherence & Cohesion", "Lexical Resource"]);
  });

  it("ignores criteria with no band rather than treating them as zero", () => {
    const caps = weakestCriteria({
      CC: { band: 6 },
      LR: {},
      TR: { band: 5 },
      GRA: { band: 6 },
    });
    expect(caps).toEqual(["Task Response"]);
  });

  it("says nothing at all from a single criterion", () => {
    // One number cannot be lower than the others when there are no others.
    expect(weakestCriteria({ CC: { band: 4 } })).toEqual([]);
    expect(weakestCriteria({})).toEqual([]);
  });

  it("handles Task 1's Task Achievement as well as Task 2's Task Response", () => {
    const caps = weakestCriteria({
      CC: { band: 6 },
      LR: { band: 6 },
      TA: { band: 5 },
      GRA: { band: 6 },
    });
    expect(caps).toEqual(["Task Achievement"]);
  });
});
