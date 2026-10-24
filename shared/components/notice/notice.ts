import { DEFAULT_LOCALE, HTML_LANG, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The service notice's plain half: which language it speaks and the date it
 * promises. Kept out of the client component so the test can call it.
 *
 * Put up 2026-10-24 at the owner's request, while the AI models are upgraded.
 * ⚠️ TAKING IT DOWN IS ONE LINE: remove `<ServiceNotice />` from app/layout.tsx.
 * Nothing else depends on it being there — every full-screen frame reads the
 * notice's height through `SCREEN` (lib/theme/tokens), which is 100dvh again
 * the moment the notice is gone.
 */

/** When the platform is expected to be fully back. The one place the date is
 *  written: every language formats it itself. */
export const BACK_BY = new Date("2026-10-31T12:00:00+05:00");

/** The return date as each language writes it — "October 31", "31 октября",
 *  "31-oktabr". Tashkent time, the product's day (lib/free-practice/rotation). */
export function backByLabel(locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(HTML_LANG[locale], {
      day: "numeric",
      month: "long",
      timeZone: "Asia/Tashkent",
    }).format(BACK_BY);
  } catch {
    // A browser without this locale or time zone throws a RangeError, and the
    // notice is on every page. "31.10" reads correctly in all three languages.
    const tashkent = new Date(BACK_BY.getTime() + 5 * 60 * 60 * 1000);
    return `${tashkent.getUTCDate()}.${String(tashkent.getUTCMonth() + 1).padStart(2, "0")}`;
  }
}

// Every locale that lives under a path prefix — all but the default, which
// owns the bare URL. Derived, as everywhere else (see locale-provider).
const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);
const PREFIX_RE = new RegExp(`^/(${PREFIXED.join("|")})(?=/|$)`);

/**
 * The language the notice speaks: the one in the URL when there is one, else
 * the visitor's chosen one.
 *
 * ⚠️ NOT JUST `useLocale()`. The notice sits in the ROOT layout, above the
 * provider a /uz or /ru page pins for itself, so the root provider is all it
 * can see — and that one follows the cookie, which a first-time visitor to /uz
 * does not have yet. It would greet them in English on an Uzbek page.
 */
export function noticeLocale(pathname: string, chosen: Locale): Locale {
  const prefix = PREFIX_RE.exec(pathname)?.[1];
  return isLocale(prefix) ? prefix : chosen;
}
