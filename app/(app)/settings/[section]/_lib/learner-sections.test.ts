import { describe, expect, it } from "vitest";

import { LEARNER_SECTIONS, resolveLearnerSection } from "./learner-sections";

describe("learner settings sections", () => {
  it("lists account, study goal, appearance, billing and delete, in that order", () => {
    expect(LEARNER_SECTIONS.map((s) => s.key)).toEqual([
      "account",
      "goal",
      "appearance",
      "billing",
      "delete",
    ]);
  });

  // Delete stays last wherever the list grows: it is the only destructive one,
  // and a reader scanning the nav should meet it after everything they came for.
  it("keeps the destructive section last", () => {
    expect(LEARNER_SECTIONS.at(-1)?.key).toBe("delete");
  });

  it("resolves only the sections that exist", () => {
    expect(resolveLearnerSection("goal")).toBe("goal");
    expect(resolveLearnerSection("delete")).toBe("delete");
    // A console section name must not resolve here.
    expect(resolveLearnerSection("subjects")).toBeNull();
    expect(resolveLearnerSection("")).toBeNull();
  });
});
