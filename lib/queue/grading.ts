import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The async grading queue — the fallback for grading spikes. When the inline
 * request path can't grade an essay right now (model overloaded / transient
 * failures after retries), we enqueue a grading_jobs row and degrade gracefully
 * (202 "queued") instead of failing the student. A cron/worker hits
 * /api/jobs/grade-queue to drain it.
 *
 * Mechanics: one job per essay (unique essay_id, upserted). Attempts increment on
 * failure with exponential backoff via run_after; past max_attempts the job is
 * marked 'failed' and the essay is parked back at 'submitted' so a human can see
 * it. Claiming is race-safe through a status guard (works for a single worker).
 */

const BASE_BACKOFF_MS = 60_000; // 1m, 2m, 4m, … per attempt

export interface GradingJob {
  id: string;
  essay_id: string;
  organization_id: string;
  attempts: number;
  max_attempts: number;
}

/** Enqueue (or re-arm) a job for an essay. Attempts are preserved across re-enqueue. */
export async function enqueueGrading(
  admin: SupabaseClient,
  essayId: string,
  organizationId: string,
  lastError?: string,
): Promise<void> {
  const { data: existing } = await admin
    .from("grading_jobs")
    .select("attempts")
    .eq("essay_id", essayId)
    .maybeSingle();
  const attempts = existing?.attempts ?? 0;

  await admin.from("grading_jobs").upsert(
    {
      essay_id: essayId,
      organization_id: organizationId,
      status: "queued",
      last_error: lastError ?? null,
      run_after: new Date(Date.now() + backoffMs(attempts)).toISOString(),
    },
    { onConflict: "essay_id" },
  );
}

/** Claim up to `limit` due jobs, flipping them to 'processing'. Race-safe via the
 *  status guard on each update (good enough for a single drainer). */
export async function claimJobs(admin: SupabaseClient, limit: number): Promise<GradingJob[]> {
  const nowIso = new Date().toISOString();
  const { data: candidates } = await admin
    .from("grading_jobs")
    .select("id, essay_id, organization_id, attempts, max_attempts")
    .eq("status", "queued")
    .lte("run_after", nowIso)
    .order("run_after", { ascending: true })
    .limit(limit);

  const claimed: GradingJob[] = [];
  for (const c of candidates ?? []) {
    const { data } = await admin
      .from("grading_jobs")
      .update({ status: "processing" })
      .eq("id", c.id)
      .eq("status", "queued")
      .select("id");
    if (data && data.length > 0) claimed.push(c as GradingJob);
  }
  return claimed;
}

/** Success — the essay is graded; drop the job. */
export async function completeJob(admin: SupabaseClient, jobId: string): Promise<void> {
  await admin.from("grading_jobs").delete().eq("id", jobId);
}

/**
 * Failure — back off and requeue, or give up past max_attempts. Either way the
 * essay is parked at 'queued' (will retry) or 'submitted' (exhausted) so it's
 * never stuck at 'grading'.
 */
export async function failJob(admin: SupabaseClient, job: GradingJob, error: string): Promise<void> {
  const attempts = job.attempts + 1;
  const exhausted = attempts >= job.max_attempts;

  await admin
    .from("grading_jobs")
    .update({
      status: exhausted ? "failed" : "queued",
      attempts,
      last_error: error.slice(0, 500),
      run_after: new Date(Date.now() + backoffMs(attempts)).toISOString(),
    })
    .eq("id", job.id);

  await admin
    .from("essays")
    .update({ status: exhausted ? "submitted" : "queued" })
    .eq("id", job.essay_id);
}

function backoffMs(attempts: number): number {
  const jitter = 0.75 + Math.random() * 0.5;
  return Math.round(BASE_BACKOFF_MS * 2 ** Math.min(attempts, 6) * jitter);
}
