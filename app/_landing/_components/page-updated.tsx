import { formatPostDate } from "@/lib/blog";
import { translator } from "@/lib/i18n";
import { HTML_LANG, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import { pageUpdated, type DatedPath } from "@/lib/seo";

import { MUTED, SANS } from "../_lib/design";

/**
 * "Updated 27 September 2026" — the quiet line under a public page's title.
 *
 * ⚠️ IT TAKES THE PAGE'S PATH, NOT A DATE, ON PURPOSE. The day comes from
 * `pageUpdated()`, the same record the sitemap's `lastmod` and the page's
 * `dateModified` read (PUBLIC_ROUTES in lib/seo.ts), so the three cannot drift
 * apart: a page that could pass in any date would sooner or later show one the
 * sitemap does not. app/page-dates.test.tsx renders every dated page to check.
 *
 * Formatted like the blog's dates (`formatPostDate`: UTC, the reader's
 * language). `locale` defaults to English because the pages that use it are
 * written in English on every locale; a localised page passes its own.
 * Server-safe: no "use client".
 */
export function PageUpdated({
  path,
  locale = SOURCE_LOCALE,
  style,
}: {
  path: DatedPath;
  locale?: Locale;
  style?: React.CSSProperties;
}) {
  const iso = pageUpdated(path);
  const t = translator(locale);
  return (
    <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: MUTED, ...style }}>
      <time dateTime={iso}>{t("mk.pageUpdated", { date: formatPostDate(iso, HTML_LANG[locale]) })}</time>
    </p>
  );
}
