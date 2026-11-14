import { describe, expect, it } from "vitest";

import type { Quota } from "@/lib/quota";

import { planTier } from "./plans";
import { gradeUpgradeCopy, gradeUpgradeOffer } from "./upgrade-offer";

const quota = (limit: number | null, used = 0): Quota => ({
  limit,
  used,
  remaining: limit === null ? null : Math.max(0, limit - used),
  resetAt: "2026-12-01T00:00:00.000Z",
  exceeded: limit !== null && used >= limit,
});

/**
 * WHO IS ASKED TO UPGRADE ON A RESULT — pinned, because the wrong answer is a
 * centre's student being sold a plan under their teacher's homework.
 */
describe("the upgrade offer on a graded essay", () => {
  it("is never made to an unmetered org — a centre, whatever its plan row says", () => {
    // billing_enforced = false reaches here as limit null (lib/quota.ts).
    expect(gradeUpgradeOffer({ plan: "trial", grade: quota(null) })).toBeNull();
    expect(gradeUpgradeOffer({ plan: "pro", grade: quota(null) })).toBeNull();
  });

  it("offers the free plan the next plan up, at that plan's own price and allowance", () => {
    const free = planTier("trial");
    const next = planTier("starter");
    const offer = gradeUpgradeOffer({ plan: "trial", grade: quota(free.gradeLimit, 2) });
    expect(offer).toMatchObject({
      remaining: (free.gradeLimit ?? 0) - 2,
      nextName: next.name,
      nextGrades: next.gradeLimit,
      nextPrice: `$${next.price} a month`,
    });
  });

  it("skips a plan that holds no more gradings than the org already has", () => {
    // An admin raised this free org's allowance past Standard's.
    const raised = (planTier("starter").gradeLimit ?? 0) + 10;
    expect(gradeUpgradeOffer({ plan: "trial", grade: quota(raised) })?.nextName).toBe(planTier("pro").name);
  });

  it("counts down with each grading of the sitting, and says so when none are left", () => {
    const offer = gradeUpgradeOffer({ plan: "trial", grade: quota(5, 3) })!;
    expect(gradeUpgradeCopy(offer, 1).title).toBe("1 of 5 gradings left this month");
    expect(gradeUpgradeCopy(offer, 2).title).toMatch(/last grading/);
    expect(gradeUpgradeCopy(offer, 9).title).toMatch(/last grading/);
    expect(gradeUpgradeCopy(offer, 1).href).toBe("/pricing");
  });
});
