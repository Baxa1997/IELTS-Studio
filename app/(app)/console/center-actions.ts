"use server";

import { revalidatePath } from "next/cache";

import { canManagePeople, requireOrgUser } from "@/lib/auth";
import { notify } from "@/lib/notifications/send";
import { createClient } from "@/lib/supabase/server";
import { sendAnnouncementTelegram } from "@/lib/telegram/send";

/**
 * The center-operations actions: marking a register, issuing a certificate,
 * sending an announcement, and editing the center's own profile.
 *
 * Every one of these re-checks the caller's role on the server. RLS is the real
 * gate (see migration 20260809120000) — these checks exist so the UI can say
 * something useful instead of surfacing a policy violation.
 */

export interface ActionState {
  error?: string;
  ok?: string;
}

/**
 * The four marks a register can carry.
 *
 * `excused` is the one that earns its keep. Without it every "my mother phoned
 * ahead" absence looks identical to a truancy, the two-absences alert fires on
 * the wrong student, and a teacher learns within a fortnight to ignore the
 * alerts entirely. It is not a softer absent — it leaves the attendance
 * denominator altogether (see `v_student_attendance`).
 */
const STATUSES = new Set(["present", "late", "absent", "excused"]);

/* ── attendance ───────────────────────────────────────────────────────────── */

/**
 * Save a register. Marks arrive as `mark:<studentId>` fields, so the form can
 * post the whole class in one go and a student left unmarked simply has no row
 * rather than a guessed one.
 */
export async function saveRegister(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can mark attendance." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const heldOn = String(formData.get("held_on") ?? "").trim();
  if (!groupId) return { error: "Pick a group first." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) return { error: "Pick a valid date." };

  const marks: { student_id: string; status: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("mark:")) continue;
    const status = String(value);
    if (!STATUSES.has(status)) continue;
    marks.push({ student_id: key.slice(5), status });
  }
  if (marks.length === 0) return { error: "Nobody was marked." };

  const supabase = await createClient();

  // RLS hides groups this person doesn't manage, so a hit proves authority.
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { error: "Group not found." };

  // One register per group per day — re-saving corrects the same row rather
  // than stacking a second one.
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert(
      {
        organization_id: profile.organization_id,
        group_id: groupId,
        held_on: heldOn,
        state: "marked",
        marked_by: profile.id,
        marked_at: new Date().toISOString(),
      },
      { onConflict: "group_id,held_on" },
    )
    .select("id")
    .single();
  if (sessionError || !session) {
    return { error: sessionError?.message ?? "Could not open the register." };
  }

  const { error: marksError } = await supabase.from("attendance_marks").upsert(
    marks.map((m) => ({
      session_id: session.id as string,
      student_id: m.student_id,
      organization_id: profile.organization_id,
      status: m.status,
    })),
    { onConflict: "session_id,student_id" },
  );
  // The 7-day lock is a database trigger and it raises a sentence, not a code
  // — "This register closed on 09 Aug 2026 …" — so the message passes straight
  // through rather than being translated twice.
  if (marksError) return { error: marksError.message };

  revalidatePath("/console/attendance");
  revalidatePath(`/console/groups/${groupId}`);
  const inRoom = marks.filter((m) => m.status === "present" || m.status === "late").length;
  const absent = marks.filter((m) => m.status === "absent").length;
  const excused = marks.filter((m) => m.status === "excused").length;
  return {
    ok:
      `Register saved — ${inRoom} in, ${absent} absent` +
      (excused > 0 ? `, ${excused} excused.` : "."),
  };
}

/* ── putting an alert down ────────────────────────────────────────────────── */

/**
 * Silence one alert type for a week.
 *
 * A WEEK, NOT FOR EVER, and that is the whole design. An alert nobody can
 * silence is one a centre learns to scroll past — and once they are scrolling
 * past one row they are scrolling past the panel, which is the only part of the
 * console that tells an owner something is wrong. Seven days is long enough to
 * act on it and short enough that a problem nobody actually fixed comes back.
 *
 * The dismissal writes itself to `center_audit_log` from a trigger, so "nobody
 * told me the students had gone quiet" is answerable.
 */
export async function dismissAlert(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can put an alert down." };
  }

  const key = String(formData.get("alert_key") ?? "").trim();
  if (!key) return { error: "Which alert?" };

  const until = new Date(Date.now() + 7 * 86400_000).toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("alert_dismissals")
    .upsert(
      {
        organization_id: profile.organization_id,
        alert_key: key,
        dismissed_by: profile.id,
        dismissed_at: new Date().toISOString(),
        expires_at: until,
      },
      { onConflict: "organization_id,alert_key" },
    )
    .select("alert_key");
  if (error) return { error: error.message };

  revalidatePath("/console");
  return { ok: "Put down for 7 days. It comes back if it is still true." };
}

/** Bring one back before its week is up. */
export async function restoreAlert(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can change this." };
  }
  const key = String(formData.get("alert_key") ?? "").trim();
  if (!key) return { error: "Which alert?" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("alert_dismissals")
    .delete()
    .eq("alert_key", key)
    .select("alert_key");
  if (error) return { error: error.message };

  revalidatePath("/console");
  return { ok: "Back on the list." };
}

/* ── chasing the work ─────────────────────────────────────────────────────── */

/**
 * Nudge the students who have not handed a practice in.
 *
 * THE STUDENT IDS ARRIVE FROM THE BROWSER, so they are treated as a request
 * rather than as fact: they are intersected with the group's real roster, read
 * through RLS. Without that, anyone who can open this page could post a list of
 * arbitrary uuids and have the platform message strangers on their behalf —
 * and it would look like an ordinary reminder to everyone who received it.
 *
 * In-app only for now. A Telegram nudge would reach further and is the obvious
 * next step, but "we messaged your parents" is not a thing to switch on without
 * a centre asking for it.
 */
export async function remindNonSubmitters(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can send a reminder." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const asked = formData.getAll("student_id").map((v) => String(v));
  if (!groupId || asked.length === 0) return { error: "Nobody to remind." };

  const supabase = await createClient();

  // RLS narrows this to a group the caller may actually see, which is what
  // makes the intersection below a real check rather than a formality.
  const { data: roster, error } = await supabase
    .from("group_members")
    .select("student_id")
    .eq("group_id", groupId);
  if (error) return { error: error.message };

  const real = new Set((roster ?? []).map((r) => r.student_id as string));
  const recipients = asked.filter((id) => real.has(id));
  if (recipients.length === 0) {
    return { error: "Those students are not in this group." };
  }

  const dueAt = String(formData.get("due_at") ?? "").trim();
  const when = dueAt
    ? ` It was due ${new Date(dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`
    : "";

  await notify({
    organizationId: profile.organization_id,
    recipientIds: recipients,
    type: "assignment_due_soon",
    title: title ? `Still to hand in: ${title}` : "You have practice still to hand in",
    body: `Your teacher is waiting on this one.${when}`,
    href: "/assignments",
  });

  revalidatePath("/console/practice");
  return {
    ok: `Reminded ${recipients.length} student${recipients.length === 1 ? "" : "s"}.`,
  };
}

/* ── lessons that did not happen ──────────────────────────────────────────── */

/**
 * Write off one lesson.
 *
 * Not a delete and not an edit — the timetable is a recurrence rule, so the
 * lesson being cancelled has no row of its own until someone marks its
 * register. This writes the fact that it did not happen, and attendance
 * percentages, the fee divisor and the unmarked-register alert all read it.
 *
 * The reason is required. "Cancelled" with no reason is an argument in three
 * weeks' time when a parent asks why they were charged for a full month.
 */
export async function cancelLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can cancel a lesson." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const heldOn = String(formData.get("held_on") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!groupId) return { error: "Pick a group first." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) return { error: "Pick a valid date." };
  if (!reason) return { error: "Say why — it is the part someone asks about later." };
  if (reason.length > 300) return { error: "Keep the reason under 300 characters." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_cancellations")
    .upsert(
      {
        organization_id: profile.organization_id,
        group_id: groupId,
        held_on: heldOn,
        reason,
        cancelled_by: profile.id,
      },
      { onConflict: "group_id,held_on" },
    )
    .select("id");
  // `.select()` after every write: an RLS-filtered write reports success while
  // changing nothing, which is how this schema hides its failures.
  if (error) return { error: error.message };

  revalidatePath("/console/attendance");
  revalidatePath("/console");
  revalidatePath(`/console/groups/${groupId}`);
  return { ok: "Lesson cancelled. It is out of attendance and out of the fee divisor." };
}

/** Put a cancelled lesson back — someone cancelled the wrong date. */
export async function restoreLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can restore a lesson." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const heldOn = String(formData.get("held_on") ?? "").trim();
  if (!groupId || !/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) return { error: "Pick a valid lesson." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_cancellations")
    .delete()
    .eq("group_id", groupId)
    .eq("held_on", heldOn)
    .select("id");
  if (error) return { error: error.message };

  revalidatePath("/console/attendance");
  revalidatePath("/console");
  revalidatePath(`/console/groups/${groupId}`);
  return { ok: "Lesson restored — its register is expected again." };
}

/* ── registers that have closed ───────────────────────────────────────────── */

/**
 * Reopen a register that locked.
 *
 * A center admin's alone, and the database says so as well as this does: the
 * trigger on `attendance_sessions` refuses the write and writes the unlock to
 * `center_audit_log` itself, so the log records what happened rather than what
 * the application meant to happen.
 */
export async function unlockRegister(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can reopen a closed register." };
  }

  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) return { error: "That register does not exist yet." };

  const supabase = await createClient();
  // 24 hours: long enough to fix the mistake in front of you, short enough that
  // nobody has to remember to close it again.
  const until = new Date(Date.now() + 24 * 3600_000).toISOString();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .update({ unlocked_until: until })
    .eq("id", sessionId)
    .select("id, group_id, held_on");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That register is not yours to reopen." };

  revalidatePath("/console/attendance");
  return { ok: "Reopened for 24 hours. The unlock is in the center's activity log." };
}

/* ── days the center is shut ──────────────────────────────────────────────── */

export async function saveHoliday(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can set the center's holidays." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const startsOn = String(formData.get("starts_on") ?? "").trim();
  const endsOn = String(formData.get("ends_on") ?? "").trim() || startsOn;
  if (!name) return { error: "Name it — “Navruz” tells the timetable more than a date does." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) return { error: "Pick a start date." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return { error: "Pick an end date." };
  if (endsOn < startsOn) return { error: "It cannot end before it starts." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("center_holidays")
    .insert({
      organization_id: profile.organization_id,
      name,
      starts_on: startsOn,
      ends_on: endsOn,
      created_by: profile.id,
    })
    .select("id");
  if (error) {
    return {
      error: error.code === "23505" ? "That holiday is already in the calendar." : error.message,
    };
  }

  revalidatePath("/console/settings");
  revalidatePath("/console/calendar");
  revalidatePath("/console/attendance");
  revalidatePath("/console");
  return { ok: `${name} saved — no lessons, no registers, no fees on those days.` };
}

export async function deleteHoliday(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can change the center's holidays." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Pick a holiday." };

  const supabase = await createClient();
  const { error } = await supabase.from("center_holidays").delete().eq("id", id).select("id");
  if (error) return { error: error.message };

  revalidatePath("/console/settings");
  revalidatePath("/console/calendar");
  revalidatePath("/console/attendance");
  return { ok: "Removed — those days are working days again." };
}

export async function sendAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && profile.role !== "teacher") {
    return { error: "Only center staff can send announcements." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "everyone").trim();
  const groupId = String(formData.get("group_id") ?? "").trim() || null;
  if (!subject) return { error: "Give it a subject." };
  if (!body) return { error: "Write the message." };
  if (!["everyone", "students", "teachers", "group"].includes(audience)) {
    return { error: "Pick an audience." };
  }
  if (audience === "group" && !groupId) return { error: "Pick which group." };

  const supabase = await createClient();

  // A teacher speaks to their own classes; the center speaks to everyone. The
  // database enforces this too (announcements_write, migration 20260812130000)
  // — this check exists so a teacher gets a sentence instead of a policy error.
  if (!isAdmin) {
    if (audience !== "group" || !groupId) {
      return { error: "You can announce to one of your groups. Pick the group." };
    }
    // RLS hides other teachers' groups, so a hit here proves they own it.
    const { data: owned } = await supabase
      .from("groups")
      .select("id, teacher_id")
      .eq("id", groupId)
      .maybeSingle();
    if (!owned || owned.teacher_id !== profile.id) {
      return { error: "You can only announce to your own groups." };
    }
  }

  // Resolve the audience to real people now, so the sent log records who it
  // actually reached rather than a rule that may mean something else later.
  let recipientIds: string[] = [];
  if (audience === "group" && groupId) {
    const { data } = await supabase
      .from("group_members")
      .select("student_id")
      .eq("group_id", groupId);
    recipientIds = (data ?? []).map((r) => r.student_id as string);
  } else {
    const { data } = await supabase.from("profiles").select("id, role");
    recipientIds = (data ?? [])
      .filter((p) => {
        if (audience === "students") return p.role === "student";
        if (audience === "teachers") return p.role === "teacher";
        return p.role === "student" || p.role === "teacher";
      })
      .map((p) => p.id as string);
  }

  const { error } = await supabase.from("announcements").insert({
    organization_id: profile.organization_id,
    subject,
    body,
    audience,
    group_id: groupId,
    recipients: recipientIds.length,
    sent_by: profile.id,
  });
  if (error) return { error: error.message };

  // In-app, not email: a center student may have no address that can receive
  // mail (see the login-name migration), so the bell is the only channel that
  // reaches everyone.
  await notify({
    organizationId: profile.organization_id,
    recipientIds,
    type: "announcement",
    title: subject,
    body,
  });

  // Optionally the same words in the class channel. A second delivery, not a
  // replacement: the bell reaches every account, Telegram reaches whoever
  // joined the channel — often parents, who have no account at all.
  let channels = 0;
  if (formData.get("telegram") === "on") {
    // The composer names every destination and sends back the ticked ones.
    // An empty list here means "post nowhere", NOT "post everywhere" — the
    // earlier version treated it as everywhere, so a message meant for one
    // class could land in five channels.
    const picked = formData.getAll("telegram_groups").map(String).filter(Boolean);
    const groupIds = audience === "group" && groupId ? [groupId] : picked;
    if (groupIds.length > 0) {
      channels = await sendAnnouncementTelegram({
        organizationId: profile.organization_id,
        groupIds,
        subject,
        body,
      });
      // Asked for and delivered nowhere: the channel was disconnected, or
      // Telegram refused every send. Saying "Sent" here is the lie that had
      // someone checking their channel for a post that never left.
      if (channels === 0) {
        revalidatePath("/console/announcements");
        return {
          ok: `Sent to ${recipientIds.length} in the app, but Telegram delivered nothing — check the group still shows a connected channel.`,
        };
      }
    }
  }

  revalidatePath("/console/announcements");
  const people = `${recipientIds.length} ${recipientIds.length === 1 ? "person" : "people"}`;
  return {
    ok:
      channels > 0
        ? `Sent to ${people} in the app, and posted to ${channels} Telegram channel${channels === 1 ? "" : "s"}.`
        : `Sent to ${people}.`,
  };
}

/* ── center profile ───────────────────────────────────────────────────────── */

/**
 * Rename the center. `status` and `plan` are NOT client-writable — column-level
 * grants stop that at the database, which is why this only touches `name`.
 */
export async function saveCenterProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can change the center's profile." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "The center needs a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", profile.organization_id);
  if (error) return { error: error.message };

  revalidatePath("/console", "layout");
  return { ok: "Saved." };
}

/**
 * How the center runs: where it is, when its week starts, which days it teaches.
 *
 * The timezone is the load-bearing one. Everything else in this app takes the
 * UTC day, which for the market it sells into means the console shows yesterday
 * until 05:00 and thinks a 19:30 lesson has not finished at 20:00. Both of
 * those make a "registers to mark" count a center owner can disprove by looking
 * out of the window.
 *
 * A missing row means every default in `CENTER_DEFAULTS`, so this upserts.
 */
export async function saveCenterSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can change these." };
  }

  const timezone = String(formData.get("timezone") ?? "").trim();
  // Validated by asking the platform, rather than by carrying a list that goes
  // stale every time a country moves its clocks.
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    return { error: "That is not a timezone this server recognises." };
  }

  const weekStartsOn = Number(formData.get("week_starts_on"));
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    return { error: "Pick the day your week starts on." };
  }

  const workingDays = formData
    .getAll("working_days")
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (workingDays.length === 0) return { error: "A center has to teach on at least one day." };

  const lessonMinutes = Number(formData.get("default_lesson_minutes"));
  if (!Number.isInteger(lessonMinutes) || lessonMinutes < 15 || lessonMinutes > 480) {
    return { error: "A lesson is between 15 and 480 minutes." };
  }

  const overridePolicy = String(formData.get("override_policy") ?? "teacher");
  if (!["teacher", "admin_only", "nobody"].includes(overridePolicy)) {
    return { error: "Pick who may correct an AI band." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("center_settings")
    .upsert(
      {
        organization_id: profile.organization_id,
        timezone,
        week_starts_on: weekStartsOn,
        working_days: workingDays,
        default_lesson_minutes: lessonMinutes,
        override_policy: overridePolicy,
      },
      { onConflict: "organization_id" },
    )
    .select("organization_id");
  if (error) return { error: error.message };

  // The timezone decides what "today" is on every console page, so the whole
  // layout has to be rebuilt rather than just this one.
  revalidatePath("/console", "layout");
  return { ok: "Saved. Every date in the console now reads in this timezone." };
}

/* ── telegram ─────────────────────────────────────────────────────────────── */

/**
 * Start the handshake: mint a code for this group and show it. The teacher
 * posts it in the channel; the bot's webhook matches it and records the chat id
 * (see app/api/telegram/webhook). A code, not a pasted chat id, because a chat
 * id is not a secret — the code is what proves the person linking the channel
 * can post in it.
 */
export async function startTelegramLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can connect a channel." };
  }
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing group." };

  // No O/0 or I/1 — this gets read off a screen and typed into Telegram.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const code = `${pick()}-${pick()}`;

  const supabase = await createClient();
  // RLS decides whether this person manages the group; upsert so re-running
  // replaces a stale code rather than piling rows up.
  const { error } = await supabase.from("telegram_links").upsert(
    {
      organization_id: profile.organization_id,
      group_id: groupId,
      link_code: code,
      code_expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      verified_at: null,
      chat_id: null,
      linked_by: profile.id,
    },
    { onConflict: "organization_id,group_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/console/groups/${groupId}`);
  return { ok: code };
}

/** Forget a channel. The bot stays in it; it just stops being posted to. */
export async function unlinkTelegram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (!canManagePeople(profile.role) && profile.role !== "teacher") {
    return { error: "Only center staff can disconnect a channel." };
  }
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing group." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("telegram_links")
    .delete()
    .eq("group_id", groupId)
    .eq("organization_id", profile.organization_id);
  if (error) return { error: error.message };

  revalidatePath(`/console/groups/${groupId}`);
  return { ok: "Disconnected." };
}

/* ── absence alerts ───────────────────────────────────────────────────────── */

/**
 * Save the absence-alert rules. SENDS NOTHING — see the migration.
 *
 * Stored ahead of the sender on purpose: who is told, after how many absences,
 * and over which channel is the part a center has opinions about, and it is
 * worth settling before a provider is chosen. When the sender is built it reads
 * this row and nothing else.
 */
export async function saveAlertSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only the center owner can change alert settings." };
  }

  const channels = formData
    .getAll("channels")
    .map(String)
    .filter((c) => c === "email" || c === "sms" || c === "telegram");

  const enabled = formData.get("enabled") === "on";
  const notifyStudent = formData.get("notify_student") === "on";
  const notifyGuardian = formData.get("notify_guardian") === "on";

  if (enabled && channels.length === 0) {
    return { error: "Pick at least one channel, or switch alerts off." };
  }
  if (enabled && !notifyStudent && !notifyGuardian) {
    return { error: "Pick who to tell — the student, their guardian, or both." };
  }

  const after = Number(formData.get("absences_before_alert") ?? 1);
  if (!Number.isInteger(after) || after < 1 || after > 10) {
    return { error: "Alert after 1 to 10 absences." };
  }

  const time = (key: string): string | null => {
    const raw = String(formData.get(key) ?? "").trim();
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : null;
  };
  const sender = String(formData.get("sms_sender") ?? "").trim();
  if (sender.length > 11) {
    return { error: "An SMS sender name is at most 11 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_alert_settings")
    .upsert(
      {
        organization_id: profile.organization_id,
        enabled,
        channels,
        absences_before_alert: after,
        notify_student: notifyStudent,
        notify_guardian: notifyGuardian,
        sms_sender: sender || null,
        quiet_hours_from: time("quiet_hours_from"),
        quiet_hours_to: time("quiet_hours_to"),
      },
      { onConflict: "organization_id" },
    )
    .select("organization_id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Those settings could not be saved." };

  revalidatePath("/console/attendance");
  return {
    ok: enabled
      ? "Alert rules saved. Nothing sends yet — the sender is not built."
      : "Alerts are off. The rules are kept for when you turn them back on.",
  };
}
