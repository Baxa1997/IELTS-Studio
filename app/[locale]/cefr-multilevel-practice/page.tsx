import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MARKETING_MAIN } from "@/app/(marketing)/_components/marketing";
import { CefrPracticeArticle, cefrPracticeMetadata } from "@/app/(marketing)/cefr-multilevel-practice/_components/cefr-page";
import { LocalisedFrame } from "@/app/_landing/_components/localised-frame";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The CEFR / Multilevel page in a language that is not the default:
 * `/uz/cefr-multilevel-practice` and `/ru/cefr-multilevel-practice`.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING, as on the other localised pages:
 * without it `/anything/cefr-multilevel-practice` would render with
 * `locale = "anything"` and answer 200. The params come from DEFAULT_LOCALE, so
 * there is no `/en/…` — English owns the bare URL.
 *
 * Framed by `LocalisedFrame`, not by the (marketing) layout the English page
 * sits in: that layout's chrome follows the visitor's cookie, and this page is
 * Uzbek or Russian whatever the cookie says. Same column (MARKETING_MAIN).
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return cefrPracticeMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedCefrPracticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return (
    // The article states its own WebPage node (PageTitle) and FAQ, so the frame adds none.
    <LocalisedFrame locale={locale}>
      <main style={MARKETING_MAIN}>
        <CefrPracticeArticle locale={locale} />
      </main>
    </LocalisedFrame>
  );
}
