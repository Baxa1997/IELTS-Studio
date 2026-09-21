/**
 * EVERY PAGED REFERRAL QUERY ORDERS BY SOMETHING UNIQUE.
 *
 * `fetchAll` exists because PostgREST caps an unbounded select at 1000 rows, so
 * every balance past a thousand commissions was silently short. The fix
 * introduced a second bug in the same breath: `range()` is OFFSET/LIMIT, and
 * Postgres guarantees no ordering between two separate queries — so paging an
 * UNORDERED select can hand back the same row on two pages while another row is
 * never returned at all.
 *
 * Both failures are invisible and both are money:
 *
 *   recordPayout          a duplicated row is paid twice, out of our pocket
 *   loadDuePayouts        the payouts screen offers the wrong amount
 *   loadProgrammeTotals   the liability the platform reports is wrong
 *   loadEarnings          the referrer is shown a balance that is not theirs
 *
 * and none of it appears until a query's own result set crosses a thousand rows,
 * which is precisely the size `fetchAll` was written to survive.
 *
 * A DISPLAY COLUMN DOES NOT COUNT. `created_at`, `attributed_at` and
 * `reviewed_at` are non-unique and `reviewed_at` is nullable, so ties re-order
 * freely between pages. This asserts a UNIQUE tiebreaker on every site.
 *
 * Asserted against the source because the failure is a property of the SQL
 * PostgREST builds, and neither jsdom nor a fake client can reproduce it.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");

/** The primary key of each table a paged query reads. Anything else is a tie. */
const UNIQUE_BY_TABLE: Record<string, string> = {
  referral_commissions: "id",
  referral_accounts: "id",
  // The whole point of this table: one row per organization, so that IS the key.
  referral_attributions: "organization_id",
};

const FILES = ["./admin.ts", "./service.ts"] as const;

/**
 * Every `.range(from, to)` in a file, with the chained call text leading up to
 * it — which is where the `.from()` and any `.order()` live.
 */
function pagedQueries(source: string): { table: string; chain: string }[] {
  const out: { table: string; chain: string }[] = [];
  const marker = /\.range\(from, to\)/g;
  let hit: RegExpExecArray | null;
  while ((hit = marker.exec(source))) {
    // Walk back to the `.from("table")` that opens this chain.
    const before = source.slice(0, hit.index);
    const from = before.lastIndexOf('.from("');
    if (from === -1) continue;
    const table = before.slice(from + 7, before.indexOf('"', from + 7));
    out.push({ table, chain: before.slice(from) });
  }
  return out;
}

describe("paged referral queries cannot duplicate or skip a row", () => {
  for (const file of FILES) {
    const source = read(file);
    const queries = pagedQueries(source);

    it(`${file} has paged queries to check`, () => {
      // If this ever hits zero the assertions below become vacuous, which is the
      // failure mode of every test that greps for something.
      expect(queries.length).toBeGreaterThan(0);
    });

    for (const { table, chain } of queries) {
      const key = UNIQUE_BY_TABLE[table];

      it(`${file}: the paged read of ${table} orders by ${key ?? "a known key"}`, () => {
        expect(
          key,
          `${table} is paged but has no known unique key — add it to UNIQUE_BY_TABLE`,
        ).toBeDefined();
        expect(
          chain.includes(`.order("${key}")`) ||
            chain.includes(`.order("${key}",`),
          `paging ${table} without ordering by ${key} can return one row twice and another never`,
        ).toBe(true);
      });
    }
  }
});

describe("the helper says why", () => {
  it("warns callers that a range without a unique order is unsafe", () => {
    // The rule is only enforceable if the next person reads it where they will
    // be writing the next paged query.
    const db = read("./db.ts");
    expect(db).toMatch(/EVERY CALLER MUST ORDER BY SOMETHING UNIQUE/);
  });
});
