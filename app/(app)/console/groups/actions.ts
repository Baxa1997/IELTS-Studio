"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireOrgUser } from "@/lib/auth";
import { generateWritingPrompt, reviewWritingPrompt, PromptServiceError } from "@/lib/prompts/service";
import { TASK2_CATEGORIES, type Task2Category } from "@/lib/prompts/types";
import { getGenerationQuota, PLAN_SEAT_LIMITS, type OrgPlan } from "@/lib/quota";
import { instantiateLibraryTest } from "@/lib/reading/service";
import { createClient } from "@/lib/supabase/server";

export interface GroupFormState {
  error?: string;
  notice?: string;
}

export interface InviteFormState {
  error?: string;
  email?: string;
  inviteUrl?: string;
}

/** Center admin creates a group, optionally assigning a teacher up front.
 *  RLS independently enforces "center_admin of this org" on the insert. */
export async function createGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only a center admin can create groups." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a group name." };
  const teacherId = String(formData.get("teacher_id") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("groups").insert({
    organization_id: profile.organization_id,
    name,
    teacher_id: teacherId,
    created_by: profile.id,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "A group with that name already exists." : error.message,
    };
  }

  revalidatePath("/console/groups");
  return { notice: `Group "${name}" created.` };
}

/** Center admin (re)assigns the teacher who owns a group. Passing an empty value
 *  unassigns. The composite FK guarantees the teacher belongs to this org. */
export async function assignTeacher(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only a center admin can assign teachers." };

  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing group." };
  const teacherId = String(formData.get("teacher_id") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ teacher_id: teacherId })
    .eq("id", groupId);
  if (error) return { error: error.message };

  revalidatePath("/console/groups");
  revalidatePath(`/console/groups/${groupId}`);
  return { notice: teacherId ? "Teacher assigned." : "Teacher unassigned." };
}

/** Center admin deletes a group. Memberships cascade; the students' accounts and
 *  their work are untouched. */
export async function deleteGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only a center admin can delete groups." };

  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing group." };

  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) return { error: error.message };

  revalidatePath("/console/groups");
  return { notice: "Group deleted." };
}

/** Remove a student from a group (they keep their account and history).
 *  RLS: only the org admin or the group's own teacher can touch these rows. */
export async function removeMember(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  await requireOrgUser();

  const groupId = String(formData.get("group_id") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();
  if (!groupId || !studentId) return { error: "Missing group or student." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("student_id", studentId);
  if (error) return { error: error.message };

  revalidatePath(`/console/groups/${groupId}`);
  return { notice: "Student removed from the group." };
}

/**
 * Invite a teacher or a student into THIS org — optionally straight into a group
 * (the membership is created when they accept). Returns a copyable link; there
 * is no invite email yet.
 *
 * Center admins may invite either role; a teacher may only invite students, and
 * only into a group they own (checked by RLS via can_manage_group when the
 * invite carries a group_id — and enforced here for the group-less case).
 */
export async function inviteMember(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can invite members." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  const role = String(formData.get("role") ?? "student");
  if (role !== "student" && role !== "teacher") return { error: "Choose a valid role." };
  if (role === "teacher" && profile.role !== "center_admin") {
    return { error: "Only a center admin can invite teachers." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim() || null;
  if (groupId && role !== "student") return { error: "Only students can join a group." };

  const supabase = await createClient();

  // A teacher may only invite into a group they own. RLS already hides other
  // teachers' groups from can_manage_group, but the group-select below is the
  // check that produces a friendly error instead of a constraint failure.
  if (groupId) {
    const { data: group } = await supabase
      .from("groups")
      .select("id, teacher_id")
      .eq("id", groupId)
      .maybeSingle();
    if (!group) return { error: "Group not found." };
    if (profile.role === "teacher" && group.teacher_id !== profile.id) {
      return { error: "You can only invite students into your own group." };
    }
  } else if (profile.role === "teacher") {
    return { error: "Pick one of your groups to invite the student into." };
  }

  if (role === "student") {
    const seatError = await seatLimitError(supabase, profile.organization_id);
    if (seatError) return { error: seatError };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("invites").upsert(
    {
      organization_id: profile.organization_id,
      email,
      role,
      group_id: groupId,
      token,
      invited_by: profile.id,
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
  revalidatePath("/console/groups");
  if (groupId) revalidatePath(`/console/groups/${groupId}`);
  return { email, inviteUrl: `${origin}/accept-invite?token=${token}` };
}

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
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can create assignments." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  if (!groupId) return { error: "Missing group." };
  if (kind !== "writing" && kind !== "reading") return { error: "Choose a practice type." };

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
  if (profile.role === "teacher" && group.teacher_id !== profile.id) {
    return { error: "You can only assign practice to your own groups." };
  }

  const actor = {
    userId: profile.id,
    organizationId: profile.organization_id,
    role: profile.role,
  };

  let title: string;
  let promptId: string | null = null;
  let readingTestId: string | null = null;

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
      const prompt = await generateWritingPrompt({ category, topicFamily, difficulty: 7 }, actor);
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
    created_by: profile.id,
  });
  if (error) return { error: error.message };

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

type RlsClient = Awaited<ReturnType<typeof createClient>>;

/** Student seats are a plan limit; pending invites count so a center can't
 *  oversubscribe by issuing links it hasn't spent yet. */
async function seatLimitError(
  supabase: RlsClient,
  organizationId: string,
): Promise<string | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", organizationId)
    .maybeSingle();
  const limit = PLAN_SEAT_LIMITS[(org?.plan ?? "trial") as OrgPlan];
  if (limit == null) return null;

  const [{ count: students }, { count: pending }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const used = (students ?? 0) + (pending ?? 0);
  if (used < limit) return null;
  return `Your plan includes ${limit} student seat${limit === 1 ? "" : "s"} and ${used} are used or pending. Upgrade your plan to invite more.`;
}
