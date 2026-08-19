import "server-only";

import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

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

/** Anything else personal: homework due, a result, a reminder. Same rule —
 *  verified private chat only, and false when they are not bound. */
export async function sendStudentTelegram(profileId: string, html: string): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const chatId = await studentChatId(profileId);
  if (chatId == null) return false;
  return sendMessage(chatId, html);
}
