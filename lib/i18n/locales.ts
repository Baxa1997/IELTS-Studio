/**
 * The three languages the product ships in.
 *
 * These are not a guess: `app/_landing/lang-picker.tsx` has drawn a UZ / EN / RU
 * control in the marketing header and on the sign-in page since the redesign,
 * and its own docstring recorded that the control moved a tick and nothing else,
 * because "there is no i18n layer in this app". This module is that layer, and
 * the order below is the order the picker already shows.
 *
 * ⚠️ LOCALE IS A COOKIE, WHERE THEME IS `localStorage` — the two deliberately do
 * NOT match, and it is worth knowing why before you "fix" the inconsistency.
 * A theme is a CLASS, so a two-line script can apply it before paint and the
 * server never needs to know. A language is TEXT: it has to be chosen before the
 * HTML is generated, or the server sends English and the client has to repaint
 * every string in the page. Only a cookie reaches the server, so locale is a
 * cookie.
 *
 * The cost that buys is real but already paid: reading a cookie makes a route
 * dynamic, and `app/(app)/layout.tsx` and `app/(shell)/layout.tsx` both import
 * `next/headers` cookies already, so every authenticated surface was dynamic
 * before this existed. The STATIC surfaces — the marketing pages and the front
 * door — are the ones that must not start reading it; they take the locale from
 * the client provider instead and keep their cache entry.
 */

export const LOCALES = ["uz", "en", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The locale served when nobody has chosen one, and the one that owns the
 * UNPREFIXED URL. Uzbek: the learners are in Uzbekistan, the centres teach in
 * Uzbek, and the exam being in English is a reason to translate the chrome
 * AROUND the exam, not a reason to greet a first-time visitor in a language
 * they may be here to learn.
 *
 * ⚠️ THIS CONSTANT IS TWO DECISIONS AT ONCE, so know what you move when you
 * move it. It is (a) the fallback when the cookie is absent or junk, and (b)
 * the locale with no path prefix — `/` is Uzbek, `/en` and `/ru` are real
 * routes. Flipping it flips both: `app/[locale]/page.tsx` derives its static
 * params from it, `sitemap.ts` and `landingMetadata` derive their URL shape
 * from it, and `locale-provider.tsx` derives the prefixes it strips from it.
 * Nothing hardcodes a locale string against it — keep it that way.
 *
 * ⚠️ IT IS NOT THE DICTIONARY FALLBACK. A key missing at runtime falls back to
 * `SOURCE_LOCALE` below, which is English because English is the dictionary
 * every other one is typed against.
 */
export const DEFAULT_LOCALE: Locale = "uz";

/** The dictionary every other dictionary is typed against, and therefore the
 *  one a missing key falls back to. Deliberately independent of
 *  `DEFAULT_LOCALE`: which language a visitor is greeted in is a market
 *  decision, which dictionary is the source of truth is a code fact. */
export const SOURCE_LOCALE: Locale = "en";

/** Cookie name. Read on the server, written by the picker on the client. */
export const LOCALE_COOKIE = "ep-locale";

/** A year: the choice should outlive a session without being permanent. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** How each language names ITSELF. Never translated — a speaker looking for
 *  their language scans for the word they use for it, not for its English name,
 *  which they may not read. */
export const LOCALE_NAMES: Record<Locale, string> = {
  uz: "Oʻzbekcha",
  en: "English",
  ru: "Русский",
};

/** The two-letter badge the picker shows collapsed. */
export const LOCALE_SHORT: Record<Locale, string> = {
  uz: "UZ",
  en: "EN",
  ru: "RU",
};

/** The BCP-47 tag for `<html lang>`. Uzbek is pinned to the LATIN script: the
 *  copy in `messages/uz.ts` is written in Latin, and `uz` alone leaves the
 *  script ambiguous to screen readers and to translation tooling. */
export const HTML_LANG: Record<Locale, string> = {
  uz: "uz-Latn",
  en: "en",
  ru: "ru",
};
