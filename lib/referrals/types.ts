/**
 * Referral programme contracts. Pure — no `server-only` — so the apply form, the
 * admin queue and the tests all share one definition.
 */

import { PLAN_TIERS } from "@/lib/billing/plans";

export type ReferralStatus = "pending" | "active" | "rejected" | "closed" | "revoked";
export type ReferralSource = "link" | "code";
export type CommissionStatus = "pending" | "payable" | "reversed" | "paid";

/**
 * What a reviewer can do. `close` and `revoke` both kill the link; they differ
 * only in what happens to commission still inside its hold, which is the whole
 * reason there are two of them.
 */
export type ReviewDecision = "approve" | "reject" | "close" | "revoke";

export interface ReferralSettings {
  /** Percent of a qualifying payment, when the account has no override. */
  defaultPercent: number;
  /** Days a commission stays reversible before it can be withdrawn. */
  holdDays: number;
  /** Minor units of USD — $20.00 by default. */
  minPayoutMinor: number;
  /** Minor units of UZS. A separate number because 2000 is $20 and also 20 so'm;
   *  one threshold cannot mean both, and there is no rate here to convert with. */
  minPayoutUzsMinor: number;
  /** How long an unattributed click stays claimable. */
  cookieDays: number;
}

export interface ReferralAccount {
  id: string;
  /** Null until approved — the code is minted at that moment, not before. */
  code: string | null;
  status: ReferralStatus;
  /** Null = the platform default applies. */
  percent: number | null;
  pitch: string | null;
  audienceUrl: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  /** Only populated on the admin queries; a person reading their own row is not
   *  told their own name by the database. */
  applicantName: string | null;
  applicantEmail: string | null;
}

/** Is this account allowed to earn right now? The single question accrual asks. */
export function canEarn(status: ReferralStatus): boolean {
  return status === "active";
}

/** Does this status mean the link and code should stop resolving? */
export function linkIsDead(status: ReferralStatus): boolean {
  return status !== "active";
}

/** Human label for a status, for both the admin queue and the applicant's page. */
export const STATUS_LABEL: Record<ReferralStatus, string> = {
  pending: "Waiting for review",
  active: "Active",
  rejected: "Not approved",
  closed: "Closed",
  revoked: "Revoked",
};

/** Money in one currency, split by how close it is to being withdrawable. */
export interface CurrencyTotal {
  /** Lowercase ISO-4217: "usd", "uzs". */
  currency: string;
  /** Earned, still inside the refund hold. */
  pendingMinor: number;
  /** Past the hold — withdrawable. */
  payableMinor: number;
  /** Already settled. */
  paidMinor: number;
  /** How many commissions make up this total. Drives "average per upgrade",
   *  which cannot be derived from the amounts alone once a rate override or a
   *  reversal is in the mix. */
  count: number;
}

/**
 * One commission, as the REFERRER is allowed to see it.
 *
 * There is no payer here, and no gross amount, and both absences are the point.
 * `organization_id` is withheld from the referrer's column grant
 * (20260907120000_referrals.sql) because who bought a subscription is that
 * person's business, not their introducer's; and the gross would disclose which
 * plan they chose, which is the same fact wearing a different hat. What the
 * referrer is owed, when it was earned, and whether they can withdraw it — that
 * is the whole of what this page is for.
 */
export interface CommissionRow {
  id: string;
  /** When the referral paid, which is when this was earned. */
  earnedAt: string;
  amountMinor: number;
  currency: string;
  /** Stored per row, so a rate change never rewrites history. */
  percentApplied: number;
  /** Derived at read time — see loadEarnings. */
  state: "held" | "released" | "paid" | "reversed";
  /** When a held row clears the refund window. Null once it already has. */
  clearsAt: string | null;
}

export interface Earnings {
  /** People who signed up through the link. Most of them never pay. */
  signups: number;
  /** Distinct referrals who have actually paid at least once. */
  converted: number;
  totals: CurrencyTotal[];
  /** Newest first. One row per qualifying payment — and there is at most one
   *  per referred person, ever, which is what makes this a short list. */
  rows: CommissionRow[];
}

/** Minor units to something a person reads. Never sums across currencies. */
export function formatMoney(minor: number, currency: string): string {
  if (currency === "uzs") {
    // Som has no subunit in practice; tiyin exist but nothing is priced in them.
    return `${Math.round(minor / 100).toLocaleString("en-US")} so'm`;
  }
  return `$${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The floor a balance must clear before it is paid out, in its own currency. */
export function payoutFloor(settings: ReferralSettings, currency: string): number {
  return currency === "uzs" ? settings.minPayoutUzsMinor : settings.minPayoutMinor;
}

/**
 * When the next monthly payout goes out: the first of next month.
 *
 * NOT STORED, because a date the calendar already decides is not a fact worth
 * keeping — the same reasoning that made `payable` a derived state rather than a
 * column something has to remember to flip. Pure, so the page and the tests
 * agree without a clock between them.
 */
export function nextPayoutDate(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
}

/**
 * What one upgrade is actually worth, derived from the real price list.
 *
 * THE HONEST NUMBER, and it is smaller than a referral programme would like.
 * The design mocked up "$14.85, typical annual upgrade" — there is no annual
 * plan, and 15% of the largest thing anyone can buy is $4.50. Quoting a figure
 * nobody can earn is the same failure mode as an inflated band: it is forgiven
 * right up until the first payout, and never afterwards.
 *
 * Derived from PLAN_TIERS rather than written down, so it cannot drift when
 * pricing moves.
 */
export function commissionRange(percent: number): { minMinor: number; maxMinor: number } {
  const paid = Object.values(PLAN_TIERS)
    .map((t) => t.price)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (paid.length === 0) return { minMinor: 0, maxMinor: 0 };
  const cut = (usd: number) => Math.floor((usd * 100 * percent) / 100);
  const amounts = paid.map(cut);
  return { minMinor: Math.min(...amounts), maxMinor: Math.max(...amounts) };
}

/** A held commission's state, given its clearing date. Shared by page and tests. */
export function commissionState(
  status: CommissionStatus,
  payableAfter: string | null,
  now: number = Date.now(),
): CommissionRow["state"] {
  if (status === "reversed") return "reversed";
  if (status === "paid") return "paid";
  if (status === "payable") return "released";
  const clear = payableAfter ? Date.parse(payableAfter) : now;
  return Number.isFinite(clear) && clear <= now ? "released" : "held";
}
