import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { fetchAll, toAccount, type CommissionQueryRow } from "./db";
import { commissionState } from "./types";
import type {
  CommissionRow,
  CurrencyTotal,
  Earnings,
  ReferralAccount,
  ReferralSettings,
} from "./types";

/**
 * The referral programme as the REFERRER sees it: apply, and watch what you
 * earned. Nothing here reads another account's rows, and nothing here decides
 * anything — approving, stopping and paying all live in `admin.ts`.
 *
 * ONE RULE RUNS THROUGH IT: a client may create an application and read its own
 * rows, and nothing else. Every state change goes through the service-role
 * client, because `status`, `percent` and `code` are not in the column grants
 * (see 20260907120000_referrals.sql) — a client write of them fails at the
 * database, not at a check somebody remembered to add.
 */

/** The platform defaults. One row, seeded by the migration. */
export async function loadSettings(): Promise<ReferralSettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_settings")
    .select("default_percent, hold_days, min_payout_minor, min_payout_uzs_minor, cookie_days")
    .eq("id", true)
    .single();

  // The migration seeds this row, so a miss means the migration has not been
  // applied. Falling back keeps the page up rather than 500ing on a value that
  // has a sensible default anyway.
  return {
    defaultPercent: Number(data?.default_percent ?? 15),
    holdDays: data?.hold_days ?? 7,
    minPayoutMinor: data?.min_payout_minor ?? 2000,
    minPayoutUzsMinor: data?.min_payout_uzs_minor ?? 25_000_000,
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

  const [rows, { count: signups }] = await Promise.all([
    fetchAll<CommissionQueryRow>((from, to) =>
      admin
        .from("referral_commissions")
        .select("id, amount_minor, currency, status, percent_applied, payable_after, created_at")
        .eq("referral_account_id", accountId)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
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
  const ledger: CommissionRow[] = [];

  for (const row of rows) {
    const currency = String(row.currency);
    const amount = Number(row.amount_minor) || 0;
    const state = commissionState(row.status, row.payable_after ?? null, now);

    ledger.push({
      id: String(row.id),
      earnedAt: String(row.created_at),
      amountMinor: amount,
      currency,
      percentApplied: Number(row.percent_applied) || 0,
      state,
      clearsAt: state === "held" ? String(row.payable_after) : null,
    });

    // `reversed` is deliberately counted in no total: it is money that came
    // back. It stays in `ledger` above, because a row that silently vanished
    // from a statement is how a person concludes the numbers are made up.
    if (state === "reversed") continue;

    const bucket = byCurrency.get(currency) ?? {
      currency,
      pendingMinor: 0,
      payableMinor: 0,
      paidMinor: 0,
      count: 0,
    };
    if (state === "paid") bucket.paidMinor += amount;
    else if (state === "released") bucket.payableMinor += amount;
    else bucket.pendingMinor += amount;
    bucket.count += 1;
    byCurrency.set(currency, bucket);
  }

  // One commission row per payment, so distinct paying orgs is the honest
  // "how many of them actually upgraded" — a renewal must not count twice.
  const payers = await fetchAll<{ organization_id: string | null }>((from, to) =>
    admin
      .from("referral_commissions")
      .select("organization_id")
      .eq("referral_account_id", accountId)
      .neq("status", "reversed")
      .range(from, to),
  );
  for (const p of payers) if (p.organization_id) converted.add(String(p.organization_id));

  return {
    signups: signups ?? 0,
    converted: converted.size,
    totals: [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    rows: ledger,
  };
}
