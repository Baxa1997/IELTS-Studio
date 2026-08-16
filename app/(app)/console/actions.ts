"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { getGenerationQuota } from "@/lib/quota";
import {
  generateWritingPrompt,
  reviewWritingPrompt,
  PromptServiceError,
  type PromptActor,
} from "@/lib/prompts/service";
import {
  DEFAULT_DIFFICULTY,
  TASK2_CATEGORIES,
  type ReviewDecision,
  type StoredPrompt,
  type Task2Category,
} from "@/lib/prompts/types";
import { generateReadingSet, reviewReadingPassage } from "@/lib/reading/service";
import {
  DEFAULT_TARGET_BAND,
  READING_QUESTION_TYPES,
  type GeneratedReadingSet,
  type GenerateReadingInput,
  type ReadingModule,
  type StoredReadingPassage,
} from "@/lib/reading/types";

// Inviting members lives in ./groups/actions.ts (it also handles roles, group
// binding and seat limits).

// ── Writing-prompt library (teacher/admin) ──────────────────────────────────

/** Resolve the signed-in org member as a prompt-service actor, or null if they
 *  aren't an org user (super_admins have no org and can't author org content). */
async function currentActor(): Promise<PromptActor | null> {
  const session = await getSession();
  if (!session?.profile) return null;
  return {
    userId: session.profile.id,
    organizationId: session.profile.organization_id,
    role: session.profile.role,
  };
}

function asServiceError(err: unknown): string {
  if (err instanceof PromptServiceError) return err.message;
  return err instanceof Error ? err.message : "Something went wrong.";
}

/** Server-side generation quota gate. Returns a user-facing message when the org
 *  has hit its monthly AI-generation limit, else null. */
async function generationQuotaError(organizationId: string): Promise<string | null> {
  const quota = await getGenerationQuota(organizationId);
  if (!quota.exceeded) return null;
  const resets = new Date(quota.resetAt).toLocaleDateString();
  return `Your center has reached its monthly generation limit (${quota.limit}). It resets on ${resets}, or upgrade your plan.`;
}

export interface GeneratePromptState {
  error?: string;
  prompt?: StoredPrompt;
}

/**
 * Teacher/admin generates one original Task 2 prompt (via Gemini through the AI
 * service). It is stored as `pending` and stays invisible to students until it's
 * approved below.
 */
export async function generatePromptAction(
  _prev: GeneratePromptState,
  formData: FormData,
): Promise<GeneratePromptState> {
  const actor = await currentActor();
  if (!actor) return { error: "You are not signed in to an organization." };

  const category = String(formData.get("category") ?? "") as Task2Category;
  if (!TASK2_CATEGORIES.includes(category)) return { error: "Choose a valid question type." };
  const topicFamily = String(formData.get("topicFamily") ?? "").trim();
  if (!topicFamily) return { error: "Enter a topic family (e.g. environment)." };
  const difficultyRaw = Number(formData.get("difficulty"));
  const difficulty = Number.isFinite(difficultyRaw) ? difficultyRaw : DEFAULT_DIFFICULTY;

  const quotaError = await generationQuotaError(actor.organizationId);
  if (quotaError) return { error: quotaError };

  try {
    const prompt = await generateWritingPrompt({ category, topicFamily, difficulty }, actor);
    revalidatePath("/console");
    return { prompt };
  } catch (err) {
    return { error: asServiceError(err) };
  }
}

export interface ReviewPromptState {
  error?: string;
  prompt?: StoredPrompt;
}

/** Teacher/admin approves or rejects a pending prompt. Approval is what releases
 *  it to students. */
export async function reviewPromptAction(
  _prev: ReviewPromptState,
  formData: FormData,
): Promise<ReviewPromptState> {
  const actor = await currentActor();
  if (!actor) return { error: "You are not signed in to an organization." };

  const promptId = String(formData.get("promptId") ?? "").trim();
  if (!promptId) return { error: "Missing prompt id." };
  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Decision must be approve or reject." };
  }

  try {
    const prompt = await reviewWritingPrompt(promptId, decision, actor);
    revalidatePath("/console");
    return { prompt };
  } catch (err) {
    return { error: asServiceError(err) };
  }
}

// ── Reading library (teacher/admin) ─────────────────────────────────────────

export interface GenerateReadingState {
  error?: string;
  result?: GeneratedReadingSet;
}

/**
 * Teacher/admin generates an original Academic Reading set (passage + typed
 * questions) via the AI service, with a second-pass answer-key check. It is
 * stored as `pending` and stays hidden from students until approved; any
 * low-confidence questions are flagged for review.
 */
export async function generateReadingAction(
  _prev: GenerateReadingState,
  formData: FormData,
): Promise<GenerateReadingState> {
  const actor = await currentActor();
  if (!actor) return { error: "You are not signed in to an organization." };

  const topic = String(formData.get("topic") ?? "").trim();
  if (!topic) return { error: "Enter a topic (e.g. urban beekeeping)." };

  const readingModule = String(formData.get("module") ?? "academic") as ReadingModule;
  const targetBandRaw = Number(formData.get("targetBand"));
  const targetBand = Number.isFinite(targetBandRaw) ? targetBandRaw : DEFAULT_TARGET_BAND;
  const totalRaw = Number(formData.get("totalQuestions"));
  const totalQuestions = Number.isFinite(totalRaw) ? totalRaw : 10;

  const requested = formData.getAll("questionTypes").map(String);
  const questionTypes = READING_QUESTION_TYPES.filter((t) => requested.includes(t));
  if (questionTypes.length === 0) return { error: "Pick at least one question type." };

  const input: GenerateReadingInput = {
    module: readingModule,
    topic,
    targetBand,
    questionTypes,
    totalQuestions,
  };

  const quotaError = await generationQuotaError(actor.organizationId);
  if (quotaError) return { error: quotaError };

  try {
    const result = await generateReadingSet(input, actor);
    revalidatePath("/console");
    return { result };
  } catch (err) {
    return { error: asServiceError(err) };
  }
}

export interface ReviewReadingState {
  error?: string;
  passage?: StoredReadingPassage;
}

/** Teacher/admin approves or rejects a generated passage; approval releases it
 *  (and its questions) to students. */
export async function reviewReadingAction(
  _prev: ReviewReadingState,
  formData: FormData,
): Promise<ReviewReadingState> {
  const actor = await currentActor();
  if (!actor) return { error: "You are not signed in to an organization." };

  const passageId = String(formData.get("passageId") ?? "").trim();
  if (!passageId) return { error: "Missing passage id." };
  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Decision must be approve or reject." };
  }

  try {
    const passage = await reviewReadingPassage(passageId, decision, actor);
    revalidatePath("/console");
    revalidatePath("/console/review");
    return { passage };
  } catch (err) {
    return { error: asServiceError(err) };
  }
}

// ── Teacher grading override (the calibration flywheel) ──────────────────────

/*
 * THE OVERRIDE ACTION USED TO LIVE HERE, and it has been removed rather than
 * left dormant.
 *
 * It wrote the human's band straight into `gradings.overall_band`, which is the
 * column `v_gradable_attempts` now reads as the AI's answer. Leaving both paths
 * in place would mean a teacher who found the old form could silently rewrite
 * what the model said — destroying the (ai_band, human_band) pair that Phase 2
 * exists to collect, and doing it invisibly, since the row would still look
 * perfectly well-formed afterwards.
 *
 * Marking is now `reviewAttempt` in ./marking-actions.ts, which writes to
 * `attempt_reviews` and never touches a grading row. See migration
 * 20260816130000.
 */
