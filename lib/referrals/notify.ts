import "server-only";

import { platformAdminEmail } from "@/lib/email/platform-admin";
import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import { formatMoney } from "./types";

/**
 * Telling a referrer what happened.
 *
 * A REFERRAL PROGRAMME IS A FEEDBACK LOOP, AND THE LOOP WAS OPEN. Somebody
 * applied and heard nothing, was approved and heard nothing, and when a person
 * they had introduced actually paid, heard nothing then either — they would have
 * had to think to go and look at a page. The second email here is the one that
 * decides whether anybody shares their link a second time, because it is the
 * only moment the programme is ever proved to work.
 *
 * NOTHING HERE THROWS, and nothing here is awaited for its result. An email that
 * fails must not roll back an approval or, worse, a commission — the money is
 * the thing, the notification is about the thing. Failures go to the server log,
 * which is also where they go when SMTP is simply not configured.
 */

/**
 * An account's owner, or null when there is no real address to write to.
 *
 * TWO PLACES HOLD AN ADDRESS, AND THE OBVIOUS ONE IS USUALLY EMPTY.
 * `profiles.contact_email` is written for a CENTRE — it is where the real inbox
 * goes when the auth address is a synthetic one (see CLAUDE.md). A B2C learner
 * who signs up with their own email has it on `auth.users` and nothing at all on
 * the profile, which is the common case here and the one this originally missed:
 * every approval email would have been skipped, silently, for exactly the people
 * the programme is for.
 *
 * So: the profile's contact email when there is one, the auth address otherwise.
 */
async function recipient(referralAccountId: string): Promise<{ email: string; name: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("profile_id, profiles(full_name, contact_email)")
    .eq("id", referralAccountId)
    .maybeSingle();
  if (!data) return null;

  const person = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  let email = person?.contact_email?.trim() ?? "";

  if (!email) {
    const { data: user } = await admin.auth.admin.getUserById(String(data.profile_id));
    email = user?.user?.email?.trim() ?? "";
  }

  // A student created by a teacher gets an undeliverable address at
  // students.engprogress.com (see CLAUDE.md). Checked against whichever address
  // we settled on, because that synthetic one lives on `auth.users` — the
  // fallback above is the branch most likely to surface it.
  if (!email || !email.includes("@") || email.endsWith("students.engprogress.com")) return null;
  return { email, name: person?.full_name?.split(" ")[0] ?? "there" };
}

/**
 * Somebody has applied, and a person now has to read it.
 *
 * THE HALF OF THE LOOP THAT WAS MISSING. Approval is the only gate on this
 * programme, so an application nobody knows about is the one state here that
 * costs something — the applicant waits, hears nothing, and concludes the
 * feature is broken. Nothing told the reviewer anything: the queue only filled
 * up for whoever happened to open /admin/referrals.
 *
 * The address comes from `platformAdminEmail()`, which already answers exactly
 * this question for "a centre has applied" — PLATFORM_ADMIN_EMAIL when it is
 * set, and the super admin's own address otherwise, so it works with no
 * configuration at all. This originally hand-rolled its own scan of auth users,
 * which was a second answer to a settled question: uncached, capped at one page,
 * and blind to the env var the owner had already filled in.
 */
export async function notifyApplied(referralAccountId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("referral_accounts")
      .select("pitch, audience_url, profile_id, profiles(full_name, contact_email)")
      .eq("id", referralAccountId)
      .maybeSingle();
    if (!data) return;

    const person = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    let from = person?.contact_email?.trim() ?? "";
    if (!from) {
      const { data: user } = await admin.auth.admin.getUserById(String(data.profile_id));
      from = user?.user?.email?.trim() ?? "";
    }

    const reviewer = await platformAdminEmail();
    if (!reviewer) {
      console.warn("[referrals] nobody to notify about a new application");
      return;
    }

    const name = person?.full_name ?? "Someone";
    const pitch = data.pitch ?? "(nothing written)";
    const link = data.audience_url ?? "(no audience link)";

    await sendEmail({
      to: reviewer,
      subject: `Referral application from ${name}`,
      text:
        `${name} has applied to the referral programme.\n\n` +
        `Their account: ${from || "no email on file"}\n` +
        `Audience link: ${link}\n\n` +
        `What they wrote:\n${pitch}\n\n` +
        `Review it: ${serverEnv.siteUrl}/admin/referrals\n`,
      html:
        `<p><strong>${escapeHtml(name)}</strong> has applied to the referral programme.</p>` +
        `<p>Their account: <strong>${escapeHtml(from || "no email on file")}</strong></p>` +
        `<p>Audience link: ${escapeHtml(link)}</p>` +
        `<p>What they wrote:</p><blockquote>${escapeHtml(pitch)}</blockquote>` +
        `<p><a href="${serverEnv.siteUrl}/admin/referrals">Review it</a></p>`,
    });
  } catch (err) {
    console.error("[referrals] application alert failed:", err);
  }
}


/** Their application was approved. Carries the code, because that is the point. */
export async function notifyApproved(referralAccountId: string, code: string, percent: number): Promise<void> {
  try {
    const who = await recipient(referralAccountId);
    if (!who) return;
    const url = `${serverEnv.siteUrl}/?ref=${code}`;

    await sendEmail({
      to: who.email,
      subject: "Your EngProgress referral code is ready",
      text:
        `Hi ${who.name},\n\n` +
        `You're in. Here's your referral link:\n${url}\n\n` +
        `Or just give people the code: ${code}\n\n` +
        `You earn ${percent}% of the first payment each person you refer makes — once per person. ` +
        `Someone who signs up and stays on the free plan doesn't earn you anything; the commission comes from a real payment.\n\n` +
        `Track it here: ${serverEnv.siteUrl}/referrals\n\n— The EngProgress team`,
      html:
        `<p>Hi ${escapeHtml(who.name)},</p>` +
        `<p>You're in. Here's your referral link:</p>` +
        `<p><a href="${url}">${url}</a></p>` +
        `<p>Or just give people the code: <strong>${escapeHtml(code)}</strong></p>` +
        `<p>You earn <strong>${percent}%</strong> of the first payment each person you refer makes — once per person. ` +
        `Someone who signs up and stays on the free plan doesn't earn you anything; the commission comes from a real payment.</p>` +
        `<p><a href="${serverEnv.siteUrl}/referrals">Track your referrals</a></p>` +
        `<p>— The EngProgress team</p>`,
    });
  } catch (err) {
    console.error("[referrals] approval email failed:", err);
  }
}

/** Their application was turned down. Carries the reviewer's note if there is one. */
export async function notifyRejected(referralAccountId: string, note: string | null): Promise<void> {
  try {
    const who = await recipient(referralAccountId);
    if (!who) return;
    await sendEmail({
      to: who.email,
      subject: "Your EngProgress referral application",
      text:
        `Hi ${who.name},\n\n` +
        `Thanks for applying to the referral programme. We haven't approved this one.\n` +
        (note ? `\n${note}\n` : "") +
        `\nIf things change, you're welcome to apply again.\n\n— The EngProgress team`,
    });
  } catch (err) {
    console.error("[referrals] rejection email failed:", err);
  }
}

/**
 * Somebody they referred just paid.
 *
 * THE ONE THAT MATTERS. This is the only moment the programme proves itself, and
 * it is the moment a person decides whether to send the link to anybody else.
 * It deliberately does NOT name who paid — that is somebody else's account, and
 * the whole reason `organization_id` is withheld from the referrer's column
 * grant. The amount is enough.
 */
export async function notifyEarned(
  referralAccountId: string,
  amountMinor: number,
  currency: string,
  holdDays: number,
): Promise<void> {
  try {
    const who = await recipient(referralAccountId);
    if (!who) return;
    const amount = formatMoney(amountMinor, currency);

    await sendEmail({
      to: who.email,
      subject: `You earned ${amount} on EngProgress`,
      text:
        `Hi ${who.name},\n\n` +
        `Someone you referred just upgraded — you've earned ${amount}.\n\n` +
        `It's held for ${holdDays} days in case that payment is refunded, then it goes into the next monthly payout.\n\n` +
        `See your referrals: ${serverEnv.siteUrl}/referrals\n\n— The EngProgress team`,
      html:
        `<p>Hi ${escapeHtml(who.name)},</p>` +
        `<p>Someone you referred just upgraded — you've earned <strong>${escapeHtml(amount)}</strong>.</p>` +
        `<p>It's held for ${holdDays} days in case that payment is refunded, then it goes into the next monthly payout.</p>` +
        `<p><a href="${serverEnv.siteUrl}/referrals">See your referrals</a></p>` +
        `<p>— The EngProgress team</p>`,
    });
  } catch (err) {
    console.error("[referrals] earnings email failed:", err);
  }
}

/**
 * Their payout has gone out.
 *
 * THE LAST MESSAGE IN THE LOOP. The programme told them they earned it, then
 * held it, and until this existed the money simply arrived in a bank account
 * with nothing connecting it to the referrals it came from. That silence is
 * where "did they actually pay me?" comes from, and answering it after the fact
 * costs far more than sending this.
 *
 * Deliberately does not itemise which referrals it covers: the referrer is not
 * told who paid (see `notifyEarned`), so a breakdown would either be useless or
 * would leak the thing every other part of this system withholds.
 */
export async function notifyPaid(
  referralAccountId: string,
  amountMinor: number,
  currency: string,
): Promise<void> {
  try {
    const who = await recipient(referralAccountId);
    if (!who) return;
    const amount = formatMoney(amountMinor, currency);

    await sendEmail({
      to: who.email,
      subject: `Your EngProgress referral payout: ${amount}`,
      text:
        `Hi ${who.name},\n\n` +
        `We've sent your referral payout of ${amount}.\n\n` +
        `Anything earned since then keeps building for the next one.\n\n` +
        `See your referrals: ${serverEnv.siteUrl}/referrals\n\n— The EngProgress team`,
      html:
        `<p>Hi ${escapeHtml(who.name)},</p>` +
        `<p>We've sent your referral payout of <strong>${escapeHtml(amount)}</strong>.</p>` +
        `<p>Anything earned since then keeps building for the next one.</p>` +
        `<p><a href="${serverEnv.siteUrl}/referrals">See your referrals</a></p>` +
        `<p>— The EngProgress team</p>`,
    });
  } catch (err) {
    console.error("[referrals] payout email failed:", err);
  }
}

/** Minimal escaping for the values that reach the HTML bodies above. */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
