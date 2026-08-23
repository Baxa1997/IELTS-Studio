import "server-only";

import { randomBytes } from "node:crypto";

import type { Profile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Long enough to be unguessable, short enough to retype. No O/0 or I/1. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_TTL_MIN = 15;

function newCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export interface StaffLink {
  code: string;
  url: string | null;
  expiresAt: string;
}

/**
 * Offer to bind this member of staff's Telegram.
 *
 * FIFTEEN MINUTES, UNLIKE THE CLASS CODE. A class invite is posted once and
 * lives for a term because it is not a credential — the phone decides who you
 * are. This one IS the credential: whoever types it becomes this person on
 * Telegram, with their role and their centre. It is meant to be generated,
 * used, and dead within the walk from the console to the phone.
 */
export async function createStaffLink(profile: Profile): Promise<StaffLink> {
  const code = newCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();

  const admin = createAdminClient();
  await admin
    .from("telegram_staff")
    .upsert(
      {
        organization_id: profile.organization_id,
        profile_id: profile.id,
        link_code: code,
        code_expires_at: expiresAt,
        // Re-linking clears the old chat: "connect this phone instead" has to
        // mean the previous one stops working, or a lost phone keeps its access.
        chat_id: null,
        verified_at: null,
      },
      { onConflict: "profile_id" },
    )
    .select("id");

  const bot = process.env.TELEGRAM_BOT_USERNAME;
  return { code, url: bot ? `https://t.me/${bot}?start=${code}` : null, expiresAt };
}

/** Their binding, if they have one. */
export async function staffLinkStatus(
  profile: Profile,
): Promise<{ connected: boolean; since: string | null }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("telegram_staff")
    .select("verified_at")
    .eq("profile_id", profile.id)
    .maybeSingle();
  return {
    connected: data?.verified_at != null,
    since: (data?.verified_at as string | null) ?? null,
  };
}

export async function unlinkStaff(profile: Profile): Promise<void> {
  const admin = createAdminClient();
  await admin.from("telegram_staff").delete().eq("profile_id", profile.id).select("id");
}

/**
 * Turn a code into a binding. Returns the person's name on success.
 *
 * Single use and time-boxed: the code is cleared the moment it works, so a
 * screenshot of it in a chat history is worth nothing afterwards.
 */
export async function bindStaffChat(
  code: string,
  chatId: number,
): Promise<{ ok: true; name: string } | { ok: false; why: string } | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("telegram_staff")
    .select("id, profile_id, verified_at, code_expires_at")
    .eq("link_code", code)
    .maybeSingle();
  // Not a staff code at all — the caller carries on and tries the other kinds.
  if (!row) return null;

  if (row.verified_at) return { ok: false, why: "That code has already been used." };
  if (row.code_expires_at && new Date(row.code_expires_at as string) < new Date()) {
    return { ok: false, why: "That code has expired — make a new one in the console." };
  }

  // One chat cannot be two members of staff. Clearing any other binding on this
  // chat first is what makes "connect a different account" work on a shared
  // phone, rather than failing on a unique index.
  await admin
    .from("telegram_staff")
    .update({ chat_id: null, verified_at: null })
    .eq("chat_id", chatId)
    .select("id");

  const { error } = await admin
    .from("telegram_staff")
    .update({
      chat_id: chatId,
      verified_at: new Date().toISOString(),
      link_code: null,
      code_expires_at: null,
    })
    .eq("id", row.id as string)
    .select("id");
  if (error) return { ok: false, why: "Something went wrong connecting you." };

  const { data: who } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", row.profile_id as string)
    .maybeSingle();
  return { ok: true, name: (who?.full_name as string | null) ?? "there" };
}

/**
 * Who this chat is, re-read from the database.
 *
 * THE CHAT ID IS A LOOKUP KEY, NEVER AN AUTHORITY. Role, organisation and
 * existence all come from `profiles` on every call — so somebody demoted this
 * morning is demoted on Telegram this afternoon, and somebody removed from the
 * centre can do nothing at all, without anybody having to remember to revoke
 * the binding as well.
 */
export async function staffForChat(chatId: number): Promise<Profile | null> {
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("telegram_staff")
    .select("profile_id")
    .eq("chat_id", chatId)
    .not("verified_at", "is", null)
    .maybeSingle();
  if (!link) return null;

  const { data: p } = await admin
    .from("profiles")
    .select("id, organization_id, role, full_name, username, contact_email")
    .eq("id", link.profile_id as string)
    .maybeSingle();
  if (!p || p.role === "student") return null;

  // THE ORGANISATION IS CHECKED TOO, exactly as `requireOrgUser` checks it on
  // the web. A centre that has been suspended stops being controllable from a
  // phone at the same moment it stops being controllable from a browser —
  // otherwise Telegram becomes the way around a suspension.
  const { data: org } = await admin
    .from("organizations")
    .select("kind, status, name")
    .eq("id", p.organization_id as string)
    .maybeSingle();
  if (!org || org.status !== "active") return null;

  // Built field by field rather than cast. A cast here compiled happily while
  // silently omitting `username`, `contact_email` and `org` — and `org.status`
  // is the field that decides whether this person may act at all.
  return {
    id: p.id as string,
    organization_id: p.organization_id as string,
    role: p.role as Profile["role"],
    full_name: (p.full_name as string | null) ?? null,
    username: (p.username as string | null) ?? null,
    contact_email: (p.contact_email as string | null) ?? null,
    org: {
      kind: org.kind as Profile["org"]["kind"],
      status: org.status as Profile["org"]["status"],
      // Not selected here: the Telegram path never renders the sidebar, and the
      // centre's name is only ever used as a brand on screen.
      name: (org.name as string | null) ?? null,
    },
  };
}
