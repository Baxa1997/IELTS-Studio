"use server";

import { revalidatePath } from "next/cache";
import { canManagePeople, requireOrgUser } from "@/lib/auth";
import { loadFinanceSettings } from "@/lib/finance/load";
import { createClient } from "@/lib/supabase/server";

import { readFee } from "./_lib/fees";
import { readSchedule, writeSchedule } from "./_lib/schedule";

export interface GroupFormState {
  error?: string;
  notice?: string;
}

/**
 * Create a group. A center_admin can create one for any teacher (or leave it
 * unassigned); a teacher creates their own class and always owns it — RLS
 * enforces that independently (groups_teacher_insert requires
 * teacher_id = auth.uid()).
 */
export async function createGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can create groups." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a group name." };
  const teacherId =
    profile.role === "teacher"
      ? profile.id
      : String(formData.get("teacher_id") ?? "").trim() || null;

  // Every class is taught at a branch, and its lessons may only be booked into
  // rooms there (migration 20260810170000). A center always has at least one,
  // so a single-site center never sees this field.
  const branchId = String(formData.get("branch_id") ?? "").trim();
  if (!branchId) return { error: "Pick the branch this group is taught at." };

  // What the class teaches. Optional: a center that has not set up subjects yet
  // creates classes exactly as before, and the field is not even rendered.
  const subjectId = String(formData.get("subject_id") ?? "").trim() || null;

  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const capacity = capacityRaw === "" ? null : Number(capacityRaw);
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 500)) {
    return { error: "Group size has to be a whole number between 1 and 500." };
  }

  // Both prices are the owner's business, so a teacher creating their own class
  // never sends them — the fields aren't on their form and are ignored if they
  // are. Priced at creation rather than later because an unpriced class is the
  // one that silently invoices nobody all month.
  const settings = await loadFinanceSettings();
  const fee = readFee(formData, "monthly_fee", settings.currency);
  const rate = readFee(formData, "teacher_rate", settings.currency);
  if (fee === "invalid") return { error: "That isn't a valid monthly fee." };
  if (rate === "invalid") return { error: "That isn't a valid teacher rate." };

  // Read before the insert: a bad time should refuse the whole form, not leave
  // a class created and unschedulable.
  const schedule = readSchedule(formData);
  if (typeof schedule === "string") return { error: schedule };

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("groups")
    .insert({
      organization_id: profile.organization_id,
      name,
      teacher_id: teacherId,
      branch_id: branchId,
      subject_id: subjectId,
      capacity,
      created_by: profile.id,
      ...(profile.role === "center_admin"
        ? { monthly_fee_minor: fee, teacher_rate_minor: rate }
        : {}),
    })
    .select("id")
    .single();
  if (error || !created) {
    return {
      error:
        error?.code === "23505"
          ? "A group with that name already exists."
          : (error?.message ?? "Could not create the group."),
    };
  }

  // The schedule is what makes the class real: it fills the timetable, it is
  // the denominator every prorated fee and salary divides by, and it is what
  // the register offers to mark. A class without one still works — it is just
  // billed on the center's assumed lesson count until someone books it.
  let scheduleNote = "";
  if (schedule) {
    const failed = await writeSchedule(
      supabase,
      profile.organization_id,
      created.id as string,
      schedule,
    );
    // The class exists either way — say what happened rather than rolling back
    // a class the teacher has already been told about.
    scheduleNote = failed
      ? ` The class was created, but its schedule wasn't saved: ${failed}`
      : ` ${schedule.weekdays.length} lesson${schedule.weekdays.length === 1 ? "" : "s"} a week added to the timetable.`;
  }

  revalidatePath("/console/groups");
  revalidatePath("/console/calendar");
  return { notice: `Group "${name}" created.${scheduleNote}` };
}

/**
 * Change when an existing class meets.
 *
 * Lives here rather than on the timetable page because the schedule is a
 * property of the class — "Mon/Wed/Fri 18:00" is how a center describes the
 * class when it sells it, not something you go to a calendar to look up.
 */
export async function setGroupSchedule(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can change the timetable." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing class." };

  const supabase = await createClient();
  // RLS hides other teachers' groups, so a hit here proves the caller manages it.
  const { data: group } = await supabase
    .from("groups")
    .select("id, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Class not found." };
  if (profile.role === "teacher" && group.teacher_id !== profile.id) {
    return { error: "You can only change your own classes." };
  }

  const schedule = readSchedule(formData);
  if (typeof schedule === "string") return { error: schedule };
  const seriesId = String(formData.get("series_id") ?? "").trim() || null;

  // No days at all means "this booking has stopped". Scoped to the series being
  // edited, never the whole class: a class with a second, separate booking must
  // not lose it because someone cleared the first.
  if (schedule == null) {
    if (!seriesId) return { error: "Pick the days this group meets." };
    const { data, error } = await supabase
      .from("lesson_slots")
      .delete()
      .eq("group_id", groupId)
      .eq("series_id", seriesId)
      .select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "That booking is already gone — reload." };
    revalidatePath(`/console/groups/${groupId}`);
    revalidatePath("/console/calendar");
    return { notice: "Taken off the timetable." };
  }

  const failed = await writeSchedule(
    supabase,
    profile.organization_id,
    groupId,
    schedule,
    seriesId,
  );
  if (failed) return { error: failed };

  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath("/console/calendar");
  return { notice: "Schedule saved." };
}

/** Center admin (re)assigns the teacher who owns a group. Passing an empty value
 *  unassigns. The composite FK guarantees the teacher belongs to this org. */
export async function assignTeacher(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  // Scheduling, not hiring: deciding who takes Tuesday's class is the front
  // desk's job. Adding a teacher to the CENTER stays with the owner (below).
  if (!canManagePeople(profile.role)) {
    return { error: "Only center staff can assign teachers to a class." };
  }

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
/**
 * Close a course, or reopen one.
 *
 * THIS IS WHAT REPLACED DELETION for a group that has finished. A deleted group
 * takes its registers, its invoices and every report that mentions it — and the
 * moment a parent asks about last term, the center discovers what "delete"
 * meant. Closing drops it out of every forward-looking count (what meets today,
 * which groups have no practice set, who has no teacher) and changes nothing
 * else.
 *
 * `deleteGroup` still exists below for a group created by mistake, and it is
 * the only thing it should ever be used for.
 */
export async function setGroupStatus(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role)) {
    return { error: "Only center staff can close or reopen a group." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!groupId) return { error: "Missing group." };
  if (status !== "active" && status !== "closed") return { error: "Unknown status." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ status, closed_at: status === "closed" ? new Date().toISOString() : null })
    .eq("id", groupId)
    .select("id, name");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That group is not yours to change." };

  revalidatePath("/console/groups");
  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath("/console");
  return {
    notice:
      status === "closed"
        ? `${data[0].name} is closed. Its roster, registers and invoices are untouched.`
        : `${data[0].name} is running again.`,
  };
}

export async function deleteGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only a center admin can delete groups." };

  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing group." };

  const supabase = await createClient();
  // Refuse to delete anything with a history. A course that ran is closed, not
  // deleted — this path exists for the group somebody created by mistake.
  const [{ count: sessions }, { count: members }] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
    supabase
      .from("group_members")
      .select("student_id", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);
  if ((sessions ?? 0) > 0 || (members ?? 0) > 0) {
    return {
      error:
        "This group has students or registers behind it. Close it instead — deleting would take its attendance and invoices with it.",
    };
  }

  const { error } = await supabase.from("groups").delete().eq("id", groupId).select("id");
  if (error) return { error: error.message };

  revalidatePath("/console/groups");
  return { notice: "Group deleted." };
}
