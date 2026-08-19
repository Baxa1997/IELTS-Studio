/**
 * Comparing names written by different people, in different alphabets.
 *
 * A centre's roster genuinely contains "Bakhriddin Nurullayev", "Bakhriddin
 * Nurullaev" and "BahridNur" for one person, and that is before anyone types a
 * name in Cyrillic. So an exact comparison matches almost nobody, and any
 * feature that depends on one will lock out the students it is meant to serve.
 *
 * WHERE THIS MAY AND MAY NOT BE USED. It is a TIE-BREAK, never an
 * authentication. `nameLooksLike` is deliberately generous — it accepts a first
 * name alone — which is the right trade when choosing between two siblings
 * already proved to share a phone, and completely the wrong one for deciding
 * who somebody is from nothing.
 */

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
};

export function transliterate(s: string): string {
  return (
    s
      .toLowerCase()
      // CYRILLIC FIRST, and the order is the fix rather than a preference.
      // NFD decomposes ў into у + a combining breve, and the accent strip below
      // then removes the breve — so running it first turned every ў into "u"
      // and made this table's `ў: "o"` entry unreachable. "Oʻzbek" and "Ўзбек"
      // folded to different strings as a result, which is precisely the pair
      // this function exists to reconcile.
      .split("")
      .map((ch) => CYRILLIC[ch] ?? ch)
      .join("")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents (é → e)
      .replace(/[ʻʼ'’`]/g, "") // Uzbek Latin oʻ/gʻ and stray apostrophes
  );
}


/** A name reduced to comparable tokens: transliterated, punctuation gone. */
export function nameTokens(name: string): string[] {
  return transliterate(name)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/**
 * Whether a typed name plausibly refers to a known one.
 *
 * True when they share any token: "Aziza" matches "Aziza Karimova", and
 * "Karimova Aziza" matches it too, because word order in this market is not
 * dependable either. Generous on purpose — see the note above about where this
 * may be used.
 */
export function nameLooksLike(typed: string, known: string): boolean {
  const a = new Set(nameTokens(typed));
  if (a.size === 0) return false;
  return nameTokens(known).some((t) => a.has(t));
}
