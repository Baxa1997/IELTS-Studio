/**
 * THE ONE COLUMN RULE EVERY PRACTICE CARD GRID USES — HUBS AND SKELETONS ALIKE.
 *
 * ⚠️ THE SKELETON AND THE HUB MUST USE THE SAME STRING OR THE PAGE JUMPS.
 * They were separate literals and they drifted: the hubs capped at three
 * columns while `CardsSkeleton` used `minmax(300px, 1fr)` with no cap, so a
 * wide screen showed four placeholder cards and then repainted as three real
 * ones the moment the data arrived. Nothing failed; the layout just moved under
 * the reader. `grid.test.ts` pins every copy to this constant.
 *
 * ⚠️ THE CAP IS THE POINT, AND IT IS WHY THIS IS NOT JUST `minmax(300px, 1fr)`.
 * A practice card carries a title, a topic line, a level chip, a question count
 * and a status pill. At four across it truncates; the redesign settled on three
 * and the cap has to be expressed in the template because `auto-fit` will
 * otherwise add a fourth column on any monitor wide enough.
 *
 * Reading the template: each column is at least a third of the row — the row
 * minus the two 14px gaps that sit between three columns — but never narrower
 * than 280px, which is what lets it collapse to two columns and then one on the
 * way down to a phone. `max()` is doing the responsive work; the `/ 3` is doing
 * the capping.
 */

/** Gap between practice cards, both axes. The `28` below is two of these. */
export const PRACTICE_GRID_GAP = 14;

/** `grid-template-columns` for a practice card grid. At most three across. */
export const PRACTICE_GRID_COLUMNS = "repeat(auto-fit, minmax(max(280px, (100% - 28px) / 3), 1fr))";

/** The whole style object, so a caller cannot take one half and not the other. */
export const PRACTICE_GRID = {
  display: "grid",
  gridTemplateColumns: PRACTICE_GRID_COLUMNS,
  gap: PRACTICE_GRID_GAP,
} as const;

/**
 * How many placeholder cards a skeleton should draw.
 *
 * ⚠️ A MULTIPLE OF THREE, SO THE LAST ROW IS FULL. Four cards under a
 * three-column cap renders as a row of three and one orphan, which reads as a
 * half-loaded page rather than a loading one — the opposite of what a skeleton
 * is for.
 */
export const PRACTICE_SKELETON_CARDS = 6;
