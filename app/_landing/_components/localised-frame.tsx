import { LocaleProvider } from "@/shared/components/i18n/locale-provider";
import { HTML_LANG, type Locale } from "@/lib/i18n/locales";

import { INK, PANEL, SANS } from "../_lib/design";
import { landingManrope, landingSora } from "../_lib/fonts";
import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "./design-chrome";

/**
 * A public page in ITS OWN language — the frame the landing page, the two
 * how-to-use guides and the score calculators share: the header island, the
 * page's `<main>` (the caller's), the centres band and the footer.
 *
 * It was four copies of the same forty lines until 2026-10-17, and the two
 * traps below were documented in one of them and merely repeated in the rest.
 *
 * ⚠️ `pin`, NOT `initial`: the page's OWN locale, and the cookie does not get a
 * vote. On /ru the page is Russian whatever `ep-locale` says, so the client
 * chrome inside — the picker, the theme toggle — has to STAY there, not merely
 * start there. With `initial` the chrome read the cookie straight after
 * hydration and a visitor who had once chosen English got an Uzbek page
 * wearing an English header. Nested inside the root layout's provider, which
 * keeps serving every other public route. `copy.test.ts` holds this.
 *
 * ⚠️ `<html lang>` IS SET BY THE ROOT LAYOUT TO THE *DEFAULT* LOCALE — it is a
 * static layout and cannot read the cookie — so a statically generated /uz or
 * /ru page would ship claiming to be English: wrong for a screen reader, which
 * picks its voice from the attribute, and for the browser's offer to translate.
 * The provider corrects it after hydration; the script corrects it before first
 * paint, the same trick as the theme's no-flash script. The real fix is a
 * `[locale]` segment at the ROOT so the layout owns the attribute, which means
 * moving every public route under it.
 *
 * STATIC. Nothing here reads the request; the header learns about a session in
 * the browser (`SiteNav`).
 */
export function LocalisedFrame({
  locale,
  structuredData,
  css = [],
  children,
}: {
  locale: Locale;
  /** The page's JSON-LD. */
  structuredData: object;
  /** Stylesheets the page needs beyond the shared one. */
  css?: string[];
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider pin={locale}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[locale])}`,
        }}
      />
      <div
        className={`${landingSora.variable} ${landingManrope.variable}`}
        style={{ background: PANEL, fontFamily: SANS, color: INK, minHeight: "100%" }}
      >
        <style>{DESIGN_CSS}</style>
        {css.map((sheet, i) => (
          <style key={i}>{sheet}</style>
        ))}
        <script
          type="application/ld+json"
          // `<` escaped, so no string in the graph can close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <SiteHeader />
        {children}
        <CentersBand />
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
