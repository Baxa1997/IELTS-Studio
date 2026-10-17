"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { canManagePeople, requireOrgUser } from "@/lib/auth";
import { uploadAvatar } from "@/lib/console/avatars";
import { formatMoney } from "@/lib/finance/money";
import { invoiceOnJoin } from "@/lib/finance/invoice-on-join";
import { postGroupInvite } from "@/lib/telegram/send";
import { createGroupInvite, sendCredentialsTelegram } from "@/lib/telegram/student";
import { serverEnv } from "@/lib/env";
import { phoneKey } from "@/lib/phone";
import { generatePassword } from "@/lib/passwords";
import { placeUserInOrg } from "@/lib/provision";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  LOGIN_RE,
  centerAuthEmail,
  loginFromName,
  parseRosterLine,
  resolveLogin,
  seatLimitError,
} from "./_lib/accounts";
import { realContactEmail, sendCredentials } from "./_lib/emails";

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
  /** What this student owes for the month they joined in, and that an invoice
   *  now exists for it. Absent when the class has no fee — a centre not using
   *  the finance side should never be shown money it did not ask about. */
  invoiceNote?: string;
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

  // WHAT THEY OWE, SAID WHILE THE PARENT IS STILL STANDING THERE. Invoices
  // were otherwise raised in a batch from the Finance page, so a student added
  // on the 5th stayed uninvoiced until somebody remembered — and the teacher,
  // who is the one actually having the conversation about money, never saw a
  // figure at all. Prorated by lesson using the same arithmetic the batch uses.
  const invoice = await invoiceOnJoin({
    organizationId: profile.organization_id,
    studentId: created.user.id,
    groupId,
  });
  const invoiceNote =
    invoice.amountMinor != null
      ? `${formatMoney(invoice.amountMinor, invoice.currency)} for this month — ${invoice.billed} of ${invoice.planned} lessons. Invoice raised.`
      : (invoice.why ?? undefined);

  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath("/console/students");
  revalidatePath("/console/finance/invoices");
  return {
    created: { name: fullName, login: finalLogin, email: contactEmail, password },
    warning: photoWarning ?? undefined,
    emailNote: emailNote ?? undefined,
    telegramNote: telegramSent ? "Sent to their Telegram too." : undefined,
    invoiceNote,
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
    /** What happened to the email copy — absent when there is no real address. */
    emailNote?: string;
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
    .select("full_name, username, role, organization_id, contact_email")
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

  // And by email, when the student gave a real address. The one channel that
  // reaches a student who never connected Telegram — the account form already
  // emails first credentials to the same address, so a reset now does too.
  const contact = realContactEmail(student.contact_email as string | null);
  const emailNote = contact
    ? await sendCredentials({
        to: contact,
        name: (student.full_name as string | null) ?? "there",
        login: (student.username as string | null) ?? "—",
        password,
        centerName: (org2?.name as string | null) ?? "your center",
        kind: "reset",
      })
    : undefined;

  revalidatePath(`/console/groups/${groupId}`);
  revalidatePath(`/console/students/${studentId}`);
  return {
    done: {
      studentId,
      name: (student.full_name as string | null) ?? "This student",
      login: (student.username as string | null) ?? "—",
      password,
      sentTelegram,
      emailNote,
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
  /** How many of `created` are being emailed their details, after the response. */
  emailing?: number;
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
 * EMAIL GOES OUT AFTER THE RESPONSE, NEVER BEFORE IT. Thirty SMTP round trips
 * inside the request is how this used to risk timing out with the passwords
 * never shown — the worst outcome this action has. So the sheet is returned
 * first and `after()` sends each student with a real address their details
 * once it is on the teacher's screen. The sheet stays the guaranteed delivery;
 * the emails are a bonus that cannot cost it.
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

  const toEmail = created.filter((c) => realContactEmail(c.email));
  if (toEmail.length > 0) {
    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    const centerName = (org?.name as string | null) ?? "your center";
    // ⚠️ `after`, not awaited here: see the note above the function. A few at a
    // time, because every send opens its own SMTP connection.
    after(async () => {
      let next = 0;
      const worker = async () => {
        while (next < toEmail.length) {
          const c = toEmail[next++];
          const note = await sendCredentials({
            to: c.email!,
            name: c.name,
            login: c.login,
            password: c.password,
            centerName,
          });
          if (!note.startsWith("Sign-in details emailed")) console.error("[bulk-add] " + note);
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
    });
  }

  return {
    created,
    skipped: skipped.length > 0 ? skipped : undefined,
    emailing: toEmail.length > 0 ? toEmail.length : undefined,
  };
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
