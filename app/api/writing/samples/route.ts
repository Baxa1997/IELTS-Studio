import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { generateWritingSamples } from "@/lib/ai";
import type { EssayTaskType } from "@/lib/ai/schema";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { figureToText, parseFigure } from "@/lib/writing/figure";

// Calls the AI service (server-only, usage-logged) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Two original essays is a heavier generation than a chat reply; give it headroom.
export const maxDuration = 60;

const TASK_TYPES = new Set<EssayTaskType>(["task1_academic", "task1_general", "task2"]);

/**
 * POST /api/writing/samples
 *
 * Band-targeted model answers (Band 7 + Band 8) for one task — the comparison the
 * learner studies AFTER grading. Cached per (org, task) so re-opening is free.
 *
 * Forward-compatible: if the `writing_samples` cache table hasn't been migrated
 * yet, the cache read/write just no-op (errors are swallowed) and we generate
 * live, so this is safe to deploy before the migration is applied.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session?.profile) return fail(401, "unauthorized");
  if (session.profile.role !== "student") return fail(403, "forbidden");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_request");
  }

  const taskType = String(body.taskType ?? "") as EssayTaskType;
  if (!TASK_TYPES.has(taskType)) return fail(422, "bad_task", "Unknown task type.");
  const promptText = String(body.promptText ?? "").trim().slice(0, 6000);
  if (!promptText) return fail(422, "empty", "Missing the task prompt.");

  const figure = taskType === "task1_academic" ? parseFigure(body.figure) : null;
  const figureText = figure ? figureToText(figure) : undefined;

  const orgId = session.profile.organization_id;
  const promptHash = createHash("sha256").update(`${taskType}\n${promptText}`).digest("hex");
  const admin = createAdminClient();

  // Cache hit? (No-op / live generation if the table isn't migrated yet.)
  const cached = await admin
    .from("writing_samples")
    .select("samples")
    .eq("organization_id", orgId)
    .eq("prompt_hash", promptHash)
    .maybeSingle();
  if (!cached.error && cached.data?.samples) {
    return NextResponse.json({ samples: cached.data.samples }, { status: 200 });
  }

  let samples;
  try {
    samples = await generateWritingSamples({
      taskType,
      promptText,
      figure: figureText,
      meta: { organizationId: orgId, userId: session.profile.id },
    });
  } catch (err) {
    console.error("[writing/samples]", err);
    return fail(502, "samples_failed", "Couldn't write the model answers right now — try again in a moment.");
  }

  // Best-effort cache write — ignored if the table is missing (pre-migration).
  await admin
    .from("writing_samples")
    .insert({ organization_id: orgId, task_type: taskType, prompt_hash: promptHash, samples })
    .then(
      () => undefined,
      () => undefined,
    );

  return NextResponse.json({ samples }, { status: 200 });
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
