/**
 * The arithmetic behind the two score calculators, kept apart from the screens
 * so a test can hold every number to its source.
 *
 * TWO EXAMS, TWO PUBLISHERS, AND EVERY TABLE HERE NAMES WHICH ONE IT CAME FROM.
 * IELTS: ielts.org, "IELTS scoring in detail" (the rounding rule, the averages
 * for Bands 5–8) and IDP's band score pages (the full Listening table).
 * Multilevel: the Knowledge Assessment Agency's "Baholash mezonlari" for the
 * multilevel format, adopted 16 March 2023 (uzbmb.uz/upload/file/pdf/Multilevel-bm.pdf).
 *
 * ⚠️ THESE ARE THE EXAMS' RULES, NOT OURS. The grader rounds DOWN when an answer
 * sits between two bands (CLAUDE.md, principle 2). The IELTS overall band rounds
 * an exact quarter UP. Making this file "conservative" would make it wrong: a
 * calculator that disagrees with the candidate's own Test Report Form is the one
 * thing nobody forgives it.
 */

/* ── IELTS ─────────────────────────────────────────────────────────────── */

export type IeltsSkill = "listening" | "reading" | "writing" | "speaking";
export const IELTS_SKILLS: readonly IeltsSkill[] = ["listening", "reading", "writing", "speaking"];

/** The bands a skill can be reported at, 1.0 to 9.0 in half bands. */
export const SKILL_BANDS: readonly number[] = Array.from({ length: 17 }, (_, i) => 1 + i / 2);

/**
 * The overall band: the average of the four, to the nearest half band, with an
 * exact quarter rounding UP — 6.25 is 6.5 and 6.75 is 7.0 (ielts.org's own
 * examples: 6.25 → 6.5, 3.875 → 4.0, 6.125 → 6.0).
 *
 * `Math.round` rounds a tie up for positive numbers, which is exactly the rule,
 * and the averages are exact in binary (multiples of 1/8), so no epsilon.
 */
export function overallBand(bands: readonly number[]): number {
  return Math.round(averageBand(bands) * 2) / 2;
}

export function averageBand(bands: readonly number[]): number {
  return bands.reduce((a, b) => a + b, 0) / bands.length;
}

/** Which of the rounding rules an average falls under — what the page says to
 *  explain the band. Averages of four half bands end in .0, .125, .25 … .875. */
export type RoundingRule = "exact" | "upQuarter" | "upThreeQuarters" | "nearest";

export function roundingRule(average: number): RoundingRule {
  const fraction = average % 1;
  if (fraction === 0 || fraction === 0.5) return "exact";
  if (fraction === 0.25) return "upQuarter";
  if (fraction === 0.75) return "upThreeQuarters";
  return "nearest";
}

/**
 * The smallest raise in ONE skill that lifts the overall band by half a band,
 * or null when it is 9 already or no single skill can do it. Ties go to the
 * weakest skill: the next half band there is usually the cheapest to earn.
 */
export function nextHalfBand(
  bands: Record<IeltsSkill, number>,
): { skill: IeltsSkill; raise: number; overall: number } | null {
  const now = overallBand(IELTS_SKILLS.map((s) => bands[s]));
  if (now >= 9) return null;
  let best: { skill: IeltsSkill; raise: number; overall: number } | null = null;
  for (const skill of IELTS_SKILLS) {
    for (let raise = 0.5; bands[skill] + raise <= 9; raise += 0.5) {
      const overall = overallBand(IELTS_SKILLS.map((s) => (s === skill ? bands[s] + raise : bands[s])));
      if (overall > now) {
        const better =
          !best || raise < best.raise || (raise === best.raise && bands[skill] < bands[best.skill]);
        if (better) best = { skill, raise, overall };
        break;
      }
    }
  }
  return best;
}

export type RawTable = "listening" | "academicReading" | "generalReading";

/**
 * Correct answers out of 40 → band, as `[fewest correct answers, band]`,
 * highest band first.
 *
 * - LISTENING is IDP's published table, row for row (11–12 is Band 4; it shows
 *   nothing lower).
 * - READING: IELTS publishes only the averages — Academic 15/23/30/35 for Bands
 *   5/6/7/8, General Training 15/23/30/35 for Bands 4/5/6/7 — and every row
 *   below lands exactly on those. The half bands between them are the widely
 *   used estimates, and where two estimates disagree the lower band is taken.
 *
 * ⚠️ General Training needs 35 for Band 7, not the 34 in tables that circulate:
 * 35 is the figure IELTS itself prints. `scores.test.ts` pins every published
 * average, so a "fix" from a third-party table goes red.
 */
export const RAW_TABLES: Record<RawTable, readonly (readonly [number, number])[]> = {
  listening: [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [11, 4]],
  academicReading: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4]],
  generalReading: [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [35, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4]],
};

/** The band for a raw score, or null below the lowest row a table gives. */
export function rawToBand(table: RawTable, correct: number): number | null {
  for (const [min, band] of RAW_TABLES[table]) if (correct >= min) return band;
  return null;
}

/** Each band's range of correct answers, for the tables on the page. */
export function rawRanges(table: RawTable): { from: number; to: number; band: number }[] {
  const rows = RAW_TABLES[table];
  return rows.map(([min, band], i) => ({ from: min, to: i === 0 ? 40 : rows[i - 1][0] - 1, band }));
}

export type CefrLevel = "C2" | "C1" | "B2" | "B1";

/**
 * IELTS band → CEFR level, as IELTS maps them: C2 from 8.5, C1 from 7.0, B2
 * from 5.5, B1 from 4.0. IELTS's own caveat travels with it on the page: 8.0 is
 * borderline C2, and many 6.5 candidates are already C1 — a guide, not an
 * equation.
 */
export const IELTS_CEFR: readonly { level: CefrLevel; from: number; to: number }[] = [
  { level: "C2", from: 8.5, to: 9 },
  { level: "C1", from: 7, to: 8 },
  { level: "B2", from: 5.5, to: 6.5 },
  { level: "B1", from: 4, to: 5 },
];

export function ieltsToCefr(band: number): CefrLevel | null {
  return IELTS_CEFR.find((r) => band >= r.from)?.level ?? null;
}

/* ── Multilevel ────────────────────────────────────────────────────────── */

export type MultilevelSection = "listening" | "reading" | "writing" | "speaking";
export const MULTILEVEL_SECTIONS: readonly MultilevelSection[] = ["listening", "reading", "writing", "speaking"];

/** Every section is scored out of 75: the format has no C2 tasks, so the
 *  agency stops the 100-point standard scale at 75. */
export const MULTILEVEL_MAX = 75;

export type MultilevelLevel = "C1" | "B2" | "B1" | "belowB1";

/** The levels by average score, highest first — the agency's table, with the
 *  approximate correct answers (of 35) it prints beside each. */
export const MULTILEVEL_LEVELS: readonly { level: MultilevelLevel; from: number; to: number; correct: [number, number] }[] = [
  { level: "C1", from: 65, to: 75, correct: [28, 35] },
  { level: "B2", from: 51, to: 64, correct: [18, 27] },
  { level: "B1", from: 38, to: 50, correct: [10, 17] },
  { level: "belowB1", from: 0, to: 37, correct: [0, 9] },
];

export type MultilevelBand = (typeof MULTILEVEL_LEVELS)[number];

export function multilevelLevel(score: number): MultilevelLevel {
  return MULTILEVEL_LEVELS.find((l) => score >= l.from)?.level ?? "belowB1";
}

export type MultilevelResult =
  | { kind: "level"; average: number; level: MultilevelLevel }
  | { kind: "borderline"; average: number; below: MultilevelBand; above: MultilevelBand };

/**
 * The level for four section scores. The agency averages the four; it does not
 * say how an average between two whole numbers is rounded, so an average that
 * falls BETWEEN two levels' ranges (50.25 is above B1's 50 and below B2's 51)
 * is reported as borderline instead of being decided by a rule we would have
 * had to invent.
 */
export function multilevelResult(scores: readonly number[]): MultilevelResult {
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  for (let i = 0; i < MULTILEVEL_LEVELS.length - 1; i++) {
    const above = MULTILEVEL_LEVELS[i];
    const below = MULTILEVEL_LEVELS[i + 1];
    if (average > below.to && average < above.from) return { kind: "borderline", average, below, above };
  }
  return { kind: "level", average, level: multilevelLevel(average) };
}

/**
 * The next level up and the points it takes, summed over the four sections —
 * the first threshold the AVERAGE has not reached, so a borderline 50.25 is
 * told what makes B2 certain (51 × 4 − 201 = 3). Null at C1, the top.
 */
export function multilevelNext(scores: readonly number[]): { level: MultilevelLevel; points: number } | null {
  const sum = scores.reduce((a, b) => a + b, 0);
  const next = [...MULTILEVEL_LEVELS].reverse().find((l) => l.from > sum / scores.length);
  return next ? { level: next.level, points: next.from * scores.length - sum } : null;
}

/** The level a number of correct answers (of 35) usually means — the agency's
 *  own approximate column, since the real points come from a Rasch model and
 *  move from session to session. */
export function multilevelLevelFromCorrect(correct: number): MultilevelLevel {
  return MULTILEVEL_LEVELS.find((l) => correct >= l.correct[0])?.level ?? "belowB1";
}

/** Writing: Task 1 is 12 of the 36 marks, Task 2 the other 24. */
export const WRITING_TASK_MAX = { task1: 12, task2: 24 } as const;
export const RATER_MAX = 36;

/**
 * Writing and Speaking: the raters' average mark (0–36) → the score out of 75,
 * the agency's table as printed, `[lowest mark, highest mark, score]`. Each row
 * runs from just above the row below it to its upper bound, so 20.25 is in
 * 20.1–20.5 and scores 50.
 */
export const RATER_SCALE: readonly (readonly [number, number, number])[] = [
  [35.1, 36.0, 75], [34.1, 35.0, 74], [33.1, 34.0, 73], [32.6, 33.0, 72], [32.1, 32.5, 71],
  [31.6, 32.0, 70], [31.1, 31.5, 69], [30.6, 31.0, 68], [30.1, 30.5, 67], [29.1, 30.0, 66],
  [28.1, 29.0, 65], [27.1, 28.0, 64], [26.6, 27.0, 63], [26.1, 26.5, 62], [25.6, 26.0, 61],
  [25.1, 25.5, 60], [24.6, 25.0, 59], [24.1, 24.5, 58], [23.6, 24.0, 57], [23.1, 23.5, 56],
  [22.6, 23.0, 55], [22.1, 22.5, 54], [21.6, 22.0, 53], [21.1, 21.5, 52], [20.6, 21.0, 51],
  [20.1, 20.5, 50], [19.6, 20.0, 49], [19.1, 19.5, 48], [18.6, 19.0, 47], [18.1, 18.5, 46],
  [17.6, 18.0, 45], [17.1, 17.5, 44], [16.6, 17.0, 43], [16.1, 16.5, 42], [15.6, 16.0, 41],
  [15.1, 15.5, 40], [14.6, 15.0, 39], [14.1, 14.5, 38], [13.6, 14.0, 37], [13.1, 13.5, 36],
  [12.6, 13.0, 35], [12.1, 12.5, 34], [11.6, 12.0, 33], [11.1, 11.5, 32], [10.6, 11.0, 31],
  [10.1, 10.5, 30], [9.6, 10.0, 29], [9.1, 9.5, 28], [8.6, 9.0, 27], [8.1, 8.5, 26],
  [7.6, 8.0, 25], [7.1, 7.5, 24], [6.6, 7.0, 23], [6.1, 6.5, 22], [5.6, 6.0, 21],
  [5.1, 5.5, 20], [4.6, 5.0, 19], [4.1, 4.5, 18], [3.6, 4.0, 17], [3.1, 3.5, 16],
  [2.6, 3.0, 15], [2.1, 2.5, 14], [1.6, 2.0, 13], [1.1, 1.5, 12], [0.6, 1.0, 11],
  [0.1, 0.5, 10],
];

const RATER_ASCENDING = [...RATER_SCALE].reverse();

/** A rater mark (0–36) as a score out of 75; 0 stays 0. */
export function raterScore(mark: number): number {
  if (mark <= 0) return 0;
  // From the lowest row up: the first whose upper bound reaches the mark holds it.
  for (const [, high, score] of RATER_ASCENDING) if (mark <= high) return score;
  return MULTILEVEL_MAX;
}
