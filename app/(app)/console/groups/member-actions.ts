"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { canManagePeople, requireOrgUser } from "@/lib/auth";
import { isMemberStatus } from "@/lib/console/status";
import { createClient } from "@/lib/supabase/server";

import { seatLimitError } from "./_lib/accounts";
import { sendInviteEmail } from "./_lib/emails";
import type { GroupFormState } from "./actions";

export interface InviteFormState {
  error?: string;
  email?: string;
  inviteUrl?: string;
  /** What happened to the email carrying the link — shown beside the link, so
   *  a send that failed is visible and the link can still be passed on. */
  emailNote?: string;
}

/**
 * Move a student's status: enrolled, on a break, or gone.
 *
 * Every denominator in the console reads this. A paused student leaves the
 * gone-quiet list, the attendance rate and next month's invoice; a student who
 * left leaves the roster as well. Nothing they have done is touched — that is
 * the whole point of having three states instead of a delete button.
 */
export async function setStudentStatus(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can change a student's status." };
  }

  const studentId = String(formData.get("student_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!studentId) return { error: "Missing student." };
  if (!isMemberStatus(status)) return { error: "Unknown status." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    // `status_changed_at` is stamped by the guard trigger, not here — the
    // column and the value it describes cannot then disagree, and a caller
    // cannot back-date a status change by sending its own timestamp.
    .update({ member_status: status, status_note: note })
    .eq("id", studentId)
    .select("id, full_name");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That student is not yours to change." };

  const name = data[0].full_name ?? "The student";
  revalidatePath("/console/students");
  revalidatePath(`/console/students/${studentId}`);
  revalidatePath("/console/groups");
  revalidatePath("/console");
  return {
    notice:
      status === "active"
        ? `${name} is active again and counts everywhere.`
        : status === "paused"
          ? `${name} is paused — out of chasing, attendance and invoicing until they return.`
          : `${name} has left. Their marks, registers and invoices stay exactly as they are.`,
  };
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
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can invite members." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

  const role = String(formData.get("role") ?? "student");
  if (role !== "student" && role !== "teacher" && role !== "administrator") {
    return { error: "Choose a valid role." };
  }
  if (role !== "student" && profile.role !== "center_admin") {
    return { error: "Only a center admin can invite staff." };
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

  const emailNote = await sendInviteEmail({
    supabase,
    organizationId: profile.organization_id,
    to: email,
    role,
    token,
  });

  revalidatePath("/console");
  revalidatePath("/console/groups");
  if (groupId) revalidatePath(`/console/groups/${groupId}`);
  return { email, inviteUrl: `${origin}/accept-invite?token=${token}`, emailNote };
}

/**
 * Revoke a pending invite — the link stops working immediately, because the
 * accept page resolves the token against this row.
 *
 * No permission check in code: RLS is the check. A center_admin manages every
 * invite in their org, a teacher only those attached to a group they own, and a
 * row that isn't yours simply doesn't match.
 */
export async function revokeInvite(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  await requireOrgUser();

  const inviteId = String(formData.get("invite_id") ?? "").trim();
  if (!inviteId) return { error: "Missing invite." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("invites")
    .delete({ count: "exact" })
    .eq("id", inviteId);
  if (error) return { error: error.message };
  if (!count) return { error: "That invite is no longer yours to revoke." };

  revalidatePath("/console");
  revalidatePath("/console/groups");
  return { notice: "Invite revoked." };
}

/**
 * Re-issue a pending invite: a fresh token and another 7 days, on the same row.
 *
 * This is "resend" in a product that sends no invite emails — the old link dies
 * and the caller gets a new one to hand over. Rotating the token is the point:
 * an invite that has been sitting in a forwarded chat for six days should not
 * stay valid just because someone clicked Resend.
 */
export async function refreshInvite(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  await requireOrgUser();

  const inviteId = String(formData.get("invite_id") ?? "").trim();
  if (!inviteId) return { error: "Missing invite." };

  const token = randomBytes(24).toString("base64url");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .update({
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
    })
    .eq("id", inviteId)
    .select("email, role, organization_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "That invite is no longer yours to renew." };

  // ⚠️ Re-sent, not optional: the new token kills the old one, so the link the
  // first email carried is dead the moment this returns. Renewing without
  // re-sending would leave the invitee holding a link that no longer works.
  const emailNote = await sendInviteEmail({
    supabase,
    organizationId: data.organization_id as string,
    to: data.email as string,
    role: data.role as string,
    token,
  });

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get("host")}`;

  revalidatePath("/console");
  revalidatePath("/console/groups");
  return { email: data.email as string, inviteUrl: `${origin}/accept-invite?token=${token}`, emailNote };
}

/**
 * Move a student from one class to another (§5).
 *
 * ONE ACTION, NOT REMOVE-THEN-ADD. Done as two steps there is a moment when the
 * student is in no class at all, and if the second step fails — a full class, a
 * dropped connection — that is where they stay, off every roster, still owing
 * money, and nobody is told. Here the add happens first and the old membership
 * is only dropped once the new one exists.
 *
 * Their work, marks, registers and invoices are untouched: those hang off the
 * student and the content, never off the membership row.
 */
export async function moveMember(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can move a student." };
  }

  const fromGroupId = String(formData.get("group_id") ?? "").trim();
  const toGroupId = String(formData.get("to_group_id") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();
  if (!fromGroupId || !toGroupId || !studentId) return { error: "Missing group or student." };
  if (fromGroupId === toGroupId) return { error: "That is the class they are already in." };

  const supabase = await createClient();

  // RLS hides classes this person does not manage, so reading the destination
  // is also the permission check on it — a teacher cannot post a student into
  // somebody else's class by editing the form.
  const { data: destination } = await supabase
    .from("groups")
    .select("id, name, capacity")
    .eq("id", toGroupId)
    .maybeSingle();
  if (!destination) return { error: "That class is not one you manage." };

  const { count } = await supabase
    .from("group_members")
    .select("student_id", { count: "exact", head: true })
    .eq("group_id", toGroupId);
  const capacity = destination.capacity as number | null;
  if (capacity != null && (count ?? 0) >= capacity) {
    return { error: `${destination.name as string} is full (${capacity}).` };
  }

  const { error: addError } = await supabase.from("group_members").insert({
    organization_id: profile.organization_id,
    group_id: toGroupId,
    student_id: studentId,
  });
  // Already in the destination: not a failure, just nothing to add. Fall
  // through and clear the old membership so the move still completes.
  if (addError && !addError.message.includes("duplicate")) return { error: addError.message };

  const { error: dropError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", fromGroupId)
    .eq("student_id", studentId)
    .select("student_id");
  if (dropError) return { error: dropError.message };

  revalidatePath(`/console/groups/${fromGroupId}`);
  revalidatePath(`/console/groups/${toGroupId}`);
  return { notice: `Moved to ${destination.name as string}.` };
}
