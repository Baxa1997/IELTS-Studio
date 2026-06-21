"use server";

import { randomBytes } from "node:crypto";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getSession, type AppRole } from "@/lib/auth";
import { recomputeSkillEstimate } from "@/lib/estimates/service";
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
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CAN_REVIEW: AppRole[] = ["center_admin", "teacher"];

export interface InviteFormState {
  error?: string;
  email?: string;
  inviteUrl?: string;
}

/**
 * Center admin invites a student to THEIR org. Creates (or refreshes) a tokenized
 * invite and returns a copyable accept link. The student's org/role come from the
 * admin here — never from the student — so there's no self-signup into other orgs.
 *
 * Writes go through the RLS-protected user client, so the policy independently
 * enforces "admin of this org only" even if the code check were bypassed.
 */
export async function inviteStudent(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "center_admin") {
    return { error: "Only a center admin can invite students." };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("invites").upsert(
    {
      organization_id: profile.organization_id,
      email,
      role: "student",
      token,
      invited_by: user.id,
      accepted_at: null,
      expires_at: expiresAt,
    },
    { onConflict: "organization_id,email" },
  );
  if (error) return { error: error.message };

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get("host")}`;

  revalidatePath("/console");
  return { email, inviteUrl: `${origin}/accept-invite?token=${token}` };
}

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

export interface OverrideState {
  error?: string;
  newBand?: number;
}

/**
 * Teacher/admin adjusts an AI grading's band with a comment. We stamp the grading
 * (is_teacher_override = true, graded_by = the teacher, the human band) and append
 * an immutable grading_overrides row pairing the prior (AI) band with the human
 * band + rationale — the source data for new calibration anchors. The student's
 * writing estimate is then re-rolled off the corrected band.
 *
 * Writes go through the RLS client, so Postgres independently enforces "teacher/
 * admin of this org only" on both the grading update and the override log.
 */
export async function overrideGradingAction(
  _prev: OverrideState,
  formData: FormData,
): Promise<OverrideState> {
  const actor = await currentActor();
  if (!actor) return { error: "You are not signed in to an organization." };
  if (!CAN_REVIEW.includes(actor.role)) {
    return { error: "Only a teacher or center admin can override a grading." };
  }

  const gradingId = String(formData.get("gradingId") ?? "").trim();
  if (!gradingId) return { error: "Missing grading id." };

  const bandRaw = Number(formData.get("band"));
  if (!Number.isFinite(bandRaw)) return { error: "Choose a band." };
  const band = Math.round(bandRaw * 2) / 2; // snap to the 0.5 grid
  if (band < 0 || band > 9) return { error: "Band must be between 0.0 and 9.0." };

  const comment = String(formData.get("comment") ?? "").trim();
  if (comment.length < 3) return { error: "Add a brief comment explaining the adjustment." };

  const supabase = await createClient();
  const { data: grading } = await supabase
    .from("gradings")
    .select("id, essay_id, organization_id, overall_band, version_no")
    .eq("id", gradingId)
    .maybeSingle();
  if (!grading) return { error: "Grading not found." };

  const { data: essay } = await supabase
    .from("essays")
    .select("student_id")
    .eq("id", grading.essay_id)
    .maybeSingle();

  // Stamp the grading with the human verdict.
  const { error: upErr } = await supabase
    .from("gradings")
    .update({ overall_band: band, is_teacher_override: true, graded_by: actor.userId })
    .eq("id", gradingId);
  if (upErr) return { error: upErr.message };

  // Append the override to the log (the anchor source).
  const { error: logErr } = await supabase.from("grading_overrides").insert({
    grading_id: gradingId,
    essay_id: grading.essay_id,
    organization_id: grading.organization_id,
    teacher_id: actor.userId,
    previous_band: grading.overall_band,
    new_band: band,
    comment,
    version_no: grading.version_no,
  });
  if (logErr) return { error: logErr.message };

  // Re-roll the student's writing estimate off the corrected band (best-effort).
  if (essay?.student_id) {
    try {
      const admin = createAdminClient();
      await recomputeSkillEstimate(admin, {
        studentId: essay.student_id,
        organizationId: grading.organization_id,
        skill: "writing",
      });
    } catch (err) {
      console.error("[override] estimate recompute failed:", gradingId, err);
    }
  }

  revalidatePath("/console/review");
  revalidatePath(`/console/grading/${gradingId}`);
  revalidatePath("/dashboard");
  return { newBand: band };
}
