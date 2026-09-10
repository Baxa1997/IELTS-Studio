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
    const cookieCode = store.get(REFERRAL_COOKIE)?.value ?? null;
    const typed = typedCode?.trim() || null;
    if (!cookieCode && !typed) return false;

    // Consumed whichever way this goes, and before anything can fail: a stash
    // that survives a failed claim will attribute a LATER account to somebody
    // who never introduced it.
    if (cookieCode) store.delete(REFERRAL_COOKIE);

    const session = await getSession();
    if (!session?.profile) return false;
    const target = {
      organizationId: session.profile.organization_id,
      profileId: session.profile.id,
    };

    /* TYPED BEATS STASHED, and it is the one place "first touch wins" bends.
       A cookie can be ninety days old and from a link somebody clicked once by
       accident; typing a code into the sign-up form is a person saying who sent
       them, right now. When both are present the deliberate act should win.
       Only ONE of them can land regardless — `organization_id` is unique on
       `referral_attributions` — so this decides which is tried first, not how
       many rows appear. */
    if (typed && (await attribute({ ...target, code: typed, source: "code" }))) return true;
    if (cookieCode) return await attribute({ ...target, code: cookieCode, source: "link" });
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
}): Promise<boolean> {
  const code = normalizeCode(args.code);
  // Checked before it reaches a query: a `?ref=` is attacker-controlled, and
  // most junk in it is a scanner rather than a typo.
  if (!isCodeShape(code)) return false;

  const admin = createAdminClient();

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
