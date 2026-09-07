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
