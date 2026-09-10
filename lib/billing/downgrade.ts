import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type { DowngradeReason } from "./lifecycle";
import { notifyPlanExpired } from "./notify-expiry";

/**
 * Put an org back on the free plan, and tell its owner — exactly once.
 *
 * ONE FUNCTION FOR EVERY DOWNGRADE, because there are now two ways to reach one
 * (a Stripe webhook, and the nightly job for Payme and Click) and each used to
 * write `plan: "trial"` on its own. Two writers means two emails for one event,
 * or, when a Stripe retry fails a second time, another "your plan has ended"
 * for a plan that was already gone.
 *
 * THE WRITE ITSELF IS THE DE-DUPLICATION. The update only matches an org that is
 * not already on trial, and only the call whose update actually returns a row
 * sends the email. Two overlapping calls both read "pro"; one flips it and mails,
 * the other finds nothing left to flip and stays silent.
 *
 * Per-org limit overrides are deliberately left alone. They are an admin's
 * explicit decision about that org, separate from what anybody paid for, and
 * the quota reader treats them the same way — so the allowance does not change
 * shape depending on whether the webhook or the nightly job got there first.
 */
export async function downgradeToFree(
  organizationId: string,
  reason: DowngradeReason,
): Promise<"downgraded" | "already_free" | "failed"> {
  const admin = createAdminClient();

  const { data: org, error: readError } = await admin
    .from("organizations")
    .select("plan")
    .eq("id", organizationId)
    .maybeSingle();
  if (readError) {
    console.error(`[billing] downgrade read failed for ${organizationId}:`, readError.message);
    return "failed";
  }
  if (!org || org.plan === "trial") return "already_free";
  const previous = String(org.plan);

  const { data: flipped, error } = await admin
    .from("organizations")
    .update({ plan: "trial" })
    .eq("id", organizationId)
    .neq("plan", "trial")
    // Without this the write reports success whether or not it matched — and
    // "did THIS call flip it" is the only thing that decides the email.
    .select("id");
  if (error) {
    console.error(`[billing] downgrade failed for ${organizationId}:`, error.message);
    return "failed";
  }
  if (!flipped || flipped.length === 0) return "already_free";

  // After the downgrade has landed, and never allowed to undo it.
  await notifyPlanExpired(organizationId, previous, reason);
  return "downgraded";
}
