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
 * ⚠️ PHONE ALONE WAS A NO-OP, AND IT LOOKED LIKE A CHECK. The original version
 * compared `profiles.phone` and returned false the moment the referrer had
 * none — and GOOGLE OAUTH NEVER SUPPLIES A PHONE. Every referral account in
 * production signed up with Google, so every one of them had `phone: null` and
 * the guard exited on its first line, every time, while reading like protection.
 * The case that exposed it: two Google accounts, near-identical names, one
 * referring the other, both with a null phone.
 *
 * So identity is now a SET of tokens rather than one field, and a match on any
 * of them refuses the commission. The email is the token that actually bites
 * for an OAuth signup, since that is the one thing Google always gives us.
 *
 * STILL NOT THE CARD. A payment-method fingerprint is the strongest test there
 * is and needs the Stripe payment method expanded on the event — phase 6. This
 * is what can be done from data we already hold.
 */
async function sharesAnIdentity(
  admin: ReturnType<typeof createAdminClient>,
  referrerProfileId: string,
  payingOrganizationId: string,
): Promise<boolean> {
  const referrerTokens = await identityTokens(admin, [referrerProfileId]);
  /* ⚠️ NO EARLY RETURN WHEN THE REFERRER HAS NO TOKENS, tempting as it looks.
     An empty set matches nothing in the loop below anyway, so the "optimization"
     buys one skipped query and costs the name flag further down — which is the
     ONLY signal left for exactly the account that has no readable phone or
     email. Removing the early return was how the mutation test caught it. */

  const { data: payers } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", payingOrganizationId)
    /* A personal org has exactly one member and is the only shape that can be a
       self-referral in practice. The cap is so a large centre cannot turn one
       accrual into hundreds of auth lookups; a centre buying a plan through a
       referral link is a real sale, not somebody's second account. */
    .limit(MAX_PAYERS_CHECKED);

  const payerIds = (payers ?? []).map((p) => p.id as string);
  const payerTokens = await identityTokens(admin, payerIds);
  for (const token of payerTokens) {
    if (referrerTokens.has(token)) return true;
  }

  /* A NAME MATCH IS FLAGGED, NOT REFUSED — deliberately, and this is the line
     most likely to be "tightened" by somebody who has not thought it through.
     Uzbek surnames repeat constantly and a learner genuinely referring a sibling
     is an ordinary, honest referral. Silently swallowing their money on a string
     comparison is a worse failure than paying a suspect one that a human can
     still review, because the referrer is never told and cannot appeal. Log it
     and let a person decide. */
  const { data: referrerProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", referrerProfileId)
    .maybeSingle();
  const referrerName = normalizeName(referrerProfile?.full_name);
  if (referrerName && (payers ?? []).some((p) => normalizeName(p.full_name) === referrerName)) {
    console.warn(
      `[referrals] REVIEW: org ${payingOrganizationId} shares a name with referrer ${referrerProfileId} — commission allowed, worth a look`,
    );
  }

  return false;
}

/** See the cap note in sharesAnIdentity. */
const MAX_PAYERS_CHECKED = 25;

/**
 * Everything that identifies these people, as comparable strings.
 *
 * Prefixed by kind (`phone:`, `email:`) so a phone number can never collide with
 * something that merely looks like one in another field.
 */
async function identityTokens(
  admin: ReturnType<typeof createAdminClient>,
  profileIds: string[],
): Promise<Set<string>> {
  const tokens = new Set<string>();
  if (profileIds.length === 0) return tokens;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone, contact_email")
    .in("id", profileIds);

  for (const p of profiles ?? []) {
    const phone = normalizePhone(p.phone);
    if (phone) tokens.add(`phone:${phone}`);
    const contact = normalizeEmail(p.contact_email);
    if (contact) tokens.add(`email:${contact}`);
  }

  /* THE AUTH EMAIL, WHICH IS THE ONLY ONE AN OAUTH SIGNUP HAS. `contact_email`
     is filled in by centre accounts; a solo learner who signed in with Google
     has nothing but the address on `auth.users`, and that is exactly the account
     shape this guard kept missing. Failures are swallowed on purpose — a
     self-referral check that cannot read one address must not take down the
     accrual of a legitimate commission. */
  for (const id of profileIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(id);
      const email = normalizeEmail(data?.user?.email);
      if (email) tokens.add(`email:${email}`);
    } catch (err) {
      console.error(`[referrals] could not read auth identity for ${id}:`, err);
    }
  }

  return tokens;
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
 * The address behind the aliases, so `me+ielts@gmail.com` and `m.e@gmail.com`
 * are recognised as the same inbox as `me@gmail.com`.
 *
 * ⚠️ DOTS ARE ONLY IGNORED ON GMAIL. That is a Gmail behaviour, not an email
 * one — plenty of providers treat `a.b@` and `ab@` as two different people, and
 * stripping dots everywhere would merge strangers and refuse their commission.
 * The `+tag` suffix is stripped generally: it is a convention, but a local part
 * containing `+` is rare enough that the trade is worth it here.
 */
function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;

  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);

  // googlemail.com is the same service under another name.
  const canonicalDomain = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canonicalDomain === "gmail.com") local = local.replace(/\./g, "");

  return local ? `${local}@${canonicalDomain}` : null;
}

/** Case- and spacing-insensitive, for the flag-only name comparison. */
function normalizeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const name = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return name.length >= 3 ? name : null;
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
