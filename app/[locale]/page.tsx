import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LandingPage, landingMetadata } from "@/app/_landing/landing-page";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The landing page in a language that is not English: `/uz` and `/ru`.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING. A single dynamic segment at the
 * root matches ANY unknown one-segment path, so without this `/pricing-typo`
 * would render the landing page with `locale = "pricing-typo"` and return 200
 * to a crawler instead of 404. Real routes like `/sign-in` already win on their
 * own — a static segment beats a dynamic one — but nothing protects the paths
 * that do not exist at all. Pinning the params to the locale list turns every
 * other segment back into a 404, and makes both pages static at build time.
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
  return landingMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Belt and braces: generateStaticParams already limits this to uz/ru, but the
  // segment is a plain string as far as the type system is concerned.
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return <LandingPage locale={locale} />;
}
