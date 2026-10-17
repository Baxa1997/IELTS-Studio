"use server";

import { revalidatePath } from "next/cache";
import { requireOrgUser } from "@/lib/auth";
import { notifyAssignment } from "@/lib/notifications/send";
import { notifyAssignmentTelegram } from "@/lib/telegram/send";
import { serverEnv } from "@/lib/env";
import {
  generateWritingPrompt,
  reviewWritingPrompt,
  PromptServiceError,
} from "@/lib/prompts/service";
import { DEFAULT_DIFFICULTY, TASK2_CATEGORIES, type Task2Category } from "@/lib/prompts/types";
import { getGenerationQuota } from "@/lib/quota";
import { instantiateLibraryTest } from "@/lib/reading/service";
import { createClient } from "@/lib/supabase/server";

import type { GroupFormState } from "./actions";

/**
 * Create one assignment for a group. The content is produced HERE, once, and
 * pinned — everyone in the group then works the identical prompt/test, which is
 * what makes the results table comparable:
 *
 *   • writing — generate an original Task 2 prompt and approve it immediately
 *     (a teacher choosing to assign it IS the approval; there is no separate
 *     content gate in this product).
 *   • reading — clone a shared library test into the org (a row copy, no model
 *     call). instantiateLibraryTest dedupes per org, so re-assigning the same
 *     template reuses the same copy.
 */
export async function createAssignment(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  // Setting practice is a teaching decision, so it is the teacher's alone — a
  // center_admin runs people, billing and reports. (An owner who also teaches
  // holds a teacher account.)
  if (profile.role !== "teacher") {
    return { error: "Only a teacher can set practice for a class." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  if (!groupId) return { error: "Missing group." };
  // "library" is a third way to answer "what practice", not a third skill: the
  // branch below reads the skill off the shelf item itself.
  if (kind !== "writing" && kind !== "reading" && kind !== "library") {
    return { error: "Choose a practice type." };
  }

  const dueRaw = String(formData.get("due_at") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { error: "That due date isn't valid." };
  const instructions = String(formData.get("instructions") ?? "").trim() || null;

  const supabase = await createClient();

  // RLS hides other teachers' groups, so this doubles as the permission check.
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Group not found." };
  if (group.teacher_id !== profile.id) {
    return { error: "You can only set practice for your own classes." };
  }

  const actor = {
    userId: profile.id,
    organizationId: profile.organization_id,
    role: profile.role,
  };

  let title: string;
  let promptId: string | null = null;
  let readingTestId: string | null = null;

  // §9: SET IT AGAIN FROM THE SHELF. This branch is the entire point of the
  // practice library — it reuses content the centre already has instead of
  // generating more. That is not only a quota saving: two classes set the same
  // library item sit the SAME paper, so their results can be compared, which
  // regenerating "the same" prompt never gives you.
  const libraryId = String(formData.get("library_id") ?? "").trim();
  if (libraryId) {
    const { data: item } = await supabase
      .from("practice_library")
      .select("id, kind, ref_id, title, archived_at")
      .eq("id", libraryId)
      .maybeSingle();
    if (!item) return { error: "That library item is gone." };
    if (item.archived_at) return { error: "That item has been archived. Restore it first." };

    if (item.kind === "writing_prompt") {
      promptId = item.ref_id as string;
    } else {
      readingTestId = item.ref_id as string;
    }
    title = String(formData.get("title") ?? "").trim() || (item.title as string);

    const { error: insertError } = await supabase.from("assignments").insert({
      organization_id: profile.organization_id,
      group_id: groupId,
      kind: item.kind === "writing_prompt" ? "writing" : "reading",
      title,
      instructions,
      prompt_id: promptId,
      reading_test_id: readingTestId,
      due_at: dueAt ? dueAt.toISOString() : null,
      is_placement: String(formData.get("is_placement") ?? "") === "on",
      library_id: libraryId,
      created_by: profile.id,
    });
    if (insertError) return { error: insertError.message };

    const reusedHref = promptId ? `/write/${promptId}` : `/read/test/${readingTestId}`;
    await notifyAssignment({
      organizationId: profile.organization_id,
      groupIds: [groupId],
      title,
      href: reusedHref,
      dueAt: dueAt ? dueAt.toISOString() : null,
      groupNameById: new Map([[groupId, group.name as string]]),
      // The library item AND the group: setting the same shelf item to a second
      // class must still notify that class.
      assignmentKey: `${libraryId}:${dueAt?.toISOString() ?? "no-due"}`,
    });
    await notifyAssignmentTelegram({
      organizationId: profile.organization_id,
      groupIds: [groupId],
      kind: item.kind === "writing_prompt" ? "writing" : "reading",
      title,
      siteUrl: serverEnv.outboundSiteUrl,
      note: instructions,
      dueAt: dueAt ? dueAt.toISOString() : null,
    });

    revalidatePath(`/console/groups/${groupId}`);
    revalidatePath("/console/practice");
    return { notice: `Assigned to ${group.name} from the library — nothing was regenerated.` };
  }

  if (kind === "writing") {
    const category = String(formData.get("category") ?? "") as Task2Category;
    if (!TASK2_CATEGORIES.includes(category)) return { error: "Choose a valid question type." };
    const topicFamily = String(formData.get("topic_family") ?? "").trim();
    if (!topicFamily) return { error: "Enter a topic family (e.g. environment)." };

    const quota = await getGenerationQuota(profile.organization_id);
    if (quota.exceeded) {
      return {
        error: `Your center has reached its monthly generation limit (${quota.limit}). It resets on ${new Date(quota.resetAt).toLocaleDateString()}, or upgrade your plan.`,
      };
    }

    try {
      const prompt = await generateWritingPrompt(
        { category, topicFamily, difficulty: DEFAULT_DIFFICULTY },
        actor,
      );
      // Assigning it releases it — otherwise RLS would hide it from the students
      // who are supposed to write it.
      await reviewWritingPrompt(prompt.id, "approved", actor);
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
    title = String(formData.get("title") ?? "").trim() || `Writing Task 2 — ${topicFamily}`;
  } else {
    const libraryTestId = String(formData.get("library_test_id") ?? "").trim();
    if (!libraryTestId) return { error: "Pick a reading test." };
    try {
      readingTestId = await instantiateLibraryTest(actor, libraryTestId);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not prepare the reading test." };
    }
    title = String(formData.get("title") ?? "").trim() || "Reading test";
  }

  const { error } = await supabase.from("assignments").insert({
    organization_id: profile.organization_id,
    group_id: groupId,
    kind,
    title,
    instructions,
    prompt_id: promptId,
    reading_test_id: readingTestId,
    due_at: dueAt ? dueAt.toISOString() : null,
    // A placement is an ordinary practice in every respect except what its band
    // is used for afterwards: it sets the student's baseline, which is the
    // number every "+1.0 since" on their report is measured from.
    is_placement: String(formData.get("is_placement") ?? "") === "on",
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  const href = promptId ? `/write/${promptId}` : `/read/test/${readingTestId}`;

  await notifyAssignment({
    organizationId: profile.organization_id,
    groupIds: [groupId],
    title,
    href,
    dueAt: dueAt ? dueAt.toISOString() : null,
    groupNameById: new Map([[groupId, group.name as string]]),
  });

  // The class's Telegram channel gets the same event. There are TWO places
  // homework is attached to a class — here, and `assignPractice` on the
  // Writing/Reading/Listening screens — and only the other one announced it.
  // So whether a class heard about its homework depended on which screen the
  // teacher happened to use, which is not a rule anyone could have guessed.
  //
  // Best-effort, like the bell: a channel that doesn't answer must never
  // un-set the homework.
  await notifyAssignmentTelegram({
    organizationId: profile.organization_id,
    groupIds: [groupId],
    kind,
    title,
    siteUrl: serverEnv.outboundSiteUrl,
    note: instructions,
    dueAt: dueAt ? dueAt.toISOString() : null,
  });

  revalidatePath(`/console/groups/${groupId}`);
  return { notice: `Assigned to ${group.name}.` };
}

/** Remove an assignment. Student work already submitted against its content is
 *  untouched — it just stops being listed as an assignment. */
export async function deleteAssignment(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  await requireOrgUser();

  const assignmentId = String(formData.get("assignment_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!assignmentId) return { error: "Missing assignment." };

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
  if (error) return { error: error.message };

  revalidatePath(`/console/groups/${groupId}`);
  return { notice: "Assignment removed." };
}
