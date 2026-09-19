/**
 * What a full reading test is CALLED on its hub card.
 *
 * The design canvas shows an editorial gist here — "Cities, oceans and memory"
 * over the subtitle "Urban beekeeping · Deep ocean floor · Memory". Nothing
 * stores such a gist: `reading_tests` carries only a key, a target band and its
 * three passages, and the curated set in lib/reading/curated defines a test as
 * `{ key, targetBand, passages }` with no title of its own.
 *
 * So the title is composed from what the test demonstrably IS — its passages'
 * topics, as a list. That is truthful for every test, curated or generated, and
 * needs no migration. If hand-written gists are ever wanted, add a
 * `reading_tests.title` column and prefer it over this.
 */

/** "A, B and C" — an Oxford-comma-free list, which is what the canvas draws. */
export function composeTestTitle(topics: (string | null | undefined)[]): string {
  const parts = topics.map((t) => (t ?? "").trim()).filter(Boolean);
  if (parts.length === 0) return "Academic Reading test";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** The card's subtitle — the passages themselves, in exam order. The canvas
 *  separates them with a middot, and relies on the row clamping to one line. */
export function composeTestSubtitle(titles: (string | null | undefined)[]): string {
  return titles
    .map((t) => (t ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}
