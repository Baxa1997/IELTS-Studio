import "server-only";

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

/** An account's owner, or null when there is no real address to write to. */
async function recipient(referralAccountId: string): Promise<{ email: string; name: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("profiles(full_name, contact_email)")
    .eq("id", referralAccountId)
    .maybeSingle();

  const person = Array.isArray(data?.profiles) ? data?.profiles[0] : data?.profiles;
  const email = person?.contact_email?.trim();
  // A student created by a teacher gets an undeliverable address at
  // students.engprogress.com (see CLAUDE.md). Writing to it bounces, so it is
  // treated as no address at all rather than as a send that failed.
  if (!email || !email.includes("@") || email.endsWith("students.engprogress.com")) return null;
  return { email, name: person?.full_name?.split(" ")[0] ?? "there" };
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

/** Minimal escaping for the values that reach the HTML bodies above. */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
