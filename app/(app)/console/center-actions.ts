"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
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

const STATUSES = new Set(["present", "late", "absent"]);

/* ── attendance ───────────────────────────────────────────────────────────── */

/**
 * Save a register. Marks arrive as `mark:<studentId>` fields, so the form can
 * post the whole class in one go and a student left unmarked simply has no row
 * rather than a guessed one.
 */
export async function saveRegister(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can mark attendance." };
  }

  const groupId = String(formData.get("group_id") ?? "").trim();
  const heldOn = String(formData.get("held_on") ?? "").trim();
  if (!groupId) return { error: "Pick a class first." };
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
  if (!group) return { error: "Class not found." };

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
  if (marksError) return { error: marksError.message };

  revalidatePath("/console/attendance");
  revalidatePath(`/console/groups/${groupId}`);
  const absent = marks.filter((m) => m.status === "absent").length;
  return {
    ok: `Register saved — ${marks.length - absent} in, ${absent} absent.`,
  };
}

export async function sendAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can send announcements." };
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
  if (audience === "group" && !groupId) return { error: "Pick which class." };

  const supabase = await createClient();

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
    channels = await sendAnnouncementTelegram({
      organizationId: profile.organization_id,
      groupIds: audience === "group" && groupId ? [groupId] : [],
      subject,
      body,
    });
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
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can connect a channel." };
  }
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing class." };

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
  if (profile.role !== "center_admin" && profile.role !== "teacher") {
    return { error: "Only center staff can disconnect a channel." };
  }
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!groupId) return { error: "Missing class." };

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
