/**
 * Money, and the status rules that decide whether any is earned.
 *
 * Both halves here are cheap to get wrong in a way nothing reports: a currency
 * rendered in the wrong denomination looks like a plausible number, and a status
 * rule that lets a stopped account keep earning produces correct-looking rows
 * that should not exist.
 */

import { describe, expect, it } from "vitest";

import { canEarn, formatMoney, linkIsDead, type ReferralStatus } from "./types";

describe("formatMoney", () => {
  it("renders USD from cents", () => {
    expect(formatMoney(300, "usd")).toBe("$3.00");
    expect(formatMoney(1499, "usd")).toBe("$14.99");
    expect(formatMoney(0, "usd")).toBe("$0.00");
  });

  it("renders UZS from tiyin, without inventing a subunit", () => {
    // 185,000 so'm is stored as 18,500,000 tiyin. Rendering that as "18500000"
    // or as "185000.00 so'm" are both wrong in ways that look like a number.
    expect(formatMoney(18_500_000, "uzs")).toBe("185,000 so'm");
    expect(formatMoney(7_500_000, "uzs")).toBe("75,000 so'm");
  });

  it("keeps the two denominations apart at the same numeric value", () => {
    // The bug this guards: treating every currency as cents. 300 minor units is
    // three dollars or three so'm, and they must not render alike.
    expect(formatMoney(300, "usd")).not.toBe(formatMoney(300, "uzs"));
  });

  it("groups thousands so a large balance stays readable", () => {
    expect(formatMoney(123_456_789, "usd")).toBe("$1,234,567.89");
  });
});

describe("who is allowed to earn", () => {
  const all: ReferralStatus[] = ["pending", "active", "rejected", "closed", "revoked"];

  it("lets exactly one status earn", () => {
    // Accrual asks this on every payment, which is what makes stopping somebody
    // take effect on referrals they made months earlier.
    expect(all.filter(canEarn)).toEqual(["active"]);
  });

  it("kills the link for every status except active", () => {
    for (const status of all) {
      expect(linkIsDead(status), status).toBe(status !== "active");
    }
  });

  it("agrees with itself — a dead link never earns", () => {
    // These two are asked in different places (attribution vs accrual) and must
    // not drift apart: a link that still attributes while the account cannot
    // earn would silently strand referrals with nobody to credit.
    for (const status of all) expect(canEarn(status)).toBe(!linkIsDead(status));
  });
});
