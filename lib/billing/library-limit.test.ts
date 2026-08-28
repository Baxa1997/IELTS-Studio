import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PLAN_ORDER, PLAN_TIERS, planTier } from "./plans";

/**
 * The free shelf: how many ready-made practices a learner may open.
 *
 * ⚠️ THE NUMBER LIVES IN TWO CODEBASES. Reading is gated in this repo
 * (lib/quota.ts, enforced in the two /api/reading/library routes); listening is
 * gated in the engine, because the browser calls that service directly and
 * nothing here is on the path. Two enforcement points, ONE promise to the
 * learner — "10 free practices". A learner who gets 10 reading and 5 listening
 * does not read that as two features with two limits; they read it as broken.
 *
 * So the engine's constant is asserted from here. It is the only place the two
 * numbers can be compared, and they have already drifted once.
 */
describe("the free library shelf", () => {
  it("gives the free tier a finite shelf", () => {
    expect(PLAN_TIERS.trial.libraryLimit).toBe(10);
  });

  it("gives every paid tier the whole library", () => {
    for (const plan of PLAN_ORDER.filter((p) => p !== "trial")) {
      expect(planTier(plan).libraryLimit, `${plan} should be unlimited`).toBeNull();
    }
  });

  it("agrees with the engine's FREE_LIBRARY_LIMIT for listening", () => {
    // Read across the repo boundary rather than restating the number: a copy
    // here would pass while the engine served something else, which is exactly
    // the failure this test exists to catch.
    const enginePath = new URL("../../../ielts-ai-engine/listening/service.py", import.meta.url);
    let source: string;
    try {
      source = readFileSync(fileURLToPath(enginePath), "utf8");
    } catch {
      // The engine is a separate checkout and may not be beside this one (CI).
      // Skipping is honest; asserting a number we cannot see is not.
      return;
    }
    const m = /^FREE_LIBRARY_LIMIT\s*=\s*(\d+)/m.exec(source);
    expect(m, "FREE_LIBRARY_LIMIT not found in the engine").not.toBeNull();
    expect(Number(m![1])).toBe(PLAN_TIERS.trial.libraryLimit);
  });

  it("keeps the shelf separate from the generation quota", () => {
    // Different costs, deliberately different numbers: generating burns a model
    // call, opening a library item is a row copy. Collapsing them into one
    // number is how the shelf silently became 5 again.
    expect(PLAN_TIERS.trial.libraryLimit).not.toBe(PLAN_TIERS.trial.generateLimit);
  });
});
