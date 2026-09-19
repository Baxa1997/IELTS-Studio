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

/** Words that stay lowercase mid-title — ordinary title case, and what the
 *  passage titles on the line below already do ("the Rules of Sleep"). */
const MINOR = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "in",
  "into",
  "nor",
  "of",
  "on",
  "onto",
  "or",
  "over",
  "per",
  "the",
  "to",
  "up",
  "via",
  "vs",
  "with",
]);

/**
 * Title-case one topic.
 *
 * `reading_passages.topic` is written as a lowercase sentence fragment ("the
 * science of sleep and why we need it"), which on a card sits directly above
 * the passage titles — and those ARE title-cased ("The Active Brain: How Modern
 * Science Rewrote the Rules of Sleep"). The two lines looked like different
 * kinds of thing. This makes the top line match the line under it, which is the
 * best available statement of what right looks like here.
 *
 * ⚠️ IT NEVER LOWERCASES A LETTER THAT IS ALREADY CAPITAL, and that is the
 * whole difficulty. Topics carry acronyms and proper nouns — "using AI and
 * speech technology…", "North America's largest ancient city", "the first
 * telegraph cable across the Atlantic" — and a title-caser built on
 * `toLowerCase()` first turns AI into Ai and USA into Usa. Only the first
 * letter of a word is ever touched.
 *
 * Minor words stay lowercase unless they open the topic, which is ordinary
 * title case and is what the passage titles below already do ("the Rules of
 * Sleep"). Word boundaries are whitespace and hyphens only — NOT apostrophes,
 * or "America's" would come out "America'S".
 */
export function titleCase(text: string): string {
  let first = true;
  return text.replace(/[^\s-]+/g, (word) => {
    const opensTheTopic = first;
    first = false;
    if (!opensTheTopic && MINOR.has(word.toLowerCase())) return word;
    // Only the leading letter, so AI and America's come through untouched.
    return word.replace(/^(\p{L})/u, (c) => c.toUpperCase());
  });
}

/** "A, B and C" — an Oxford-comma-free list, which is what the canvas draws.
 *  The joiner stays lowercase: it is a minor word mid-title, like every other. */
export function composeTestTitle(topics: (string | null | undefined)[]): string {
  const parts = topics.map((t) => titleCase((t ?? "").trim())).filter(Boolean);
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
