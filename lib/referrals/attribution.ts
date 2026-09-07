import "server-only";

import { cookies } from "next/headers";

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { isCodeShape, normalizeCode } from "./code";

/**
 * Turning a click on somebody's link into a row that can earn.
 *
 * TWO DOORS, ONE RECORD. A `?ref=CODE` link is caught by the proxy and dropped
 * in the cookie below; a code typed at sign-up arrives directly. Both end up in
 * the same `referral_attributions` row, so nothing downstream has to care which
 * way somebody came in.
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
export async function claimReferral(): Promise<boolean> {
  try {
    const store = await cookies();
    const raw = store.get(REFERRAL_COOKIE)?.value;
    if (!raw) return false;
    store.delete(REFERRAL_COOKIE);

    const session = await getSession();
    if (!session?.profile) return false;

    return await attribute({
      code: raw,
      organizationId: session.profile.organization_id,
      profileId: session.profile.id,
      source: "link",
    });
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

  const { data: account } = await admin
    .from("referral_accounts")
    .select("id, profile_id, organization_id, status")
    .ilike("code", code)
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
