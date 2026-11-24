import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MARKETING_MAIN } from "@/app/(marketing)/_components/marketing";
import { PlatformArticle, platformPageMetadata } from "@/app/(marketing)/ielts-ai-platform-uzbekistan/_components/platform-page";
import { LocalisedFrame } from "@/app/_landing/_components/localised-frame";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The platform page in a language that is not the default:
 * `/uz/ielts-ai-platform-uzbekistan` and `/ru/ielts-ai-platform-uzbekistan` —
 * the two languages the question it answers is actually asked in.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING, as on the other localised pages:
 * without it `/anything/ielts-ai-platform-uzbekistan` would render with
 * `locale = "anything"` and answer 200. English owns the bare URL.
 *
 * Framed by `LocalisedFrame`, not the (marketing) layout, whose chrome follows
 * the visitor's cookie; this page is Uzbek or Russian whatever the cookie says.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return platformPageMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedPlatformPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return (
    // The article states its own WebPage node (PageTitle) and FAQ, so the frame adds none.
    <LocalisedFrame locale={locale}>
      <main style={MARKETING_MAIN}>
        <PlatformArticle locale={locale} />
      </main>
    </LocalisedFrame>
  );
}
