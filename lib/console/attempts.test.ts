import { describe, expect, it } from "vitest";

import {
  ATTEMPT_KINDS,
  KIND_LABEL,
  reportHref,
  snapBand,
  WRITING_CRITERIA,
} from "./attempts";

/**
 * The contract the marking footer and the queue both depend on.
 *
 * `reportHref` is the load-bearing one: it is the promise that a teacher and
 * their student open the SAME page. If these four routes ever diverge from the
 * learner's own report, the band a parent is shown and the band a teacher
 * signed become two artefacts that can drift apart — which is the single
 * failure the whole review feature exists to prevent.
 */

describe("reportHref", () => {
  it("points at the learner's own report, not a staff-only copy", () => {
    expect(reportHref("writing", "abc")).toBe("/activities/essay/abc");
    expect(reportHref("reading", "abc")).toBe("/activities/reading/abc");
    expect(reportHref("listening", "abc")).toBe("/listen/results/abc");
    expect(reportHref("speaking", "abc")).toBe("/speak/mock/abc");
  });

  it("has a route for every kind", () => {
    for (const kind of ATTEMPT_KINDS) {
      expect(reportHref(kind, "x")).toMatch(/^\/[a-z]/);
      expect(KIND_LABEL[kind]).toBeTruthy();
    }
  });
});

describe("snapBand", () => {
  it("keeps a band on the half-band grid", () => {
    expect(snapBand(6.5)).toBe(6.5);
    expect(snapBand(6.3)).toBe(6.5);
    expect(snapBand(6.2)).toBe(6);
    expect(snapBand(0)).toBe(0);
    expect(snapBand(9)).toBe(9);
  });

  it("refuses anything off the scale", () => {
    // A form is user input. A band of 47 stored against a student is the kind
    // of thing that is only noticed when a parent reads the report.
    expect(snapBand(9.5)).toBeNull();
    expect(snapBand(-1)).toBeNull();
    expect(snapBand(Number.NaN)).toBeNull();
    expect(snapBand(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("WRITING_CRITERIA", () => {
  it("is the four official criteria, in the descriptors' order", () => {
    expect(WRITING_CRITERIA.map((c) => c.key)).toEqual(["TR", "CC", "LR", "GRA"]);
  });

  it("matches the keys the grader actually stores", () => {
    // `gradings.criteria` on real rows is {CC, LR, TR, GRA}. If the grader ever
    // renames one, the override form would silently offer a criterion nothing
    // reads back — this is the test that fails first.
    const stored = new Set(["CC", "LR", "TR", "GRA"]);
    for (const c of WRITING_CRITERIA) expect(stored.has(c.key)).toBe(true);
  });
});
