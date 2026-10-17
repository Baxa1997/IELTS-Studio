/**
 * The calculators' arithmetic, held to the numbers the two exams publish.
 *
 * A score calculator is only worth anything if it agrees with the result the
 * candidate is later handed, so every case here is a figure from a source —
 * ielts.org's worked examples and averages, IDP's Listening table, the
 * Assessment Agency's 2023 scoring criteria — and not a value this file
 * happens to produce.
 */

import { describe, expect, it } from "vitest";

import {
  IELTS_CEFR,
  RATER_MAX,
  RATER_SCALE,
  RAW_TABLES,
  WRITING_TASK_MAX,
  ieltsToCefr,
  multilevelLevel,
  multilevelLevelFromCorrect,
  multilevelNext,
  multilevelResult,
  nextHalfBand,
  overallBand,
  rawRanges,
  rawToBand,
  raterScore,
  roundingRule,
  type MultilevelResult,
  type RawTable,
} from "./scores";

describe("the IELTS overall band", () => {
  it("rounds the way ielts.org's own examples do", () => {
    expect(overallBand([6.5, 6.5, 5.0, 7.0])).toBe(6.5); // 6.25: an exact quarter rounds UP
    expect(overallBand([4.0, 3.5, 4.0, 4.0])).toBe(4.0); // 3.875
    expect(overallBand([6.5, 6.5, 5.5, 6.0])).toBe(6.0); // 6.125
  });

  it("rounds .75 up to the next whole band, and is not 'conservative' about it", () => {
    // The grader rounds down between bands; the exam does not. This file
    // reproduces the exam.
    expect(overallBand([6.5, 7.0, 7.0, 6.5])).toBe(7.0); // 6.75
    expect(overallBand([7.0, 6.5, 6.5, 6.5])).toBe(6.5); // 6.625
    expect(overallBand([7.0, 7.0, 7.0, 6.5])).toBe(7.0); // 6.875
  });

  it("names the rule each average falls under, as the page explains it", () => {
    expect([6, 6.5, 6.25, 6.75, 6.125, 6.375, 6.625, 6.875].map(roundingRule)).toEqual([
      "exact", "exact", "upQuarter", "upThreeQuarters", "nearest", "nearest", "nearest", "nearest",
    ]);
  });

  it("names the cheapest half band to chase, in the weakest skill on a tie", () => {
    expect(nextHalfBand({ listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6.0 })).toEqual({
      skill: "writing",
      raise: 0.5,
      overall: 6.5,
    });
    expect(nextHalfBand({ listening: 9, reading: 9, writing: 9, speaking: 9 })).toBeNull();
  });
});

describe("correct answers to an IELTS band", () => {
  // ielts.org, "IELTS scoring in detail": the average marks out of 40 for each band.
  const PUBLISHED: Record<RawTable, [number, number][]> = {
    listening: [[16, 5], [23, 6], [30, 7], [35, 8]],
    academicReading: [[15, 5], [23, 6], [30, 7], [35, 8]],
    generalReading: [[15, 4], [23, 5], [30, 6], [35, 7]],
  };

  it.each(Object.entries(PUBLISHED))("lands on every average IELTS publishes (%s)", (table, rows) => {
    for (const [correct, band] of rows) {
      expect(rawToBand(table as RawTable, correct), `${correct} correct`).toBe(band);
      // ...and one fewer is not enough: the published figure is the threshold.
      expect(rawToBand(table as RawTable, correct - 1) ?? 0, `${correct - 1} correct`).toBeLessThan(band);
    }
  });

  it("asks 35, not 34, for Band 7 in General Training Reading", () => {
    // The tables that circulate say 34; IELTS prints 35. See RAW_TABLES.
    expect(rawToBand("generalReading", 34)).toBe(6.5);
    expect(rawToBand("generalReading", 35)).toBe(7);
  });

  it("is IDP's Listening table row for row", () => {
    expect(rawRanges("listening").map((r) => `${r.from}-${r.to}:${r.band}`)).toEqual([
      "39-40:9", "37-38:8.5", "35-36:8", "32-34:7.5", "30-31:7", "26-29:6.5",
      "23-25:6", "18-22:5.5", "16-17:5", "13-15:4.5", "11-12:4",
    ]);
    expect(rawToBand("listening", 10)).toBeNull();
  });

  it.each(Object.keys(RAW_TABLES))("never gives fewer answers a higher band (%s)", (table) => {
    let last = Infinity;
    for (let correct = 40; correct >= 0; correct--) {
      const band = rawToBand(table as RawTable, correct) ?? 0;
      expect(band).toBeLessThanOrEqual(last);
      last = band;
    }
    expect(rawToBand(table as RawTable, 40)).toBe(9);
  });
});

describe("IELTS bands and CEFR levels", () => {
  it("follows the IELTS mapping", () => {
    expect([9, 8.5, 8, 7, 6.5, 5.5, 5, 4, 3.5].map(ieltsToCefr)).toEqual([
      "C2", "C2", "C1", "C1", "B2", "B2", "B1", "B1", null,
    ]);
    expect(IELTS_CEFR.map((r) => r.level)).toEqual(["C2", "C1", "B2", "B1"]);
  });
});

describe("the Multilevel level", () => {
  it("uses the agency's thresholds on the average of the four sections", () => {
    expect([75, 65, 64, 51, 50, 38, 37, 0].map(multilevelLevel)).toEqual([
      "C1", "C1", "B2", "B2", "B1", "B1", "belowB1", "belowB1",
    ]);
    expect(multilevelResult([60, 70, 65, 65])).toEqual({ kind: "level", average: 65, level: "C1" });
  });

  it("calls an average between two levels borderline instead of inventing a rounding rule", () => {
    const pair = (r: MultilevelResult) => (r.kind === "borderline" ? [r.below.level, r.above.level] : r.level);
    expect(multilevelResult([50, 50, 50, 51]).average).toBe(50.25);
    expect(pair(multilevelResult([50, 50, 50, 51]))).toEqual(["B1", "B2"]);
    expect(pair(multilevelResult([37, 38, 38, 38]))).toEqual(["belowB1", "B1"]);
    expect(pair(multilevelResult([64, 65, 64, 65]))).toEqual(["B2", "C1"]);
    expect(pair(multilevelResult([50, 50, 50, 50]))).toBe("B1");
  });

  it("counts the points to the next level over all four sections", () => {
    // A borderline 50.25 is told what makes B2 certain, not what rounds to it.
    expect(multilevelNext([50, 50, 50, 51])).toEqual({ level: "B2", points: 3 });
    expect(multilevelNext([37, 38, 38, 38])).toEqual({ level: "B1", points: 1 });
    expect(multilevelNext([58, 61, 52, 57])).toEqual({ level: "C1", points: 32 });
    expect(multilevelNext([0, 0, 0, 0])).toEqual({ level: "B1", points: 152 });
    expect(multilevelNext([65, 65, 65, 65])).toBeNull();
  });

  it("reads correct answers with the agency's approximate column", () => {
    expect([35, 28, 27, 18, 17, 10, 9, 0].map(multilevelLevelFromCorrect)).toEqual([
      "C1", "C1", "B2", "B2", "B1", "B1", "belowB1", "belowB1",
    ]);
  });
});

describe("Multilevel Writing and Speaking marks", () => {
  it("converts with the agency's printed table", () => {
    const cases: [number, number][] = [
      [36, 75], [35.5, 75], [35, 74], [34.1, 74], [34, 73], [33, 72], [32.5, 71],
      [30, 66], [29, 65], [28, 64], [27, 63], [26.5, 62], [20.25, 50], [20, 49],
      [14.5, 38], [1, 11], [0.5, 10], [0, 0],
    ];
    for (const [mark, score] of cases) expect(raterScore(mark), `mark ${mark}`).toBe(score);
  });

  it("has no gap and no overlap between rows", () => {
    for (let i = 0; i < RATER_SCALE.length - 1; i++) {
      const [low] = RATER_SCALE[i];
      const [, highBelow, scoreBelow] = RATER_SCALE[i + 1];
      expect(Math.round((low - highBelow) * 10) / 10, `row ${RATER_SCALE[i].join("–")}`).toBe(0.1);
      expect(RATER_SCALE[i][2]).toBe(scoreBelow + 1);
    }
  });

  it("gives Task 2 twice Task 1's weight, out of the scale's 36", () => {
    expect(WRITING_TASK_MAX.task2).toBe(2 * WRITING_TASK_MAX.task1);
    expect(WRITING_TASK_MAX.task1 + WRITING_TASK_MAX.task2).toBe(RATER_MAX);
    expect(RATER_SCALE[0][1]).toBe(RATER_MAX);
  });
});
