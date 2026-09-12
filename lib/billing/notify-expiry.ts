import "server-only";

import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { notify } from "@/lib/notifications/notify";
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
  periodEnd?: string,
): Promise<void> {
  await notifyBillingPeople({ organizationId, plan, reason, kind: reason === "payment_failed" ? "payment_failed" : "expired", periodEnd });
}

/** Notify before a non-renewing period ends. The cron may run more than once;
 * both the in-app row and the email delivery table make this idempotent. */
export async function notifyPlanExpiring(
  organizationId: string,
  plan: string,
  periodEnd: string,
): Promise<void> {
  await notifyBillingPeople({ organizationId, plan, reason: "expiring", kind: "expiring", periodEnd });
}

/** Confirm a successful renewal or second gateway payment. */
export async function notifyPlanRenewed(
  organizationId: string,
  plan: string,
  periodEnd: string,
): Promise<void> {
  await notifyBillingPeople({ organizationId, plan, reason: "renewed", kind: "renewed", periodEnd });
}

type BillingNotice = {
  organizationId: string;
  plan: string;
  reason: "ended" | "payment_failed" | "expiring" | "renewed";
  kind: "expired" | "payment_failed" | "expiring" | "renewed";
  periodEnd?: string;
};

async function notifyBillingPeople(input: BillingNotice): Promise<void> {
  try {
    const admin = createAdminClient();

    /* WHO TO WRITE TO. A personal org has exactly one profile, which is the case
       this programme is built for. A centre would have several, and its owner is
       the center_admin — writing to every teacher about billing would be wrong,
       so only the admin roles are considered. */
    const { data: members } = await admin
      .from("profiles")
      .select("id, full_name, contact_email, role")
      .eq("organization_id", input.organizationId);

    const candidates = (members ?? []).filter(
      (m) => m.role === "student" || m.role === "center_admin" || m.role === "administrator",
    );
    if (candidates.length === 0) return;

    // `plan` arrives as a string off the org row, so it is checked against the
    // catalogue rather than cast into it.
    const planName = (input.plan in PLAN_TIERS ? PLAN_TIERS[input.plan as OrgPlan].name : null) ?? "your paid plan";
    const allowance =
      `free accounts get ${PLAN_TIERS.trial.gradeLimit} gradings and ` +
      `${PLAN_TIERS.trial.generateLimit} practice sets a month`;
    const untouched =
      "Nothing you have written, read or recorded has been touched — your history, bands and " +
      "feedback are all still there.";

    const failed = input.reason === "payment_failed";
    const expired = input.reason === "ended";
    const subject = failed
      ? `We couldn't renew your EngProgress ${planName} plan`
      : expired
        ? `Your EngProgress ${planName} plan has ended`
        : input.reason === "expiring"
          ? `Your EngProgress ${planName} plan ends soon`
          : `Your EngProgress ${planName} plan was renewed`;
    const lead = failed
      ? `Your latest payment for ${planName} didn't go through, so your account is on the free plan for now. ` +
        `As soon as the payment succeeds, your plan comes back by itself.`
      : expired
        ? `Your ${planName} plan has reached the end of what was paid for, so your account is back on the free plan.`
        : input.reason === "expiring"
          ? `Your ${planName} plan ends on ${new Date(input.periodEnd ?? "").toLocaleDateString()}. Renew before then to keep paid access.`
          : `Your ${planName} plan has renewed successfully. Your new paid period ends on ${new Date(input.periodEnd ?? "").toLocaleDateString()}.`;
    const cta = failed || expired ? (failed ? "Update your payment" : "Pick the plan back up") : "Open your plan";
    const body = expired || failed ? `${lead}\n\n${untouched} What changes is the monthly allowance: ${allowance}.` : lead;
    const htmlBody = expired || failed ? `${lead} ${untouched} What changes is the monthly allowance: ${allowance}.` : lead;
    const periodKey = input.periodEnd ?? "none";
    const dedupeKey = `billing:${input.kind}:${periodKey}`;

    await notify({
      organizationId: input.organizationId,
      recipientIds: candidates.map((person) => String(person.id)),
      type: input.kind === "expired" ? "billing_expired" : input.kind === "payment_failed" ? "billing_payment_failed" : input.kind === "expiring" ? "billing_expiring" : "billing_renewed",
      title: subject,
      body,
      href: "/plan",
      dedupeKey,
    });

    for (const person of candidates) {
      let email = person.contact_email?.trim() ?? "";
      if (!email) {
        // A personal self-signup keeps the real address on auth.users.
        const { data: user } = await admin.auth.admin.getUserById(String(person.id));
        email = user?.user?.email?.trim() ?? "";
      }
      if (!email || !email.includes("@") || email.endsWith("students.engprogress.com")) continue;

      const claimed = await claimEmailDelivery({
        organizationId: input.organizationId,
        recipientId: String(person.id),
        kind: input.kind,
        periodEnd: input.periodEnd ?? new Date(0).toISOString(),
        email,
      });
      if (!claimed) continue;

      const name = person.full_name?.split(" ")[0] ?? "there";
      const result = await sendEmail({
        to: email,
        subject,
        text: `Hi ${name},\n\n${body}\n\n${cta}: ${serverEnv.siteUrl}/plan\n\n— The EngProgress team`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(htmlBody)}</p><p><a href="${serverEnv.siteUrl}/plan">${escapeHtml(cta)}</a></p><p>— The EngProgress team</p>`,
      });
      await finishEmailDelivery(claimed.id, result.sent, result.detail);
    }
  } catch (err) {
    console.error("[billing] expiry email failed:", err);
  }
}

async function claimEmailDelivery(args: {
  organizationId: string;
  recipientId: string;
  kind: BillingNotice["kind"];
  periodEnd: string;
  email: string;
}): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("billing_email_deliveries").upsert(
    {
      organization_id: args.organizationId,
      recipient_id: args.recipientId,
      kind: args.kind,
      period_end: args.periodEnd,
      recipient_email: args.email,
    },
    { onConflict: "organization_id,recipient_id,kind,period_end", ignoreDuplicates: true },
  );
  if (insertError) {
    console.error("[billing] email delivery record failed:", insertError.message);
    return null;
  }
  const stale = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("billing_email_deliveries")
    .update({ claimed_at: new Date().toISOString(), recipient_email: args.email })
    .eq("organization_id", args.organizationId)
    .eq("recipient_id", args.recipientId)
    .eq("kind", args.kind)
    .eq("period_end", args.periodEnd)
    .is("sent_at", null)
    .or(`claimed_at.is.null,claimed_at.lt.${stale}`)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[billing] email delivery claim failed:", error.message);
    return null;
  }
  return data ? { id: String(data.id) } : null;
}

async function finishEmailDelivery(id: string, sent: boolean, detail?: string): Promise<void> {
  const admin = createAdminClient();
  if (sent) {
    await admin.from("billing_email_deliveries").update({ sent_at: new Date().toISOString(), claimed_at: null, last_error: null }).eq("id", id);
  } else {
    await admin.from("billing_email_deliveries").update({ claimed_at: null, last_error: detail ?? "email delivery failed" }).eq("id", id);
  }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
