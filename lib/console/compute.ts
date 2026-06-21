/**
 * Cohort analytics for the center-admin dashboard — pure derivations from stored
 * work, no I/O and no `server-only`, so the loader uses them and they stay
 * unit-testable. The headline this has to make legible: how much band the center's
 * students have GAINED (current − diagnostic baseline) and where that's trending.
 */

import { SKILLS, type Skill } from "@/lib/estimates/compute";

// ---- Inputs (what the loader hands us) -------------------------------------

export interface EstimateInput {
  skill: Skill;
  currentBand: number | null;
  baselineBand: number | null;
  targetBand: number;
  sampleCount: number;
}

/** One graded submission (essay or reading attempt) for a student. */
export interface SubmissionInput {
  studentId: string;
  date: string; // ISO
  band: number;
}

export interface StudentInput {
  id: string;
  name: string | null;
}

// ---- Outputs ---------------------------------------------------------------

export interface SkillCell {
  baseline: number;
  current: number;
  target: number;
  lift: number; // current − baseline (the gain since the diagnostic)
  samples: number;
}

export type CohortStatus = "improving" | "steady" | "stuck" | "not_started";

export interface StudentRow {
  id: string;
  name: string;
  reading: SkillCell | null;
  writing: SkillCell | null;
  /** Mean lift across the student's measured skills; null if unmeasured. */
  avgLift: number | null;
  submissions: number;
  lastActiveISO: string | null;
  status: CohortStatus;
  statusReason: string;
}

export interface CohortSummary {
  studentCount: number;
  measuredCount: number;
  counts: Record<CohortStatus, number>;
  avgLift: { reading: number | null; writing: number | null; overall: number | null };
}

export interface TrendPoint {
  weekStartISO: string;
  label: string;
  avgBand: number | null;
  count: number;
}

const DAY = 86_400_000;
const INACTIVE_DAYS = 14; // dormant past this → flagged for attention

// ---- Low-confidence grading flag -------------------------------------------

const CRITERION_KEYS = ["TR", "CC", "LR", "GRA"] as const;
/** Spread this wide between the four criteria → the overall band is a rough mean
 *  of disagreeing scores; worth a human glance. */
const BORDERLINE_SPREAD = 1.5;

type CriteriaJson = Record<string, { band?: number | null } | undefined> | null;

/** Max − min across the four criterion bands; null if too few to judge. */
export function criteriaSpread(criteria: CriteriaJson): number | null {
  if (!criteria) return null;
  const bands = CRITERION_KEYS.map((k) => criteria[k]?.band).filter(
    (b): b is number => typeof b === "number",
  );
  if (bands.length < 2) return null;
  return Math.round((Math.max(...bands) - Math.min(...bands)) * 10) / 10;
}

/** A "low-confidence" AI grading the queue should surface first: the criteria
 *  disagree enough that the overall band is shaky. */
export function isBorderlineGrading(criteria: CriteriaJson): boolean {
  const s = criteriaSpread(criteria);
  return s != null && s >= BORDERLINE_SPREAD;
}

// ---- Per-student rollup ----------------------------------------------------

export function buildStudentRow(
  student: StudentInput,
  estimates: EstimateInput[],
  submissions: SubmissionInput[],
  now: Date = new Date(),
): StudentRow {
  const cellFor = (skill: Skill): SkillCell | null => {
    const e = estimates.find((x) => x.skill === skill);
    if (!e || e.currentBand == null) return null;
    const baseline = e.baselineBand ?? e.currentBand;
    return {
      baseline,
      current: e.currentBand,
      target: e.targetBand,
      lift: round1(e.currentBand - baseline),
      samples: e.sampleCount,
    };
  };

  const reading = cellFor("reading");
  const writing = cellFor("writing");
  const lifts = [reading?.lift, writing?.lift].filter((v): v is number => v != null);
  const avgLift = lifts.length ? round1(lifts.reduce((a, b) => a + b, 0) / lifts.length) : null;

  const dates = submissions.map((s) => s.date).sort();
  const lastActiveISO = dates.length ? dates[dates.length - 1] : null;
  const samplesTotal = (reading?.samples ?? 0) + (writing?.samples ?? 0);

  const { status, statusReason } = classify({
    measured: reading != null || writing != null,
    avgLift,
    samplesTotal,
    lastActiveISO,
    now,
  });

  return {
    id: student.id,
    name: student.name?.trim() || "—",
    reading,
    writing,
    avgLift,
    submissions: submissions.length,
    lastActiveISO,
    status,
    statusReason,
  };
}

function classify(args: {
  measured: boolean;
  avgLift: number | null;
  samplesTotal: number;
  lastActiveISO: string | null;
  now: Date;
}): { status: CohortStatus; statusReason: string } {
  const { measured, avgLift, samplesTotal, lastActiveISO, now } = args;
  if (!measured) return { status: "not_started", statusReason: "no diagnostic yet" };

  const inactiveDays = lastActiveISO
    ? Math.floor((now.getTime() - new Date(lastActiveISO).getTime()) / DAY)
    : Infinity;
  if (inactiveDays >= INACTIVE_DAYS) {
    return {
      status: "stuck",
      statusReason: Number.isFinite(inactiveDays) ? `inactive ${inactiveDays}d` : "inactive",
    };
  }

  const lift = avgLift ?? 0;
  if (lift >= 0.5) return { status: "improving", statusReason: `+${lift.toFixed(1)} bands` };
  if (lift <= 0 && samplesTotal >= 3) return { status: "stuck", statusReason: "no gains yet" };
  return { status: "steady", statusReason: lift > 0 ? `+${lift.toFixed(1)} bands` : "getting started" };
}

// ---- Cohort summary --------------------------------------------------------

export function summarizeCohort(rows: StudentRow[]): CohortSummary {
  const counts: Record<CohortStatus, number> = { improving: 0, steady: 0, stuck: 0, not_started: 0 };
  for (const r of rows) counts[r.status] += 1;

  const readingLifts = rows.map((r) => r.reading?.lift).filter((v): v is number => v != null);
  const writingLifts = rows.map((r) => r.writing?.lift).filter((v): v is number => v != null);
  const overallLifts = rows.map((r) => r.avgLift).filter((v): v is number => v != null);

  return {
    studentCount: rows.length,
    measuredCount: rows.filter((r) => r.status !== "not_started").length,
    counts,
    avgLift: {
      reading: mean(readingLifts),
      writing: mean(writingLifts),
      overall: mean(overallLifts),
    },
  };
}

// ---- Band-lift-over-time trend ---------------------------------------------

/**
 * Average band per ISO week (UTC, weeks starting Monday) over the last `weeks`,
 * across the WHOLE cohort. Empty weeks are kept (avgBand null) so the time axis
 * stays continuous and the upward story reads at a glance.
 */
export function weeklyTrend(submissions: SubmissionInput[], weeks = 8, now: Date = new Date()): TrendPoint[] {
  const thisWeek = startOfWeekUTC(now);
  const buckets: TrendPoint[] = [];
  const index = new Map<string, { sum: number; count: number }>();

  for (let i = weeks - 1; i >= 0; i--) {
    const ms = thisWeek - i * 7 * DAY;
    const iso = new Date(ms).toISOString();
    const key = iso.slice(0, 10);
    index.set(key, { sum: 0, count: 0 });
    buckets.push({ weekStartISO: iso, label: shortDate(ms), avgBand: null, count: 0 });
  }

  for (const s of submissions) {
    const wk = startOfWeekUTC(new Date(s.date));
    const key = new Date(wk).toISOString().slice(0, 10);
    const agg = index.get(key);
    if (agg) {
      agg.sum += s.band;
      agg.count += 1;
    }
  }

  for (const b of buckets) {
    const agg = index.get(b.weekStartISO.slice(0, 10))!;
    b.count = agg.count;
    b.avgBand = agg.count ? round1(agg.sum / agg.count) : null;
  }
  return buckets;
}

// ---- Helpers ---------------------------------------------------------------

function mean(xs: number[]): number | null {
  return xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function startOfWeekUTC(d: Date): number {
  const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dow = new Date(dayStart).getUTCDay(); // 0=Sun..6=Sat
  const backToMonday = (dow + 6) % 7;
  return dayStart - backToMonday * DAY;
}

function shortDate(ms: number): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(ms));
}

export { SKILLS };
