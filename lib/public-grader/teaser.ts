/**
 * Depth-cap for the public grader — turns the FULL internal grade into the slim
 * preview the anonymous visitor is allowed to see.
 *
 * The free preview deliberately gives the WHAT, not the WHY:
 *   - shows  → overall band, each criterion's band, and the top 3 fixes
 *   - hides  → per-criterion `evidence` (the proving quotes), `what_caps_it` (the
 *              gap analysis), `band_with_fixes` (the achievable target), the
 *              revision loop, history and Reading.
 *
 * That withheld depth is exactly the coaching loop you sign up for. Pure module —
 * no I/O — so it's trivially testable.
 */

import type { Criterion, EssayGrade } from "@/lib/ai/schema";

export interface TeaserCriterion {
  key: Criterion;
  label: string;
  band: number;
}

export interface TeaserFix {
  criterion: Criterion;
  label: string;
  /** The single highest-value next move for this criterion (the `fix` field). */
  fix: string;
}

export interface PublicTeaser {
  overallBand: number;
  criteria: TeaserCriterion[];
  /** At most 3 — the weakest criteria first. */
  topFixes: TeaserFix[];
  model: string;
  disclaimer: string;
}

const CRITERION_ORDER: Criterion[] = ["TR", "CC", "LR", "GRA"];

const CRITERION_LABEL: Record<Criterion, string> = {
  TR: "Task Response",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammar Range & Accuracy",
};

const MAX_FIXES = 3;

export function toPublicTeaser(grade: EssayGrade): PublicTeaser {
  const criteria: TeaserCriterion[] = CRITERION_ORDER.map((key) => ({
    key,
    label: CRITERION_LABEL[key],
    band: grade.criteria[key].band,
  }));

  // Top 3 fixes = the weakest criteria first, so the highest-value moves surface.
  // Stable sort keeps the canonical order on ties.
  const topFixes: TeaserFix[] = [...criteria]
    .sort((a, b) => a.band - b.band)
    .slice(0, MAX_FIXES)
    .map(({ key, label }) => ({ criterion: key, label, fix: grade.criteria[key].fix }));

  return {
    overallBand: grade.overall_band,
    criteria,
    topFixes,
    model: grade.model,
    disclaimer: grade.disclaimer,
  };
}
