import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRACTICE_GRID_COLUMNS, PRACTICE_GRID_GAP, PRACTICE_SKELETON_CARDS } from "./grid";

/**
 * EVERY PRACTICE CARD GRID — INCLUDING THE LOADING SKELETON — USES ONE TEMPLATE.
 *
 * ⚠️ THIS IS A GUARD AGAINST A BUG THAT LOOKS LIKE NOTHING. The skeleton and
 * the hubs held separate copies of the column rule and drifted: the hubs capped
 * at three columns, the skeleton did not, and a wide screen drew four
 * placeholder cards that repainted as three real ones when the data landed.
 * No error, no failing test — the page just moved under the reader.
 *
 * A unit test cannot catch it, because the two values only meet on screen. So
 * this reads the sources instead and insists nobody writes the template out by
 * hand a sixth time.
 */

const ROOT = join(__dirname, "..", "..");

/** Every file that lays out practice cards, real or skeleton. */
const GRIDS = [
  "app/(shell)/read/_components/read-hub.tsx",
  "app/(shell)/write/_components/library.tsx",
  "app/(shell)/listen/_components/listening-client.tsx",
  "app/(shell)/cefr/_components/multilevel-client.tsx",
  "shared/components/assignments/assigned-hub.tsx",
  "shared/components/app-shell/page-skeleton.tsx",
  "app/(shell)/listen/loading.tsx",
  "app/(shell)/cefr/loading.tsx",
];

const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("the practice card grid is defined once", () => {
  for (const rel of GRIDS) {
    it(`${rel} takes its columns from the shared constant`, () => {
      const src = read(rel);
      expect(src).toContain("gridTemplateColumns: PRACTICE_GRID_COLUMNS");
      expect(src).toContain('from "@/lib/practice/grid"');
    });

    it(`${rel} spells out no card-sized template of its own`, () => {
      const src = read(rel);
      /* ⚠️ MATCHED ON THE TRACK SIZE, NOT ON `repeat(`. These files also hold
         chip rows and two-column layouts — `minmax(110px, 1fr)`, `1fr 1fr` —
         which are legitimate literals and must not trip this. A practice card
         is never narrower than 240px, so a minmax at or above that is the one
         thing this guard is looking for. */
      const cardSized = [
        ...src.matchAll(/gridTemplateColumns:\s*["'`][^"'`]*?minmax\(\s*(?:max\(\s*)?(\d+)px/g),
      ].filter((m) => Number(m[1]) >= 240);
      expect(
        cardSized.map((m) => m[0]),
        `literal card grid in ${rel}`,
      ).toEqual([]);
    });
  }

  it("caps the grid at three columns", () => {
    // The `/ 3` is the cap. If someone widens it to four the skeleton and the
    // hubs still agree, but the cards truncate — so pin the number too.
    expect(PRACTICE_GRID_COLUMNS).toContain("/ 3");
    expect(PRACTICE_GRID_COLUMNS).toContain("280px");
  });

  it("draws a whole number of skeleton rows", () => {
    // Four cards under a three-column cap is a row of three and an orphan.
    expect(PRACTICE_SKELETON_CARDS % 3).toBe(0);
    expect(PRACTICE_SKELETON_CARDS).toBeGreaterThan(0);
  });

  it("subtracts exactly the gaps that sit between three columns", () => {
    /* ⚠️ COMPARED AGAINST THE CONSTANT, NOT AGAINST 14. Written as `14 * 2`
       this passed when PRACTICE_GRID_GAP was changed on its own — the exact
       drift it exists to catch. Derive both sides or the guard is decorative. */
    const gaps = Number(/\(100% - (\d+)px\)/.exec(PRACTICE_GRID_COLUMNS)?.[1]);
    expect(gaps).toBe(PRACTICE_GRID_GAP * 2);
  });
});
