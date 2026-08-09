"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { notify } from "@/lib/notifications/send";
import { createClient } from "@/lib/supabase/server";

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

/* ── certificates ─────────────────────────────────────────────────────────── */

/** Short, unambiguous verification code: no O/0 or I/1 to mistype. */
function certificateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${pick()}-${pick()}`;
}

export async function issueCertificate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  // A certificate is the center's statement, not one teacher's.
  if (profile.role !== "center_admin") {
    return { error: "Only a center admin can issue certificates." };
  }

  const studentId = String(formData.get("student_id") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const bandRaw = String(formData.get("band") ?? "").trim();
  if (!studentId) return { error: "Pick a student." };
  if (!course) return { error: "Name the course." };

  const band = bandRaw ? Number(bandRaw) : null;
  if (band != null && (Number.isNaN(band) || band < 0 || band > 9)) {
    return { error: "A band is between 0 and 9." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("certificates").insert({
    organization_id: profile.organization_id,
    student_id: studentId,
    course,
    band,
    code: certificateCode(),
    issued_by: profile.id,
  });
  if (error) return { error: error.message };

  await notify({
    organizationId: profile.organization_id,
    recipientIds: [studentId],
    type: "announcement",
    title: "Your certificate has been issued",
    body: `${course}${band != null ? ` · Band ${band.toFixed(1)}` : ""}`,
  });

  revalidatePath("/console/certificates");
  return { ok: "Certificate issued." };
}

/* ── announcements ────────────────────────────────────────────────────────── */

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

  revalidatePath("/console/announcements");
  return {
    ok: `Sent to ${recipientIds.length} ${recipientIds.length === 1 ? "person" : "people"}.`,
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
