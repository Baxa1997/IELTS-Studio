"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { notifyAssignment } from "@/lib/notifications/send";
import { notifyAssignmentTelegram } from "@/lib/telegram/send";
import {
  generateWritingPrompt,
  PromptServiceError,
  reviewWritingPrompt,
} from "@/lib/prompts/service";
import { DEFAULT_DIFFICULTY, TASK2_CATEGORIES, type Task2Category } from "@/lib/prompts/types";
import { getGenerationQuota } from "@/lib/quota";
import { instantiateLibraryTest } from "@/lib/reading/service";
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
  // Practice is a teaching decision, so it belongs to teachers only — a
  // center_admin runs people, billing and reports.
  if (profile.role !== "teacher") {
    return { error: "Only a teacher can create practice." };
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
  if (profile.role !== "teacher") {
    return { error: "Only a teacher can publish practice." };
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
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") return { error: "Only a teacher can archive practice." };

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
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") return { error: "Only a teacher can restore practice." };

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
  if (profile.role !== "teacher") {
    return { error: "Only a teacher can copy practice." };
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

const KIND_TITLE = {
  writing: "Writing Task 2",
  reading: "Reading test",
  listening: "Listening practice",
} as const;

/**
 * Set the practice on screen to one or more of the teacher's classes.
 *
 * Called from the floating control on the learner runners (/write/[id],
 * /read/test/[id], the listening player) and from the practice library, so it
 * takes `kind` + `content_id` — the id of the CONTENT, because that is what an
 * attempt carries. Assignments deliberately stamp no id on the attempt; every
 * report joins group member x content id.
 *
 * A writing prompt still sitting as a draft is published on the way: choosing to
 * set it to a class is a stronger statement of approval than any button.
 */
export async function assignPractice(
  _prev: PracticeFormState,
  formData: FormData,
): Promise<PracticeFormState> {
  const { profile } = await requireOrgUser();
  // Teaching decisions belong to whoever runs the class. A center_admin manages
  // people, billing and reports; an owner who also teaches holds a teacher
  // account too.
  if (profile.role !== "teacher") {
    return { error: "Only a teacher can set practice for a class." };
  }

  // `prompt_id` is the older field name, still posted by the library rows.
  const contentId =
    String(formData.get("content_id") ?? "").trim() ||
    String(formData.get("prompt_id") ?? "").trim();
  if (!contentId) return { error: "Missing practice." };

  const kindRaw = String(formData.get("kind") ?? "writing");
  if (kindRaw !== "writing" && kindRaw !== "reading" && kindRaw !== "listening") {
    return { error: "That practice type can't be set as homework yet." };
  }
  const kind = kindRaw;

  const groupIds = formData.getAll("group_ids").map((g) => String(g));
  if (groupIds.length === 0) return { error: "Pick at least one class." };

  const dueRaw = String(formData.get("due_at") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { error: "That due date isn't valid." };
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim() || KIND_TITLE[kind];

  const supabase = await createClient();

  // Own classes only, and RLS narrows the read to this org besides — so a group
  // id typed by hand simply doesn't come back.
  const { data: allowed } = await supabase
    .from("groups")
    .select("id, name")
    .in("id", groupIds)
    .eq("teacher_id", profile.id);
  const allowedRows = (allowed ?? []) as { id: string; name: string }[];
  const targets = allowedRows.map((g) => g.id);
  if (targets.length === 0) return { error: "You can only set practice for your own classes." };

  if (kind === "writing") {
    const { data: prompt } = await supabase
      .from("writing_prompts")
      .select("status")
      .eq("id", contentId)
      .maybeSingle();
    if (!prompt) return { error: "Practice not found." };

    if (prompt.status !== "approved") {
      try {
        await reviewWritingPrompt(contentId, "approved", {
          userId: profile.id,
          organizationId: profile.organization_id,
          role: profile.role,
        });
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Could not publish before assigning.",
        };
      }
    }
  }

  // A LIBRARY reading test belongs to the shared library org, not to this
  // center — assigning its id directly would point the assignment at another
  // org's row, and every downstream join (the report, the runner, RLS) would be
  // reading across a tenant boundary. Clone it into this org first.
  //
  // This lives in the action, not in one caller, because it has to hold for
  // every entry point: the reading hub's cards, the runner's floating control,
  // and the group page's assign panel. The group page already did it by hand;
  // instantiateLibraryTest dedupes per org, so doing it here too is a no-op for
  // that path rather than a second copy.
  let assignedId = contentId;
  if (kind === "reading") {
    const { data: test } = await supabase
      .from("reading_tests")
      .select("id, is_library")
      .eq("id", contentId)
      .maybeSingle();
    if (!test) return { error: "Practice not found." };
    if (test.is_library) {
      try {
        assignedId = await instantiateLibraryTest(
          { userId: profile.id, organizationId: profile.organization_id, role: profile.role },
          contentId,
        );
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Could not copy that test into your center.",
        };
      }
    }
  }

  const contentColumn =
    kind === "writing"
      ? "prompt_id"
      : kind === "reading"
        ? "reading_test_id"
        : "listening_library_id";

  const { error } = await supabase.from("assignments").insert(
    targets.map((groupId) => ({
      organization_id: profile.organization_id,
      group_id: groupId,
      kind,
      title,
      instructions,
      [contentColumn]: assignedId,
      due_at: dueAt ? dueAt.toISOString() : null,
      created_by: profile.id,
    })),
  );
  if (error) return { error: error.message };

  // Tell the class. Best-effort: homework that was set is set, whether or not
  // the bell lit up.
  const href =
    kind === "writing"
      ? `/write/${assignedId}`
      : kind === "reading"
        ? `/read/test/${assignedId}`
        : `/listen?item=${assignedId}`;

  await notifyAssignment({
    organizationId: profile.organization_id,
    groupIds: targets,
    title,
    href,
    dueAt: dueAt ? dueAt.toISOString() : null,
  });

  // Second channel on the same event, not a second event. Best-effort like the
  // bell: a channel that didn't answer must not un-set the homework.
  await notifyAssignmentTelegram({
    organizationId: profile.organization_id,
    groupIds: targets,
    kind,
    title,
    url: `${serverEnv.siteUrl}${href}`,
    dueAt: dueAt ? dueAt.toISOString() : null,
  });

  revalidatePath("/console/practices");
  for (const groupId of targets) revalidatePath(`/console/groups/${groupId}`);

  return { notice: `Set to ${allowedRows.map((g) => g.name).join(", ")}.` };
}
