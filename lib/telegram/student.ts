import "server-only";

import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import { nameLooksLike } from "@/lib/names";
import { phoneKey } from "@/lib/phone";

import { escapeHtml, sendMessage, telegramConfigured } from "./send";

/**
 * Reaching ONE student privately, over Telegram.
 *
 * WHY THIS EXISTS AT ALL. Credentials have to get to a student somehow, and the
 * three obvious routes each have a problem here: email is barely used, SMS in
 * Uzbekistan is per-message paid AND template-moderated by the operator (change
 * one character and the text needs re-approving, which takes days), and handing
 * a password over in class does not scale past one group.
 *
 * Telegram has none of those problems and, in this market specifically, better
 * reach than any of them — around 85% of the country. Messages are free,
 * unlimited, and moderated by nobody.
 *
 * THE ONE CONSTRAINT, and everything here is shaped by it: a bot cannot start a
 * conversation. The student must open the bot first. So the flow is a deep link
 * carrying a one-time code — the student taps once, the webhook binds them, and
 * from then on anything personal can reach them directly.
 *
 * That first tap is not a nuisance to design around; it is the authentication.
 * Holding the code proves staff gave it to them, and opening it from their own
 * account proves the account is theirs.
 */

/** How long a student has to tap the link before it stops working.
 *
 *  A week rather than an hour: this gets printed on a slip and handed out in
 *  class, and a code that dies before the lesson ends is a code that generates
 *  a support message instead of a login. */
const CODE_TTL_DAYS = 7;

/** 40 bits, unambiguous alphabet. No 0/O or 1/I/L, because this gets read off
 *  paper and typed by a teenager on a phone. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function newCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export interface StudentInvite {
  code: string;
  /** What the student taps. Null when no bot username is configured. */
  url: string | null;
  expiresAt: string;
}

/**
 * Mint (or re-mint) the link that binds a student to their Telegram.
 *
 * Service-role, and called only from staff-gated server actions — the code IS
 * the authority to bind, so anyone able to mint one for a student could receive
 * that student's password. RLS on the table says the same thing; this is the
 * write path that has to be trusted not to be called from anywhere else.
 *
 * Re-minting REPLACES the previous code and any existing binding. That is the
 * behaviour a teacher expects from "send it again" when a student has changed
 * phone — and it means a lost device stops receiving within one click.
 */
export async function createStudentInvite(args: {
  organizationId: string;
  profileId: string;
}): Promise<StudentInvite> {
  const code = newCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_DAYS * 86_400_000).toISOString();

  const admin = createAdminClient();
  await admin
    .from("telegram_students")
    .upsert(
      {
        organization_id: args.organizationId,
        profile_id: args.profileId,
        link_code: code,
        code_expires_at: expiresAt,
        // Cleared deliberately: a fresh code means the old chat is no longer
        // the student's, so it must stop receiving before the new one starts.
        chat_id: null,
        verified_at: null,
      },
      { onConflict: "profile_id" },
    )
    .select("id");

  const bot = process.env.TELEGRAM_BOT_USERNAME;
  return {
    code,
    url: bot ? `https://t.me/${bot}?start=${code}` : null,
    expiresAt,
  };
}

/** The student's chat, if they have completed the tap. Null otherwise. */
export async function studentChatId(profileId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("telegram_students")
    .select("chat_id, verified_at")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data?.verified_at || data.chat_id == null) return null;
  return Number(data.chat_id);
}

/**
 * Their login details, in their own chat.
 *
 * UNLIKE THE CHANNEL ANNOUNCEMENTS, this carries something private — which is
 * exactly why it may only ever go to a chat bound by the code flow above. A
 * group channel is visible to everyone in it, parents included; sending a
 * password there would be a breach, not a bug. `studentChatId` returns only
 * verified private bindings, and nothing else in this module takes a chat id
 * from a caller.
 *
 * Returns false rather than throwing when the student has not bound Telegram,
 * so the caller can fall back to another channel — that decision is not this
 * function's to make.
 */
export async function sendCredentialsTelegram(args: {
  profileId: string;
  fullName: string;
  login: string;
  password: string;
  centerName: string;
  signInUrl: string;
}): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const chatId = await studentChatId(args.profileId);
  if (chatId == null) return false;

  const html = [
    `👋 <b>${escapeHtml(args.fullName)}</b>, welcome to ${escapeHtml(args.centerName)}.`,
    "",
    "Here is how you sign in:",
    `Login: <code>${escapeHtml(args.login)}</code>`,
    `Password: <code>${escapeHtml(args.password)}</code>`,
    "",
    `<a href="${escapeHtml(args.signInUrl)}">Open the app</a>`,
    "",
    "<i>Keep this message — and change your password once you are in.</i>",
  ].join("\n");

  return sendMessage(chatId, html);
}

/* ── the whole class at once ───────────────────────────────────────────────── */

/**
 * A code the class shares, so thirty students connect from one message.
 *
 * NOT A CREDENTIAL, and the distinction is what makes it safe to post in a
 * channel. On its own it names a class and nothing more; holding it lets
 * somebody ask the bot "who am I?", and the bot answers only if the phone
 * number Telegram reports matches a student on that roster. The secret that
 * decides the bind is the student's own phone, which this code neither contains
 * nor can reveal.
 *
 * Re-inviting REPLACES the class's code, which revokes the old one — what a
 * teacher means by "make a new link" after a code has been forwarded somewhere
 * it should not have gone.
 */
export async function createGroupInvite(args: {
  organizationId: string;
  groupId: string;
  createdBy: string;
}): Promise<StudentInvite> {
  const code = newCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_DAYS * 86_400_000).toISOString();

  const admin = createAdminClient();
  await admin
    .from("telegram_group_invites")
    .upsert(
      {
        organization_id: args.organizationId,
        group_id: args.groupId,
        code,
        expires_at: expiresAt,
        created_by: args.createdBy,
      },
      { onConflict: "group_id" },
    )
    .select("id");

  const bot = process.env.TELEGRAM_BOT_USERNAME;
  return { code, url: bot ? `https://t.me/${bot}?start=${code}` : null, expiresAt };
}

/** The class a code belongs to, if it is live. Null for unknown or expired. */
export async function groupForInviteCode(
  code: string,
): Promise<{ groupId: string; organizationId: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("telegram_group_invites")
    .select("group_id, organization_id, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;
  return {
    groupId: data.group_id as string,
    organizationId: data.organization_id as string,
  };
}

/**
 * Who, on this class roster, owns the number Telegram just reported.
 *
 * THE MATCH IS THE AUTHENTICATION. Everything else in this flow is public — the
 * class code goes in a channel, the names are never shown — so this comparison
 * is the only thing standing between a student and someone else's password. It
 * is therefore written to fail closed:
 *
 *  - a student with no phone on file can never match, because `phoneKey`
 *    returns null for both sides and null is not equal to null. In a table
 *    where most rows have no number, matching blanks would hand the first
 *    person who asked the first empty row.
 *  - two students sharing a number match NOBODY. Siblings on one parent's phone
 *    is a real case, and guessing between them is exactly the kind of guess
 *    that gives one child the other's account.
 *  - a student already bound to a different Telegram account is refused rather
 *    than rebound, so a lost or forwarded code cannot take over an account that
 *    is already working.
 */
export interface RosterMatch {
  profileId: string;
  fullName: string;
  login: string;
}

export async function matchStudentByPhone(args: {
  groupId: string;
  phone: string;
  /** Typed by the student, and only ever consulted when the phone alone points
   *  at more than one person. Never enough on its own. */
  name?: string;
}): Promise<{ match: RosterMatch | null; ambiguous: boolean }> {
  const key = phoneKey(args.phone);
  if (!key) return { match: null, ambiguous: false };

  const admin = createAdminClient();
  const { data: members } = await admin
    .from("group_members")
    .select("student_id")
    .eq("group_id", args.groupId);
  const ids = (members ?? []).map((m) => m.student_id as string);
  if (ids.length === 0) return { match: null, ambiguous: false };

  const { data: rows } = await admin
    .from("profiles")
    .select("id, full_name, username, phone")
    .in("id", ids);

  const onThisPhone = (rows ?? []).filter((r) => phoneKey(r.phone as string | null) === key);
  if (onThisPhone.length === 0) return { match: null, ambiguous: false };

  // Anyone already bound is out of the running before the name is considered,
  // so a sibling who has connected does not have to be disambiguated from again
  // — and a forwarded code cannot take over an account that already works.
  const { data: bound } = await admin
    .from("telegram_students")
    .select("profile_id")
    .in("profile_id", onThisPhone.map((r) => r.id as string))
    .not("verified_at", "is", null);
  const taken = new Set((bound ?? []).map((b) => b.profile_id as string));
  let candidates = onThisPhone.filter((r) => !taken.has(r.id as string));
  if (candidates.length === 0) return { match: null, ambiguous: false };

  // THE NAME IS A TIE-BREAK, NOT A CHECK. Siblings on one parent's phone is a
  // real case and the phone cannot separate them, so the name is asked for only
  // here — among two or three people already proved to share a number. Using it
  // as a general identity test would lock out half a roster, because the same
  // student is spelled "Nurullayev", "Nurullaev" and "BahridNur" in this very
  // database.
  if (candidates.length > 1 && args.name) {
    const narrowed = candidates.filter((r) =>
      nameLooksLike(args.name as string, (r.full_name as string | null) ?? ""),
    );
    if (narrowed.length === 1) candidates = narrowed;
  }

  if (candidates.length !== 1) {
    // Several people, and the name did not separate them. Ask rather than guess:
    // guessing here gives one child the other's account.
    return { match: null, ambiguous: true };
  }

  const hit = candidates[0];
  return {
    match: {
      profileId: hit.id as string,
      fullName: (hit.full_name as string | null) ?? "Student",
      login: (hit.username as string | null) ?? "—",
    },
    ambiguous: false,
  };
}

/** Record the binding once the phone has decided who this is. */
export async function bindStudentChat(args: {
  organizationId: string;
  profileId: string;
  chatId: number;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("telegram_students")
    .upsert(
      {
        organization_id: args.organizationId,
        profile_id: args.profileId,
        chat_id: args.chatId,
        verified_at: new Date().toISOString(),
        link_code: null,
        code_expires_at: null,
      },
      { onConflict: "profile_id" },
    )
    .select("id");
  return Boolean(data && data.length > 0);
}

/** Anything else personal: homework due, a result, a reminder. Same rule —
 *  verified private chat only, and false when they are not bound. */
export async function sendStudentTelegram(profileId: string, html: string): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const chatId = await studentChatId(profileId);
  if (chatId == null) return false;
  return sendMessage(chatId, html);
}
