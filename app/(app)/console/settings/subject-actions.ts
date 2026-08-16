"use server";

import { revalidatePath } from "next/cache";

import { isOrgOwner, requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Subjects: what the center teaches, and which teachers can take each one.
 *
 * Owner-only, matching the RLS in migration 20260813120000. Deciding that the
 * center now runs SAT, or that a teacher may be given it, is a staffing call —
 * the administrator who fills the classes works from the list, not on it.
 */

export interface SubjectState {
  error?: string;
  ok?: string;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

async function requireOwner(): Promise<{ error: SubjectState } | { organizationId: string }> {
  const { profile } = await requireOrgUser();
  if (!isOrgOwner(profile.role)) {
    return { error: { error: "Only the center owner can change subjects." } };
  }
  return { organizationId: profile.organization_id };
}

function refresh(): void {
  revalidatePath("/console/settings");
  revalidatePath("/console/groups");
  revalidatePath("/console/teachers");
}

export async function createSubject(_prev: SubjectState, formData: FormData): Promise<SubjectState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const name = str(formData, "name");
  if (!name) return { error: "Give the subject a name." };
  if (name.length > 60) return { error: "That name is too long." };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({
    organization_id: guard.organizationId,
    name,
    color: str(formData, "color") || null,
  });
  // The unique index is case-insensitive, so "ielts" collides with "IELTS" —
  // which is the point, and worth saying plainly rather than as a constraint name.
  if (error) {
    return error.code === "23505"
      ? { error: `${name} is already on the list.` }
      : { error: error.message };
  }

  refresh();
  return { ok: `${name} added.` };
}

export async function renameSubject(_prev: SubjectState, formData: FormData): Promise<SubjectState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return { error: "Nothing to rename." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update({ name })
    .eq("id", id)
    .select("id"); // an RLS-filtered update reports success without this
  if (error) {
    return error.code === "23505"
      ? { error: `${name} is already on the list.` }
      : { error: error.message };
  }
  if (!data || data.length === 0) return { error: "You cannot change that subject." };

  refresh();
  return { ok: "Renamed." };
}

/**
 * Retire a subject, or bring it back.
 *
 * Never a delete once classes point at it: `groups.subject_id` would null out
 * and a term's worth of timetable would quietly stop saying what it taught.
 * A subject nobody has used yet is deleted outright, same rule as a cash desk.
 */
export async function setSubjectActive(
  _prev: SubjectState,
  formData: FormData,
): Promise<SubjectState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const id = str(formData, "id");
  const active = str(formData, "active") === "on";
  if (!id) return { error: "Nothing to change." };

  const supabase = await createClient();

  if (!active) {
    const [{ count: groupCount }, { count: teacherCount }] = await Promise.all([
      supabase.from("groups").select("id", { count: "exact", head: true }).eq("subject_id", id),
      supabase
        .from("teacher_subjects")
        .select("teacher_id", { count: "exact", head: true })
        .eq("subject_id", id),
    ]);
    if ((groupCount ?? 0) === 0 && (teacherCount ?? 0) === 0) {
      const { data, error } = await supabase.from("subjects").delete().eq("id", id).select("id");
      if (error) return { error: error.message };
      if (!data || data.length === 0) return { error: "You cannot remove that subject." };
      refresh();
      return { ok: "Removed — nothing was using it." };
    }
  }

  const { data, error } = await supabase
    .from("subjects")
    .update({ active })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You cannot change that subject." };

  refresh();
  return { ok: active ? "Back on the list." : "Retired — existing groups keep it." };
}

/**
 * Set exactly which subjects a teacher can take.
 *
 * Replace, not merge: the form posts the full set of ticked boxes, so an
 * unticked one has to mean "remove". Merging would make it impossible to take a
 * subject away from a teacher, which is the whole reason to edit this.
 */
export async function setTeacherSubjects(
  _prev: SubjectState,
  formData: FormData,
): Promise<SubjectState> {
  const guard = await requireOwner();
  if ("error" in guard) return guard.error;

  const teacherId = str(formData, "teacher_id");
  if (!teacherId) return { error: "No teacher given." };
  const subjectIds = formData.getAll("subject_id").map((v) => String(v)).filter(Boolean);

  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("teacher_subjects")
    .delete()
    .eq("teacher_id", teacherId);
  if (clearError) return { error: clearError.message };

  if (subjectIds.length > 0) {
    const { error } = await supabase.from("teacher_subjects").insert(
      subjectIds.map((subjectId) => ({
        teacher_id: teacherId,
        subject_id: subjectId,
        organization_id: guard.organizationId,
      })),
    );
    if (error) return { error: error.message };
  }

  refresh();
  return {
    ok:
      subjectIds.length === 0
        ? "Cleared — they can be put on any group."
        : `Set to ${subjectIds.length} subject${subjectIds.length === 1 ? "" : "s"}.`,
  };
}
