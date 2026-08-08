"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireOrgUser } from "@/lib/auth";
import { uploadAvatar } from "@/lib/console/avatars";
import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { generateWritingPrompt, reviewWritingPrompt, PromptServiceError } from "@/lib/prompts/service";
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
}

/** Logins are typed by hand, often from a whiteboard: letters, digits and a few
 *  separators only, and case-insensitive (stored lowercase). */
const LOGIN_RE = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])$/;

/** Students created without a real address get an address on a domain we own
 *  that has no mail exchanger — valid to Supabase, undeliverable in practice,
 *  and impossible to collide with someone's real inbox. */
const NO_MAIL_DOMAIN = "students.engprogress.com";

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
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can create groups." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a group name." };
  const teacherId =
    profile.role === "teacher"
      ? profile.id
      : String(formData.get("teacher_id") ?? "").trim() || null;

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
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
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

  if (!groupId) return { error: "Missing group." };
  if (!fullName) return { error: "Enter the student's name." };
  if (!login) return { error: "Enter a login for the student." };
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

  // The email is optional; a student without one signs in by login alone.
  const email = emailInput || `${login}@${NO_MAIL_DOMAIN}`;

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
  // until you're in), so check before creating an auth user we'd have to undo.
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", login)
    .maybeSingle();
  if (taken) {
    return { error: `The login "${login}" is already taken. Try adding a number, e.g. ${login}2.` };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
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
        ? `${email} already has an account on the platform. Use a different email or login — moving an existing personal account into a center isn't supported yet.`
        : (createError?.message ?? "Could not create the account."),
    };
  }

  const { error: placeError } = await placeUserInOrg(admin, created.user.id, {
    organizationId: profile.organization_id,
    role: "student",
    fullName,
    username: login,
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
  if (emailInput) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    emailNote = await sendCredentials({
      to: emailInput,
      name: fullName,
      login,
      password,
      centerName: (org?.name as string | null) ?? "your center",
    });
  }

  revalidatePath(`/console/groups/${groupId}`);
  return {
    created: { name: fullName, login, email: emailInput || null, password },
    warning: photoWarning ?? undefined,
    emailNote: emailNote ?? undefined,
  };
}

export interface BulkStudentState {
  error?: string;
  /** Accounts created this run, in the order pasted — this IS the credentials
   *  sheet, and the passwords are never retrievable again. */
  created?: { name: string; login: string; email: string | null; password: string }[];
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
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
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

    const login = await resolveLogin(admin, parsed.login ?? loginFromName(parsed.name), loginsThisBatch);
    if (!login) {
      skipped.push({ line, reason: "Every login built from this name is taken. Give one explicitly." });
      continue;
    }

    const password = generatePassword();
    const email = parsed.email || `${login}@${NO_MAIL_DOMAIN}`;

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
          ? `${email} already has an account on the platform.`
          : (createError?.message ?? "Could not create the account."),
      });
      continue;
    }

    const { error: placeError } = await placeUserInOrg(admin, account.user.id, {
      organizationId: profile.organization_id,
      role: "student",
      fullName: parsed.name,
      username: login,
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
    created.push({ name: parsed.name, login, email: parsed.email || null, password });
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
function parseRosterLine(line: string): { name: string; login: string | null; email: string } | null {
  const parts = line
    .split(/[\t,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const name = parts.shift();
  if (!name) return null;

  let login: string | null = null;
  let email = "";
  for (const part of parts) {
    if (part.includes("@")) email = part.toLowerCase();
    else login = part.toLowerCase();
  }
  return { name, login, email };
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

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

function transliterate(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (é → e)
    .replace(/[ʻʼ'’`]/g, "") // Uzbek Latin oʻ/gʻ and stray apostrophes
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("");
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
    return { error: "Only a center admin can add teachers." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const login = String(formData.get("login") ?? "")
    .trim()
    .toLowerCase();
  const emailInput = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const passwordInput = String(formData.get("password") ?? "").trim();

  if (!fullName) return { error: "Enter the teacher's name." };
  if (!login) return { error: "Enter a login for the teacher." };
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

  // Same rule as students: no address means a synthetic one on a domain with no
  // mail exchanger, so they sign in by login and cannot reset by email.
  const email = emailInput || `${login}@${NO_MAIL_DOMAIN}`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { organization_id: profile.organization_id, role: "teacher" },
    user_metadata: { full_name: fullName },
  });
  if (createError || !created?.user) {
    const already = /already|exists|registered/i.test(createError?.message ?? "");
    return {
      error: already
        ? `${email} already has an account on the platform. Use a different email or login.`
        : (createError?.message ?? "Could not create the account."),
    };
  }

  const { error: placeError } = await placeUserInOrg(admin, created.user.id, {
    organizationId: profile.organization_id,
    role: "teacher",
    fullName,
    username: login,
  });
  if (placeError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: placeError };
  }

  let emailNote: string | null = null;
  if (emailInput) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    emailNote = await sendCredentials({
      to: emailInput,
      name: fullName,
      login,
      password,
      centerName: (org?.name as string | null) ?? "your center",
    });
  }

  revalidatePath("/console/teachers");
  return {
    created: { name: fullName, login, email: emailInput || null, password },
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

/** Readable throwaway password — the student can change it later. Avoids
 *  look-alike characters so it survives being written on a whiteboard. */
function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

type RlsClient = Awaited<ReturnType<typeof createClient>>;

/** Student seats are a plan limit; pending invites count so a center can't
 *  oversubscribe by issuing links it hasn't spent yet. Skipped entirely while
 *  the org is unmetered (`billing_enforced = false` — centers, for now; see
 *  migration 20260807150000). */
async function seatLimitError(
  supabase: RlsClient,
  organizationId: string,
): Promise<string | null> {
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
