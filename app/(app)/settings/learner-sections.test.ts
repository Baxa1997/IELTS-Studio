import { describe, expect, it } from "vitest";

import { LEARNER_SECTIONS, resolveLearnerSection } from "./learner-sections";

describe("learner settings sections", () => {
  it("lists account, study goal, billing and delete, in that order", () => {
    expect(LEARNER_SECTIONS.map((s) => s.key)).toEqual(["account", "goal", "billing", "delete"]);
  });

  it("resolves only the sections that exist", () => {
    expect(resolveLearnerSection("goal")).toBe("goal");
    expect(resolveLearnerSection("delete")).toBe("delete");
    // A console section name must not resolve here.
    expect(resolveLearnerSection("subjects")).toBeNull();
    expect(resolveLearnerSection("")).toBeNull();
  });
});
