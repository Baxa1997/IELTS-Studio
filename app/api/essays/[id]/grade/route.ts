import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { GradingError, runGrading, type GradableEssay } from "@/lib/grading/run";
import { enqueueGrading } from "@/lib/queue/grading";
import { getGradingQuota } from "@/lib/quota";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { figureToText, parseFigure } from "@/lib/writing/figure";

// The grading pipeline reads the ielts-examiner skill from disk and uses the
// service-role client — Node runtime, evaluated per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gemini 3 Pro + a thinking budget makes a grade heavier than flash; give it the
// full serverless window. A rare overrun falls through to the async queue below.
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/essays/[id]/grade
 *
 * Loads the essay (ownership/tenant enforced by RLS), checks the org's monthly
 * grading quota, then grades + stores via the shared runGrading path. On a model
 * (grade-phase) failure it enqueues the essay for the async queue and returns 202
 * instead of hard-failing — the spike fallback.
 */
export async function POST(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  // --- Authn ---------------------------------------------------------------
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org essays
  const organizationId = session.profile.organization_id;

  // --- Load essay (RLS = ownership + tenant isolation) ---------------------
  const supabase = await createClient();
  const { data: essay, error: essayErr } = await supabase
    .from("essays")
    .select("id, organization_id, student_id, prompt_id, task_type, content, word_count, status")
    .eq("id", id)
    .maybeSingle();
  if (essayErr) return fail(500, "load_failed");
  if (!essay) return fail(404, "essay_not_found");
  if (!essay.content?.trim()) return fail(422, "essay_empty");
  if (essay.status === "grading") return fail(409, "already_grading");

  // --- Resolve the prompt the essay was answering --------------------------
  let promptText = "";
  let figureText: string | undefined;
  if (essay.prompt_id) {
    const { data: prompt } = await supabase
      .from("writing_prompts")
      .select("prompt_text, figure")
      .eq("id", essay.prompt_id)
      .maybeSingle();
    promptText = prompt?.prompt_text?.trim() ?? "";
    // Academic Task 1: flatten the figure so the grader checks reported data.
    const figure = parseFigure(prompt?.figure);
    if (figure) figureText = figureToText(figure);
  }
  if (!promptText) return fail(422, "missing_prompt");

  // --- Quota (per-org monthly AI grading limit) ----------------------------
  const quota = await getGradingQuota(organizationId);
  if (quota.exceeded) {
    return NextResponse.json(
      { error: "quota_exceeded", limit: quota.limit, used: quota.used, resetAt: quota.resetAt },
      { status: 429, headers: { "Retry-After": String(secondsUntil(quota.resetAt)) } },
    );
  }

  const admin = createAdminClient();

  // Atomically claim the essay so two concurrent requests can't both grade it.
  const { data: claimed } = await admin
    .from("essays")
    .update({ status: "grading" })
    .eq("id", essay.id)
    .neq("status", "grading")
    .select("id");
  if (!claimed || claimed.length === 0) return fail(409, "already_grading");

  // --- Grade + persist via the shared path ---------------------------------
  try {
    const outcome = await runGrading(admin, {
      essay: essay as GradableEssay,
      promptText,
      figureText,
      userId: session.user.id,
    });
    return NextResponse.json(
      {
        grading: outcome.grading,
        previous: outcome.previous,
        history: outcome.history,
        disclaimer: outcome.disclaimer,
      },
      { status: 200 },
    );
  } catch (err) {
    // Persist-phase failure already reverted the essay → a real 500.
    if (err instanceof GradingError && err.phase === "persist") {
      console.error("[grade] persist failed:", essay.id, err.message);
      return fail(500, "store_failed");
    }
    // Model failure after retries → degrade to the async queue (the spike fallback).
    await admin.from("essays").update({ status: "queued" }).eq("id", essay.id);
    await enqueueGrading(admin, essay.id, essay.organization_id, errMsg(err));
    console.error("[grade] model failure, essay queued:", essay.id, errMsg(err));
    return NextResponse.json(
      {
        status: "queued",
        essayId: essay.id,
        message: "Grading is busy right now — your essay is queued and will be graded shortly.",
      },
      { status: 202 },
    );
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
