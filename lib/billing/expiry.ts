import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { downgradeToFree } from "./downgrade";
import { hasLapsed } from "./lifecycle";
import { notifyPlanExpiring } from "./notify-expiry";
import { applyPlanChange, coercePlan } from "./service";
import { changeFromSubscription, fetchLiveStripeSubscription } from "./stripe";

/**
 * The nightly pass: end what has run out, and re-check what may have.
 *
 * WHAT IT FIXES. Nothing ever expired — `current_period_end` was written and
 * never read, so one payment bought a paid plan for good, and the learner was
 * told nothing either way.
 *
 * WHAT IT MUST NOT DO, which the first version of this file got wrong. It
 * treated every provider's stored date as the truth. That is right for Payme
 * and Click, which never renew. It is wrong for Stripe, which renews by itself:
 * our date is only a copy of Stripe's, advanced by a webhook, and a single
 * missed webhook would have had this downgrade a customer the day after Stripe
 * charged them — then email them that their plan had ended. So:
 *
 * - Payme / Click: a passed date ends the plan.
 * - Stripe: a missing or passed date is a reason to ASK Stripe. Whatever Stripe
 *   says is applied through `applyPlanChange`, exactly as if the webhook had
 *   arrived — renewed advances the date, failed or ended downgrades. If Stripe
 *   cannot be asked, nothing happens; a network error never takes a plan away.
 *
 * IDEMPOTENT. Every downgrade goes through `downgradeToFree`, whose conditional
 * write is the de-duplication, so a retried or overlapping run sends one email.
 *
 * ORDER, AND WHY THE FIRST VERSION'S ORDER WAS A TRAP. It closed the
 * subscription first and downgraded second, claiming a failure in between would
 * be "fixable on the next run". It would not: the next run skips closed rows, so
 * the org stayed on its paid plan permanently. Now the downgrade goes first and
 * the row is closed only after it landed — a failure in between leaves an open
 * row, which the next run picks up and finishes without mailing twice.
 */
export async function expireLapsedSubscriptions(): Promise<{
  expired: number;
  reconciled: number;
  errors: string[];
}> {
  const admin = createAdminClient();
  const errors: string[] = [];
  const now = Date.now();

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("organization_id, plan, status, provider, current_period_end, external_customer_id, external_subscription_id")
    .neq("status", "canceled");
  if (error) return { expired: 0, reconciled: 0, errors: [error.message] };

  let expired = 0;
  let reconciled = 0;
  const reminderWindow = now + 7 * 24 * 60 * 60 * 1000;

  for (const row of rows ?? []) {
    const organizationId = String(row.organization_id);
    try {
      if (row.provider === "stripe") {
        // Only rows that claim to be paid are worth asking about — an
        // `incomplete` row is an abandoned checkout with nothing to take away.
        const claimsPaid = row.status === "active" || row.status === "trialing" || row.status === "past_due";
        if (!claimsPaid) continue;
        if (row.current_period_end) {
          const end = Date.parse(row.current_period_end);
          if (Number.isFinite(end) && end > now && end <= reminderWindow) {
            await notifyPlanExpiring(organizationId, String(row.plan), row.current_period_end);
          }
        }
        if (row.current_period_end && !hasLapsed(row, now)) continue;

        const live = await fetchLiveStripeSubscription({
          subscriptionId: row.external_subscription_id,
          customerId: row.external_customer_id,
        });
        if (!live.ok) {
          errors.push(`${organizationId}: could not reach Stripe (${live.error}) — left as it was`);
          continue;
        }
        if (!live.subscription) {
          // Absence of evidence is not evidence of non-payment. A row that
          // says paid with nothing behind it in Stripe is for a person to look
          // at, not for a job to downgrade.
          errors.push(`${organizationId}: row says ${row.status} but Stripe has no subscription for it — left as it was`);
          continue;
        }

        await applyPlanChange(
          changeFromSubscription(live.subscription, {
            organizationId,
            plan: coercePlan(row.plan) ?? "pro",
          }),
        );
        reconciled += 1;
        continue;
      }

      // Payme and Click: the stored date is the whole truth.
      if (row.current_period_end) {
        const end = Date.parse(row.current_period_end);
        if (Number.isFinite(end) && end > now && end <= reminderWindow) {
          await notifyPlanExpiring(organizationId, String(row.plan), row.current_period_end);
        }
      }
      if (!hasLapsed(row, now)) continue;

      const result = await downgradeToFree(organizationId, "ended", row.current_period_end);
      if (result === "failed") {
        errors.push(`${organizationId}: downgrade failed — row left open for the next run`);
        continue;
      }
      const { error: closeError } = await admin
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date(now).toISOString() })
        .eq("organization_id", organizationId)
        .neq("status", "canceled")
        .select("organization_id");
      if (closeError) errors.push(`${organizationId}: downgraded, but closing the row failed: ${closeError.message}`);
      if (result === "downgraded") expired += 1;
    } catch (err) {
      errors.push(`${organizationId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { expired, reconciled, errors };
}
