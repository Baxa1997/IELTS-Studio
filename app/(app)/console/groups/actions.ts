"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireOrgUser } from "@/lib/auth";
import { PLAN_SEAT_LIMITS, type OrgPlan } from "@/lib/quota";
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
