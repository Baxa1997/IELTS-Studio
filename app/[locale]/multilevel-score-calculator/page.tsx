import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  MultilevelCalculatorPage,
  multilevelCalculatorMetadata,
} from "@/app/(tools)/multilevel-score-calculator/_components/multilevel-page";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The Multilevel calculator in a language that is not the default:
 * `/uz/multilevel-score-calculator` — where most of its visitors search
 * ("multilevel ball hisoblash") — and `/ru/multilevel-score-calculator`.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING: see the IELTS calculator's
 * localised route beside this one.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return multilevelCalculatorMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedMultilevelCalculator({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return <MultilevelCalculatorPage locale={locale} />;
}
