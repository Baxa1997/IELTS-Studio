import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LocalisedFrame } from "@/app/_landing/_components/localised-frame";
import { BLOG_CSS } from "@/app/_landing/_lib/blog-css";
import { GradePage, gradeJsonLd, gradeMetadata } from "@/app/grade/_components/grade-page";
import { newsreader } from "@/app/grade/_lib/fonts";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The free writing checker in a language that is not the default:
 * `/uz/grade` and `/ru/grade`. The questions and the grader's feedback stay
 * English (they are the exam); the page and the checker's controls do not.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING, as on the other localised pages:
 * without it `/anything/grade` would render with `locale = "anything"` and
 * answer 200. The params come from DEFAULT_LOCALE, so there is no `/en/grade`.
 *
 * `LocalisedFrame`, not the `/grade` layout's SiteFrame: that one follows the
 * visitor's cookie and marks its `<main>` English, and this page is Uzbek or
 * Russian whatever the cookie says. BLOG_CSS rides along because SiteFrame
 * carries it, so the two render alike.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return gradeMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedGradePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return (
    <div className={newsreader.variable}>
      <LocalisedFrame locale={locale} structuredData={gradeJsonLd(locale)} css={[BLOG_CSS]}>
        <main>
          <GradePage locale={locale} />
        </main>
      </LocalisedFrame>
    </div>
  );
}
