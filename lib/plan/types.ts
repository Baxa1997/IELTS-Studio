/**
 * Study-plan contracts + pure helpers (level → task difficulty, weekly quota,
 * re-test cadence, countdown). No server-only / I/O imports, so the onboarding
 * form, the plan page, and the prompts route all share one source of truth.
 */

import { z } from "zod";

// ---- Row shape (UI) --------------------------------------------------------

export interface StudyPlan {
  /** Provisional self-assessment; used to pitch difficulty until a real measure. */
  selfReportedBand: number | null;
  targetBand: number;
  /** ISO date (YYYY-MM-DD) of the real test, or null. */
  examDate: string | null;
  weeklyGoal: number;
  lastLevelCheckAt: string | null;
  nextLevelCheckAt: string | null;
  starterSeeded: boolean;
}

// ---- Form options ----------------------------------------------------------

/** What the learner can self-report at onboarding (whole + half bands). */
export const SELF_REPORT_BANDS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8] as const;
/** Targets they can aim for. */
export const TARGET_BANDS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9] as const;

/** Fallback pitch when nothing is known yet (mid-scale, deliberately modest). */
export const DEFAULT_PITCH_BAND = 6;
export const DEFAULT_TARGET_BAND = 7;

// ---- Validation ------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const studyPlanInputSchema = z.object({
  /** null = "not sure yet" — difficulty then falls back to the default pitch. */
  selfReportedBand: z.number().min(0).max(9).nullable(),
  targetBand: z.number().min(4).max(9),
  examDate: z
    .string()
    .regex(ISO_DATE)
    .nullable()
    .refine((d) => d == null || !Number.isNaN(Date.parse(d)), "invalid date"),
  /** Optional override; otherwise derived from the gap × time-to-exam. */
  weeklyGoal: z.number().int().min(1).max(21).optional(),
});
export type StudyPlanInput = z.infer<typeof studyPlanInputSchema>;

// ---- Pure helpers ----------------------------------------------------------

function clampInt(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(x)));
}

/**
 * The whole-band difficulty to pitch a generated task at. Pitch at the learner's
 * working band, stretched ONE band toward the target (productive challenge) but
 * never above the target — and never inflate past what we actually know.
 */
export function pitchDifficulty(args: {
  measuredBand: number | null;
  selfReportedBand: number | null;
  targetBand: number;
}): number {
  const base = args.measuredBand ?? args.selfReportedBand ?? DEFAULT_PITCH_BAND;
  const targetInt = Math.round(args.targetBand);
  const stretched = base < args.targetBand ? base + 1 : base;
  return clampInt(Math.min(stretched, targetInt), 4, 9);
}

/** Whole days from now until an ISO date (negative = past). null if no date. */
export function daysUntil(isoDate: string | null, now: Date = new Date()): number | null {
  if (!isoDate) return null;
  const then = Date.parse(`${isoDate}T00:00:00`);
  if (Number.isNaN(then)) return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((then - start) / 86_400_000);
}

function weeksUntil(isoDate: string | null, now?: Date): number | null {
  const d = daysUntil(isoDate, now);
  return d == null ? null : d / 7;
}

/**
 * Suggested tasks per week: more when the band gap is wider or the exam is near.
 * gap 0 → 3, gap 1 → 5, gap 2 → 7; +3 inside the final 4 weeks, +1 inside 8.
 */
export function deriveWeeklyGoal(args: {
  targetBand: number;
  currentBand: number | null;
  examDate: string | null;
  now?: Date;
}): number {
  const known = args.currentBand ?? args.targetBand - 1;
  const gap = Math.max(0, args.targetBand - known);
  let goal = 3 + Math.round(gap * 2);
  const weeks = weeksUntil(args.examDate, args.now);
  if (weeks != null && weeks <= 4) goal += 3;
  else if (weeks != null && weeks <= 8) goal += 1;
  return clampInt(goal, 1, 21);
}

/** How often to prompt an explicit level re-check: fortnightly, tightening to
 *  weekly in the final stretch before the exam. */
export function levelCheckCadenceDays(examDate: string | null, now?: Date): number {
  const weeks = weeksUntil(examDate, now);
  if (weeks != null && weeks <= 3) return 7;
  if (weeks != null && weeks <= 8) return 10;
  return 14;
}

/** ISO timestamp `days` from `now` (for next_level_check_at). */
export function isoInDays(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

/** Is an explicit level re-check due? */
export function levelCheckDue(nextLevelCheckAt: string | null, now: Date = new Date()): boolean {
  if (!nextLevelCheckAt) return false;
  const t = Date.parse(nextLevelCheckAt);
  return !Number.isNaN(t) && t <= now.getTime();
}
