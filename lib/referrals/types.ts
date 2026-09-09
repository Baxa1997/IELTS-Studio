/**
 * Referral programme contracts. Pure — no `server-only` — so the apply form, the
 * admin queue and the tests all share one definition.
 */

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
}

export interface Earnings {
  /** People who signed up through the link. Most of them never pay. */
  signups: number;
  /** Distinct referrals who have actually paid at least once. */
  converted: number;
  totals: CurrencyTotal[];
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
