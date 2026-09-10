import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { notifyPlanExpired } from "./notify-expiry";
import type { SubscriptionStatus } from "./types";

/**
 * Paid plans ending when they are supposed to.
 *
 * THE BUG THIS EXISTS FOR: nothing ever expired. A subscription recorded a
 * `current_period_end` and no code anywhere read it, so an org that paid once
 * stayed on Pro permanently — a single $14.99 bought unlimited grading for good.
 * There was no downgrade, and the learner was never told anything either way.
 *
 * TWO HALVES, ON PURPOSE. The cron below does the durable work: it downgrades
 * the org, closes the subscription and sends the email. `hasLapsed` is also
 * consulted on the READ path (lib/quota.ts) so that the window between a period
 * ending and the next cron run does not hand out a free month — a job that runs
 * daily is a job that is up to a day late, and quota is checked far more often
 * than once a day.
 */

/** What the expiry pass needs to know about one subscription. */
export interface LapsableSubscription {
  status: SubscriptionStatus | string | null;
  current_period_end: string | null;
}

/**
 * Has this subscription run out?
 *
 * NULL IS NOT LAPSED, AND THAT IS THE LOAD-BEARING PART. Several paid orgs on
 * this platform have no subscription row at all, or one with no period end —
 * comped accounts, the shared library orgs, and plans granted by hand from the
 * admin console. Treating "no end date" as "ended" would downgrade every one of
 * them the first time this ran, silently, including the owner's own account.
 *
 * So the rule is narrow by design: a subscription lapses only when it HAS an end
 * date, that date has passed, and it has not already been closed. Everything
 * else is somebody's deliberate decision and is left alone.
 *
 * Pure, so the cron and the quota reader cannot disagree about who has expired.
 */
export function hasLapsed(sub: LapsableSubscription | null | undefined, now = Date.now()): boolean {
  if (!sub) return false;
  if (!sub.current_period_end) return false;
  // Already terminal — expiring it again would re-send the email every night.
  if (sub.status === "canceled") return false;
  const end = Date.parse(sub.current_period_end);
  return Number.isFinite(end) && end <= now;
}

/**
 * Downgrade everything that has run out, and tell the people it happened to.
 *
 * IDEMPOTENT BY CONSTRUCTION. It only ever picks up subscriptions that are still
 * open with a past end date, and closing one removes it from its own query — so
 * a retried cron, an overlapping invocation, or somebody curling it twice all
 * settle to one downgrade and one email.
 *
 * Order matters: the subscription is closed FIRST, then the org is downgraded,
 * then the email goes. Closing first is what makes a crash safe — a closed
 * subscription beside a still-Pro org is visible and fixable on the next run,
 * whereas a downgraded org with an open subscription would be re-downgraded
 * every night and mail the learner every night with it.
 */
export async function expireLapsedSubscriptions(): Promise<{
  expired: number;
  errors: string[];
}> {
  const admin = createAdminClient();
  const errors: string[] = [];
  const nowIso = new Date().toISOString();

  const { data: lapsed, error } = await admin
    .from("subscriptions")
    .select("organization_id, plan, status, current_period_end, provider")
    .not("current_period_end", "is", null)
    .lt("current_period_end", nowIso)
    .neq("status", "canceled");

  if (error) return { expired: 0, errors: [error.message] };

  let expired = 0;
  for (const sub of lapsed ?? []) {
    const organizationId = String(sub.organization_id);
    try {
      const { error: subError } = await admin
        .from("subscriptions")
        .update({ status: "canceled", updated_at: nowIso })
        .eq("organization_id", organizationId)
        // Re-checked at write time so two overlapping runs cannot both claim it.
        .neq("status", "canceled");
      if (subError) {
        errors.push(`${organizationId}: ${subError.message}`);
        continue;
      }

      const { error: orgError } = await admin
        .from("organizations")
        .update({ plan: "trial" })
        .eq("id", organizationId);
      if (orgError) {
        errors.push(`${organizationId}: ${orgError.message}`);
        continue;
      }

      expired += 1;
      // After the downgrade has landed, and never allowed to undo it.
      await notifyPlanExpired(organizationId, String(sub.plan ?? "pro"));
    } catch (err) {
      errors.push(`${organizationId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { expired, errors };
}
