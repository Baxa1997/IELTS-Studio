/**
 * ONE COMMISSION PER REFERRAL, EVER.
 *
 * The referrer earns from a referred account's FIRST payment and never again.
 * This is the rule most easily broken by a change that looks unrelated, and the
 * breakage is silent and expensive: it pays real money, on a schedule, and
 * nothing reports it.
 *
 * The near-miss worth remembering: `billing_event_id unique` was assumed to give
 * this and does not. It stops one EVENT paying twice; two payments are two
 * events. That gap was invisible on Stripe (whose renewal event is unmapped) and
 * would have paid every single month on Payme and Click, which have no
 * subscription object — each month is a fresh transaction with a fresh id.
 * The same programme would have meant two different things in two currencies.
 *
 * jsdom cannot run Postgres, so this asserts the guarantee where it is written:
 * the migration, and the guard in the accrual path.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const migration = read("../../supabase/migrations/20260907120000_referrals.sql");
const accrual = read("./accrual.ts");
const types = read("./types.ts");

describe("the database bounds the payout", () => {
  it("allows at most one commission row per referred organization", () => {
    // A partial unique index: `organization_id` is nullable (a deleted org sets
    // it null), and multiple nulls must stay legal.
    expect(migration).toMatch(
      /create unique index if not exists referral_commissions_one_per_org\s+on public\.referral_commissions \(organization_id\)\s+where organization_id is not null;/,
    );
  });

  it("still de-duplicates a redelivered webhook separately", () => {
    // The two constraints answer different questions and neither replaces the
    // other. Dropping this one would let a provider retry pay twice for the
    // FIRST payment, which the org-level index cannot see as a duplicate.
    expect(migration).toMatch(/billing_event_id\s+uuid not null unique/);
  });

  it("is idempotent, so the file can be re-applied", () => {
    expect(migration).toContain("create unique index if not exists referral_commissions_one_per_org");
  });
});

describe("the accrual path declines quietly", () => {
  it("checks for an existing commission before doing any other work", () => {
    // Ordering matters for cost, not correctness: after month one this is the
    // answer for every payment a referred account ever makes, so it should come
    // before the account, settings and self-referral lookups.
    const attribution = accrual.indexOf("referral_attributions");
    const already = accrual.indexOf('.eq("organization_id", input.organizationId)');
    const account = accrual.indexOf("referral_accounts");
    const settings = accrual.indexOf("referral_settings");
    expect(already).toBeGreaterThan(attribution);
    expect(already).toBeLessThan(account);
    expect(already).toBeLessThan(settings);
  });

  it("counts any existing row, including a reversed one", () => {
    // A reversed commission still occupies the slot — otherwise pay, refund,
    // pay again mints a second commission, which is a loop rather than an edge.
    const guard = accrual.slice(accrual.indexOf("ALREADY EARNED FROM"), accrual.indexOf("referral_accounts"));
    expect(guard).not.toMatch(/status/);
  });

  it("treats a unique violation as a no-op, not an error", () => {
    // The check above cannot close the race between two concurrent webhooks;
    // the constraint does, and this is what stops it becoming a logged failure.
    expect(accrual).toMatch(/error\.code !== "23505"/);
  });
});

describe("what a referrer is promised", () => {
  const page = read("../../app/(app)/referrals/page.tsx");
  const form = read("../../app/(app)/referrals/apply-form.tsx");

  it("never promises recurring commission", () => {
    // The copy said "every month they keep paying" while the code paid once.
    // Promising money we do not pay is worse than paying less than we could.
    for (const [name, src] of [["page", page], ["form", form]] as const) {
      expect(src, name).not.toMatch(/every month they keep paying/i);
      expect(src, name).not.toMatch(/as long as they keep paying/i);
    }
  });

  it("says the first-payment rule out loud on both surfaces", () => {
    expect(page).toMatch(/first payment/i);
    expect(form).toMatch(/first payment/i);
  });
});

describe("the hold, the payout cycle, and money going back", () => {
  const service = read("./service.ts");
  const webhook = read("../../app/api/billing/stripe/webhook/route.ts");

  it("holds for 7 days, not 14", () => {
    expect(migration).toMatch(/hold_days\s+integer not null default 7/);
    // Fallbacks matter: they are what runs if the settings row is missing, and
    // a stale one here quietly reinstates the old policy.
    expect(service).toMatch(/hold_days \?\? 7/);
    expect(accrual).toMatch(/hold_days \?\? 7/);
  });

  it("derives payable from the hold rather than waiting for a job", () => {
    // The bug this replaced: nothing promoted `pending`, so "ready" was
    // permanently zero and every balance sat on hold forever.
    expect(service).toMatch(/payable_after/);
    // The comparison itself moved into one shared helper once three screens
    // needed it — the learner ledger, the programme total and the per-account
    // detail. Three copies of a date comparison is three chances for the
    // referrer's page and the reviewer's page to disagree about whether the
    // same commission has cleared.
    expect(types).toMatch(/export function commissionState/);
    expect(types).toMatch(/clear <= now/);
  });

  it("routes every balance through that one helper", () => {
    // If a caller re-implements the comparison inline, this stops biting and
    // the two sides can drift apart by a day without anybody noticing.
    const callers = service.match(/commissionState\(/g) ?? [];
    expect(callers.length).toBeGreaterThanOrEqual(3);
    // And nothing recomputes it by hand alongside the helper.
    expect(service).not.toMatch(/Date\.parse\(String\(row\.payable_after\)\)/);
  });

  it("counts a reversed commission toward no total, but still shows the row", () => {
    // Money that came back is not earnings. A row that VANISHED from the
    // statement, though, is how somebody decides the numbers are invented —
    // so it is excluded from the arithmetic and kept in the ledger.
    expect(service).toMatch(/if \(state === "reversed"\) continue;/);
    expect(service).toMatch(/ledger\.push\(/);
    const push = service.indexOf("ledger.push(");
    const skip = service.indexOf('if (state === "reversed") continue;');
    expect(push).toBeLessThan(skip); // pushed first, then excluded from totals
  });

  it("reverses a refund across pending AND payable, but never paid", () => {
    // Monthly settlement means a commission can sit `payable` for weeks. A
    // reversal that only covered `pending` would miss most of the window it
    // exists for.
    expect(accrual).toMatch(/\.in\("status", \["pending", "payable"\]\)/);
    expect(accrual).toMatch(/\.eq\("status", "paid"\)/); // counted, then left alone
  });

  it("treats a dispute like a refund", () => {
    // The money is gone either way; waiting for the dispute to resolve would
    // mean paying commission on a payment we are losing.
    expect(webhook).toMatch(/charge\.refunded/);
    expect(webhook).toMatch(/charge\.dispute\.created/);
  });

  it("finds the org through the customer, since a refund carries no metadata", () => {
    expect(accrual).toMatch(/external_customer_id/);
  });
});

/**
 * STOPPING SOMEBODY STOPS THEM EARNING — including from referrals they had
 * already made. This was documented the other way round for a while: the
 * migration said `closed` kept "paying out their window", which was written when
 * commission was recurring and capped at twelve months. It is one-time now, so
 * there is no window, and the sentence described behaviour the code never had.
 * A doc that disagrees with the code is worse than no doc, because it is the one
 * somebody reads before deciding whether to close an account.
 */
describe("a stopped referrer earns nothing more", () => {
  const service = read("./service.ts");

  it("accrues only for an active account", () => {
    // The single gate. `closed`, `revoked`, `pending` and `rejected` all fail it,
    // and it is checked at PAYMENT time so it applies to referrals made earlier.
    expect(accrual).toMatch(/account\.status !== "active"/);
  });

  it("revokes across every unsettled state, not just the stored one", () => {
    // `payable` is derived at read time, so filtering `pending` alone catches
    // everything — by coincidence. If anything ever writes `payable`, a
    // `pending`-only filter silently stops reversing half the ledger.
    expect(service).toMatch(/\.in\("status", \["pending", "payable"\]\)/);
  });

  it("never reverses money already paid", () => {
    // Both stop paths and the refund path must stop at `paid`. Clawing back a
    // settled payout is a conversation, not an UPDATE.
    expect(service).not.toMatch(/"pending", "payable", "paid"/);
    expect(accrual).not.toMatch(/"pending", "payable", "paid"/);
  });

  it("no longer promises a window that does not exist", () => {
    expect(migration).not.toMatch(/keep paying out their window/);
    expect(service).not.toMatch(/keep paying out their window/);
  });
});
