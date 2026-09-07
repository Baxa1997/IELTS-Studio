import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Turning a payment into commission.
 *
 * ONE PLACE, ALL THREE PROVIDERS. This hangs off `applyPlanChange`, which is
 * where Stripe, Payme and Click all converge — the same reason `lib/quota.ts`
 * hangs its enforcement off `loadOrg`. Adding a fourth provider gets commission
 * for free; putting this in the Stripe webhook would have meant Payme referrals
 * silently earning nothing.
 *
 * NEVER THROWS. A commission that fails to record must not fail the payment that
 * earned it — the subscription is the thing the customer bought, and a missing
 * ledger row can be reconciled from `billing_events` afterwards. A payment
 * rolled back because a referral row would not insert cannot be.
 */

export interface AccrualInput {
  organizationId: string;
  /** The `billing_events` row this payment produced — the idempotency key. */
  billingEventId: string;
  /** Minor units of `currency`. Cents for USD, tiyin for UZS. */
  amountMinor: number;
  currency: string;
}

/**
 * Record commission for a payment, if the paying org was referred.
 *
 * Returns the amount accrued in minor units, or 0 for every ordinary case where
 * nothing is owed: not referred, referrer stopped, self-referral, no money.
 */
export async function accrueCommission(input: AccrualInput): Promise<number> {
  try {
    if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) return 0;

    const admin = createAdminClient();

    // Was this org referred at all? The common answer is no, and it costs one
    // indexed lookup on a primary key to find out.
    const { data: attribution } = await admin
      .from("referral_attributions")
      .select("referral_account_id")
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!attribution) return 0;

    const { data: account } = await admin
      .from("referral_accounts")
      .select("id, profile_id, organization_id, status, percent")
      .eq("id", attribution.referral_account_id)
      .single();
    if (!account) return 0;

    // THE STOP RULE, ENFORCED WHERE THE MONEY IS. Status is checked at every
    // payment rather than once at attribution, because an account can be stopped
    // long after it introduced somebody. This is what makes "stopping ends
    // future earning" true rather than a sentence in the terms.
    if (account.status !== "active") return 0;

    // SELF-REFERRAL, THE HALF THAT ONLY EXISTS HERE. Attribution already refused
    // the same profile and the same workspace. This catches the second account:
    // the referrer's own phone number on the paying profile. Without it the
    // programme is a standing discount for anyone willing to hold two accounts,
    // which is what removing the plan gate exposed.
    if (await sharesAnIdentity(admin, account.profile_id, input.organizationId)) {
      console.warn(
        `[referrals] refused commission: org ${input.organizationId} shares an identity with referrer ${account.profile_id}`,
      );
      return 0;
    }

    const { data: settings } = await admin
      .from("referral_settings")
      .select("default_percent, hold_days")
      .eq("id", true)
      .single();

    const percent = Number(account.percent ?? settings?.default_percent ?? 20);
    const holdDays = settings?.hold_days ?? 14;
    if (!(percent > 0)) return 0;

    // Rounded down: a fraction of a cent is not money, and rounding up means
    // paying out marginally more than was taken in, forever.
    const amount = Math.floor((input.amountMinor * percent) / 100);
    if (amount <= 0) return 0;

    const payableAfter = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await admin.from("referral_commissions").insert({
      referral_account_id: account.id,
      organization_id: input.organizationId,
      billing_event_id: input.billingEventId,
      amount_minor: amount,
      currency: input.currency.toLowerCase(),
      // Frozen here. Reading the rate live at payout would rewrite history every
      // time somebody's percentage changed.
      percent_applied: percent,
      status: "pending",
      payable_after: payableAfter,
    });

    // 23505 = this billing event already produced a commission. That is a
    // provider redelivering a webhook, which is normal and must be a no-op —
    // the unique constraint is doing exactly the job it was added for.
    if (error && error.code !== "23505") {
      console.error("[referrals] accrual failed:", error.message);
      return 0;
    }
    return error ? 0 : amount;
  } catch (err) {
    console.error("[referrals] accrual threw:", err);
    return 0;
  }
}

/**
 * Does the paying workspace look like the referrer wearing a second hat?
 *
 * Phone only, for now. It is the strongest signal already on `profiles` — a
 * self-referrer has to reuse something, and the phone is collected at sign-up.
 * The card fingerprint is the better test and needs the Stripe payment method
 * expanded on the event, which is phase 6 work; this is the cheap half that
 * removes the obvious version of the abuse today.
 */
async function sharesAnIdentity(
  admin: ReturnType<typeof createAdminClient>,
  referrerProfileId: string,
  payingOrganizationId: string,
): Promise<boolean> {
  const { data: referrer } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", referrerProfileId)
    .maybeSingle();

  const phone = normalizePhone(referrer?.phone);
  if (!phone) return false;

  const { data: payers } = await admin
    .from("profiles")
    .select("phone")
    .eq("organization_id", payingOrganizationId);

  return (payers ?? []).some((p) => normalizePhone(p.phone) === phone);
}

/** Digits only, so +998 90 123-45-67 and 998901234567 are the same person. */
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // Too short to identify anybody — treating it as a match would refuse real
  // commission over a typo.
  return digits.length >= 7 ? digits : null;
}
