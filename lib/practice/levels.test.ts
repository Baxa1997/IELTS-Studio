import { describe, expect, it } from "vitest";

import {
  MAX_LEVEL,
  PRACTICE_LEVELS,
  bandToLevel,
  groupByLevel,
  levelChipForBand,
  levelChipForLevel,
} from "./levels";

/**
 * The one difficulty scale, guarded where it MISREPRESENTS THE CONTENT.
 *
 * Nothing here throws or fails a type check. Every defect below renders a
 * perfectly good card carrying the wrong number, which a learner then uses to
 * decide what to practise:
 *
 *   1. AN OFF-BY-ONE IN THE MAPPING. `band - 3` is the whole conversion, and
 *      `band - 4` or a floor instead of a round shifts every card in the
 *      library by a level. Nothing would look broken.
 *
 *   2. A BAND THAT FALLS OFF THE SCALE. Reading stores bands 4 through 9, but
 *      generated content can carry a half-band or something outside that range.
 *      Returning 0, 6 or null there gives a chip that reads "LEVEL 0" or shows
 *      nothing at all on a card that definitely has a difficulty.
 *
 *   3. LOSING THE BAND ENTIRELY. IELTS learners think in bands — it is the
 *      scale they are actually being examined on — so the mapping has to stay
 *      reachable. It lives in the chip's tooltip.
 *
 *   4. THE TWO HUBS DRIFTING APART AGAIN. Reading maps a band onto the scale,
 *      listening is already on it, and the whole point is that "Level 3" means
 *      one thing across both.
 */

describe("band to level", () => {
  it("maps every band the reading library actually stores", () => {
    // ⚠️ The off-by-one. These six are the values in lib/reading/curated.
    expect(bandToLevel(4)).toBe(1);
    expect(bandToLevel(5)).toBe(2);
    expect(bandToLevel(6)).toBe(3);
    expect(bandToLevel(7)).toBe(4);
    expect(bandToLevel(8)).toBe(5);
    expect(bandToLevel(9)).toBe(5); // five levels, six bands — the top absorbs two
  });

  it("rounds a half-band to the nearer whole one", () => {
    expect(bandToLevel(6.5)).toBe(4); // → band 7
    expect(bandToLevel(6.4)).toBe(3); // → band 6
  });

  it("clamps rather than falling off either end", () => {
    /* A band 3 passage is still the easiest thing in the library and a band 9
       one still the hardest; "LEVEL 0" and "LEVEL 6" are not levels. */
    for (const band of [0, 1, 3, 3.4]) expect(bandToLevel(band)).toBe(1);
    for (const band of [9, 9.5, 12]) expect(bandToLevel(band)).toBe(MAX_LEVEL);
  });

  it("is null only when there is genuinely no band", () => {
    for (const nothing of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(bandToLevel(nothing as number | null)).toBeNull();
    }
  });
});

describe("the chip a card shows", () => {
  it("names the level and keeps the band one hover away", () => {
    // ⚠️ Losing the band would cut off the scale the learner is examined on.
    expect(levelChipForBand(6)).toEqual({
      text: "LEVEL 3",
      hint: "Level 3 of 5 · pitched at band 6",
    });
    expect(levelChipForBand(9).hint).toContain("8–9");
  });

  it("says Mixed for a test with no single band, not nothing", () => {
    /* A full test assembled from passages at different bands genuinely has no
       one level. An empty chip would read as missing data. */
    expect(levelChipForBand(null).text).toBe("MIXED");
    expect(levelChipForBand(null).hint).toBeTruthy();
  });

  it("gives listening the identical chip for the same level", () => {
    // ⚠️ THE POINT OF THE SHARED SCALE. A reading card pitched at band 6 and a
    // listening practice at level 3 must be labelled the same way.
    expect(levelChipForLevel(3)!.text).toBe(levelChipForBand(6).text);
    expect(levelChipForLevel(5)!.text).toBe(levelChipForBand(8).text);
  });

  it("clamps a listening level the engine let through", () => {
    // The engine clamps to 1–5, but the catalogue is not a trusted input.
    expect(levelChipForLevel(0)!.text).toBe("LEVEL 1");
    expect(levelChipForLevel(9)!.text).toBe(`LEVEL ${MAX_LEVEL}`);
    expect(levelChipForLevel(null)).toBeNull();
  });
});

describe("the table itself", () => {
  it("covers bands 4 to 9 with no gap and no overlap", () => {
    const covered = PRACTICE_LEVELS.flatMap((r) => r.bands);
    expect(covered).toEqual([4, 5, 6, 7, 8, 9]);
    expect(new Set(covered).size, "a band appears at two levels").toBe(covered.length);
  });

  it("numbers the levels 1..n in order", () => {
    expect(PRACTICE_LEVELS.map((r) => r.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it("agrees with the function that maps onto it", () => {
    // The table is documentation; bandToLevel is what runs. They must not drift.
    for (const row of PRACTICE_LEVELS) {
      for (const band of row.bands) {
        expect(bandToLevel(band), `band ${band} is not level ${row.level}`).toBe(row.level);
      }
    }
  });
});

/**
 * Sectioning a hub's library by level. Every failure below renders a hub that
 * looks finished and misleads or loses content:
 *
 *   1. AN EMPTY HEADING. The library has no band 4 full test, so a section per
 *      level in the abstract prints "Level 1" above nothing, which reads as a
 *      load that failed.
 *
 *   2. A RENUMBERED CARD. The sequence number is in the card label and in the
 *      URL. Recomputing it from a position inside a section silently renames
 *      every card below the first level boundary.
 *
 *   3. A CARD THAT VANISHES. Content whose difficulty is null has to appear
 *      somewhere; dropping it removes real practice from the hub with no error.
 */
describe("grouping a library into level sections", () => {
  const card = (n: number, level: number | null) => ({ n, level });
  const byLevel = (c: { level: number | null }) => c.level;

  it("orders sections easiest first and skips the levels with nothing in them", () => {
    const out = groupByLevel([card(1, 3), card(2, 5), card(3, 3)], byLevel);
    // ⚠️ The empty heading. Levels 1, 2 and 4 hold nothing and must not appear.
    expect(out.map((s) => s.level)).toEqual([3, 5]);
    expect(out[0].items.map((c) => c.n)).toEqual([1, 3]);
  });

  it("keeps the number the caller attached, not the position in the section", () => {
    // ⚠️ The renumbering. Cards 11 and 12 are level 5, card 13 is level 2, so
    // grouping REORDERS them — and 13 must still be 13 under its own heading.
    const out = groupByLevel([card(11, 5), card(12, 5), card(13, 2)], byLevel);
    expect(out.map((s) => s.level)).toEqual([2, 5]);
    expect(out[0].items.map((c) => c.n)).toEqual([13]);
    expect(out[1].items.map((c) => c.n)).toEqual([11, 12]);
  });

  it("puts content with no level last and never drops it", () => {
    // ⚠️ The vanishing card. A full test assembled across bands has no single
    // level, and it is still a test a learner can sit.
    const out = groupByLevel([card(1, null), card(2, 4)], byLevel);
    expect(out.map((s) => s.level)).toEqual([4, null]);
    expect(out.flatMap((s) => s.items.map((c) => c.n))).toEqual([2, 1]);
  });

  it("clamps a level off either end of the scale rather than losing it", () => {
    const out = groupByLevel([card(1, 0), card(2, 99), card(3, Number.NaN)], byLevel);
    expect(out.map((s) => s.level)).toEqual([1, MAX_LEVEL, null]);
  });

  it("derives its sections from the scale, so every level can hold cards", () => {
    // Guards the literal-1..5 regression: a section exists for each defined level.
    const all = PRACTICE_LEVELS.map((r, i) => card(i, r.level));
    expect(groupByLevel(all, byLevel).map((s) => s.level)).toEqual(
      PRACTICE_LEVELS.map((r) => r.level),
    );
  });

  it("loses nothing: every card in equals exactly one card out", () => {
    const cards = [card(1, 2), card(2, null), card(3, 2), card(4, 5), card(5, 1)];
    const out = groupByLevel(cards, byLevel);
    expect(out.flatMap((s) => s.items).length).toBe(cards.length);
    expect(new Set(out.flatMap((s) => s.items.map((c) => c.n))).size).toBe(cards.length);
  });
});
