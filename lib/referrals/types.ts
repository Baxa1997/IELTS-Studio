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
  /** Minor units, in the earning currency. */
  minPayoutMinor: number;
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
