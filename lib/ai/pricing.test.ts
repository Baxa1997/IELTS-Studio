import { describe, expect, it } from "vitest";

import { estimateCostUsd, rateForModel } from "./pricing";

const at = (iso: string) => new Date(iso);

describe("model rates", () => {
  it("know Gemini 4 Argon instead of billing it at the silent fallback", () => {
    // The fallback is { input: 0.5, output: 2 } — a fifth of Argon's output rate.
    expect(rateForModel("gemini-4-argon", at("2026-11-07T12:00:00Z"))).toEqual({ input: 2, output: 10 });
  });

  it("switch to an announced price on its date, without anyone editing the table", () => {
    expect(rateForModel("gemini-4-argon", at("2026-11-30T23:59:59Z"))).toEqual({ input: 2, output: 10 });
    expect(rateForModel("gemini-4-argon", at("2026-12-01T00:00:00Z"))).toEqual({ input: 4, output: 20 });
    expect(rateForModel("gemini-3.6-flash", at("2026-12-31T23:59:59Z"))).toEqual({ input: 0.75, output: 3.75 });
    expect(rateForModel("gemini-3.6-flash", at("2027-01-01T00:00:00Z"))).toEqual({ input: 1.5, output: 7.5 });
  });

  it("still match the longest prefix", () => {
    expect(rateForModel("gemini-4-argon-cyber-permissive", at("2026-11-07T00:00:00Z"))).toEqual({ input: 2, output: 10 });
    expect(rateForModel("gemini-3.1-pro-preview")).toEqual({ input: 2, output: 12 });
    expect(rateForModel("gemini-3.6-flash", at("2026-11-07T00:00:00Z")).input).toBe(0.75);
  });
});

describe("estimated cost", () => {
  it("prices a call at the rate in force when it ran", () => {
    expect(estimateCostUsd("gemini-4-argon", 1_000_000, 100_000, at("2026-11-07T00:00:00Z"))).toBe(3);
    expect(estimateCostUsd("gemini-4-argon", 1_000_000, 100_000, at("2026-12-02T00:00:00Z"))).toBe(6);
  });

  it("stores nothing rather than a misleading zero", () => {
    expect(estimateCostUsd("gemini-4-argon", undefined, undefined)).toBeNull();
  });
});
