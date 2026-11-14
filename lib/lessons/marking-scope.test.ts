import { describe, expect, it } from "vitest";

import { modelMarksOpenAnswers } from "./marking-scope";

describe("who gets written lesson answers marked by a model", () => {
  it("always marks a centre student's homework", () => {
    expect(modelMarksOpenAnswers({ orgKind: "center", priorAttempts: 0 })).toBe(true);
    expect(modelMarksOpenAnswers({ orgKind: "center", priorAttempts: 7 })).toBe(true);
  });

  it("marks a solo learner's first hand-in of a lesson", () => {
    expect(modelMarksOpenAnswers({ orgKind: "personal", priorAttempts: 0 })).toBe(true);
  });

  /** The cost guard: nothing meters these calls, so a repeat must not make one. */
  it("does not mark a solo learner's repeat attempts", () => {
    expect(modelMarksOpenAnswers({ orgKind: "personal", priorAttempts: 1 })).toBe(false);
    expect(modelMarksOpenAnswers({ orgKind: "personal", priorAttempts: 12 })).toBe(false);
  });
});
