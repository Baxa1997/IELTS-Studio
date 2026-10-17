import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/_components/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/_lib/fonts";
import { INK, PANEL, SANS } from "@/app/_landing/_lib/design";
import { LocaleProvider } from "@/shared/components/i18n/locale-provider";
import { HTML_LANG, type Locale } from "@/lib/i18n/locales";

import { TOOL_CSS } from "../_lib/tool-css";

/**
 * The public site's frame around a calculator: header island, the page, the
 * centres band and the footer — in the PAGE's language.
 *
 * ⚠️ `pin`, NOT `initial`, and the `<html lang>` fix-up, for the reasons the
 * learner guide gives (app/how-to-use/_components/learner-guide.tsx): /uz/… is
 * Uzbek whatever the cookie says, and the static root layout would otherwise
 * ship every language claiming to be English.
 *
 * STATIC. Nothing here reads the request, so all six pages (two calculators ×
 * three languages) are built once and served from cache; the header learns
 * about a session in the browser.
 */
export function ToolFrame({
  locale,
  structuredData,
  children,
}: {
  locale: Locale;
  structuredData: object;
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
        <style>{TOOL_CSS}</style>
        <script
          type="application/ld+json"
          // `<` escaped so no string in the graph can close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <SiteHeader />
        <main lang={HTML_LANG[locale]}>{children}</main>
        <CentersBand />
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
