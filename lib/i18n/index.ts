import { SOURCE_LOCALE, type Locale } from "./locales";
import { en, type MessageKey, type Messages } from "./messages/en";
import { ru } from "./messages/ru";
import { uz } from "./messages/uz";

export type { Locale } from "./locales";
export type { MessageKey } from "./messages/en";

export const DICTIONARIES: Record<Locale, Messages> = { en, uz, ru };

/** `{name}` placeholders, filled from `vars`. */
const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Look up `key` in `locale`, falling back to English and finally to the key.
 *
 * ⚠️ THE FALLBACK IS `SOURCE_LOCALE`, NOT `DEFAULT_LOCALE`. The default locale
 * is Uzbek — what a visitor with no cookie is greeted in — but English is the
 * dictionary the other two are typed against, so it is the only one guaranteed
 * to carry every key. Falling back to the default would mean a key added to
 * English and not yet to Uzbek resolves to the key name rather than to the
 * English text that exists.
 *
 * ⚠️ THE LAST FALLBACK RETURNS THE KEY ITSELF, NOT AN EMPTY STRING. A missing
 * translation then renders as `nav.dashboard` — visibly wrong, in the exact spot
 * it is wrong, which someone reports in a day. Returning "" instead produces a
 * button with no label and a layout that still looks deliberate, and those
 * survive for months. The type system makes this unreachable from TypeScript
 * call sites anyway; it exists for keys arriving as plain strings at runtime.
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[SOURCE_LOCALE];
  const raw = dict[key] ?? DICTIONARIES[SOURCE_LOCALE][key] ?? key;
  if (!vars) return raw;
  return raw.replace(PLACEHOLDER, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** A bound `t` for one locale. */
export function translator(locale: Locale): Translate {
  return (key, vars) => translate(locale, key, vars);
}
