import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  IeltsCalculatorPage,
  ieltsCalculatorMetadata,
} from "@/app/(tools)/ielts-band-score-calculator/_components/ielts-page";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The IELTS calculator in a language that is not the default:
 * `/uz/ielts-band-score-calculator` ("ielts ball hisoblash") and
 * `/ru/ielts-band-score-calculator` ("калькулятор баллов ielts").
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING, as on the other localised pages:
 * without it `/anything/ielts-band-score-calculator` would render with
 * `locale = "anything"` and answer 200. The params come from DEFAULT_LOCALE, so
 * there is no `/en/…` — English owns the bare URL.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return ieltsCalculatorMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedIeltsCalculator({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return <IeltsCalculatorPage locale={locale} />;
}
