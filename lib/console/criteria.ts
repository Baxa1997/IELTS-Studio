/**
 * Which criterion is holding an essay back.
 *
 * Pure, and deliberately NOT `server-only`: this is the piece of `reports.ts`
 * that most needed a test and could not have one while it lived there.
 */

export const CRITERION_LABEL: Record<string, string> = {
  TR: "Task Response",
  TA: "Task Achievement",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammatical Range & Accuracy",
};

/**
 * The criteria that capped this essay — all of them, and none when they tie.
 *
 * WHAT THIS REPLACED, AND WHY IT MATTERED. The old version walked
 * `Object.entries` and kept the first strict minimum. The grader always writes
 * its criteria in the order CC, LR, TR, GRA — so every tie silently resolved to
 * Coherence & Cohesion.
 *
 * On the real corpus that produced "Coherence & Cohesion is the lowest
 * criterion for 20 of 22 students", printed at the top of Results as the single
 * thing worth teaching next. The truth on the same 76 gradings:
 *
 *     reported as capping by the old rule   CC 60, LR 12, GRA 3, TR 1
 *     STRICTLY lowest                       CC  2, GRA 3, LR 2, TR 1
 *     all four tied — nothing is capping    49
 *
 * It was a fact about JSON key order, not about anybody's writing, and it was
 * the most prominent sentence on the page. The failure was silent and
 * confident: no error, no empty state, just a plausible claim that was false.
 *
 * So: every criterion at the minimum is returned, because an essay held back
 * equally by two things is held back by two things. And when EVERY criterion
 * sits at the minimum, nothing is returned at all — a uniformly 5.0 essay has
 * no weak spot, and naming one invents a finding.
 */
export function weakestCriteria(criteria: Record<string, { band?: number }>): string[] {
  const scored = Object.entries(criteria ?? {})
    .map(([key, value]) => ({ key, band: Number(value?.band) }))
    .filter((c) => Number.isFinite(c.band));
  if (scored.length < 2) return [];

  const lowest = Math.min(...scored.map((c) => c.band));
  const atLowest = scored.filter((c) => c.band === lowest);
  if (atLowest.length === scored.length) return [];

  return atLowest.map((c) => CRITERION_LABEL[c.key] ?? c.key);
}
