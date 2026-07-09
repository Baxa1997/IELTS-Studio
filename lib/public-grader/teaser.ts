/**
 * Shapes the FULL internal grade into the public result the anonymous visitor
 * sees. The public grader now shows the SAME per-criterion feedback as the internal
 * writing studio — overall band, band-with-fixes, the score blocker, and for each
 * criterion the band, the evidence, what caps it, and the fix. What still requires a
 * free account is the DEEPER coaching loop: sentence-level marked-up fixes on the
 * essay, the "Write it better" model answer, the revision loop (rewrite + re-grade),
 * progress history, and Reading/Listening. Pure module — no I/O — so it's trivially
 * testable.
 */

import type { Criterion, EssayGrade } from "@/lib/ai/schema";

export interface TeaserCriterion {
  key: Criterion;
  label: string;
  band: number;
  evidence: string;
  whatCapsIt: string;
  fix: string;
}

export interface PublicTeaser {
  overallBand: number;
  bandWithFixes: number;
  /** The one criterion holding the band back (matches the internal "Fix this first"). */
  blocker: { criterion: Criterion; why: string };
  criteria: TeaserCriterion[];
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

export function toPublicTeaser(grade: EssayGrade): PublicTeaser {
  const criteria: TeaserCriterion[] = CRITERION_ORDER.map((key) => ({
    key,
    label: CRITERION_LABEL[key],
    band: grade.criteria[key].band,
    evidence: grade.criteria[key].evidence,
    whatCapsIt: grade.criteria[key].what_caps_it,
    fix: grade.criteria[key].fix,
  }));

  return {
    overallBand: grade.overall_band,
    bandWithFixes: grade.band_with_fixes,
    blocker: grade.score_blocker,
    criteria,
    model: grade.model,
    disclaimer: grade.disclaimer,
  };
}
