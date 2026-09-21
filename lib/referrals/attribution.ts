import "server-only";

import { cookies } from "next/headers";

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { isCodeShape, normalizeCode } from "./code";

/**
 * Turning a click on somebody's link into a row that can earn.
 *
 * TWO DOORS, ONE RECORD. A `?ref=CODE` link is caught by the proxy and dropped
 * in the cookie below; a code typed into the sign-up form arrives directly. Both
 * end up in the same `referral_attributions` row — differing only in `source`,
 * which is kept so it is possible to tell later whether links or codes actually
 * bring people in. Nothing downstream cares which way somebody came.
 *
 * WHY THIS IS NOT IN `handle_new_user`. The trigger is what provisions a
 * self-signup's org and profile, and it cannot read a cookie — it sees only the
 * `auth.users` row. So attribution is claimed here, from a server action or a
 * route handler, immediately after the session exists. Same shape as
 * `applyPendingPlan`, and for the same reason.
 */

export const REFERRAL_COOKIE = "ep_ref";

/**
 * How old an account may be, when we cannot tell when the link was clicked, and
 * still be treated as arriving through the referral.
 *
 * ONLY FOR A COOKIE WITH NO TIMESTAMP — one set by the proxy before the click
 * time was part of the format, and in the wild for up to ninety days after this
 * ships. The exact comparison below is `org.created_at >= clickedAt`, which
 * needs no window at all; this is the degraded version for the legacy shape.
 * Twenty-four hours is long enough to cover a confirmation email answered the
 * next morning and far short of the months-old accounts the bug credited.
 */
const LEGACY_MAX_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;

/** Preserve a code typed into the signup form across email confirmation or
 * OAuth, where the original server action no longer has a live session.
 *
 * Carries the same `code.stashedAtMs` shape the proxy writes: this runs
 * immediately BEFORE `supabase.auth.signUp`, so the organization the trigger
 * provisions is always newer than the stamp, and the freshness check below
 * passes for a real sign-up however long the confirmation email sits unread. */
export async function stashReferralCode(raw: string | null | undefined): Promise<void> {
  const code = normalizeCode(raw ?? "");
  if (!isCodeShape(code)) return;
  const store = await cookies();
  store.set(REFERRAL_COOKIE, `${code}.${Date.now()}`, {
    maxAge: 90 * 24 * 60 * 60,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/**
 * Split `code.clickedAtMs` back into its parts.
 *
 * A code cannot contain `.` (the CHECK is `^[a-z0-9][a-z0-9_-]{2,31}$`), so the
 * separator is unambiguous and a cookie with no dot is simply the old format —
 * returned with `clickedAt: null`, which the caller treats as "unknown", not as
 * "now".
 */
export function parseStashedReferral(
  value: string | null | undefined,
): { code: string; clickedAt: number | null } | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot === -1) return isCodeShape(value) ? { code: normalizeCode(value), clickedAt: null } : null;
  const code = normalizeCode(value.slice(0, dot));
  if (!isCodeShape(code)) return null;
  const stamp = Number(value.slice(dot + 1));
  return { code, clickedAt: Number.isFinite(stamp) && stamp > 0 ? stamp : null };
}

/**
 * Claim the stashed referral for the now-authenticated user.
 *
 * Single-use: the cookie is consumed whatever the outcome, because a code that
 * failed to attribute once will fail the same way on every later page load, and
 * a cookie that survives is one that attributes a LATER account to a referrer
 * who never introduced it.
 *
 * Never throws. Attribution failing must not take a sign-up down with it — a
 * learner who cannot get into the product is a worse outcome than a referrer
 * who does not get credited, and this runs on the sign-up path.
 */
export async function claimReferral(typedCode?: string | null): Promise<boolean> {
  try {
    const store = await cookies();
    const stashed = parseStashedReferral(store.get(REFERRAL_COOKIE)?.value);
    const cookieCode = stashed?.code ?? null;
    const typed = typedCode?.trim() || null;
    if (!cookieCode && !typed) return false;

    const session = await getSession();
    if (!session?.profile) return false;
    const target = {
      organizationId: session.profile.organization_id,
      profileId: session.profile.id,
      /* ⚠️ THE WHOLE REASON THIS IS NOT JUST A CODE.
         This function runs from `/auth/callback`, and that route is every Google
         SIGN-IN, not only a sign-up. Without a floor, an existing customer who
         opened somebody's referral link and then signed in got attributed to
         them — permanently, because `organization_id` is the primary key on
         `referral_attributions` — and would have paid that referrer 15% of their
         next payment. Found in production: org 827add5b (created 2026-08-02)
         credited to a code approved 2026-09-19, 0.57s after a Google sign-in. */
      notBefore: stashed?.clickedAt ?? null,
    };

    /* TYPED BEATS STASHED, and it is the one place "first touch wins" bends.
       A cookie can be ninety days old and from a link somebody clicked once by
       accident; typing a code into the sign-up form is a person saying who sent
       them, right now. When both are present the deliberate act should win.
       Only ONE of them can land regardless — `organization_id` is unique on
       `referral_attributions` — so this decides which is tried first, not how
       many rows appear. */
    if (typed && (await attribute({ ...target, code: typed, source: "code" }))) {
      if (cookieCode) store.delete(REFERRAL_COOKIE);
      return true;
    }
    if (cookieCode) {
      const claimed = await attribute({ ...target, code: cookieCode, source: "link" });
      if (claimed) store.delete(REFERRAL_COOKIE);
      return claimed;
    }
    return false;
  } catch (err) {
    console.error("[referrals] claim failed:", err);
    return false;
  }
}

/**
 * Record that an org was referred. Returns false — not an error — for every
 * ordinary miss: an unknown code, a stopped one, an org that already has a
 * referrer, or a self-referral.
 */
export async function attribute(args: {
  code: string;
  organizationId: string;
  profileId: string;
  source: "link" | "code";
  /** When the link was clicked, in ms. The organization must be NEWER than this
   *  to be a referral rather than an existing customer following a link. Null =
   *  unknown (a legacy cookie), which falls back to a freshness window. */
  notBefore?: number | null;
}): Promise<boolean> {
  const code = normalizeCode(args.code);
  // Checked before it reaches a query: a `?ref=` is attacker-controlled, and
  // most junk in it is a scanner rather than a typo.
  if (!isCodeShape(code)) return false;

  const admin = createAdminClient();

  /* ONLY AN ACCOUNT THE LINK ACTUALLY BROUGHT IN. Checked before the code is
     even looked up, because the answer does not depend on the code and this is
     the check the whole programme's honesty rests on. See the note on
     `notBefore` in claimReferral. */
  if (!(await accountIsNewerThanTheClick(admin, args.organizationId, args.notBefore ?? null))) {
    return false;
  }

  /* EXACT MATCH, NOT `ilike`. This read `.ilike("code", code)` and that is a
     PATTERN match: `_` is ILIKE's single-character wildcard, and `isCodeShape`
     permits `_` because it mirrors the column's CHECK constraint. So
     `?ref=q_______` matched the real code `qg8dtnd9` — one known character was
     enough. Two things fell out of that: anybody could attribute a signup to a
     referrer whose code they had guessed one letter of, and, worse, the success
     or failure of each probe leaked the next character, which turns the whole
     code space into something you can walk. `maybeSingle` hid the scale of it by
     erroring whenever a pattern matched two rows — so it only ever "worked"
     when it had narrowed to exactly one.

     `.eq` has no pattern semantics, so `_` is just a character again. Codes are
     stored lower-case (the CHECK forbids anything else) and `normalizeCode`
     lower-cases the input, so this is also still case-insensitive in practice. */
  const { data: account } = await admin
    .from("referral_accounts")
    .select("id, profile_id, organization_id, status")
    .eq("code", code)
    .maybeSingle();

  // A stopped account's link is dead. That is the whole meaning of stopping one:
  // it cannot bring in anybody new, while the money it already earned stands.
  if (!account || account.status !== "active") return false;

  // SELF-REFERRAL, THE OBVIOUS HALF. Removing the plan gate removed the reason
  // self-referral was pointless — it used to cost a subscription to run and
  // returned less than it cost. Now it is free, so it has to be refused. This
  // catches the same person and the same workspace; the same-card and
  // same-phone checks live at accrual, where the payment details exist.
  if (account.profile_id === args.profileId) return false;
  if (account.organization_id === args.organizationId) return false;

  // FIRST TOUCH WINS. The unique `organization_id` is what actually enforces it;
  // this insert simply does nothing when a row is already there, so a second
  // link cannot overwrite the referrer who got there first.
  const { error } = await admin
    .from("referral_attributions")
    .insert({
      organization_id: args.organizationId,
      referral_account_id: account.id,
      source: args.source,
    });

  if (error && error.code !== "23505") {
    console.error("[referrals] attribution insert failed:", error.message);
    return false;
  }
  return !error;
}

/**
 * Was this workspace created by the click, or did it already exist?
 *
 * The one question that separates a referral from an existing customer
 * following a public link. `organizations.created_at` is set by
 * `handle_new_user` at sign-up, so it is the moment the account came into being
 * — and a genuine referral's org is always newer than the click that led to it,
 * no matter how long the confirmation email sat unread.
 *
 * Fails CLOSED on a missing org or an unreadable date: an attribution that
 * cannot be justified must not be made, and the cost of refusing a real one is
 * a referrer who has to be credited by hand, against a permanent row that pays
 * out real money and cannot be corrected by the person it wrongs.
 */
async function accountIsNewerThanTheClick(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  notBefore: number | null,
): Promise<boolean> {
  const { data: org } = await admin
    .from("organizations")
    .select("created_at")
    .eq("id", organizationId)
    .maybeSingle();

  const createdAt = org?.created_at ? Date.parse(org.created_at as string) : NaN;
  if (!Number.isFinite(createdAt)) return false;

  // The exact test, available whenever the proxy or the sign-up form wrote the
  // stamp. `>=` rather than `>` because the two can land in the same
  // millisecond when a code is typed straight into the sign-up form.
  if (notBefore !== null) return createdAt >= notBefore;

  // Legacy cookie: no stamp, so fall back to "is this account new at all?".
  return Date.now() - createdAt <= LEGACY_MAX_ACCOUNT_AGE_MS;
}
