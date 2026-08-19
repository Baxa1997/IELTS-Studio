"use server";

import { randomBytes, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { canManagePeople, requireOrgUser } from "@/lib/auth";
import { explainClashes, findClashes, type SlotLike } from "@/lib/console/slot-clash";
import { uploadAvatar } from "@/lib/console/avatars";
import { isMemberStatus } from "@/lib/console/status";
import { sendEmail } from "@/lib/email/send";
import { loadFinanceSettings } from "@/lib/finance/load";
import { parseMoney } from "@/lib/finance/money";
import { notifyAssignment } from "@/lib/notifications/send";
import { notifyAssignmentTelegram, postGroupInvite } from "@/lib/telegram/send";
import { createGroupInvite, sendCredentialsTelegram } from "@/lib/telegram/student";
import { serverEnv } from "@/lib/env";
import { phoneKey } from "@/lib/phone";
import { transliterate } from "@/lib/names";
import { generatePassword } from "@/lib/passwords";
import {
  generateWritingPrompt,
  reviewWritingPrompt,
  PromptServiceError,
} from "@/lib/prompts/service";
import { placeUserInOrg } from "@/lib/provision";
import { DEFAULT_DIFFICULTY, TASK2_CATEGORIES, type Task2Category } from "@/lib/prompts/types";
import { getGenerationQuota, PLAN_SEAT_LIMITS, type OrgPlan } from "@/lib/quota";
import { instantiateLibraryTest } from "@/lib/reading/service";
import { createAdminClient } from "@/lib/supabase/admin";
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

export interface AddStudentState {
  error?: string;
  /** Credentials to hand to the student — shown once, right after creation.
   *  `email` is null when the student has no address and signs in by login. */
  created?: { name: string; login: string; email: string | null; password: string };
  /** Non-fatal problem (e.g. the optional photo failed) — the account exists. */
  warning?: string;
  /** What happened to the credentials email, when an address was given. */
  emailNote?: string;
  /** Set when their Telegram was already connected and got the details too. */
  telegramNote?: string;
}

/** Logins are typed by hand, often from a whiteboard: letters, digits and a few
 *  separators only, and case-insensitive (stored lowercase). */
const LOGIN_RE = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])$/;

/** Students created without a real address get an address on a domain we own
 *  that has no mail exchanger — valid to Supabase, undeliverable in practice,
 *  and impossible to collide with someone's real inbox. */
const NO_MAIL_DOMAIN = "students.engprogress.com";

/**
 * The auth address for a center-created account. ALWAYS synthetic, never the
 * person's real one.
 *
 * `auth.users.email` is globally unique, so using a real address here would let
 * a center account claim it forever — which is exactly what stopped a learner
 * who already practises solo from also being added as a teacher. A center
 * account signs in by login (resolved to this address server-side in `signIn`),
 * and the real inbox is kept on `profiles.contact_email` for delivery only.
 *
 * The domain has no MX record, so nothing is ever sent here and the account has
 * no email password reset. The center resets it.
 */
function centerAuthEmail(login: string): string {
  return `${login}@${NO_MAIL_DOMAIN}`;
}

/**
 * A money field that is allowed to be blank.
 *
 * Blank is `null` and means "not priced", which is a real and different answer
 * from zero — a class with no fee raises no invoices, a class priced at zero
 * raises invoices for nothing. Anything unparseable comes back as `"invalid"`
 * so the caller refuses the whole form rather than quietly storing null.
 */
function readFee(formData: FormData, field: string, currency: string): number | null | "invalid" {
  const raw = String(formData.get(field) ?? "").trim();
  if (raw === "") return null;
  const value = parseMoney(raw, currency);
  return value == null || value < 0 ? "invalid" : value;
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

/* ── when the class meets ─────────────────────────────────────────────────── */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The weekdays ticked on a schedule form, as JS `getDay()` numbers. */
function readWeekdays(formData: FormData): number[] {
  return [
    ...new Set(
      formData
        .getAll("weekdays")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ].sort();
}

/**
 * Read a schedule off a form, or `null` when none was filled in.
 *
 * Returns a string when it was filled in WRONGLY, so a half-typed schedule
 * refuses the whole form rather than silently creating a class that meets on no
 * days — the failure a teacher would only notice a week later when the register
 * had nothing to mark.
 */
function readSchedule(
  formData: FormData,
): { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null } | null | string {
  const weekdays = readWeekdays(formData);
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (weekdays.length === 0 && !startsAt && !endsAt) return null;

  if (weekdays.length === 0) return "Pick the days this group meets.";
  if (!TIME_RE.test(startsAt) || !TIME_RE.test(endsAt)) return "Use times like 15:30.";
  if (endsAt <= startsAt) return "The lesson has to end after it starts.";

  return {
    weekdays,
    startsAt,
    endsAt,
    roomId: String(formData.get("room_id") ?? "").trim() || null,
  };
}

/**
 * Put a class's weekly schedule on the timetable: ONE ROW PER DAY IT MEETS,
 * tied together by a `series_id`.
 *
 * That shape is not incidental — see migration 20260810160000. A single row
 * carrying "Mon/Wed/Fri" was drawn on one day only, so two thirds of a class's
 * lessons were invisible and staff re-added them by hand. The series id is what
 * lets three rows still be edited and deleted as one thing.
 *
 * Reconciles rather than deletes-and-recreates: a day that is still ticked
 * keeps its row, and therefore its `effective_from` and its id. Dropping and
 * re-inserting would silently reset the term on every edit.
 *
 * SCOPED TO ONE SERIES, ALWAYS. A class can legitimately hold several — the
 * live data has one running Tue and Wed at 08:00 AND at 15:30, which is four
 * rows in two independent bookings. An earlier version of this reconciled
 * every slot on the group into a single series and would have deleted three of
 * those four. So `seriesId` is required to edit; omit it and a NEW series is
 * added alongside whatever is already there.
 */
async function writeSchedule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  groupId: string,
  schedule: { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null },
  seriesIdInput?: string | null,
): Promise<string | null> {
  const seriesId = seriesIdInput || randomUUID();

  // §5/§10: WARN AND BLOCK. The timetable already drew clashes in red, but only
  // when you went to look at the grid — nothing stopped the save. A teacher
  // booked into two rooms at 15:30 is not a display problem; it is two classes
  // turning up and one of them having nobody to teach them.
  //
  // Checked against the whole centre, not this group's own bookings: the room
  // you are taking is taken by somebody else's class, and RLS already limits
  // what this person can see to their own centre.
  const clashError = await refuseOnClash(supabase, groupId, schedule, seriesId);
  if (clashError) return clashError;

  const { data: existingRows, error: readError } = await supabase
    .from("lesson_slots")
    .select("id, weekday, series_id")
    .eq("group_id", groupId)
    .eq("series_id", seriesId);
  if (readError) return readError.message;

  const existing = (existingRows ?? []) as { id: string; weekday: number; series_id: string }[];
  const wanted = new Set(schedule.weekdays);

  const drop = existing.filter((r) => !wanted.has(r.weekday)).map((r) => r.id);
  if (drop.length > 0) {
    const { error } = await supabase.from("lesson_slots").delete().in("id", drop);
    if (error) return error.message;
  }

  const keep = existing.filter((r) => wanted.has(r.weekday));
  if (keep.length > 0) {
    const { error } = await supabase
      .from("lesson_slots")
      .update({ starts_at: schedule.startsAt, ends_at: schedule.endsAt, room_id: schedule.roomId })
      .in(
        "id",
        keep.map((r) => r.id),
      );
    if (error) return error.message;
  }

  const have = new Set(keep.map((r) => r.weekday));
  const add = schedule.weekdays.filter((d) => !have.has(d));
  if (add.length > 0) {
    const { error } = await supabase.from("lesson_slots").insert(
      add.map((weekday) => ({
        organization_id: organizationId,
        group_id: groupId,
        room_id: schedule.roomId,
        series_id: seriesId,
        weekday,
        starts_at: schedule.startsAt,
        ends_at: schedule.endsAt,
      })),
    );
    if (error) return explainSlotError(error);
  }
  return null;
}


/**
 * The save-time half of §5's conflict rule: read what the centre already has,
 * ask the shared rule, and refuse.
 *
 * Returns a sentence to show the user, or null to proceed. Uses the SAME
 * `findClashes` the grid draws with, so "the timetable says this is fine" and
 * "the save says it is not" can never both be true.
 */
async function refuseOnClash(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  schedule: { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null },
  seriesId: string,
): Promise<string | null> {
  const [{ data: slots }, { data: groups }, { data: rooms }] = await Promise.all([
    supabase.from("lesson_slots").select("id, group_id, series_id, weekday, starts_at, ends_at, room_id"),
    supabase.from("groups").select("id, name, teacher_id"),
    supabase.from("rooms").select("id, name"),
  ]);
  if (!slots?.length) return null;

  const groupById = new Map(
    ((groups ?? []) as { id: string; name: string; teacher_id: string | null }[]).map((g) => [g.id, g]),
  );
  const roomName = new Map(((rooms ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]));

  const existing: SlotLike[] = (slots as Record<string, unknown>[]).map((r) => {
    const g = groupById.get(r.group_id as string);
    return {
      id: r.id as string,
      groupId: r.group_id as string,
      groupName: g?.name,
      seriesId: (r.series_id as string | null) ?? null,
      weekday: Number(r.weekday),
      startsAt: String(r.starts_at).slice(0, 5),
      endsAt: String(r.ends_at).slice(0, 5),
      roomId: (r.room_id as string | null) ?? null,
      roomName: r.room_id ? (roomName.get(r.room_id as string) ?? null) : null,
      teacherId: g?.teacher_id ?? null,
    };
  });

  const mine = groupById.get(groupId);
  const teacherName = mine?.teacher_id
    ? ((
        await supabase.from("profiles").select("full_name").eq("id", mine.teacher_id).maybeSingle()
      ).data?.full_name as string | null)
    : null;

  // Every weekday being saved, because a Mon/Wed/Fri booking can be fine on
  // Monday and collide on Wednesday — and saving two of the three would leave
  // the timetable half-changed.
  const clashes = schedule.weekdays.flatMap((weekday) =>
    findClashes(
      {
        groupId,
        groupName: mine?.name,
        seriesId,
        weekday,
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        roomId: schedule.roomId,
        roomName: schedule.roomId ? (roomName.get(schedule.roomId) ?? null) : null,
        teacherId: mine?.teacher_id ?? null,
        teacherName,
      },
      existing,
    ),
  );

  return clashes.length > 0 ? explainClashes(clashes) : null;
}

/** The two constraints a schedule can trip, in words a teacher can act on. */
function explainSlotError(error: { code?: string; message: string }): string {
  if (error.code === "23P01") {
    return "That clashes with a lesson this group already has at the same hour.";
  }
  if (error.code === "23514" || /branch/i.test(error.message)) {
    return "That room is at a different branch from this group.";
  }
  return error.message;
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

  revalidatePath("/console");
  revalidatePath("/console/groups");
  if (groupId) revalidatePath(`/console/groups/${groupId}`);
  return { email, inviteUrl: `${origin}/accept-invite?token=${token}` };
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
    .select("email")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "That invite is no longer yours to renew." };

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get("host")}`;

  revalidatePath("/console");
  revalidatePath("/console/groups");
  return { email: data.email as string, inviteUrl: `${origin}/accept-invite?token=${token}` };
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

/**
 * Create a student account directly and drop them into the group — the way a
 * center actually onboards a class: the teacher types a name and email, gets a
 * password back, and hands over the two lines. No email is sent and no invite
 * link has to survive a WhatsApp forward.
 *
 * The account is a perfectly ordinary account: the student signs in at
 * /sign-in with that email and password, practises whatever they like, and can
 * change the password later. It just happens to live in the center's org, so
 * their teacher can set homework and see their progress.
 *
 * Runs on the service-role client because creating an auth user is privileged —
 * so the caller's right to manage this group is checked explicitly first.
 */
export async function addStudentAccount(
  _prev: AddStudentState,
  formData: FormData,
): Promise<AddStudentState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can add students." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const login = String(formData.get("login") ?? "")
    .trim()
    .toLowerCase();
  const emailInput = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const passwordInput = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const guardianName = String(formData.get("guardian_name") ?? "").trim();
  const guardianPhone = String(formData.get("guardian_phone") ?? "").trim();

  if (!groupId) return { error: "Missing group." };
  if (!fullName) return { error: "Enter the student's name." };
  // A login is only asked for when the teacher wants a particular one. Left
  // blank it is built from the name below, the same way the bulk path does it —
  // a teacher adding a class should be typing names, not inventing usernames.
  if (login && !LOGIN_RE.test(login)) {
    return {
      error:
        "A login must be 3–32 characters: letters, digits, and . _ - in the middle (no spaces).",
    };
  }
  if (emailInput && !emailInput.includes("@")) return { error: "Enter a valid email address." };
  if (passwordInput && passwordInput.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // The address they gave is where we WRITE to them; it is never how they sign
  // in, so it can be an address that already has a personal account on the
  // platform. See centerAuthEmail above.
  const contactEmail = emailInput || null;

  const supabase = await createClient();
  // RLS hides other teachers' groups, so a hit here proves the caller manages it.
  const { data: group } = await supabase
    .from("groups")
    .select("id, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Group not found." };
  if (profile.role === "teacher" && group.teacher_id !== profile.id) {
    return { error: "You can only add students to your own groups." };
  }

  const seatError = await seatLimitError(supabase, profile.organization_id);
  if (seatError) return { error: seatError };

  const password = passwordInput || generatePassword();
  const admin = createAdminClient();

  // Logins are global (the sign-in box can't know which center you belong to
  // until you're in). A login the teacher TYPED must be honoured or refused —
  // silently handing them `aziz.karimov2` when they asked for `aziz.karimov`
  // means the credentials they already wrote on the board are wrong. One
  // derived from the name has no such promise attached, so it may take a suffix.
  let resolved: string | null;
  if (login) {
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", login)
      .maybeSingle();
    if (taken) {
      return {
        error: `The login "${login}" is already taken. Try adding a number, e.g. ${login}2.`,
      };
    }
    resolved = login;
  } else {
    resolved = await resolveLogin(admin, loginFromName(fullName), new Set());
    if (!resolved) {
      return { error: "Every login built from that name is taken. Type one yourself." };
    }
  }
  const finalLogin = resolved;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: centerAuthEmail(finalLogin),
    password,
    email_confirm: true,
    // Kept as the record of who this user is, and read by getSession. It does
    // NOT stop handle_new_user provisioning a personal org — Supabase writes
    // app_metadata after the INSERT, so the trigger never sees it. placeUserInOrg
    // below undoes that.
    app_metadata: { organization_id: profile.organization_id, role: "student" },
    user_metadata: { full_name: fullName },
  });
  if (createError || !created?.user) {
    const already = /already|exists|registered/i.test(createError?.message ?? "");
    return {
      error: already
        ? `The login "${finalLogin}" is already in use. Pick another one.`
        : (createError?.message ?? "Could not create the account."),
    };
  }

  const { error: placeError } = await placeUserInOrg(admin, created.user.id, {
    organizationId: profile.organization_id,
    role: "student",
    fullName,
    username: finalLogin,
    contactEmail,
    phone: phone || null,
    guardianName: guardianName || null,
    guardianPhone: guardianPhone || null,
  });
  if (placeError) {
    // Roll back the orphaned auth user so the email can be retried cleanly.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: placeError };
  }

  // Optional photo. A failed upload must not cost them the account — the
  // teacher just sees the reason and can add a picture later.
  const photo = formData.get("photo");
  let photoWarning: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const { path, error } = await uploadAvatar(photo, profile.organization_id, created.user.id);
    if (path) {
      await admin.from("profiles").update({ avatar_path: path }).eq("id", created.user.id);
    } else {
      photoWarning = error ?? "The photo could not be saved.";
    }
  }

  const { error: memberError } = await admin.from("group_members").insert({
    group_id: groupId,
    student_id: created.user.id,
    organization_id: profile.organization_id,
    added_by: profile.id,
  });
  if (memberError) {
    // The account is fine — only the membership failed. Say so rather than
    // deleting an account the student may already have been told about.
    return {
      error: `Account created, but adding them to the group failed: ${memberError.message}`,
    };
  }

  // A real address means the credentials can be delivered rather than dictated.
  // Never fatal: the teacher still has them on screen to hand over in person.
  let emailNote: string | null = null;
  let telegramSent = false;
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .maybeSingle();
  const centerName = (org?.name as string | null) ?? "your center";

  if (contactEmail) {
    emailNote = await sendCredentials({
      to: contactEmail,
      name: fullName,
      login: finalLogin,
      password,
      centerName,
    });
  }

  // AND TELEGRAM, where they have already connected. Free, no template
  // moderation, and in this country it reaches far more people than email —
  // which is why a student created without an address is not a student who
  // cannot be told their password. Returns false when they are not bound, so
  // this costs nothing for everyone else.
  telegramSent = await sendCredentialsTelegram({
    profileId: created.user.id,
    fullName,
    login: finalLogin,
    password,
    centerName,
    signInUrl: `${serverEnv.outboundSiteUrl}/sign-in`,
  });

  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath("/console/students");
  return {
    created: { name: fullName, login: finalLogin, email: contactEmail, password },
    warning: photoWarning ?? undefined,
    emailNote: emailNote ?? undefined,
    telegramNote: telegramSent ? "Sent to their Telegram too." : undefined,
  };
}

export interface ResetPasswordState {
  error?: string;
  /** The new password, shown once. Never retrievable again. */
  done?: {
    studentId: string;
    name: string;
    login: string;
    password: string;
    /** True when the new password reached their Telegram, so the teacher knows
     *  whether they still have to hand it over in person. */
    sentTelegram?: boolean;
  };
}

/**
 * Give a student a new password.
 *
 * THIS IS NOT A CONVENIENCE — it is the only reset that exists for most center
 * students. Their auth address is synthetic and on a domain with no mail
 * exchanger (see `centerAuthEmail`), so "forgot password" over email cannot
 * reach them. Without this, a student who forgets their password is locked out
 * of their own homework permanently and the center's answer is to create a
 * second account, splitting their history in two.
 *
 * Service-role, so the caller's right to manage this group is proved first:
 * RLS hides other teachers' groups, so reading the membership back through the
 * caller's own client is the check.
 */
export async function resetStudentPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can reset a student's password." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();
  if (!groupId || !studentId) return { error: "Missing student." };

  // A chosen password, or blank to generate one. Centers teaching children ask
  // for this constantly: a nine-year-old can be told "your password is
  // dolphin7" and cannot be told "kR4t-9Qmz". Same 8-character floor as account
  // creation — memorable is fine, guessable in three tries is not.
  const chosen = String(formData.get("password") ?? "").trim();
  if (chosen && chosen.length < 8) {
    return { error: "A password needs at least 8 characters." };
  }

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Group not found." };
  if (profile.role === "teacher" && group.teacher_id !== profile.id) {
    return { error: "You can only manage students in your own groups." };
  }
  // Membership read through the caller's client, so RLS confirms this student
  // really is in a group they can see rather than any id they cared to post.
  const { data: member } = await supabase
    .from("group_members")
    .select("student_id")
    .eq("group_id", groupId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!member) return { error: "That student isn't in this class." };

  const admin = createAdminClient();
  const { data: student } = await admin
    .from("profiles")
    .select("full_name, username, role, organization_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student || student.organization_id !== profile.organization_id) {
    return { error: "That student isn't in your center." };
  }
  // Staff accounts are reset from the teachers page by an admin, never from a
  // class roster — a teacher must not be able to take over a colleague's login.
  if (student.role !== "student") return { error: "That account isn't a student." };

  const password = chosen || generatePassword();
  const { error } = await admin.auth.admin.updateUserById(studentId, { password });
  if (error) return { error: error.message };

  // THE ONLY WAY AN EXISTING STUDENT CAN BE SENT THEIR DETAILS. A stored
  // password cannot be read back — Supabase keeps a hash — so "send me my
  // login" is necessarily "set a new one and send that". Which is why this
  // lives here rather than in a separate send action that would have nothing
  // to send.
  const { data: org2 } = await admin
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .maybeSingle();
  const sentTelegram = await sendCredentialsTelegram({
    profileId: studentId,
    fullName: (student.full_name as string | null) ?? "Student",
    login: (student.username as string | null) ?? "—",
    password,
    centerName: (org2?.name as string | null) ?? "your center",
    signInUrl: `${serverEnv.outboundSiteUrl}/sign-in`,
  });

  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath(`/console/students/${studentId}`);
  return {
    done: {
      studentId,
      name: (student.full_name as string | null) ?? "This student",
      login: (student.username as string | null) ?? "—",
      password,
      sentTelegram,
    },
  };
}

export interface GroupInviteState {
  error?: string;
  ok?: string;
  url?: string;
  code?: string;
  /** True when it was also posted to the class's Telegram channel, which is
   *  the whole point — a teacher who has to forward it by hand has not been
   *  saved any work. */
  posted?: boolean;
}

/**
 * One invite for a whole class, posted where the class already is.
 *
 * THE ACTION A TEACHER ACTUALLY WANTS after importing a spreadsheet: thirty
 * accounts exist and nobody can sign in. This posts a single message to the
 * class channel; each student taps it, confirms their phone, and receives their
 * own login privately. No slips, no thirty codes, no passwords in the channel.
 *
 * Safe to post publicly because the code identifies a CLASS, not a person. It
 * lets the holder ask the bot "who am I?" and the bot answers only if the phone
 * Telegram reports matches someone on that roster — so the secret that decides
 * the bind is the student's own phone, which the code neither contains nor can
 * reveal.
 */
export async function inviteGroupToTelegram(
  _prev: GroupInviteState,
  formData: FormData,
): Promise<GroupInviteState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can invite a class." };
  }
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing class." };

  const supabase = await createClient();
  // RLS hides other teachers' groups, so a hit here proves the caller manages it.
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Class not found." };
  if (profile.role === "teacher" && group.teacher_id !== profile.id) {
    return { error: "You can only invite your own classes." };
  }
  if (!process.env.TELEGRAM_BOT_USERNAME) {
    return { error: "The Telegram bot isn't configured for this environment yet." };
  }

  // HOW MANY OF THEM COULD ACTUALLY CONNECT. The phone is the identity check,
  // so a roster imported without numbers produces an invite that refuses
  // everyone — and finding that out from thirty confused students is worse than
  // being told now.
  const { data: members } = await supabase
    .from("group_members")
    .select("student_id")
    .eq("group_id", groupId);
  const ids = (members ?? []).map((m) => m.student_id as string);
  if (ids.length === 0) return { error: "That class has no students yet." };

  const admin = createAdminClient();
  const { data: rows } = await admin.from("profiles").select("id, phone").in("id", ids);
  const withPhone = (rows ?? []).filter((r) => phoneKey(r.phone as string | null)).length;
  if (withPhone === 0) {
    return {
      error:
        "None of these students has a phone number on file, so nobody could be identified. " +
        "Add numbers to the roster first — the import reads a phone column.",
    };
  }

  const invite = await createGroupInvite({
    organizationId: profile.organization_id,
    groupId,
    createdBy: profile.id,
  });

  const posted = await postGroupInvite({
    organizationId: profile.organization_id,
    groupId,
    groupName: (group.name as string | null) ?? "your class",
    url: invite.url,
    code: invite.code,
  });

  revalidatePath(`/console/groups/${groupId}`);
  const missing = ids.length - withPhone;
  return {
    ok: posted
      ? `Posted to the class channel.${missing > 0 ? ` ${missing} student${missing === 1 ? " has" : "s have"} no phone on file and won't be able to connect.` : ""}`
      : `Link ready — send it to the class.${missing > 0 ? ` ${missing} student${missing === 1 ? " has" : "s have"} no phone on file.` : ""}`,
    url: invite.url ?? undefined,
    code: invite.code,
    posted,
  };
}

export interface BulkStudentState {
  error?: string;
  /** Accounts created this run, in the order pasted — this IS the credentials
   *  sheet, and the passwords are never retrievable again. */
  created?: {
    name: string;
    login: string;
    email: string | null;
    password: string;
    /** Shown on the credentials sheet so a missing one is VISIBLE. Without a
     *  phone a student cannot collect their own login over Telegram, and
     *  finding that out later means chasing thirty people. */
    phone: string | null;
  }[];
  /** Lines that produced no account, each with the reason. */
  skipped?: { line: string; reason: string }[];
}

/** One class at a time. Each student costs an auth-user round trip, so a bigger
 *  paste risks the request being killed half-way — and a half-done batch whose
 *  passwords were never shown is the worst possible outcome. */
const MAX_BULK_STUDENTS = 30;

/**
 * Create a whole class from a pasted list — the way a center actually onboards.
 * One student per line:
 *
 *     Aziza Karimova
 *     Bekzod Toshmatov, bekzod.t
 *     Dilnoza Rashidova, dilnoza@example.com
 *
 * Extra fields are optional and order-free: anything with an `@` is the email,
 * anything else is the login. A missing login is derived from the name
 * (`dilnoza.r`) and de-duplicated against every login on the platform AND the
 * rest of the paste. A missing password is generated.
 *
 * DELIBERATELY SENDS NO EMAIL, unlike the single-student form. Thirty SMTP round
 * trips inside one request is how this times out, and the credentials sheet the
 * teacher downloads is the delivery mechanism here. An address given on a line
 * still lands on the account, so that student keeps email password reset.
 *
 * Every row is independent: one bad line is reported and skipped, it never costs
 * the other twenty-nine their accounts.
 */
export async function addStudentsBulk(
  _prev: BulkStudentState,
  formData: FormData,
): Promise<BulkStudentState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can add students." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing group." };

  const lines = String(formData.get("roster") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { error: "Paste at least one name." };
  if (lines.length > MAX_BULK_STUDENTS) {
    return {
      error: `That's ${lines.length} students. Add up to ${MAX_BULK_STUDENTS} at a time so nothing is lost half-way — paste the rest straight after.`,
    };
  }

  const supabase = await createClient();
  // RLS hides other teachers' groups, so a hit here proves the caller manages it.
  const { data: group } = await supabase
    .from("groups")
    .select("id, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Group not found." };
  if (profile.role === "teacher" && group.teacher_id !== profile.id) {
    return { error: "You can only add students to your own groups." };
  }

  const admin = createAdminClient();
  const created: NonNullable<BulkStudentState["created"]> = [];
  const skipped: NonNullable<BulkStudentState["skipped"]> = [];
  const loginsThisBatch = new Set<string>();

  for (const [i, line] of lines.entries()) {
    const parsed = parseRosterLine(line);
    if (!parsed) {
      skipped.push({ line, reason: "Couldn't read a name on this line." });
      continue;
    }
    if (parsed.login && !LOGIN_RE.test(parsed.login)) {
      skipped.push({ line, reason: `"${parsed.login}" isn't a valid login.` });
      continue;
    }

    // Seats are checked per row, not once: the limit can be reached mid-batch,
    // and everyone created before that point keeps their account.
    const seatError = await seatLimitError(supabase, profile.organization_id);
    if (seatError) {
      for (const rest of lines.slice(i)) skipped.push({ line: rest, reason: seatError });
      break;
    }

    const login = await resolveLogin(
      admin,
      parsed.login ?? loginFromName(parsed.name),
      loginsThisBatch,
    );
    if (!login) {
      skipped.push({
        line,
        reason: "Every login built from this name is taken. Give one explicitly.",
      });
      continue;
    }

    const password = generatePassword();
    const contactEmail = parsed.email || null;
    const email = centerAuthEmail(login);

    const { data: account, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { organization_id: profile.organization_id, role: "student" },
      user_metadata: { full_name: parsed.name },
    });
    if (createError || !account?.user) {
      const already = /already|exists|registered/i.test(createError?.message ?? "");
      skipped.push({
        line,
        reason: already
          ? `The login "${login}" is already in use.`
          : (createError?.message ?? "Could not create the account."),
      });
      continue;
    }

    const { error: placeError } = await placeUserInOrg(admin, account.user.id, {
      organizationId: profile.organization_id,
      role: "student",
      fullName: parsed.name,
      username: login,
      contactEmail,
      // Carried through because it is now an IDENTITY, not a contact detail:
      // the bot binds a student to their account by matching the number
      // Telegram reports against this one. A roster imported without phones is
      // a class that cannot self-connect.
      phone: parsed.phone,
    });
    if (placeError) {
      await admin.auth.admin.deleteUser(account.user.id);
      skipped.push({ line, reason: placeError });
      continue;
    }

    const { error: memberError } = await admin.from("group_members").insert({
      group_id: groupId,
      student_id: account.user.id,
      organization_id: profile.organization_id,
      added_by: profile.id,
    });
    // The account exists and the password has been generated — report it either
    // way, or the teacher hands out credentials for an account they can't see.
    if (memberError) {
      skipped.push({
        line,
        reason: `Account created (login ${login}) but joining the group failed: ${memberError.message}`,
      });
    }

    loginsThisBatch.add(login);
    created.push({ name: parsed.name, login, email: contactEmail, password, phone: parsed.phone });
  }

  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath("/console/students");

  if (created.length === 0) {
    return { error: "No accounts were created.", skipped };
  }
  return { created, skipped: skipped.length > 0 ? skipped : undefined };
}

/** `Name`, `Name, login`, `Name, email`, `Name, login, email` — in any order
 *  after the name, comma- or tab-separated (a paste from a spreadsheet). */
function parseRosterLine(
  line: string,
): { name: string; login: string | null; email: string; phone: string | null } | null {
  const parts = line
    .split(/[\t,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const name = parts.shift();
  if (!name) return null;

  let login: string | null = null;
  let email = "";
  let phone: string | null = null;
  for (const part of parts) {
    if (part.includes("@")) {
      email = part.toLowerCase();
      continue;
    }
    // A PHONE, TOLD APART BY SHAPE rather than by column. The fields here are
    // deliberately order-free — a centre's spreadsheet puts them in whatever
    // order it already had — so each one has to identify itself. A phone is the
    // only field that is mostly digits: `phoneKey` returns null for anything
    // with fewer than nine of them, which rules out a login like `aziza2` and
    // a name like `10B` without a second rule.
    if (phoneKey(part)) {
      phone = part;
      continue;
    }
    login = part.toLowerCase();
  }
  return { name, login, email, phone };
}

/** Build a login from a name the way a teacher would: `dilnoza.r`. Cyrillic is
 *  transliterated rather than dropped — a class list pasted from a Russian
 *  register must not produce thirty identical empty logins. */
function loginFromName(name: string): string {
  const tokens = transliterate(name)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  let base = tokens[0] ?? "";
  if (tokens.length > 1) base = `${tokens[0]}.${tokens[tokens.length - 1][0]}`;
  base = base.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  // LOGIN_RE needs at least three characters, first and last alphanumeric.
  while (base.length > 0 && base.length < 3) base += "1";
  return base || "student";
}

/** First free login in the `base, base2, base3…` series — free both on the
 *  platform (logins are global) and within this paste. */
async function resolveLogin(
  admin: ReturnType<typeof createAdminClient>,
  base: string,
  usedInBatch: Set<string>,
): Promise<string | null> {
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? base : `${base}${n}`;
    if (!LOGIN_RE.test(candidate) || usedInBatch.has(candidate)) continue;
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!taken) return candidate;
  }
  return null;
}

/**
 * Create a teacher outright, the same way a teacher creates a student: name +
 * login + password, email optional. center_admin only.
 *
 * The tokenized invite path still exists and is better when you have a real
 * address and want them to set their own password. This is for the common case
 * in a center — the teacher is standing next to you and needs an account now.
 */
export async function addTeacherAccount(
  _prev: AddStudentState,
  formData: FormData,
): Promise<AddStudentState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can add staff." };
  }

  // Teacher or administrator — the same account-creation flow, because the two
  // differ only in what they may reach, and the owner is standing next to
  // whichever of them they just hired.
  const staffRole = String(formData.get("staff_role") ?? "teacher").trim();
  if (staffRole !== "teacher" && staffRole !== "administrator") {
    return { error: "Choose a valid role." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const login = String(formData.get("login") ?? "")
    .trim()
    .toLowerCase();
  const emailInput = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const passwordInput = String(formData.get("password") ?? "").trim();

  if (!fullName) return { error: "Enter their name." };
  if (!login) return { error: "Enter a login for them." };
  if (!LOGIN_RE.test(login)) {
    return {
      error:
        "A login must be 3–32 characters: letters, digits, and . _ - in the middle (no spaces).",
    };
  }
  if (emailInput && !emailInput.includes("@")) return { error: "Enter a valid email address." };
  if (passwordInput && passwordInput.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const seatError = await seatLimitError(supabase, profile.organization_id);
  if (seatError) return { error: seatError };

  const password = passwordInput || generatePassword();
  const admin = createAdminClient();

  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", login)
    .maybeSingle();
  if (taken) {
    return { error: `The login "${login}" is already taken. Try adding a number, e.g. ${login}2.` };
  }

  // Same rule as students: the auth address is always synthetic, so a teacher
  // may give the same Gmail they already use for a personal account here.
  const contactEmail = emailInput || null;
  const email = centerAuthEmail(login);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { organization_id: profile.organization_id, role: staffRole },
    user_metadata: { full_name: fullName },
  });
  if (createError || !created?.user) {
    const already = /already|exists|registered/i.test(createError?.message ?? "");
    return {
      error: already
        ? `The login "${login}" is already in use. Pick another one.`
        : (createError?.message ?? "Could not create the account."),
    };
  }

  const { error: placeError } = await placeUserInOrg(admin, created.user.id, {
    organizationId: profile.organization_id,
    role: staffRole,
    fullName,
    username: login,
    contactEmail,
  });
  if (placeError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: placeError };
  }

  let emailNote: string | null = null;
  if (contactEmail) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    emailNote = await sendCredentials({
      to: contactEmail,
      name: fullName,
      login,
      password,
      centerName: (org?.name as string | null) ?? "your center",
    });
  }

  revalidatePath("/console/teachers");
  return {
    created: { name: fullName, login, email: contactEmail, password },
    emailNote: emailNote ?? undefined,
  };
}

/** Email a new student their sign-in details. Returns a line for the teacher
 *  about what happened — sending is best-effort, never a blocker. */
async function sendCredentials(args: {
  to: string;
  name: string;
  login: string;
  password: string;
  centerName: string;
}): Promise<string> {
  const signInUrl = `${serverEnv.siteUrl}/sign-in`;
  const result = await sendEmail({
    to: args.to,
    subject: `Your ${args.centerName} account on EngProgress`,
    text:
      `Hi ${args.name},\n\n` +
      `${args.centerName} has set up your EngProgress account for IELTS practice.\n\n` +
      `Sign in here: ${signInUrl}\n` +
      `Login:    ${args.login}\n` +
      `Password: ${args.password}\n\n` +
      `Please change your password after you sign in.\n\n— EngProgress`,
    html:
      `<p>Hi ${escapeHtml(args.name)},</p>` +
      `<p><strong>${escapeHtml(args.centerName)}</strong> has set up your EngProgress account for IELTS practice.</p>` +
      `<p><a href="${signInUrl}">Sign in here</a></p>` +
      `<p>Login: <strong>${escapeHtml(args.login)}</strong><br>` +
      `Password: <strong>${escapeHtml(args.password)}</strong></p>` +
      `<p>Please change your password after you sign in.</p><p>— EngProgress</p>`,
  });

  return result.sent
    ? `Sign-in details emailed to ${args.to}.`
    : `Couldn't email the details (${result.detail}) — hand them over below instead.`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type RlsClient = Awaited<ReturnType<typeof createClient>>;

/** Student seats are a plan limit; pending invites count so a center can't
 *  oversubscribe by issuing links it hasn't spent yet. Skipped entirely while
 *  the org is unmetered (`billing_enforced = false` — centers, for now; see
 *  migration 20260807150000). */
async function seatLimitError(supabase: RlsClient, organizationId: string): Promise<string | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, billing_enforced")
    .eq("id", organizationId)
    .maybeSingle();
  if (org?.billing_enforced === false) return null;

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
