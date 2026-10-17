import { DEFAULT_LOCALE, HTML_LANG, LOCALES } from "@/lib/i18n/locales";

/**
 * The page's language on <html>, before the first paint — for the URLs that
 * name one: /uz/… and /ru/…, the localised public pages.
 *
 * ⚠️ IN THE ROOT LAYOUT, NOT IN THE PAGE (moved 2026-10-17). This was an
 * inline <script> inside LocalisedFrame. That runs on a cold load, but on an
 * in-app navigation React builds the new page in the browser, and a script
 * React creates there never runs — React 19 reports it as a console error,
 * "Encountered a script tag while rendering React component", a red Issue in
 * the dev overlay on every such visit. Here it is rendered once on the server
 * with the root layout and only ever hydrated, never created on the client.
 * On a navigation, LocaleProvider's `pin` sets the attribute, as it always has.
 *
 * The prefix IS the language: `[locale]` routes exist only for the locales
 * that are not the default, which owns the bare URL (lib/i18n/locales). The
 * theme's no-flash script's rules apply: synchronous, inline, and wrapped in a
 * bare try/catch, since anything it throws happens before React exists.
 */
const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);
const LANG = Object.fromEntries(PREFIXED.map((locale) => [locale, HTML_LANG[locale]]));

const SCRIPT = `
(function(){
  try {
    var m = /^\\/(${PREFIXED.join("|")})(?:\\/|$)/.exec(location.pathname);
    if (m) document.documentElement.lang = ${JSON.stringify(LANG)}[m[1]];
  } catch (e) {}
})();
`.trim();

export function LangScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
