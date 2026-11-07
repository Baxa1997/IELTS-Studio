import { describe, expect, it } from "vitest";

import { billedOutputTokens, takesThinkingLevel, thinkingConfig, thinkingLevelFor } from "./thinking";

/**
 * gemini-4-argon 400s on `thinkingBudget` (measured 2026-11-07) while every
 * model running today still needs one. These pin both halves: Gemini 4 gets a
 * level, nothing that runs today changes.
 */

describe("which models take a thinking level", () => {
  it("is Gemini 4 and later", () => {
    for (const id of ["gemini-4-argon", "gemini-4-argon-cyber-permissive", "gemini-5-flash", "publishers/google/models/gemini-4-argon"]) {
      expect(takesThinkingLevel(id), id).toBe(true);
    }
  });

  it("is not a model that runs today, which would 400 without its budget", () => {
    for (const id of [
      "gemini-3.1-pro-preview",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-live-2.5-flash-native-audio",
      "claude-sonnet-5-5",
    ]) {
      expect(takesThinkingLevel(id), id).toBe(false);
    }
  });
});

describe("the thinking config a call sends", () => {
  it("keeps the budget, byte for byte, on the 3.x models", () => {
    expect(thinkingConfig("gemini-3.1-pro-preview", 2048)).toEqual({ thinkingBudget: 2048, includeThoughts: false });
    expect(thinkingConfig("gemini-3.5-flash", 0)).toEqual({ thinkingBudget: 0, includeThoughts: false });
  });

  it("sends a level, never a budget, to Gemini 4", () => {
    const grader = thinkingConfig("gemini-4-argon", 2048);
    expect(grader).toEqual({ thinkingLevel: "MEDIUM", includeThoughts: false });
    expect(grader).not.toHaveProperty("thinkingBudget");
  });

  it("never asks Gemini 4 for MINIMAL, which it also 400s", () => {
    for (const budget of [0, 1, 128, 1024, 1025, 2048, 8192, 8193, 32768]) {
      expect(["LOW", "MEDIUM", "HIGH"]).toContain(thinkingLevelFor(budget));
    }
    expect(thinkingConfig("gemini-4-argon", 0)).toEqual({ thinkingLevel: "LOW", includeThoughts: false });
  });

  it("maps a budget onto the level of the same intent", () => {
    expect(thinkingLevelFor(0)).toBe("LOW");
    expect(thinkingLevelFor(1024)).toBe("LOW");
    expect(thinkingLevelFor(2048)).toBe("MEDIUM");
    expect(thinkingLevelFor(8192)).toBe("MEDIUM");
    expect(thinkingLevelFor(8193)).toBe("HIGH");
  });

  it("leaves the model's default alone when the caller asked for none, or for dynamic", () => {
    expect(thinkingConfig("gemini-4-argon", undefined)).toBeUndefined();
    expect(thinkingConfig("gemini-3.5-flash", undefined)).toBeUndefined();
    expect(thinkingConfig("gemini-4-argon", -1)).toBeUndefined();
    expect(thinkingConfig("gemini-3.5-flash", -1)).toEqual({ thinkingBudget: -1, includeThoughts: false });
  });
});

describe("billed output tokens", () => {
  it("count the thinking as well as the answer", () => {
    // The 2026-11-07 probe: 3.5-flash answered in 417 tokens after 2,232 of thought.
    expect(billedOutputTokens({ candidatesTokenCount: 417, thoughtsTokenCount: 2232 })).toBe(2649);
  });

  it("are the answer alone when the model did not think", () => {
    expect(billedOutputTokens({ candidatesTokenCount: 252 })).toBe(252);
  });

  it("are unknown, not zero, when the response carried no counts", () => {
    expect(billedOutputTokens(undefined)).toBeUndefined();
    expect(billedOutputTokens({})).toBeUndefined();
  });
});
