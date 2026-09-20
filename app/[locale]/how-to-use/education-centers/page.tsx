import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CentersGuide, centersMetadata } from "@/app/how-to-use/education-centers/centers-guide";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The education-centre guide at `/en/how-to-use/education-centers` and
 * `/ru/how-to-use/education-centers`. `dynamicParams = false` for the same
 * reason as every other route under `[locale]` — see the learner guide one
 * level up.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return centersMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedCentersGuide({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return <CentersGuide locale={locale} />;
}
