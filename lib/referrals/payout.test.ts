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

/**
 * One function's body, bounded at the next top-level export.
 *
 * A SLICE THAT RUNS TO END-OF-FILE IS NOT A TEST OF THAT FUNCTION. Written the
 * naive way, the "loadDuePayouts filters on both states" assertion below kept
 * passing after loadDuePayouts was narrowed back to `pending` — because the
 * slice ran on past it into recordPayout, which still had the wider filter.
 * The sabotage that proved it was caught only because it was run.
 */
function fn(src: string, name: string): string {
  const start = src.indexOf(`export async function ${name}`);
  if (start < 0) return "";
  const next = src.indexOf("\nexport ", start + 1);
  return next < 0 ? src.slice(start) : src.slice(start, next);
}

const recordPayout = fn(adminSide, "recordPayout");

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
    expect(fn(actions, "markReferralPaid")).not.toMatch(/amountMinor/);
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
    // Excludes `paid` and `reversed`, which is the whole job of the guard.
    const settle = recordPayout.slice(recordPayout.indexOf('.in("id", ids)'));
    expect(settle).toMatch(/\.in\("status", \["pending", "payable"\]\)/);
  });

  it("rolls the payout row back when the settle does not cover every id", () => {
    expect(recordPayout).toMatch(/\(settled\?\.length \?\? 0\) !== ids\.length/);
    expect(recordPayout).toMatch(/\.from\("referral_payouts"\)\s*\.delete\(\)/);
  });

  it("un-settles the rows that DID update before deleting the payout", () => {
    /* THE BUG THIS CAUGHT, in code written two commits earlier.
     *
     * The settle is a single UPDATE, so Postgres commits every row that
     * matched — a short count means somebody else settled the rest first, not
     * that nothing happened. Deleting the payout row at that point leaves those
     * commissions `paid` with `payout_id` nulled by the FK's ON DELETE SET
     * NULL: money marked paid with no record of the payment, while the error
     * message says "nothing was recorded". That is the single state in this
     * feature that cannot be reconstructed afterwards. */
    const branch = recordPayout.slice(recordPayout.indexOf("if (settleError ||"));
    const undo = branch.indexOf('status: "pending", payout_id: null');
    const del = branch.indexOf('.from("referral_payouts")');
    expect(undo, "the partial settle is never undone").toBeGreaterThan(-1);
    expect(undo).toBeLessThan(del);
    expect(branch).toMatch(/\.eq\("payout_id", payout\.id\)/);
  });

  it("keeps the payout row when the undo itself fails", () => {
    // A payout row with its commissions still attached reconciles: the amounts
    // agree and a person can see what happened. An orphaned `paid` row with a
    // null payout does not, so deleting on a failed undo makes it worse.
    const branch = recordPayout.slice(recordPayout.indexOf("if (undoError)"));
    expect(branch.slice(0, branch.indexOf("}"))).not.toMatch(/\.delete\(\)/);
    expect(branch).toMatch(/left in place/);
  });

  it("treats both unsettled states as payable, not just the stored one", () => {
    // `payable` is derived at read time, so filtering `pending` alone catches
    // everything by coincidence. If anything ever writes `payable`, a
    // pending-only filter silently stops paying half the ledger.
    expect(fn(adminSide, "loadDuePayouts")).toMatch(/\.in\("status", \["pending", "payable"\]\)/);
    expect(recordPayout).toMatch(/\.in\("status", \["pending", "payable"\]\)/);
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
    const start = notify.indexOf("export async function notifyPaid");
    const next = notify.indexOf("\nexport ", start + 1);
    expect(next < 0 ? notify.slice(start) : notify.slice(start, next)).not.toMatch(
      /organization|payer|customer/i,
    );
  });
});

describe("the screen and the schema line up", () => {
  it("groups by referrer and currency, which is what one payout row is", () => {
    expect(fn(adminSide, "loadDuePayouts")).toMatch(/\$\{accountId\}:\$\{currency\}/);
  });

  it("shows below-floor balances rather than hiding them", () => {
    // Hiding them leaves a reviewer wondering where somebody's money went.
    expect(fn(adminSide, "loadDuePayouts")).toMatch(/ready: b\.amountMinor >= payoutFloor/);
  });

  it("writes every column referral_payouts actually has", () => {
    const insert = recordPayout.slice(recordPayout.indexOf('.from("referral_payouts")'));
    for (const col of ["referral_account_id", "currency", "amount_minor", "reference", "note", "marked_by"]) {
      expect(insert, `payout insert is missing ${col}`).toMatch(new RegExp(col));
    }
    expect(migration).toMatch(/create table if not exists public\.referral_payouts/);
  });

  it("is logged, and the reference survives in the audit row", () => {
    const paid = fn(actions, "markReferralPaid");
    expect(paid).toMatch(/action: "referral\.payout"/);
    expect(paid).toMatch(/detail: \{ currency, reference/);
  });

  it("is reachable only behind requireSuperAdmin", () => {
    const page = code("../../app/admin/referrals/payouts/page.tsx");
    expect(page).toMatch(/await requireSuperAdmin\(\)/);
    expect(page.indexOf("requireSuperAdmin()")).toBeLessThan(page.indexOf("loadDuePayouts("));
    const paid = fn(actions, "markReferralPaid");
    expect(paid.indexOf("requireSuperAdmin()")).toBeLessThan(paid.indexOf("recordPayout("));
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
