/**
 * ONE DIFFICULTY SCALE FOR EVERY PRACTICE CARD — Level 1 to 5.
 *
 * The hubs were storing two different things and printing both:
 *   · reading  — `target_band` / `difficulty`, an IELTS band, 4 to 9
 *   · listening — `difficulty`, already clamped 1 to 5 by the engine
 *
 * So one card said "BAND 6" and the next said "LEVEL 3" for the same idea, and
 * a learner had no way to compare them.
 *
 * ⚠️ AND ON A FINISHED READING CARD THE BAND COLLIDED WITH ITSELF. The head
 * said "BAND 6" (what the content is pitched at) while the status pill said
 * "Band 7.0" (what the learner actually scored) — the same word, the same
 * scale, two unrelated meanings, side by side. Levels remove the collision
 * outright: a level is a property of the material, a band is a result.
 *
 * ⚠️ NOTHING IS STORED IN LEVELS, and nothing should be. The band is the real
 * datum — it is what the generator is told to aim at, what the curated set
 * records, and what the grader returns. This is a DISPLAY mapping and it must
 * stay one way: band → level, at render time. Writing a level back into the
 * database would lose the half-bands and make the content unreproducible.
 */

/** A level, and the band or bands it stands for. Index 0 is Level 1. */
export const PRACTICE_LEVELS: { level: number; bands: number[]; hint: string }[] = [
  { level: 1, bands: [4], hint: "pitched at band 4" },
  { level: 2, bands: [5], hint: "pitched at band 5" },
  { level: 3, bands: [6], hint: "pitched at band 6" },
  { level: 4, bands: [7], hint: "pitched at band 7" },
  /* ⚠️ FIVE LEVELS, SIX BANDS — one level has to cover two, and the top is the
     right place for it. Band 8 and band 9 are both "expert" in the descriptors,
     and band 9 material is rare in the library (10 of 160 curated passages), so
     splitting them would give Level 5 almost nothing and gain no clarity. */
  { level: 5, bands: [8, 9], hint: "pitched at band 8–9" },
];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = PRACTICE_LEVELS.length;

/** What a card's level chip shows, and what its tooltip says. */
export interface LevelChip {
  text: string;
  hint: string;
}

/**
 * Band → level. Half-bands round to the nearer whole one (6.5 → band 7 →
 * Level 4), and anything off the ends is clamped rather than dropped: a band 3
 * passage is still the easiest thing we have, and a band 9 one still the
 * hardest.
 */
export function bandToLevel(band: number | null | undefined): number | null {
  if (band == null || !Number.isFinite(band)) return null;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(band) - 3));
}

/** The chip for content stored as a band — reading. */
export function levelChipForBand(band: number | null | undefined): LevelChip {
  const level = bandToLevel(band);
  /* A full test assembled from passages at different bands has no single one,
     and "Mixed" is the honest answer rather than a missing value. */
  if (level == null) return { text: "MIXED", hint: "Passages at several levels" };
  return chip(level);
}

/** The chip for content already stored as a level — listening. */
export function levelChipForLevel(level: number | null | undefined): LevelChip | null {
  if (level == null || !Number.isFinite(level)) return null;
  return chip(Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level))));
}

function chip(level: number): LevelChip {
  const row = PRACTICE_LEVELS[level - 1];
  /* The hint carries the band, so the mapping is always one hover away and an
     IELTS learner who thinks in bands is never cut off from the number they
     came for. */
  return { text: `LEVEL ${level}`, hint: `Level ${level} of ${MAX_LEVEL} · ${row.hint}` };
}
