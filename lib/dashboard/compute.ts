/**
 * Dashboard analytics — pure derivations from the student's stored work. No I/O,
 * no `server-only`, so the loader uses these and they stay unit-testable.
 *
 * The point is a single, motivating read: where you are vs. your target, the ONE
 * weakest area per skill (so practice is targeted, not scattered), a streak to
 * keep the habit, recent history, and one recommended next task.
 */

import { READING_QUESTION_LABELS, type ReadingQuestionType } from "@/lib/reading/types";
import type { Skill, SkillEstimateView } from "@/lib/estimates/compute";

// ---- Writing criteria ------------------------------------------------------

export const CRITERIA = ["TR", "CC", "LR", "GRA"] as const;
export type Criterion = (typeof CRITERIA)[number];

/** TR is Task Response (Task 2) / Task Achievement (Task 1). */
export const CRITERION_LABELS: Record<Criterion, string> = {
  TR: "Task Response",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammatical Range & Accuracy",
};

// ---- Shapes ----------------------------------------------------------------

export interface GradingRow {
  overall_band: number | null;
  criteria: Partial<Record<Criterion, { band?: number | null }>> | null;
  score_blocker: { criterion?: string } | null;
  created_at: string;
}

export interface AttemptRow {
  band: number | null;
  type_breakdown: Partial<Record<ReadingQuestionType, { attempted?: number; correct?: number }>> | null;
  submitted_at: string | null;
  created_at: string;
}

export interface WeakCriterion {
  key: Criterion;
  label: string;
  meanBand: number;
  /** How many graded essays were capped by this criterion. */
  blockerCount: number;
}

export interface WeakReadingType {
  type: ReadingQuestionType;
  label: string;
  attempted: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface RawHistoryEvent {
  date: string;
  skill: Skill;
  band: number;
}

export interface HistoryEvent extends RawHistoryEvent {
  /** Change vs. the previous result in the SAME skill; null for the first. */
  deltaVsPrev: number | null;
}

export interface Recommendation {
  title: string;
  reason: string;
  href: string;
  cta: string;
}

// ---- Weakest writing criterion ---------------------------------------------

/**
 * The criterion holding the student back most. Primary signal is how often it's
 * the score_blocker (the grader's "what caps your band"); ties break to the lower
 * mean band. Pass ONE grading per essay (the latest) so revisions don't double-count.
 */
export function computeWeakestCriterion(gradings: GradingRow[]): WeakCriterion | null {
  if (gradings.length === 0) return null;

  const blocker: Record<Criterion, number> = { TR: 0, CC: 0, LR: 0, GRA: 0 };
  const sum: Record<Criterion, number> = { TR: 0, CC: 0, LR: 0, GRA: 0 };
  const count: Record<Criterion, number> = { TR: 0, CC: 0, LR: 0, GRA: 0 };

  for (const g of gradings) {
    const blk = g.score_blocker?.criterion;
    if (blk && isCriterion(blk)) blocker[blk] += 1;
    for (const key of CRITERIA) {
      const band = g.criteria?.[key]?.band;
      if (typeof band === "number") {
        sum[key] += band;
        count[key] += 1;
      }
    }
  }

  const mean = (k: Criterion) => (count[k] ? sum[k] / count[k] : Number.POSITIVE_INFINITY);
  // Most-blocked first; tie → lowest mean band; final tie → fixed order.
  const ranked = [...CRITERIA].sort((a, b) => {
    if (blocker[b] !== blocker[a]) return blocker[b] - blocker[a];
    return mean(a) - mean(b);
  });
  const key = ranked[0];
  if (count[key] === 0 && blocker[key] === 0) return null;

  return {
    key,
    label: CRITERION_LABELS[key],
    meanBand: count[key] ? Math.round(mean(key) * 10) / 10 : 0,
    blockerCount: blocker[key],
  };
}

// ---- Weakest reading question type -----------------------------------------

/**
 * The question type with the lowest accuracy across all attempts. Types with ≥2
 * attempts are preferred (one miss isn't a trend); falls back to all if none
 * clear that bar. Ties break to the more-attempted (better-evidenced) type.
 */
export function computeWeakestReadingType(attempts: AttemptRow[]): WeakReadingType | null {
  const agg = new Map<ReadingQuestionType, { attempted: number; correct: number }>();
  for (const a of attempts) {
    const bd = a.type_breakdown;
    if (!bd) continue;
    for (const [type, t] of Object.entries(bd) as [ReadingQuestionType, { attempted?: number; correct?: number }][]) {
      const e = agg.get(type) ?? { attempted: 0, correct: 0 };
      e.attempted += t?.attempted ?? 0;
      e.correct += t?.correct ?? 0;
      agg.set(type, e);
    }
  }

  const rows = [...agg.entries()]
    .map(([type, t]) => ({ type, ...t, accuracy: t.attempted ? t.correct / t.attempted : 1 }))
    .filter((r) => r.attempted > 0);
  if (rows.length === 0) return null;

  const reliable = rows.filter((r) => r.attempted >= 2);
  const pool = reliable.length > 0 ? reliable : rows;
  pool.sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);
  const w = pool[0];

  return {
    type: w.type,
    label: READING_QUESTION_LABELS[w.type],
    attempted: w.attempted,
    correct: w.correct,
    accuracy: w.accuracy,
  };
}

// ---- Streak ----------------------------------------------------------------

/**
 * Consecutive calendar days (UTC) with at least one submission, anchored to today
 * or yesterday. A gap of a full day breaks it. Returns 0 when there's no activity
 * today/yesterday.
 */
export function computeStreak(activityISO: string[], now: Date = new Date()): number {
  if (activityISO.length === 0) return 0;
  const days = new Set(activityISO.map(dayKeyFromISO));

  const DAY = 86_400_000;
  let cursor = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!days.has(dayKeyFromMs(cursor))) {
    cursor -= DAY; // allow the streak to "hold" if they haven't practiced yet today
    if (!days.has(dayKeyFromMs(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKeyFromMs(cursor))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

// ---- History ---------------------------------------------------------------

/** Recent results, newest first, each tagged with its change vs. the previous
 *  result in the same skill. */
export function buildHistory(events: RawHistoryEvent[], limit = 6): HistoryEvent[] {
  const asc = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const prev = new Map<Skill, number>();
  const withDelta: HistoryEvent[] = asc.map((e) => {
    const p = prev.get(e.skill);
    prev.set(e.skill, e.band);
    return { ...e, deltaVsPrev: p == null ? null : Math.round((e.band - p) * 10) / 10 };
  });
  return withDelta.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

// ---- Recommendation --------------------------------------------------------

/**
 * One next task. Diagnostic first if unmeasured; otherwise target the skill
 * furthest below its goal, pointed at that skill's single weakest area. When both
 * skills are at/above target, keep them sharp on the weaker-by-margin skill.
 */
export function recommend(args: {
  estimates: { bySkill: Record<Skill, SkillEstimateView>; diagnosticComplete: boolean };
  weakestCriterion: WeakCriterion | null;
  weakestReadingType: WeakReadingType | null;
}): Recommendation {
  const { estimates, weakestCriterion, weakestReadingType } = args;
  if (!estimates.diagnosticComplete) {
    return {
      title: "Take your entry diagnostic",
      reason: "One timed reading set and one essay set your starting bands.",
      href: "/diagnostic",
      cta: "Start diagnostic",
    };
  }

  const reading = estimates.bySkill.reading;
  const writing = estimates.bySkill.writing;
  const rGap = gap(reading);
  const wGap = gap(writing);
  // Furthest below target wins; if both at/above, nudge the thinner margin.
  const pickWriting = wGap === rGap ? (writing.currentBand ?? 0) <= (reading.currentBand ?? 0) : wGap > rGap;

  if (pickWriting) {
    const focus = weakestCriterion?.label;
    return {
      title: focus ? `Write a Task 2 — focus on ${focus}` : "Write a Task 2 essay",
      reason: focus
        ? `${focus} is capping your writing band most often. One focused essay will move it.`
        : "A fresh timed essay with a full per-criterion breakdown.",
      href: "/write",
      cta: "Open writing studio",
    };
  }

  const focus = weakestReadingType?.label;
  const pct = weakestReadingType ? Math.round(weakestReadingType.accuracy * 100) : null;
  return {
    title: focus ? `Practice reading — ${focus}` : "Do a reading set",
    reason:
      focus && pct != null
        ? `You're at ${pct}% on ${focus}. Target it with a fresh passage.`
        : "A timed passage with instant marking and per-answer explanations.",
    href: "/read",
    cta: "Start a reading set",
  };
}

// ---- Helpers ---------------------------------------------------------------

/** Distance below target (0 when at/above, or when unmeasured). */
function gap(e: SkillEstimateView): number {
  if (e.currentBand == null) return 0;
  return Math.max(0, e.targetBand - e.currentBand);
}

function isCriterion(s: string): s is Criterion {
  return (CRITERIA as readonly string[]).includes(s);
}

function dayKeyFromISO(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}
function dayKeyFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
