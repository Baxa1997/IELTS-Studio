/**
 * THE REFERRER'S LEDGER MUST NOT NAME WHO PAID.
 *
 * This is the invariant the redesign came closest to breaking. The design handed
 * over for these pages had an earnings table with a "Person" column and a "Their
 * payment" column — `Dilnoza R. · Sep 28 · $39.00 · your 15% $5.85`. Building it
 * as drawn would have routed around three separate mechanisms that exist to
 * withhold exactly that:
 *
 *   1. `organization_id` is left out of the referrer's column grant on
 *      `referral_commissions` (20260907120000_referrals.sql).
 *   2. `referral_attributions` has no policy for `authenticated` at all, so a
 *      referrer cannot read who they introduced.
 *   3. `notifyEarned` is tested never to name a payer in an email.
 *
 * A table is the fourth door, and it is the easiest one to leave open, because
 * the page is rendered by service-role code that CAN see all of it. Nothing at
 * the database would have stopped it — only this.
 *
 * The gross amount is the same disclosure wearing a different hat: it says which
 * plan somebody bought. It is left out for the same reason.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");

/**
 * The file with its comments removed.
 *
 * WITHOUT THIS EVERY ASSERTION BELOW PASSES FOR THE WRONG REASON — or fails
 * for one. These files explain in prose exactly what they refuse to render
 * ("the design had a Their payment column…"), so a naive `not.toMatch` on the
 * raw text trips over the sentence describing the absence and reports the very
 * leak it was written to catch. Comments say why; code says what. Only the
 * second one ships.
 *
 * `//` is left alone when it follows a colon, so a URL survives.
 */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
const ledger = code("../../app/(app)/referrals/ledger.tsx");
const page = code("../../app/(app)/referrals/page.tsx");
const types = code("./types.ts");
const service = code("./service.ts");
const migration = read("../../supabase/migrations/20260907120000_referrals.sql");

describe("what the referrer's row is allowed to carry", () => {
  it("has no payer on the type at all", () => {
    // Enforced on the CONTRACT, not on the template. A field that does not
    // exist cannot be rendered by a later edit that seemed harmless.
    const row = types.slice(types.indexOf("export interface CommissionRow"), types.indexOf("}", types.indexOf("export interface CommissionRow")));
    expect(row).not.toMatch(/organization|payer|customer|who|name|email/i);
  });

  it("has no gross payment on the type either", () => {
    const row = types.slice(types.indexOf("export interface CommissionRow"), types.indexOf("}", types.indexOf("export interface CommissionRow")));
    expect(row).not.toMatch(/gross|paid_by|paymentMinor|totalMinor/i);
  });

  it("never selects organization_id when building the referrer's ledger", () => {
    // loadEarnings runs as service-role, so the column grant does not protect
    // it here — leaving the column out of the SELECT is what does.
    const fn = service.slice(service.indexOf("export async function loadEarnings"));
    const select = fn.slice(fn.indexOf('.select("'), fn.indexOf('.eq("referral_account_id"'));
    expect(select).not.toMatch(/organization_id/);
  });

  it("renders no Person or payment column", () => {
    expect(ledger).not.toMatch(/<Th>Person<\/Th>/);
    expect(ledger).not.toMatch(/Their payment/i);
  });

  it("keeps the withholding written down where the next person will look", () => {
    // The design asked for these columns. Without a reason recorded next to the
    // absence, the obvious "improvement" is to add them back. Read from the
    // RAW file, because this is the one assertion that is about the prose.
    expect(read("../../app/(app)/referrals/ledger.tsx")).toMatch(
      /withheld from the[\s*]+referrer's column grant/,
    );
  });
});

describe("the grant this depends on is still the grant", () => {
  it("omits organization_id from the referrer's column grant", () => {
    const grant = migration.slice(
      migration.indexOf("grant select (id, referral_account_id"),
      migration.indexOf("on public.referral_commissions to authenticated"),
    );
    expect(grant).toMatch(/amount_minor/);
    expect(grant).not.toMatch(/organization_id/);
  });

  it("gives authenticated no read of referral_attributions", () => {
    // Deny-all by absence: there is a policy for commissions and for accounts,
    // and deliberately none for attributions.
    expect(migration).not.toMatch(/on public\.referral_attributions\s+for select to authenticated/);
  });
});

describe("what the REVIEWER sees, which is a different question", () => {
  it("does carry names, because approving is a judgement about people", () => {
    // The asymmetry is the point: a super admin deciding whether an application
    // is genuine needs to see who signed up and whether they look real. A
    // referrer does not need it to be paid correctly.
    expect(service).toMatch(/export interface AdminLedgerRow/);
    const row = service.slice(service.indexOf("export interface AdminLedgerRow"), service.indexOf("}", service.indexOf("export interface AdminLedgerRow")));
    expect(row).toMatch(/who: string/);
  });

  it("is reachable only behind requireSuperAdmin", () => {
    const detail = code("../../app/admin/referrals/[id]/page.tsx");
    expect(detail).toMatch(/await requireSuperAdmin\(\)/);
    const guard = detail.indexOf("requireSuperAdmin()");
    const load = detail.indexOf("loadAccountDetail(");
    expect(guard).toBeLessThan(load);
  });
});

describe("two currencies stay two numbers", () => {
  it("invents no exchange rate on the hero", () => {
    // The design stacked "$118.20" over "1,477,500 so'm" — a conversion at
    // ~12,500. There is no rate anywhere in this system, and a hardcoded one
    // would be wrong in both currencies and drift further every week.
    const hero = code("../../app/(app)/referrals/earnings-hero.tsx");
    expect(hero).not.toMatch(/12[_,]?500|\* *12500|exchange/i);
    // The second balance is announced as a separate one, not a translation.
    expect(hero).toMatch(/and \{formatMoney/);
  });

  it("keeps a payout floor per currency", () => {
    expect(types).toMatch(/export function payoutFloor/);
    expect(page).toMatch(/payoutFloor\(settings, t\.currency\)/);
  });
});

describe("the offer quotes a number somebody can actually earn", () => {
  it("derives the per-upgrade range from the real price list", () => {
    // The design mocked "$14.85 — typical annual upgrade". There is no annual
    // plan; 15% of the largest thing anybody can buy is $4.50. Quoting a figure
    // nobody can reach is the same failure as an inflated band — forgiven until
    // the first payout, and never after it.
    const panel = code("../../app/(app)/referrals/pitch-panel.tsx");
    expect(panel).toMatch(/commissionRange\(percent\)/);
    expect(panel).not.toMatch(/14\.85|annual/i);
    expect(types).toMatch(/PLAN_TIERS/);
  });

  it("moves with pricing instead of being written down", () => {
    const fn = types.slice(types.indexOf("export function commissionRange"));
    expect(fn).toMatch(/PLAN_TIERS/);
    expect(fn).not.toMatch(/\b(?:599|1499|2999)\b/); // no inlined prices
  });
});
