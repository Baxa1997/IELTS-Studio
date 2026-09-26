import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LearnerGuide, learnerMetadata } from "@/app/how-to-use/_components/learner-guide";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * The learner's guide in a language that is not the default: `/en/how-to-use`
 * and `/ru/how-to-use`.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING, exactly as it is for the landing
 * page one level up. The `[locale]` segment is dynamic, so without this
 * `/anything/how-to-use` would render this page with `locale = "anything"` and
 * answer 200 to a crawler instead of 404. Pinning the params to the locale list
 * turns every other segment back into a 404 and makes both pages static at
 * build time.
 *
 * It also means `/uz/how-to-use` is a 404: Uzbek is the default locale and the
 * default owns the unprefixed URL, so the params are derived from
 * `DEFAULT_LOCALE` rather than typed out.
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
  return learnerMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedHowToUse({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Belt and braces: generateStaticParams already limits this to en/ru, but the
  // segment is a plain string as far as the type system is concerned.
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return <LearnerGuide locale={locale} />;
}
