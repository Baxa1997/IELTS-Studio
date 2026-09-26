import "server-only";

import { isOrgOwner } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { notify, type NotificationType } from "@/lib/notifications/notify";
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

/**
 * A paid plan has just started — a first payment, a payment after a lapse, or a
 * plan granted by hand in /admin.
 *
 * THE FIRST PAYMENT WAS THE ONE MOMENT NOBODY WAS TOLD ANYTHING. Renewal,
 * expiry and a declined card each sent an email; paying for the first time sent
 * nothing, and Payme and Click send no receipt of their own. A comp from the
 * owner was just as silent — the learner found out by noticing the allowance
 * had changed, if at all.
 *
 * `periodEnd` is null for a hand-granted plan, which has no end date. The
 * delivery row still needs a key, so the caller passes the moment it happened:
 * two grants are two events and both deserve their email.
 */
export async function notifyPlanActivated(
  organizationId: string,
  plan: string,
  periodEnd: string | null,
  eventKey: string,
): Promise<void> {
  await notifyBillingPeople({
    organizationId,
    plan,
    reason: "activated",
    kind: "activated",
    periodEnd: periodEnd ?? undefined,
    deliveryKey: periodEnd ?? eventKey,
  });
}

/**
 * The owner took a plan away in /admin.
 *
 * Not `notifyPlanExpired`: that one says the plan reached "the end of what was
 * paid for", which is untrue of a comp being withdrawn. Same kind ("expired")
 * and the same in-app type, so nothing downstream has to learn a new value.
 *
 * ⚠️ `eventKey` MUST differ per call. The delivery table is unique on
 * (org, recipient, kind, period_end), and a plan granted by hand has no period
 * end — keyed on nothing, the second removal ever made for a person would find
 * the first one's row and never send.
 */
export async function notifyPlanRevoked(
  organizationId: string,
  plan: string,
  eventKey: string,
): Promise<void> {
  await notifyBillingPeople({
    organizationId,
    plan,
    reason: "revoked",
    kind: "expired",
    deliveryKey: eventKey,
  });
}

type BillingNotice = {
  organizationId: string;
  plan: string;
  reason: "ended" | "payment_failed" | "expiring" | "renewed" | "activated" | "revoked";
  kind: "expired" | "payment_failed" | "expiring" | "renewed" | "activated";
  periodEnd?: string;
  /** What makes this notice distinct from an earlier one of the same kind.
   *  Defaults to `periodEnd`; see `notifyPlanRevoked` for why it cannot always.
   *  ⚠️ An ISO timestamp: it lands in the timestamptz `period_end` column. */
  deliveryKey?: string;
};

/**
 * Who hears about an org's plan and its allowance, with the address to use.
 *
 * Shared by the billing notices here and the quota warnings
 * (lib/billing/quota-warnings.ts), so "who owns this account's plan" has one
 * answer. `email` is null when there is no real inbox to write to — the person
 * still gets the in-app notice.
 */
export async function planOwners(
  organizationId: string,
): Promise<{ id: string; firstName: string; email: string | null }[]> {
  const admin = createAdminClient();

  /* WHO TO WRITE TO. A personal org has exactly one profile, which is the case
     this programme is built for. A centre has several, and its plan is its
     owner's business, not its teachers' or its students'. */
  const { data: members } = await admin
    .from("profiles")
    .select("id, full_name, contact_email, role")
    .eq("organization_id", organizationId);

  /* ⚠️ THE OWNER IF THERE IS ONE, THE LEARNER ONLY IF THERE IS NOT. This used
     to accept `student` alongside the admin roles in one filter — right for a
     personal org, whose one member is a student, and wrong for a centre, where
     it meant every student in the building got the centre's billing mail. The
     /admin plan change now announces itself, which would have made that live
     for any centre whose plan the owner touched. `isOrgOwner`, not a role
     string: the front-desk administrator has no say in the plan. */
  const owners = (members ?? []).filter((m) => isOrgOwner(m.role));
  const candidates = owners.length > 0 ? owners : (members ?? []).filter((m) => m.role === "student");

  return Promise.all(
    candidates.map(async (person) => {
      let email = person.contact_email?.trim() ?? "";
      if (!email) {
        // A personal self-signup keeps the real address on auth.users.
        const { data: user } = await admin.auth.admin.getUserById(String(person.id));
        email = user?.user?.email?.trim() ?? "";
      }
      const deliverable = email.includes("@") && !email.endsWith("students.engprogress.com");
      return {
        id: String(person.id),
        firstName: person.full_name?.split(" ")[0] ?? "there",
        email: deliverable ? email : null,
      };
    }),
  );
}

async function notifyBillingPeople(input: BillingNotice): Promise<void> {
  try {
    const candidates = await planOwners(input.organizationId);
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
    // Both leave the account on the free plan, so both carry the reassurance
    // and the new allowance. Only the first sentence differs.
    const expired = input.reason === "ended" || input.reason === "revoked";
    const ends = new Date(input.periodEnd ?? "").toLocaleDateString();
    const subject = failed
      ? `We couldn't renew your EngProgress ${planName} plan`
      : expired
        ? `Your EngProgress ${planName} plan has ended`
        : input.reason === "expiring"
          ? `Your EngProgress ${planName} plan ends soon`
          : input.reason === "activated"
            ? `Your EngProgress ${planName} plan is active`
            : `Your EngProgress ${planName} plan was renewed`;
    const lead = failed
      ? `Your latest payment for ${planName} didn't go through, so your account is on the free plan for now. ` +
        `As soon as the payment succeeds, your plan comes back by itself.`
      : expired
        ? // Not "the end of what was paid for": a plan granted by hand with an
          // end date lapses through this same path, and nobody paid for it.
          `Your ${planName} plan has ended${input.reason === "ended" && input.periodEnd ? ` (${ends})` : ""}, so your account is back on the free plan.`
        : input.reason === "expiring"
            ? `Your ${planName} plan ends on ${ends}. Renew before then to keep paid access.`
            : input.reason === "activated"
              ? `Your account is now on ${planName}, and its monthly allowance applies straight away.` +
                (input.periodEnd ? ` This period runs until ${ends}.` : "")
              : `Your ${planName} plan has renewed successfully. Your new paid period ends on ${ends}.`;
    const cta = failed || expired ? (failed ? "Update your payment" : "Pick the plan back up") : "Open your plan";
    const body = expired || failed ? `${lead}\n\n${untouched} What changes is the monthly allowance: ${allowance}.` : lead;
    const htmlBody = expired || failed ? `${lead} ${untouched} What changes is the monthly allowance: ${allowance}.` : lead;
    const periodKey = input.deliveryKey ?? input.periodEnd ?? "none";
    const dedupeKey = `billing:${input.kind}:${periodKey}`;

    await notify({
      organizationId: input.organizationId,
      recipientIds: candidates.map((person) => person.id),
      type: NOTIFICATION_TYPE[input.kind],
      title: subject,
      body,
      href: "/plan",
      dedupeKey,
    });

    for (const person of candidates) {
      const email = person.email;
      if (!email) continue;

      const claimed = await claimEmailDelivery({
        organizationId: input.organizationId,
        recipientId: person.id,
        kind: input.kind,
        periodEnd: input.deliveryKey ?? input.periodEnd ?? new Date(0).toISOString(),
        email,
      });
      if (!claimed) continue;

      const name = person.firstName;
      // `outboundSiteUrl`, not `siteUrl`: the latter is localhost whenever this
      // runs from a dev machine or a script, and a localhost link in an inbox is
      // a dead link (see lib/env.ts).
      const planUrl = `${serverEnv.outboundSiteUrl}/plan`;
      const result = await sendEmail({
        to: email,
        subject,
        text: `Hi ${name},\n\n${body}\n\n${cta}: ${planUrl}\n\n— The EngProgress team`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(htmlBody)}</p><p><a href="${planUrl}">${escapeHtml(cta)}</a></p><p>— The EngProgress team</p>`,
      });
      await finishEmailDelivery(claimed.id, result.sent, result.detail);
    }
  } catch (err) {
    console.error("[billing] expiry email failed:", err);
  }
}

const NOTIFICATION_TYPE: Record<BillingNotice["kind"], NotificationType> = {
  expired: "billing_expired",
  payment_failed: "billing_payment_failed",
  expiring: "billing_expiring",
  renewed: "billing_renewed",
  activated: "billing_activated",
};

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
