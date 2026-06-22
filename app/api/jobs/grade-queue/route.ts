import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { GradingError, runGrading, type GradableEssay } from "@/lib/grading/run";
import { claimJobs, completeJob, failJob } from "@/lib/queue/grading";
import { createAdminClient } from "@/lib/supabase/admin";
import { figureToText, parseFigure } from "@/lib/writing/figure";

// Drains the grading queue — Node runtime (reads the skill, calls the model).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gemini 3 Pro + a thinking budget makes each grade heavier; give the drainer the
// full serverless window (BATCH is small so the batch still fits).
export const maxDuration = 60;

const BATCH = 5; // hard cap on jobs per invocation; call this often (e.g. every minute via cron)
// Stop claiming new jobs once we're this close to maxDuration. A Gemini 3 Pro +
// thinking grade is heavy (~10-40s), so we claim ONE job at a time and only when
// there's time to finish it — otherwise a job flipped to 'processing' that we
// can't complete before the function is killed would be stranded (claimJobs only
// re-picks 'queued'). Better to leave it 'queued' for the next invocation.
const DRAIN_BUDGET_MS = 50_000;

/**
 * POST /api/jobs/grade-queue  — the queue drainer.
 *
 * Protected by CRON_SECRET (Authorization: Bearer <secret>). Claims up to a small
 * batch of due jobs, grades each through the shared runGrading path, and on
 * success drops the job (the essay is now graded). Transient/persistent failures
 * back off and requeue, exhausting to 'failed' after max_attempts. Designed to be
 * called on a schedule (Vercel Cron, Supabase cron, an external worker).
 */
export async function POST(req: Request): Promise<Response> {
  const secret = serverEnv.cronSecret;
  if (!secret) return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  if (!isAuthorized(req, secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const startedAt = Date.now();

  let claimed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  // Claim one due job at a time, only while there's budget to finish it. Stops on
  // the first empty claim (queue drained) or when the time budget / BATCH cap is hit.
  while (claimed < BATCH && Date.now() - startedAt < DRAIN_BUDGET_MS) {
    const [job] = await claimJobs(admin, 1);
    if (!job) break;
    claimed += 1;
    // Load the essay + its prompt (service-role — cross-tenant drainer).
    const { data: essay } = await admin
      .from("essays")
      .select("id, organization_id, student_id, prompt_id, task_type, content, word_count, status")
      .eq("id", job.essay_id)
      .maybeSingle();

    if (!essay || !essay.content?.trim()) {
      await completeJob(admin, job.id); // nothing to grade → drop the job
      skipped += 1;
      continue;
    }
    if (essay.status === "graded") {
      await completeJob(admin, job.id); // already done elsewhere
      skipped += 1;
      continue;
    }

    let promptText = "";
    let figureText: string | undefined;
    if (essay.prompt_id) {
      const { data: prompt } = await admin
        .from("writing_prompts")
        .select("prompt_text, figure")
        .eq("id", essay.prompt_id)
        .maybeSingle();
      promptText = prompt?.prompt_text?.trim() ?? "";
      const figure = parseFigure(prompt?.figure);
      if (figure) figureText = figureToText(figure);
    }
    if (!promptText) {
      await failJob(admin, job, "missing prompt");
      failed += 1;
      continue;
    }

    // Claim the essay row too, then grade through the shared path.
    await admin.from("essays").update({ status: "grading" }).eq("id", essay.id);
    try {
      await runGrading(admin, {
        essay: essay as GradableEssay,
        promptText,
        figureText,
        userId: essay.student_id, // attribute usage to the original requester
      });
      await completeJob(admin, job.id);
      succeeded += 1;
    } catch (err) {
      const message = err instanceof GradingError ? `${err.phase}: ${err.message}` : String(err);
      await failJob(admin, job, message);
      failed += 1;
    }
  }

  return NextResponse.json({ claimed, succeeded, failed, skipped });
}

function isAuthorized(req: Request, secret: string): boolean {
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return req.headers.get("x-cron-secret") === secret;
}
