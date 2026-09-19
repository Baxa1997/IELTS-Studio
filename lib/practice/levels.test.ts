import { describe, expect, it } from "vitest";

import {
  MAX_LEVEL,
  PRACTICE_LEVELS,
  bandToLevel,
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
