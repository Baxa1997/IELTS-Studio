import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { generateCode, normalizeCode } from "./code";
import { notifyApproved, notifyRejected } from "./notify";
import type {
  CurrencyTotal,
  Earnings,
  ReferralAccount,
  ReferralSettings,
  ReviewDecision,
} from "./types";

/**
 * The referral programme's server side.
 *
 * ONE RULE RUNS THROUGH ALL OF IT: a client may create an application and read
 * its own rows, and nothing else. Every state change here goes through the
 * service-role client, because `status`, `percent` and `code` are not in the
 * column grants (see 20260907120000_referrals.sql) — a client write of them
 * fails at the database, not at a check somebody remembered to add.
 */

/** The platform defaults. One row, seeded by the migration. */
export async function loadSettings(): Promise<ReferralSettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_settings")
    .select("default_percent, hold_days, min_payout_minor, cookie_days")
    .eq("id", true)
    .single();

  // The migration seeds this row, so a miss means the migration has not been
  // applied. Falling back keeps the page up rather than 500ing on a value that
  // has a sensible default anyway.
  return {
    defaultPercent: Number(data?.default_percent ?? 15),
    holdDays: data?.hold_days ?? 7,
    minPayoutMinor: data?.min_payout_minor ?? 2000,
    cookieDays: data?.cookie_days ?? 90,
  };
}

/** The caller's own referral account, or null if they have never applied. */
export async function loadOwnAccount(profileId: string): Promise<ReferralAccount | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data ? toAccount(data) : null;
}

/**
 * File an application.
 *
 * Deliberately does NOT take a status or a percent: this writes the applicant's
 * case and nothing else, and the row lands `pending` on the column default.
 * Returns a message rather than throwing so the form can render it.
 */
export async function applyToRefer(args: {
  profileId: string;
  organizationId: string;
  pitch: string;
  audienceUrl: string | null;
}): Promise<{ error: string | null }> {
  const pitch = args.pitch.trim();
  if (pitch.length < 20) {
    return { error: "Tell us a little more about where you'd share it — a sentence or two." };
  }
  if (pitch.length > 2000) return { error: "That's longer than we need — 2000 characters or fewer." };

  const url = args.audienceUrl?.trim() || null;
  if (url && !/^https?:\/\/\S+$/i.test(url)) {
    return { error: "That link doesn't look right. Include the https:// part." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("referral_accounts").insert({
    profile_id: args.profileId,
    organization_id: args.organizationId,
    pitch,
    audience_url: url,
  });

  // profile_id is unique — one code per person — so a second application is a
  // duplicate-key error rather than a second row.
  if (error?.code === "23505") return { error: "You've already applied. We'll be in touch." };
  if (error) return { error: `Couldn't send that: ${error.message}` };
  return { error: null };
}

/** Everything waiting on a decision, oldest first — a queue, not a list. */
export async function loadPendingApplications(): Promise<ReferralAccount[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, profiles(full_name, contact_email)")
    .eq("status", "pending")
    .order("applied_at", { ascending: true });
  return (data ?? []).map(toAccount);
}

/** Everyone already approved, plus the ones that were stopped. */
export async function loadDecidedAccounts(): Promise<ReferralAccount[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, profiles(full_name, contact_email)")
    .neq("status", "pending")
    .order("reviewed_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(toAccount);
}

/**
 * Approve, reject, or stop one application.
 *
 * APPROVING MINTS THE CODE, and it is minted here rather than chosen by the
 * applicant: a free-text code needs an impersonation and profanity blocklist in
 * three languages before it can be safe, and that is not worth blocking the
 * programme on. Retries on collision — the space is large, but "large" is not
 * "never".
 *
 * BOTH STOPS END FUTURE EARNING. The link stops resolving and accrual refuses
 * any status but `active`, so a stopped referrer earns nothing more — not even
 * from somebody they had already introduced who pays next week. They differ only
 * in what happens to money already on the ledger: `closed` leaves it alone,
 * `revoked` reverses everything still `pending` (the abuse case). Neither
 * touches `paid` — that money has left.
 */
export async function decideApplication(args: {
  accountId: string;
  decision: ReviewDecision;
  note: string | null;
  reviewerId: string | null;
}): Promise<{ error: string | null; notice: string | null }> {
  const admin = createAdminClient();

  const { data: account } = await admin
    .from("referral_accounts")
    .select("id, status, code")
    .eq("id", args.accountId)
    .single();
  if (!account) return { error: "That application no longer exists.", notice: null };

  const now = new Date().toISOString();
  const base = { reviewed_at: now, reviewed_by: args.reviewerId, review_note: args.note };

  if (args.decision === "approve") {
    if (account.status === "active") return { error: null, notice: "Already approved." };
    const code = account.code ?? (await mintCode(admin));
    if (!code) return { error: "Couldn't allocate a code. Try again.", notice: null };
    const { error } = await admin
      .from("referral_accounts")
      .update({ ...base, status: "active", code, stopped_at: null })
      .eq("id", args.accountId);
    if (error) return { error: `Update failed: ${error.message}`, notice: null };

    // After the decision has landed, and never allowed to undo it. The same
    // rule `recordAdminAction` follows: the approval matters more than the
    // notification about it, and a half-applied decision is worse than an
    // unannounced one.
    const rate = Number(
      (await admin.from("referral_settings").select("default_percent").eq("id", true).single()).data
        ?.default_percent ?? 15,
    );
    await notifyApproved(args.accountId, code, rate);
    return { error: null, notice: `Approved — their code is ${code}. Email sent.` };
  }

  if (args.decision === "reject") {
    const { error } = await admin
      .from("referral_accounts")
      .update({ ...base, status: "rejected" })
      .eq("id", args.accountId);
    if (error) return { error: `Update failed: ${error.message}`, notice: null };
    await notifyRejected(args.accountId, args.note);
    return { error: null, notice: "Rejected — email sent." };
  }

  // close | revoke — both kill the link immediately.
  const status = args.decision === "revoke" ? "revoked" : "closed";
  const { error } = await admin
    .from("referral_accounts")
    .update({ ...base, status, stopped_at: now })
    .eq("id", args.accountId);
  if (error) return { error: `Update failed: ${error.message}`, notice: null };

  if (args.decision === "revoke") {
    /* Everything not yet settled. `paid` is left alone — that money has left.
       Both unsettled states are listed even though only `pending` is ever
       WRITTEN today: `payable` is derived from `payable_after` at read time, so
       filtering on `pending` alone happens to catch everything. That is true by
       coincidence, not by design, and the day somebody starts storing `payable`
       this would silently stop reversing half the ledger. */
    const { error: reverseError, count } = await admin
      .from("referral_commissions")
      .update({ status: "reversed", reversed_reason: "referral account revoked" }, { count: "exact" })
      .eq("referral_account_id", args.accountId)
      .in("status", ["pending", "payable"])
      .select("id");
    if (reverseError) {
      return { error: `Stopped, but reversing pending commission failed: ${reverseError.message}`, notice: null };
    }
    return { error: null, notice: `Revoked — ${count ?? 0} pending commission${count === 1 ? "" : "s"} reversed.` };
  }

  return { error: null, notice: "Closed — the link is dead, existing referrals keep paying out." };
}

/** A free code, or null if the space refused to yield one. */
async function mintCode(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  for (let i = 0; i < 8; i++) {
    const candidate = generateCode();
    const { data } = await admin
      .from("referral_accounts")
      .select("id")
      .ilike("code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toAccount(row: any): ReferralAccount {
  const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    code: row.code ? normalizeCode(row.code) : null,
    status: row.status,
    percent: row.percent == null ? null : Number(row.percent),
    pitch: row.pitch ?? null,
    audienceUrl: row.audience_url ?? null,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at ?? null,
    reviewNote: row.review_note ?? null,
    applicantName: person?.full_name ?? null,
    applicantEmail: person?.contact_email ?? null,
  };
}

/**
 * What a referrer has earned, and from how many people.
 *
 * TOTALS ARE PER CURRENCY, never one number. Stripe settles USD and the UZ
 * gateways settle UZS; adding them would produce a figure that is wrong in both
 * currencies, and there is no rate in this system to convert with.
 *
 * `signups` and `converted` are reported apart on purpose. Most referrals sign
 * up and stay free — if the page showed one figure, somebody who brought in
 * thirty people and earned nothing would conclude it was broken.
 */
export async function loadEarnings(accountId: string): Promise<Earnings> {
  const admin = createAdminClient();

  const [{ data: rows }, { count: signups }] = await Promise.all([
    admin
      .from("referral_commissions")
      .select("amount_minor, currency, status, payable_after, created_at")
      .eq("referral_account_id", accountId)
      .order("created_at", { ascending: false }),
    admin
      .from("referral_attributions")
      .select("organization_id", { count: "exact", head: true })
      .eq("referral_account_id", accountId),
  ]);

  const byCurrency = new Map<string, CurrencyTotal>();
  const converted = new Set<string>();

  /**
   * PAYABLE IS DERIVED, NOT STORED — and that is a fix, not a shortcut.
   *
   * Accrual writes `pending` with a `payable_after` date and nothing ever
   * promoted it, so every balance would have sat under "on hold" forever and
   * "ready to withdraw" would have been permanently zero. The obvious repair is
   * a scheduled job flipping rows at midnight; the better one is not to store a
   * state that a clock already decides. A row is ready when its hold has passed,
   * and asking that question at read time cannot drift, cannot miss a night, and
   * needs no infrastructure.
   *
   * `paid` and `reversed` stay stored, because those are decisions somebody
   * made, not facts a date implies.
   */
  const now = Date.now();
  for (const row of rows ?? []) {
    const currency = String(row.currency);
    const bucket = byCurrency.get(currency) ?? {
      currency,
      pendingMinor: 0,
      payableMinor: 0,
      paidMinor: 0,
    };
    const amount = Number(row.amount_minor) || 0;
    // `reversed` is deliberately counted nowhere: it is money that came back.
    if (row.status === "paid") bucket.paidMinor += amount;
    else if (row.status === "pending") {
      const clear = row.payable_after ? Date.parse(String(row.payable_after)) : now;
      if (Number.isFinite(clear) && clear <= now) bucket.payableMinor += amount;
      else bucket.pendingMinor += amount;
    } else if (row.status === "payable") bucket.payableMinor += amount;
    byCurrency.set(currency, bucket);
  }

  // One commission row per payment, so distinct paying orgs is the honest
  // "how many of them actually upgraded" — a renewal must not count twice.
  const { data: payers } = await admin
    .from("referral_commissions")
    .select("organization_id")
    .eq("referral_account_id", accountId)
    .neq("status", "reversed");
  for (const p of payers ?? []) if (p.organization_id) converted.add(String(p.organization_id));

  return {
    signups: signups ?? 0,
    converted: converted.size,
    totals: [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}
