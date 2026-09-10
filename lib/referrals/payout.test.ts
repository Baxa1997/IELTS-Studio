/**
 * SETTLING A MONTH — the half of the programme that was never built.
 *
 * Commission accrued, cleared its hold, and then stopped. `referral_payouts`
 * had no writer anywhere in the codebase, so nothing could mark a month settled:
 * "Commission owed" was a figure that only ever went up, and "paid out monthly"
 * on the learner's page had nothing behind it.
 *
 * This is also the only path in the feature where money LEAVES, and it runs
 * without a transaction — supabase-js has none. So the ordering below is not
 * stylistic. Get it wrong and you get commissions marked paid with no record of
 * the payment, which is the one failure here that cannot be reconstructed
 * afterwards.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const adminSide = code("./admin.ts");
const actions = code("../../app/admin/actions.ts");
const payRow = code("../../app/admin/referrals/payouts/pay-row.tsx");
const notify = code("./notify.ts");
const migration = read("../../supabase/migrations/20260907120000_referrals.sql");

const recordPayout = adminSide.slice(adminSide.indexOf("export async function recordPayout"));

describe("the amount is derived, never accepted", () => {
  it("takes no amount from the caller", () => {
    // A reviewer typing an amount could settle more than is owed, or less, and
    // the ledger would agree with whatever was typed. The sum comes from the
    // commissions that actually cleared instead.
    const args = recordPayout.slice(0, recordPayout.indexOf("}): Promise"));
    expect(args).not.toMatch(/amountMinor|amount_minor|amount:/);
  });

  it("sums only what has cleared its hold", () => {
    expect(recordPayout).toMatch(/commissionState\(/);
    expect(recordPayout).toMatch(/=== "released"/);
    expect(recordPayout).toMatch(/reduce\(/);
  });

  it("refuses a balance under the floor, in that balance's own currency", () => {
    expect(recordPayout).toMatch(/payoutFloor\(settings, args\.currency\)/);
  });

  it("carries no amount field on the form either", () => {
    expect(payRow).not.toMatch(/name="amount/);
    expect(payRow).toMatch(/name="reference"/);
  });

  it("passes no amount through the action", () => {
    const fn = actions.slice(actions.indexOf("export async function markReferralPaid"));
    expect(fn.slice(0, fn.indexOf("\n}"))).not.toMatch(/amountMinor/);
  });
});

describe("no transaction, so the order is the safety", () => {
  it("writes the payout row before settling the commissions", () => {
    // The other order can mark commissions paid and then fail to record the
    // payment — money gone from the ledger with nothing saying where.
    const payoutInsert = recordPayout.indexOf('.from("referral_payouts")');
    const settle = recordPayout.indexOf('status: "paid"');
    expect(payoutInsert).toBeGreaterThan(-1);
    expect(settle).toBeGreaterThan(payoutInsert);
  });

  it("settles by explicit id, not by a filter that could widen", () => {
    // A filter re-evaluated at write time can pick up a commission that cleared
    // in the milliseconds since the sum was taken — paying out more than the
    // payout row records.
    expect(recordPayout).toMatch(/\.in\("id", ids\)/);
  });

  it("re-checks status at write time so a concurrent settlement collides", () => {
    const settle = recordPayout.slice(recordPayout.indexOf('.in("id", ids)'));
    expect(settle).toMatch(/\.eq\("status", "pending"\)/);
  });

  it("rolls the payout row back when the settle does not cover every id", () => {
    expect(recordPayout).toMatch(/\(settled\?\.length \?\? 0\) !== ids\.length/);
    expect(recordPayout).toMatch(/\.from\("referral_payouts"\)\s*\.delete\(\)/);
  });

  it("tells the reviewer nothing was recorded, rather than half of it", () => {
    expect(recordPayout).toMatch(/nothing was recorded/);
  });
});

describe("what the referrer is told", () => {
  it("emails them that it went out", () => {
    expect(notify).toMatch(/export async function notifyPaid/);
    expect(recordPayout).toMatch(/await notifyPaid\(/);
  });

  it("sends only after the ledger is settled", () => {
    const settle = recordPayout.indexOf('status: "paid"');
    const email = recordPayout.indexOf("notifyPaid(");
    expect(email).toBeGreaterThan(settle);
  });

  it("still does not name anybody who paid", () => {
    const fn = notify.slice(notify.indexOf("export async function notifyPaid"));
    expect(fn).not.toMatch(/organization|payer|customer/i);
  });
});

describe("the screen and the schema line up", () => {
  it("groups by referrer and currency, which is what one payout row is", () => {
    const due = adminSide.slice(adminSide.indexOf("export async function loadDuePayouts"));
    expect(due).toMatch(/\$\{accountId\}:\$\{currency\}/);
  });

  it("shows below-floor balances rather than hiding them", () => {
    // Hiding them leaves a reviewer wondering where somebody's money went.
    const due = adminSide.slice(adminSide.indexOf("export async function loadDuePayouts"));
    expect(due).toMatch(/ready: b\.amountMinor >= payoutFloor/);
  });

  it("writes every column referral_payouts actually has", () => {
    const insert = recordPayout.slice(recordPayout.indexOf('.from("referral_payouts")'));
    for (const col of ["referral_account_id", "currency", "amount_minor", "reference", "note", "marked_by"]) {
      expect(insert, `payout insert is missing ${col}`).toMatch(new RegExp(col));
    }
    expect(migration).toMatch(/create table if not exists public\.referral_payouts/);
  });

  it("is logged, and the reference survives in the audit row", () => {
    const fn = actions.slice(actions.indexOf("export async function markReferralPaid"));
    expect(fn).toMatch(/action: "referral\.payout"/);
    expect(fn).toMatch(/detail: \{ currency, reference/);
  });

  it("is reachable only behind requireSuperAdmin", () => {
    const page = code("../../app/admin/referrals/payouts/page.tsx");
    expect(page).toMatch(/await requireSuperAdmin\(\)/);
    expect(page.indexOf("requireSuperAdmin()")).toBeLessThan(page.indexOf("loadDuePayouts("));
    const fn = actions.slice(actions.indexOf("export async function markReferralPaid"));
    expect(fn.indexOf("requireSuperAdmin()")).toBeLessThan(fn.indexOf("recordPayout("));
  });
});

describe("the split that made this safe to write", () => {
  it("keeps every payout function on the reviewer's side", () => {
    const learner = code("./service.ts");
    for (const name of ["recordPayout", "loadDuePayouts", "loadPayoutHistory"]) {
      expect(learner, `${name} must not be importable from the learner service`).not.toMatch(
        new RegExp(name),
      );
    }
  });
});
