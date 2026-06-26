import "server-only";

import type { AppRole } from "@/lib/auth";
import { generate } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { figureSchema, type Figure } from "@/lib/writing/figure";

import {
  DEFAULT_DIFFICULTY,
  generatePromptInputSchema,
  promptFiltersSchema,
  reviewDecisionSchema,
  TASK2_CATEGORIES,
  TOPIC_FAMILIES,
  type EssayTaskKind,
  type GeneratePromptInput,
  type PromptFilters,
  type ReviewDecision,
  type StoredPrompt,
  type Task2Category,
} from "./types";

/** Tasks we can generate on demand. Task 1 Academic now ships with the figure
 *  pipeline (a chart rendered for the student AND fed to the grader). */
const GENERATABLE = new Set<EssayTaskKind>(["task2", "task1_general", "task1_academic"]);

/**
 * Writing-prompt library service: generate (via the Gemini AI service) → store as
 * pending → teacher review → serve to a student without ever repeating one.
 *
 * Every DB call goes through the request's RLS client, so tenant isolation and the
 * teacher-only write rules are enforced by Postgres, not just these guards. The
 * role checks here fail fast with a clean message before we spend a model call.
 */

export interface PromptActor {
  userId: string;
  organizationId: string;
  role: AppRole;
}

const PROMPT_COLUMNS =
  "id, task_type, category, prompt_text, figure, topic_family, difficulty, status, source, created_at";

const CAN_AUTHOR: AppRole[] = ["center_admin", "teacher"];

/** Raised for caller-side problems (bad input, wrong role, nothing to serve) so
 *  routes/actions can map them to 4xx instead of a generic 500. */
export class PromptServiceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "forbidden"
      | "invalid_input"
      | "not_found"
      | "no_prompt_available"
      | "store_failed",
  ) {
    super(message);
    this.name = "PromptServiceError";
  }
}

// ---- Generate --------------------------------------------------------------

/**
 * Generate ONE original Task 2 prompt of the requested shape and store it as
 * `pending` (source = ai). It is invisible to students until a teacher approves it.
 */
export async function generateWritingPrompt(
  rawInput: GeneratePromptInput,
  actor: PromptActor,
): Promise<StoredPrompt> {
  if (!CAN_AUTHOR.includes(actor.role)) {
    throw new PromptServiceError("Only a teacher or center admin can generate prompts.", "forbidden");
  }
  const input = parse(generatePromptInputSchema, rawInput);

  const prompt_text = await composePromptText(
    { taskType: "task2", category: input.category, topicFamily: input.topicFamily, difficulty: input.difficulty },
    actor,
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("writing_prompts")
    .insert({
      organization_id: actor.organizationId,
      task_type: "task2",
      category: input.category,
      prompt_text,
      topic_family: input.topicFamily,
      difficulty: input.difficulty,
      status: "pending",
      source: "ai",
      created_by: actor.userId,
    })
    .select(PROMPT_COLUMNS)
    .single();

  if (error || !data) {
    throw new PromptServiceError(`Failed to store prompt: ${error?.message ?? "unknown"}`, "store_failed");
  }
  return data as StoredPrompt;
}

// ---- Review ----------------------------------------------------------------

/** Teacher/admin approves or rejects a pending prompt. Approval is what makes it
 *  visible to students. RLS independently enforces the teacher/admin + org rule. */
export async function reviewWritingPrompt(
  promptId: string,
  rawDecision: ReviewDecision,
  actor: PromptActor,
): Promise<StoredPrompt> {
  if (!CAN_AUTHOR.includes(actor.role)) {
    throw new PromptServiceError("Only a teacher or center admin can review prompts.", "forbidden");
  }
  const decision = parse(reviewDecisionSchema, rawDecision);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("writing_prompts")
    .update({ status: decision, reviewed_by: actor.userId, reviewed_at: new Date().toISOString() })
    .eq("id", promptId)
    .eq("organization_id", actor.organizationId)
    .select(PROMPT_COLUMNS)
    .maybeSingle();

  if (error) throw new PromptServiceError(`Review failed: ${error.message}`, "store_failed");
  if (!data) throw new PromptServiceError("Prompt not found.", "not_found");
  return data as StoredPrompt;
}

// ---- Serve (no repeats) ----------------------------------------------------

/**
 * Pick a fresh, approved prompt for a student and record the assignment so it can
 * never be served to them again. "Seen" = anything already in their assignment
 * ledger OR any prompt they've already written an essay for. Returns null when the
 * student has exhausted the approved pool for the given filters.
 */
export async function pickNextPromptForStudent(
  actor: PromptActor,
  rawFilters: PromptFilters = {},
): Promise<StoredPrompt> {
  const filters = parse(promptFiltersSchema, rawFilters);

  // Explicit "Generate a topic": always produce a brand-new AI prompt (and claim it)
  // rather than re-serving an existing unseen one — so the learner gets a genuinely
  // fresh, AI-marked topic that surfaces first in their library.
  if (filters.fresh) {
    const tt = filters.taskType ?? "task2";
    if (GENERATABLE.has(tt)) return generateOnDemand(actor, tt, filters);
  }

  const supabase = await createClient();
  const studentId = actor.userId;

  // What this student has already been served / written on.
  const [assigned, written] = await Promise.all([
    supabase.from("prompt_assignments").select("prompt_id").eq("student_id", studentId),
    supabase.from("essays").select("prompt_id").eq("student_id", studentId).not("prompt_id", "is", null),
  ]);
  const writtenSet = new Set<string>();
  for (const r of written.data ?? []) if (r.prompt_id) writtenSet.add(r.prompt_id);
  const seen = new Set<string>(writtenSet);
  // Prompts assigned but not yet written — we re-serve one of these before spending
  // a model call, so re-opening the studio doesn't generate endlessly.
  const outstanding: string[] = [];
  for (const r of assigned.data ?? []) {
    if (!r.prompt_id) continue;
    seen.add(r.prompt_id);
    if (!writtenSet.has(r.prompt_id)) outstanding.push(r.prompt_id);
  }

  // Candidate pool. RLS already restricts a student to approved prompts in their
  // org; the status filter is belt-and-suspenders for teacher callers.
  let query = supabase
    .from("writing_prompts")
    .select(PROMPT_COLUMNS)
    .eq("organization_id", actor.organizationId)
    .eq("task_type", filters.taskType ?? "task2")
    .eq("status", "approved")
    .limit(200);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.topicFamily) query = query.eq("topic_family", filters.topicFamily);
  if (filters.difficulty !== undefined) query = query.eq("difficulty", filters.difficulty);

  const { data: candidates, error } = await query;
  if (error) throw new PromptServiceError(`Failed to load prompts: ${error.message}`, "store_failed");

  const eligible = shuffle((candidates ?? []).filter((p) => !seen.has(p.id)));
  if (eligible.length === 0) {
    const taskType = filters.taskType ?? "task2";
    // B2C: there is no teacher curating a pool. Re-serve an unfinished prompt the
    // learner already has, otherwise generate a fresh one on demand.
    if (GENERATABLE.has(taskType)) {
      const pending = await reserveOutstanding(supabase, outstanding, filters);
      if (pending) return pending;
      return generateOnDemand(actor, taskType, filters);
    }
    throw new PromptServiceError(
      "Task 1 Academic isn't available yet — try Task 2 or Task 1 Letter.",
      "no_prompt_available",
    );
  }

  // Claim one. The unique(student_id, prompt_id) constraint makes this race-safe:
  // if a concurrent request grabbed the same prompt, the insert 23505s and we move
  // to the next candidate.
  for (const prompt of eligible) {
    const { error: claimErr } = await supabase.from("prompt_assignments").insert({
      organization_id: actor.organizationId,
      student_id: studentId,
      prompt_id: prompt.id,
    });
    if (!claimErr) return prompt as StoredPrompt;
    if (claimErr.code !== "23505") {
      throw new PromptServiceError(`Failed to assign prompt: ${claimErr.message}`, "store_failed");
    }
  }

  // Everything we tried was claimed concurrently. Fall back to generating a fresh
  // one rather than dead-ending on a transient race.
  const taskType = filters.taskType ?? "task2";
  if (GENERATABLE.has(taskType)) {
    return generateOnDemand(actor, taskType, filters);
  }
  throw new PromptServiceError("No new prompts are available right now.", "no_prompt_available");
}

// ---- On-demand generation (B2C, no teacher gate) ---------------------------

/** Generate one original prompt's text via the AI service. Shared by the teacher
 *  authoring flow and the B2C on-demand path. `category` applies to Task 2 only. */
async function composePromptText(
  spec: { taskType: EssayTaskKind; category: Task2Category | null; topicFamily: string; difficulty: number },
  actor: PromptActor,
): Promise<string> {
  const { content } = await generate({
    kind: "writing_prompt",
    spec: {
      task_type: spec.taskType,
      ...(spec.category ? { category: spec.category } : {}),
      topic_family: spec.topicFamily,
      target_band: spec.difficulty,
    },
    meta: { organizationId: actor.organizationId, userId: actor.userId },
  });
  const text = content.trim();
  if (!text) throw new PromptServiceError("Model returned an empty prompt.", "store_failed");
  return text;
}

/** Re-serve a prompt the student was already assigned but never wrote on, so
 *  reopening the studio doesn't spend a model call each time. */
async function reserveOutstanding(
  supabase: Awaited<ReturnType<typeof createClient>>,
  outstandingIds: string[],
  filters: PromptFilters,
): Promise<StoredPrompt | null> {
  if (outstandingIds.length === 0) return null;
  let q = supabase
    .from("writing_prompts")
    .select(PROMPT_COLUMNS)
    .in("id", outstandingIds)
    .eq("status", "approved")
    .eq("task_type", filters.taskType ?? "task2")
    .limit(1);
  if (filters.category) q = q.eq("category", filters.category);
  const { data } = await q;
  return (data?.[0] as StoredPrompt | undefined) ?? null;
}

/**
 * Generate ONE original Academic Task 1 task (the rubric + the structured figure)
 * via the AI service, validating the figure against figureSchema. The same figure
 * is rendered for the student and (flattened) fed to the grader.
 */
async function composeTask1Academic(
  actor: PromptActor,
  topicFamily: string,
  difficulty: number,
): Promise<{ prompt_text: string; figure: Figure }> {
  const { content } = await generate({
    kind: "writing_task1_academic",
    spec: { task_type: "task1_academic", topic_family: topicFamily, target_band: difficulty },
    meta: { organizationId: actor.organizationId, userId: actor.userId },
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(content));
  } catch {
    throw new PromptServiceError("Model returned malformed Task 1 JSON.", "store_failed");
  }
  const obj = (parsed ?? {}) as { prompt_text?: unknown; figure?: unknown };
  const prompt_text = typeof obj.prompt_text === "string" ? obj.prompt_text.trim() : "";
  if (!prompt_text) throw new PromptServiceError("Model returned an empty Task 1 prompt.", "store_failed");

  const figure = figureSchema.safeParse(obj.figure);
  if (!figure.success) {
    throw new PromptServiceError(
      `Model returned an invalid Task 1 figure: ${figure.error.issues[0]?.message ?? "unknown"}`,
      "store_failed",
    );
  }
  return { prompt_text, figure: figure.data };
}

/**
 * B2C fallback: with no teacher to curate a pool, generate ONE fresh prompt on
 * demand, store it already-approved, and claim it for the student so it never
 * repeats. Written with the service-role client because RLS only lets
 * teachers/admins insert into writing_prompts — this is a deliberate, system-owned
 * content op (the generator stays separate from the grader), not a user write.
 */
async function generateOnDemand(
  actor: PromptActor,
  taskType: EssayTaskKind,
  filters: PromptFilters,
): Promise<StoredPrompt> {
  const topicFamily = filters.topicFamily ?? pickRandom(TOPIC_FAMILIES);
  const difficulty = filters.difficulty ?? DEFAULT_DIFFICULTY;

  // category is a Task 2 concept; Task 1 (letter/academic) carry none. The figure
  // is Academic-Task-1-only — Task 2 essays and letters store null.
  let category: Task2Category | null = null;
  let prompt_text: string;
  let figure: Figure | null = null;

  if (taskType === "task1_academic") {
    const composed = await composeTask1Academic(actor, topicFamily, difficulty);
    prompt_text = composed.prompt_text;
    figure = composed.figure;
  } else {
    category = taskType === "task2" ? (filters.category ?? pickRandom(TASK2_CATEGORIES)) : null;
    prompt_text = await composePromptText({ taskType, category, topicFamily, difficulty }, actor);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("writing_prompts")
    .insert({
      organization_id: actor.organizationId,
      task_type: taskType,
      category,
      prompt_text,
      figure,
      topic_family: topicFamily,
      difficulty,
      status: "approved",
      source: "ai",
      created_by: actor.userId,
    })
    .select(PROMPT_COLUMNS)
    .single();
  if (error || !data) {
    throw new PromptServiceError(`Failed to store prompt: ${error?.message ?? "unknown"}`, "store_failed");
  }

  const { error: claimErr } = await admin.from("prompt_assignments").insert({
    organization_id: actor.organizationId,
    student_id: actor.userId,
    prompt_id: data.id,
  });
  if (claimErr && claimErr.code !== "23505") {
    throw new PromptServiceError(`Failed to assign prompt: ${claimErr.message}`, "store_failed");
  }
  return data as StoredPrompt;
}

function pickRandom<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/** Tolerate a ```json … ``` fence around a JSON reply. */
function stripFence(text: string): string {
  const t = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  return m ? m[1] : t;
}

// ---- Helpers ---------------------------------------------------------------

function parse<T>(schema: { parse: (v: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new PromptServiceError(`Invalid input: ${msg}`, "invalid_input");
  }
}

/** Fisher–Yates: spread serving across the approved pool instead of always the
 *  oldest, so students don't all get the same prompt first. */
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { DEFAULT_DIFFICULTY };
