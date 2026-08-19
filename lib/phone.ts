/**
 * Comparing two phone numbers written by different people.
 *
 * The same Uzbek mobile arrives as `+998 90 123 45 67`, `998901234567`,
 * `90 123-45-67` and `(90) 1234567` depending on who typed it and whether it
 * came from a spreadsheet, a registration form or Telegram. None of those
 * strings are equal and all of them are the same phone, so anything that
 * matches on the raw value matches almost nothing.
 *
 * The rule is deliberately blunt: keep the digits, drop everything else, and
 * compare the LAST NINE. Nine because that is the length of a national Uzbek
 * number after the 998 country code, and comparing the tail means a stored
 * number with the code matches one without it — which is the actual difference
 * between what a teacher types and what Telegram sends.
 *
 * Pure and isomorphic on purpose: the same function has to run in the bot's
 * webhook and anywhere the console shows a match, and two implementations of
 * "is this the same number" is how they end up disagreeing.
 */

/** How many trailing digits decide a match. A full Uzbek national number. */
const SIGNIFICANT = 9;

/**
 * A comparable form, or null when there is not enough number to compare.
 *
 * Null rather than an empty string so a missing phone can never match another
 * missing phone — which, in a table where most students have no number stored,
 * would otherwise bind the first person who asked to the first blank row.
 */
export function phoneKey(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D+/g, "");
  if (digits.length < SIGNIFICANT) return null;
  return digits.slice(-SIGNIFICANT);
}

/** Whether two written numbers are the same line. False if either is unusable. */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = phoneKey(a);
  const kb = phoneKey(b);
  return ka != null && ka === kb;
}
