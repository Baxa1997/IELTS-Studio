/**
 * Two bugs found reviewing the finished feature. Neither showed up in any test,
 * in the build, or on the page — which is what they have in common and why they
 * are guarded together.
 *
 * ONE: the code lookup matched by PATTERN. `.ilike("code", code)` treats `_` as
 * a single-character wildcard, and `isCodeShape` permits `_` because it mirrors
 * the column's CHECK constraint. Probed against the live database,
 * `?ref=q_______` matched the real code `qg8dtnd9` — one known character was
 * enough. That let anyone attribute a signup to a referrer they had guessed a
 * letter of, and, worse, made each probe leak the next character, so the whole
 * code space could be walked. `maybeSingle()` disguised it by erroring whenever
 * a pattern hit two rows, so it only ever appeared to "work" once narrowed to
 * exactly one.
 *
 * TWO: every balance was summed from an unbounded select, and PostgREST caps
 * those. Measured on this project at 1000 rows (`ai_usage`: 2335 rows, an
 * unbounded select returns 1000). Past a thousand commissions the arithmetic
 * silently stopped at the cap — no error, no empty page, just a referrer shown
 * less money than they are owed and a platform shown a smaller liability than
 * it has. It is the shape of bug that only arrives once the programme works.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const attribution = code("./attribution.ts");
const service = code("./service.ts");
const adminSide = code("./admin.ts");
const db = code("./db.ts");
const shape = read("./code.ts");

describe("a referral code is matched, not pattern-matched", () => {
  it("resolves an incoming code with eq, never ilike", () => {
    expect(attribution).toMatch(/\.eq\("code", code\)/);
    expect(attribution).not.toMatch(/\.ilike\(/);
  });

  it("checks a fresh code for collision with eq too", () => {
    // Not exploitable — a generated candidate has no `_` — but a collision
    // check that matches by pattern can refuse a code that was free.
    expect(adminSide).not.toMatch(/\.ilike\(/);
    expect(adminSide).toMatch(/\.eq\("code", candidate\)/);
  });

  it("still admits the underscore that made this reachable", () => {
    // The shape check is deliberately NOT tightened: it mirrors the column's
    // CHECK constraint, and the two drifting apart is its own bug. The fix
    // belongs at the lookup, where `_` stops being a wildcard and goes back to
    // being a character.
    expect(shape).toMatch(/\^\[a-z0-9\]\[a-z0-9_-\]\{2,31\}\$/);
  });

  it("keeps the shape check ahead of the query", () => {
    const check = attribution.indexOf("isCodeShape(code)");
    const query = attribution.indexOf('.from("referral_accounts")');
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(query);
  });
});

describe("no balance is summed from a capped select", () => {
  it("pages the referrer's commissions", () => {
    const fn = service.slice(service.indexOf("export async function loadEarnings"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    expect(body).toMatch(/fetchAll<CommissionQueryRow>/);
    expect(body).toMatch(/\.range\(from, to\)/);
  });

  it("pages the distinct-payer count as well", () => {
    // `converted` is a headline figure on the dashboard. Capping it understates
    // how well somebody's link is working, which is the number they judge the
    // programme by.
    const fn = service.slice(service.indexOf("export async function loadEarnings"));
    expect(fn.slice(0, fn.indexOf("\n}"))).toMatch(/const payers = await fetchAll/);
  });

  it("pages the programme-wide totals", () => {
    // "Commission owed" is a liability. Understating it is the direction that
    // costs money rather than the direction that is merely embarrassing.
    const fn = adminSide.slice(adminSide.indexOf("export async function loadProgrammeTotals"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    expect(body).toMatch(/fetchAll<\{ status: string; applied_at: string \}>/);
    expect(body).toMatch(/fetchAll<CommissionQueryRow>/);
  });

  it("pages one account's attributions and commissions", () => {
    const fn = adminSide.slice(adminSide.indexOf("export async function loadAccountDetail"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    expect(body).toMatch(/fetchAll</);
    expect((body.match(/\.range\(from, to\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("stops paging on a short page rather than looping forever", () => {
    const fn = db.slice(db.indexOf("export async function fetchAll"));
    expect(fn).toMatch(/if \(data\.length < SIZE\) break;/);
    expect(fn).toMatch(/if \(error\) throw new Error/); // never return a partial balance on failure
  });

  it("leaves no unbounded select behind in the aggregate readers", () => {
    // The three readers that ADD UP rows must all page. `.limit()` is fine
    // elsewhere (the admin queue caps the decided list on purpose) — this is
    // about arithmetic, not listing.
    for (const [name, where] of [
      ["loadEarnings", service],
      ["loadProgrammeTotals", adminSide],
      ["loadAccountDetail", adminSide],
    ] as const) {
      const fn = where.slice(where.indexOf(`export async function ${name}`));
      const body = fn.slice(0, fn.indexOf("\n}"));
      const selects = (body.match(/\.from\("referral_(commissions|attributions|accounts)"\)/g) ?? []).length;
      const bounded =
        (body.match(/\.range\(from, to\)/g) ?? []).length +
        (body.match(/head: true/g) ?? []).length +
        (body.match(/\.maybeSingle\(\)/g) ?? []).length;
      expect(bounded, `${name} has an unbounded select`).toBeGreaterThanOrEqual(selects);
    }
  });
});
