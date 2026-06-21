import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Writes a prompt row (RLS blocks student writes to writing_prompts, so this uses
// the service-role admin client) — Node runtime, per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TASKS = new Set(["task2", "task1_general", "task1_academic"]);
const MIN_LEN = 10;
const MAX_LEN = 4000;

/**
 * POST /api/prompts/custom
 *
 * "Paste your own" — the learner brings a specific IELTS prompt they want to
 * practise/grade. We persist it (approved, source "manual", tagged topic_family
 * "custom" so it stays out of the browsable AI library) and return it to open in
 * the studio. We never store passages this way — only the user's own short prompt
 * text — to stay clear of the copyright landmine on long copyrighted material.
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

  const promptText = String(body.promptText ?? "").trim();
  const taskTypeRaw = String(body.taskType ?? "task2");
  const taskType = ALLOWED_TASKS.has(taskTypeRaw) ? taskTypeRaw : "task2";
  if (promptText.length < MIN_LEN) return fail(422, "too_short", "Paste the full prompt — at least a sentence.");
  if (promptText.length > MAX_LEN) return fail(422, "too_long", "That prompt is too long to be a task question.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("writing_prompts")
    .insert({
      organization_id: session.profile.organization_id,
      task_type: taskType,
      category: null,
      prompt_text: promptText,
      topic_family: "custom",
      difficulty: null,
      status: "approved",
      source: "manual",
      created_by: session.profile.id,
    })
    .select("id, task_type, category, prompt_text, topic_family, difficulty")
    .single();
  if (error || !data) {
    console.error("[prompts/custom] insert failed:", error);
    return fail(500, "store_failed", "Couldn't save your prompt. Please try again.");
  }

  return NextResponse.json({ prompt: data }, { status: 200 });
}

function fail(status: number, error: string, message?: string) {
  return NextResponse.json(message ? { error, message } : { error }, { status });
}
