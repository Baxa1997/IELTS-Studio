"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { generateWritingPrompt, PromptServiceError, reviewWritingPrompt } from "@/lib/prompts/service";
import { DEFAULT_DIFFICULTY, TASK2_CATEGORIES, type Task2Category } from "@/lib/prompts/types";
import { getGenerationQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export interface PracticeFormState {
  error?: string;
  notice?: string;
}

/**
 * Generate a Task 2 prompt and STOP — the prompt lands as `pending`, which RLS
 * already hides from students, and the teacher reads it before anyone is asked
 * to write it.
 *
 * This is the half that was missing. Assigning used to generate and approve in
 * the same click, so a bad generation was already homework by the time anyone
 * saw it. The one-click path still exists on the group page for teachers who
 * want it; this one is for teachers who want to look first.
 */
export async function generatePracticeDraft(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can create practice." };
  }

  const category = String(formData.get("category") ?? "") as Task2Category;
  if (!TASK2_CATEGORIES.includes(category)) return { error: "Choose a question type." };
  const topicFamily = String(formData.get("topic_family") ?? "").trim();
  if (!topicFamily) return { error: "Enter a topic (e.g. environment)." };

  const difficultyRaw = Number(formData.get("difficulty"));
  const difficulty =
    Number.isFinite(difficultyRaw) && difficultyRaw >= 4 && difficultyRaw <= 9
      ? difficultyRaw
      : DEFAULT_DIFFICULTY;

  const quota = await getGenerationQuota(profile.organization_id);
  if (quota.exceeded) {
    return {
      error: `Your center has reached its monthly generation limit (${quota.limit}). It resets on ${new Date(quota.resetAt).toLocaleDateString()}.`,
    };
  }

  let promptId: string;
  try {
    const prompt = await generateWritingPrompt(
      { category, topicFamily, difficulty },
      { userId: profile.id, organizationId: profile.organization_id, role: profile.role },
    );
    promptId = prompt.id;
  } catch (err) {
    return {
      error:
        err instanceof PromptServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not generate the prompt.",
    };
  }

  revalidatePath("/console/practices");
  // Straight to the preview: the whole point is that a human reads it next.
  redirect(`/console/practices/${promptId}`);
}

/** Publish a draft — students can be set it from this moment, and not before. */
export async function publishPractice(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can publish practice." };
  }

  const id = String(formData.get("prompt_id") ?? "").trim();
  if (!id) return { error: "Missing practice." };

  try {
    await reviewWritingPrompt(id, "approved", {
      userId: profile.id,
      organizationId: profile.organization_id,
      role: profile.role,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not publish." };
  }

  revalidatePath("/console/practices");
  revalidatePath(`/console/practices/${id}`);
  return { notice: "Published. You can assign it to a group now." };
}

/**
 * Retire a practice. Never a delete: students' graded essays point at this
 * prompt, and the teacher's reports read through it.
 */
export async function archivePractice(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  await requireOrgUser();

  const id = String(formData.get("prompt_id") ?? "").trim();
  if (!id) return { error: "Missing practice." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("writing_prompts")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/console/practices");
  revalidatePath(`/console/practices/${id}`);
  return { notice: "Archived." };
}

/** Put an archived practice back on the shelf. */
export async function restorePractice(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  await requireOrgUser();

  const id = String(formData.get("prompt_id") ?? "").trim();
  if (!id) return { error: "Missing practice." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("writing_prompts")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/console/practices");
  revalidatePath(`/console/practices/${id}`);
  return { notice: "Back in Published." };
}

/**
 * Copy a practice into a new draft. This is how a teacher "edits" one that has
 * already been assigned — the original is frozen (a DB trigger enforces it, see
 * 20260808160000) so that a student's band always refers to the wording they
 * actually answered.
 */
export async function duplicatePractice(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can copy practice." };
  }

  const id = String(formData.get("prompt_id") ?? "").trim();
  if (!id) return { error: "Missing practice." };

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("writing_prompts")
    .select("task_type, category, prompt_text, figure, topic_family, difficulty")
    .eq("id", id)
    .maybeSingle();
  if (!source) return { error: "Practice not found." };

  const { data: copy, error } = await supabase
    .from("writing_prompts")
    .insert({
      organization_id: profile.organization_id,
      task_type: source.task_type,
      category: source.category,
      prompt_text: source.prompt_text,
      figure: source.figure,
      topic_family: source.topic_family,
      difficulty: source.difficulty,
      status: "pending",
      source: "manual",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !copy) return { error: error?.message ?? "Could not copy." };

  revalidatePath("/console/practices");
  redirect(`/console/practices/${copy.id}`);
}

/**
 * Set one practice to one or more groups at once — the multi-group step the
 * group page can't do, since it only ever knew about the group you were on.
 *
 * Publishes on the way if the teacher assigns straight from a draft: choosing to
 * set it to a class is a stronger statement of approval than any button.
 */
export async function assignPractice(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can assign practice." };
  }

  const promptId = String(formData.get("prompt_id") ?? "").trim();
  if (!promptId) return { error: "Missing practice." };

  const groupIds = formData.getAll("group_ids").map((g) => String(g));
  if (groupIds.length === 0) return { error: "Pick at least one group." };

  const dueRaw = String(formData.get("due_at") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { error: "That due date isn't valid." };
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim() || "Writing Task 2";

  const supabase = await createClient();

  // RLS returns only groups this caller manages, so the intersection below IS
  // the permission check — a group id typed by hand simply won't come back.
  const { data: allowed } = await supabase.from("groups").select("id, name").in("id", groupIds);
  const allowedIds = new Set(((allowed ?? []) as { id: string }[]).map((g) => g.id));
  const targets = groupIds.filter((id) => allowedIds.has(id));
  if (targets.length === 0) return { error: "You can only assign to your own groups." };

  const { data: prompt } = await supabase
    .from("writing_prompts")
    .select("status")
    .eq("id", promptId)
    .maybeSingle();
  if (!prompt) return { error: "Practice not found." };

  if (prompt.status !== "approved") {
    try {
      await reviewWritingPrompt(promptId, "approved", {
        userId: profile.id,
        organizationId: profile.organization_id,
        role: profile.role,
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not publish before assigning." };
    }
  }

  const { error } = await supabase.from("assignments").insert(
    targets.map((groupId) => ({
      organization_id: profile.organization_id,
      group_id: groupId,
      kind: "writing" as const,
      title,
      instructions,
      prompt_id: promptId,
      due_at: dueAt ? dueAt.toISOString() : null,
      created_by: profile.id,
    })),
  );
  if (error) return { error: error.message };

  revalidatePath("/console/practices");
  revalidatePath(`/console/practices/${promptId}`);
  for (const groupId of targets) revalidatePath(`/console/groups/${groupId}`);

  const names = ((allowed ?? []) as { id: string; name: string }[])
    .filter((g) => allowedIds.has(g.id))
    .map((g) => g.name);
  return { notice: `Set to ${names.join(", ")}.` };
}
