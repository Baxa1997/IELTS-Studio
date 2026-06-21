/**
 * Conservative, rolling band estimation — the math behind the "current band"
 * tracker. Pure and deterministic (no I/O, no `server-only`), so the recompute
 * service uses it and it stays unit-testable.
 *
 * Two conservative levers, both deliberate (CLAUDE.md: never inflate — a false
 * 7.0 destroys trust on exam day):
 *   1. Weighted to RECENT work (EWMA) so an old strong essay can't prop up a
 *      current estimate, but a single great submission can't spike it either.
 *   2. An uncertainty margin that shrinks as evidence accumulates — with little
 *      data we deliberately under-state — and banding that rounds HALF DOWN.
 */

export const SKILLS = ["reading", "writing"] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  reading: "Reading",
  writing: "Writing",
};

export const MIN_TARGET_BAND = 5;
export const MAX_TARGET_BAND = 9;
export const DEFAULT_TARGET_BAND = 7;

/** Recency decay: each older sample counts 0.55× the next more-recent one. */
export const DECAY = 0.55;

export interface BandEstimate {
  band: number;
  sampleCount: number;
}

/** A skill's tracker state, shaped for the UI (null bands = not yet measured). */
export interface SkillEstimateView {
  skill: Skill;
  currentBand: number | null;
  baselineBand: number | null;
  targetBand: number;
  sampleCount: number;
}

/**
 * Estimate a skill band from the student's graded bands, oldest→newest.
 * Returns band 0 with sampleCount 0 when there's nothing to go on.
 */
export function estimateBand(bandsChrono: number[]): BandEstimate {
  const bands = bandsChrono.filter((b) => Number.isFinite(b) && b > 0);
  const n = bands.length;
  if (n === 0) return { band: 0, sampleCount: 0 };

  // EWMA: most recent sample weight 1, each older one ×DECAY.
  let weighted = 0;
  let total = 0;
  let w = 1;
  for (let i = n - 1; i >= 0; i--) {
    weighted += bands[i] * w;
    total += w;
    w *= DECAY;
  }
  const mean = weighted / total;
  const conservative = Math.max(0, mean - uncertaintyMargin(n));
  return { band: toBandStep(conservative), sampleCount: n };
}

/** How much we shave off while evidence is thin. Vanishes at 4+ samples. */
function uncertaintyMargin(n: number): number {
  if (n >= 4) return 0;
  if (n === 3) return 0.1;
  if (n === 2) return 0.2;
  return 0.3; // n === 1: a single data point — under-state on purpose
}

/**
 * Snap to the IELTS 0.5 grid, rounding exact midpoints (quarter-points) DOWN so
 * we never round up into a band the work doesn't clearly support.
 */
export function toBandStep(x: number): number {
  const g = x * 2;
  const floor = Math.floor(g + 1e-9);
  const frac = g - floor;
  const steps = Math.abs(frac - 0.5) < 1e-9 ? floor : Math.round(g);
  return clampBand(steps / 2);
}

export function clampBand(x: number): number {
  return Math.max(0, Math.min(9, x));
}
