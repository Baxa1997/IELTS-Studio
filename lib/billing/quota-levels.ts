/**
 * When a monthly allowance is worth telling somebody about — pure, no I/O, so
 * the thresholds are executed by tests rather than read off the source.
 */

import type { Quota } from "@/lib/quota";

export type QuotaLevel = "warning" | "exhausted";

/**
 * The share of an allowance at which the heads-up goes out — rounded UP.
 *
 * ⚠️ The rounding is what keeps small allowances quiet, so there is no separate
 * minimum: under 5, 80% rounds up to the limit itself (4 × 0.8 = 3.2 → 4), and
 * those allowances only ever get "none left". A floor here would warn a free
 * learner after their first of two mocks.
 */
export const WARN_AT = 0.8;

export function quotaLevel(q: Pick<Quota, "limit" | "used">): QuotaLevel | null {
  // Unlimited — nothing to run out of.
  if (q.limit === null) return null;
  // ⚠️ 0 is an admin blocking the feature on purpose, not an allowance that was
  // spent. "You have used all 0" every month would be noise about a decision
  // somebody already made.
  if (q.limit <= 0) return null;
  if (q.used >= q.limit) return "exhausted";
  if (q.used >= Math.ceil(q.limit * WARN_AT)) return "warning";
  return null;
}
