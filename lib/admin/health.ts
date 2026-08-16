import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Is the platform actually working?
 *
 * Measured, not asserted. Every AI call already writes an `ai_usage` row with
 * its latency and whether it succeeded, so the honest answer to "how long does
 * a student wait for a band, and how often does it fail?" is sitting in the
 * database — it had simply never been read.
 *
 * WHAT COUNTS AS GRADING. `ai_usage.task` only knows 'grade' | 'generate' |
 * 'practice', which is too coarse: speaking grading is logged as 'generate'
 * because it runs through the generation path. The skill lives in
 * `request_kind`, so that is what is matched on. The prefix lists below are the
 * mapping, kept in one place so a new request kind is one line rather than a
 * hunt through the file.
 *
 * FAILURE RATE IS THE POINT. Latency is interesting; a failed grade is a
 * student who submitted work and got nothing back. Both are returned, and the
 * page leads with whichever is worse.
 */

const DAY = 24 * 60 * 60 * 1000;

/** request_kind prefixes, per skill. Order matters: first match wins. */
const GRADE_KINDS: { skill: string; match: (kind: string) => boolean }[] = [
  { skill: "Writing", match: (k) => k.startsWith("task1") || k.startsWith("task2") || k === "cefr_writing_grade" || k.startsWith("multilevel_writing_grade") },
  { skill: "Speaking", match: (k) => k.startsWith("speaking_grade") },
  { skill: "Reading", match: (k) => k.startsWith("reading_grade") || k.startsWith("multilevel_reading_grade") },
  { skill: "Listening", match: (k) => k.startsWith("listening_grade") },
];

const GENERATE_KINDS: { label: string; match: (kind: string) => boolean }[] = [
  { label: "Reading passages", match: (k) => k.startsWith("reading_set") || k.startsWith("reading_next") || k.startsWith("multilevel_reading") },
  { label: "Writing prompts", match: (k) => k.startsWith("writing_") || k.startsWith("multilevel_writing") },
  { label: "Listening tests", match: (k) => k.startsWith("listening_") },
  { label: "Speaking exams", match: (k) => k.startsWith("speaking_exam") || k.startsWith("speaking_theme") },
  { label: "Practice AI lessons", match: (k) => k.startsWith("lesson_") },
];

export interface LatencyRow {
  label: string;
  /** Calls in the window. Zero means "nobody used it", not "it is broken". */
  calls: number;
  medianMs: number | null;
  p90Ms: number | null;
  failed: number;
  failureRate: number;
}

export interface HealthSnapshot {
  windowDays: number;
  grading: LatencyRow[];
  generation: LatencyRow[];
  /** Across everything, so the headline is not skewed by one quiet skill. */
  totals: { calls: number; failed: number; failureRate: number; medianMs: number | null };
  queue: { queued: number; running: number; failed: number; oldestQueuedMinutes: number | null };
  /** Slowest single successful call in the window — the true worst case a user saw. */
  slowest: { label: string; seconds: number } | null;
}

function stats(rows: { latency_ms: number | null; ok: boolean }[]): Omit<LatencyRow, "label"> {
  const ok = rows.filter((r) => r.ok);
  const lat = ok
    .map((r) => r.latency_ms)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  const failed = rows.length - ok.length;
  return {
    calls: rows.length,
    medianMs: lat.length ? lat[Math.floor(lat.length / 2)] : null,
    p90Ms: lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.9))] : null,
    failed,
    failureRate: rows.length ? failed / rows.length : 0,
  };
}

export async function loadHealth(windowDays = 30): Promise<HealthSnapshot> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowDays * DAY).toISOString();

  const [usageRes, jobsRes] = await Promise.all([
    // Bounded: this is a console page, not a metrics pipeline. If the platform
    // ever outgrows 5k calls a month this becomes a SQL aggregate, but reading
    // rows keeps the mapping above in TypeScript where it can be tested.
    admin
      .from("ai_usage")
      .select("task, request_kind, latency_ms, ok, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000),
    admin.from("grading_jobs").select("status, created_at, updated_at"),
  ]);

  const usage = (usageRes.data ?? []) as {
    task: string;
    request_kind: string | null;
    latency_ms: number | null;
    ok: boolean;
    created_at: string;
  }[];

  const grading: LatencyRow[] = GRADE_KINDS.map(({ skill, match }) => ({
    label: skill,
    ...stats(usage.filter((u) => match(u.request_kind ?? ""))),
  }));

  const generation: LatencyRow[] = GENERATE_KINDS.map(({ label, match }) => ({
    label,
    ...stats(usage.filter((u) => u.task === "generate" && match(u.request_kind ?? ""))),
  }));

  // The headline counts every call, including the ones no bucket above claims —
  // a failure in an unmapped request kind is still a failure.
  const totals = stats(usage);

  const jobs = (jobsRes.data ?? []) as { status: string; created_at: string; updated_at: string }[];
  const queued = jobs.filter((j) => j.status === "queued");
  const oldest = queued.reduce<number | null>((acc, j) => {
    const age = (Date.now() - new Date(j.created_at).getTime()) / 60000;
    return acc == null || age > acc ? age : acc;
  }, null);

  const slowestRow = usage
    .filter((u) => u.ok && typeof u.latency_ms === "number")
    .sort((a, b) => (b.latency_ms ?? 0) - (a.latency_ms ?? 0))[0];

  return {
    windowDays,
    grading,
    generation,
    totals: {
      calls: totals.calls,
      failed: totals.failed,
      failureRate: totals.failureRate,
      medianMs: totals.medianMs,
    },
    queue: {
      queued: queued.length,
      running: jobs.filter((j) => j.status === "running").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      oldestQueuedMinutes: oldest == null ? null : Math.round(oldest),
    },
    slowest: slowestRow
      ? {
          label: slowestRow.request_kind ?? slowestRow.task,
          seconds: Math.round((slowestRow.latency_ms ?? 0) / 100) / 10,
        }
      : null,
  };
}

/** "24.3s" / "310ms" / "—" */
export function humanMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
