import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One-click unsubscribe, for a person who has no session.
 *
 * THE LINK HAS TO WORK FROM AN EMAIL CLIENT, which means no login, no cookie
 * and nothing the app can look up about who is clicking. So the link carries
 * the identity itself, and a signature proves we issued it. Without the
 * signature `?u=<uuid>` would let anyone who can guess a profile id unsubscribe
 * a stranger — and the ids are not secret, they appear in our own URLs.
 *
 * ⚠️ NO TOKEN COLUMN, DELIBERATELY. The obvious design stores a random token on
 * `profiles`, and it is worse here: `profiles` is readable by its owner and, in
 * a centre, by staff — so the token would be a credential sitting in a row that
 * several people can already read, and it would need backfilling for every
 * account that exists. An HMAC stores nothing, leaks nothing, and needs no
 * migration.
 */

/** Truncated to 32 hex characters — 128 bits, far past guessing, and short
 *  enough that the URL survives an email client wrapping long lines. */
const TOKEN_LENGTH = 32;

/**
 * The signing key.
 *
 * Reuses the service-role key rather than adding an env var the owner has to
 * set before the feature works at all. That is safe in the one direction that
 * matters — HMAC-SHA256 does not reveal its key, and this value never leaves
 * the server — but it does mean ROTATING THE SUPABASE KEY INVALIDATES EVERY
 * UNSUBSCRIBE LINK ALREADY IN SOMEBODY'S INBOX. That is an acceptable trade for
 * a link people click within days of delivery, and it is the reason
 * `MARKETING_UNSUBSCRIBE_SECRET` is honoured first: set it and the links stop
 * depending on the key's lifetime.
 */
function signingKey(): string {
  return process.env.MARKETING_UNSUBSCRIBE_SECRET?.trim() || serverEnv.supabaseServiceRoleKey;
}

export function unsubscribeToken(profileId: string): string {
  return createHmac("sha256", signingKey()).update(`unsubscribe:${profileId}`).digest("hex").slice(0, TOKEN_LENGTH);
}

/** Constant-time, so a wrong token cannot be narrowed by timing one character
 *  at a time — the same class of mistake as the `ilike` referral lookup. */
export function tokenMatches(profileId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(unsubscribeToken(profileId));
  const given = Buffer.from(String(token));
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** The link a PERSON clicks, in the footer of every marketing email. Lands on a
 *  page that confirms what happened and offers to undo it. */
export function unsubscribeUrl(profileId: string): string {
  return `${serverEnv.outboundSiteUrl}/unsubscribe?u=${encodeURIComponent(profileId)}&t=${unsubscribeToken(profileId)}`;
}

/**
 * The URL a MAIL CLIENT hits for `List-Unsubscribe-Post`, which is a POST.
 *
 * ⚠️ A DIFFERENT PATH FROM THE ONE ABOVE, AND IT HAS TO BE. Next's App Router
 * refuses a `route.ts` beside a `page.tsx` in the same folder, so the friendly
 * page at `/unsubscribe` cannot also answer POST. Gmail and Outlook do not care
 * that the two differ — the header is for the client, the footer link is for
 * the reader — and `/api/unsubscribe` redirects a human who follows it to the
 * page anyway.
 */
export function unsubscribePostUrl(profileId: string): string {
  return `${serverEnv.outboundSiteUrl}/api/unsubscribe?u=${encodeURIComponent(profileId)}&t=${unsubscribeToken(profileId)}`;
}

/**
 * Honour an unsubscribe. Returns what happened so the page can say something
 * true rather than a blanket "done".
 *
 * IDEMPOTENT ON PURPOSE. Mail clients pre-fetch links, people click twice, and
 * `List-Unsubscribe-Post` means some clients hit this without a human at all.
 * Every one of those has to be a quiet success — an error page for a second
 * click reads as "it did not work" and earns a spam complaint instead.
 */
export async function applyUnsubscribe(
  profileId: string,
  token: string | null | undefined,
): Promise<{ ok: boolean; alreadyOut: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(profileId) || !tokenMatches(profileId, token)) {
    return { ok: false, alreadyOut: false };
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("profiles")
    .select("marketing_opt_out")
    .eq("id", profileId)
    .maybeSingle();
  if (!before) return { ok: false, alreadyOut: false };
  if (before.marketing_opt_out === true) return { ok: true, alreadyOut: true };

  const { error } = await admin
    .from("profiles")
    .update({ marketing_opt_out: true })
    .eq("id", profileId)
    // ⚠️ `.select()` after an update, always — a filtered write reports success
    // with no rows otherwise, and "unsubscribed" would be a lie.
    .select("id");
  if (error) {
    console.error("[marketing] unsubscribe failed:", error.message);
    return { ok: false, alreadyOut: false };
  }
  return { ok: true, alreadyOut: false };
}

/** Undo, for somebody who clicked by accident and came back. */
export async function applyResubscribe(
  profileId: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(profileId) || !tokenMatches(profileId, token)) return false;
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ marketing_opt_out: false })
    .eq("id", profileId)
    .select("id");
  if (error) {
    console.error("[marketing] resubscribe failed:", error.message);
    return false;
  }
  return true;
}
