import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { notifyEarned } from "./notify";

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
 * ONCE PER REFERRAL, EVER — the first payment they make and no other. Not
 * renewals, not an upgrade, not a cancel-and-return. The database enforces it
 * (`referral_commissions_one_per_org`); the check below is so the ordinary case
 * declines quietly instead of arriving as a caught constraint violation.
 *
 * Returns the amount accrued in minor units, or 0 for every ordinary case where
 * nothing is owed: not referred, already paid out for, referrer stopped,
 * self-referral, no money.
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

    /* ALREADY EARNED FROM? Then this is a renewal, an upgrade, or a return, and
       none of them pay. Checked before anything else costs a lookup, because
       after the first month this is the answer for every payment a referred
       account ever makes — the common path, not the exception. A `reversed` row
       counts as used: see the note on the index. */
    const { count: already } = await admin
      .from("referral_commissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId);
    if ((already ?? 0) > 0) return 0;

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

    const percent = Number(account.percent ?? settings?.default_percent ?? 15);
    const holdDays = settings?.hold_days ?? 7;
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

    // 23505 = one of the two unique constraints refused it: the same billing
    // event arriving twice (a provider redelivering), or this referral having
    // already earned its one commission. Both are normal and both must be a
    // silent no-op — the constraints are doing exactly the job they exist for,
    // and this is the backstop for the race the check above cannot close.
    if (error && error.code !== "23505") {
      console.error("[referrals] accrual failed:", error.message);
      return 0;
    }
    if (error) return 0; // 23505 — already earned, and already announced then

    /* THE ONLY MOMENT THE PROGRAMME PROVES ITSELF. Sent after the row is
       committed, never before, and it cannot fail the accrual — the money is the
       thing, the email is about the thing. It deliberately does not say WHO
       paid: that is somebody else's account, and the reason `organization_id` is
       withheld from the referrer's column grant in the first place. */
    await notifyEarned(account.id, amount, input.currency.toLowerCase(), holdDays);
    return amount;
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

/**
 * Take back the commission on a payment that came back.
 *
 * WHAT "REMOVED FROM REFERRALS" MEANS HERE. The row is not deleted — it is
 * marked `reversed`, which stops it counting toward any balance while leaving
 * the fact that it happened on the record. A deleted row cannot be explained to
 * a referrer who saw the money and then did not.
 *
 * REVERSES `pending` AND `payable`, STOPS AT `paid`. A refund inside the 7-day
 * hold catches a `pending` row; a refund after it catches a `payable` one, which
 * is the case the hold cannot cover and monthly settlement makes common — money
 * sits payable for up to a month before anyone is paid. Once it IS paid the
 * money has left, and clawing back a settled payout is a conversation, not a
 * database write.
 *
 * The reversed commission still occupies the org's one slot, so a refund and a
 * fresh purchase does not mint a second commission.
 */
export async function reverseCommission(
  organizationId: string,
  reason: string,
): Promise<{ reversed: number; alreadyPaid: number }> {
  try {
    const admin = createAdminClient();

    // Checked first so a reversal that arrives too late is reported rather than
    // silently doing nothing — "we already paid this out" is the one outcome a
    // human needs to know about.
    const { count: alreadyPaid } = await admin
      .from("referral_commissions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "paid");

    const { data, error } = await admin
      .from("referral_commissions")
      .update({ status: "reversed", reversed_reason: reason })
      .eq("organization_id", organizationId)
      .in("status", ["pending", "payable"])
      .select("id");

    if (error) {
      console.error("[referrals] reversal failed:", error.message);
      return { reversed: 0, alreadyPaid: alreadyPaid ?? 0 };
    }
    if ((alreadyPaid ?? 0) > 0) {
      console.warn(
        `[referrals] refund for org ${organizationId} arrived after payout — ${alreadyPaid} settled commission(s) left alone`,
      );
    }
    return { reversed: data?.length ?? 0, alreadyPaid: alreadyPaid ?? 0 };
  } catch (err) {
    console.error("[referrals] reversal threw:", err);
    return { reversed: 0, alreadyPaid: 0 };
  }
}

/**
 * Which org a Stripe refund belongs to.
 *
 * A refund event carries none of the metadata a checkout does — no
 * `organizationId`, no `client_reference_id` — so it cannot be mapped the way
 * `mapEvent` maps a payment. It does carry the customer, and `subscriptions`
 * already stores that against the org, which is the link back.
 */
export async function orgForStripeCustomer(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("organization_id")
    .eq("external_customer_id", customerId)
    .maybeSingle();
  return (data?.organization_id as string | null) ?? null;
}
