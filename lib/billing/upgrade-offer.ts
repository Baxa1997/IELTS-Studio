import type { Quota } from "@/lib/quota";

import { PLAN_ORDER, planTier, type OrgPlan } from "./plans";

/**
 * The upgrade offer on a graded essay's result — the one moment a learner has
 * just seen what a grading is worth.
 *
 * WHY HERE. Until this, the only prompts to upgrade were the rail's plan button
 * and the strip that appears once an allowance is nearly gone: both speak when
 * the learner is being refused something. The result screen is where they want
 * the next thing — to revise and be graded again — and can see how many of
 * those they have left.
 *
 * Pure (no I/O), like plans.ts: the studio page builds the offer on the server
 * and the client studio words it, because the count moves with every grade of
 * the sitting and the page is not reloaded between them.
 */
export interface GradeUpgradeOffer {
  /** Gradings left this month when the studio opened. */
  remaining: number;
  limit: number;
  /** The plan the offer names: "Standard". */
  nextName: string;
  /** "$5.99 a month" / "$29.99 for 3 months". */
  nextPrice: string;
  /** `null` = unlimited. */
  nextGrades: number | null;
}

/**
 * ⚠️ `null` FOR ANYONE WHOSE GRADINGS ARE NOT METERED — and that is read off the
 * QUOTA, never off the plan or the role. A centre runs with `billing_enforced`
 * false (lib/quota.ts `effectiveLimit`), so its students and staff arrive here
 * with `limit: null` whatever plan the org row says: they cannot buy anything
 * and must never be asked to. Unlimited plans land on the same line.
 */
export function gradeUpgradeOffer(usage: { plan: OrgPlan; grade: Quota }): GradeUpgradeOffer | null {
  const { limit, remaining } = usage.grade;
  if (limit === null || remaining === null) return null;
  // The next plan up that actually holds MORE gradings. Compared with the
  // quota's own limit, not the tier's: an admin can raise one org's allowance,
  // and offering that org a plan with fewer gradings than it has would be a lie.
  const next = PLAN_ORDER.slice(PLAN_ORDER.indexOf(usage.plan) + 1)
    .map(planTier)
    .find((t) => t.price !== null && (t.gradeLimit === null || t.gradeLimit > limit));
  if (!next) return null;
  return {
    remaining,
    limit,
    nextName: next.name,
    nextPrice: `$${next.price} ${next.months === 1 ? "a month" : `for ${next.months} months`}`,
    nextGrades: next.gradeLimit,
  };
}

/**
 * The card's words. `gradedSinceOpen` is how many gradings this sitting has
 * spent — the first submit and every revision — since the offer was built.
 */
export function gradeUpgradeCopy(offer: GradeUpgradeOffer, gradedSinceOpen: number) {
  const left = Math.max(0, offer.remaining - gradedSinceOpen);
  const more = offer.nextGrades === null ? "unlimited gradings" : `${offer.nextGrades} gradings a month`;
  const plan = `${offer.nextName} gives you ${more} for ${offer.nextPrice}.`;
  return {
    lead: "",
    title: left === 0 ? "That was your last grading this month" : `${left} of ${offer.limit} gradings left this month`,
    body:
      left === 0
        ? `Your feedback stays here. To revise this essay and see the band move, you need another grading. ${plan}`
        : `The fastest way up a band is to revise this essay and grade it again. ${plan}`,
    cta: `See ${offer.nextName}`,
    href: "/pricing",
  };
}
