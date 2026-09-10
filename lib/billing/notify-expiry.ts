import "server-only";

import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import type { DowngradeReason } from "./lifecycle";
import { PLAN_TIERS, type OrgPlan } from "./plans";

/**
 * Telling somebody their plan has ended.
 *
 * THIS IS THE WHOLE POINT OF EXPIRING QUIETLY VERSUS EXPIRING WELL. A learner
 * whose Pro lapses discovers it by hitting a quota wall mid-essay, with no idea
 * why the product suddenly stopped working. The alternative costs one email.
 *
 * Never throws, and is never awaited for its result: a downgrade that rolled
 * back because SMTP was down would leave a paid plan running for free, which is
 * a worse outcome than a silent one. Same rule as the referral notifications.
 */
export async function notifyPlanExpired(
  organizationId: string,
  plan: string,
  /** `payment_failed` is a card declining on renewal while Stripe retries — the
   *  plan comes back by itself if a retry succeeds, so "your plan has ended"
   *  would be untrue. Everything else is a plan that has actually ended. */
  reason: DowngradeReason = "ended",
): Promise<void> {
  try {
    const admin = createAdminClient();

    /* WHO TO WRITE TO. A personal org has exactly one profile, which is the case
       this programme is built for. A centre would have several, and its owner is
       the center_admin — writing to every teacher about billing would be wrong,
       so only the admin roles are considered. */
    const { data: members } = await admin
      .from("profiles")
      .select("id, full_name, contact_email, role")
      .eq("organization_id", organizationId);

    const candidates = (members ?? []).filter(
      (m) => m.role === "student" || m.role === "center_admin" || m.role === "administrator",
    );
    if (candidates.length === 0) return;

    const person = candidates[0];
    let email = person.contact_email?.trim() ?? "";
    if (!email) {
      // Same two-places problem as the referral notifications: a self-signup's
      // address lives on `auth.users`, not on the profile.
      const { data: user } = await admin.auth.admin.getUserById(String(person.id));
      email = user?.user?.email?.trim() ?? "";
    }
    if (!email || !email.includes("@") || email.endsWith("students.engprogress.com")) return;

    const name = person.full_name?.split(" ")[0] ?? "there";
    // `plan` arrives as a string off the org row, so it is checked against the
    // catalogue rather than cast into it.
    const planName = (plan in PLAN_TIERS ? PLAN_TIERS[plan as OrgPlan].name : null) ?? "your paid plan";
    const allowance =
      `free accounts get ${PLAN_TIERS.trial.gradeLimit} gradings and ` +
      `${PLAN_TIERS.trial.generateLimit} practice sets a month`;
    const untouched =
      "Nothing you have written, read or recorded has been touched — your history, bands and " +
      "feedback are all still there.";

    const failed = reason === "payment_failed";
    const subject = failed
      ? `We couldn't renew your EngProgress ${planName} plan`
      : `Your EngProgress ${planName} plan has ended`;
    const lead = failed
      ? `Your latest payment for ${planName} didn't go through, so your account is on the free plan for now. ` +
        `As soon as the payment succeeds, your plan comes back by itself.`
      : `Your ${planName} plan has reached the end of what was paid for, so your account is back on the free plan.`;
    const cta = failed ? "Update your payment" : "Pick the plan back up";

    await sendEmail({
      to: email,
      subject,
      text:
        `Hi ${name},\n\n${lead}\n\n${untouched} What changes is the monthly allowance: ${allowance}.\n\n` +
        `${cta}: ${serverEnv.siteUrl}/plan\n\n— The EngProgress team`,
      html:
        `<p>Hi ${escapeHtml(name)},</p>` +
        `<p>${escapeHtml(lead)}</p>` +
        `<p>${escapeHtml(untouched)} What changes is the monthly allowance: ${escapeHtml(allowance)}.</p>` +
        `<p><a href="${serverEnv.siteUrl}/plan">${escapeHtml(cta)}</a></p>` +
        `<p>— The EngProgress team</p>`,
    });
  } catch (err) {
    console.error("[billing] expiry email failed:", err);
  }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
