import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LocalisedFrame } from "@/app/_landing/_components/localised-frame";
import { BLOG_CSS } from "@/app/_landing/_lib/blog-css";
import { FreePracticeView, practiceMetadata } from "@/app/practice/[skill]/_components/practice-page";
import { LOCALISED_PRACTICE } from "@/app/practice/[skill]/_lib/locales";
import { isFreeSkill, type FreeSkill } from "@/lib/free-practice/rotation";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * A free-practice page in a language that is not the default — today
 * `/uz/practice/cefr` and `/ru/practice/cefr` (LOCALISED_PRACTICE). The page
 * follows the language; the practices on it stay English, they are the exam.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING TWICE OVER: an unknown language
 * would otherwise render with `locale = "anything"`, and a skill not yet in
 * LOCALISED_PRACTICE (`/uz/practice/reading`) would answer 200 as an Uzbek page
 * the sitemap, hreflang and language picker all deny exists.
 *
 * `LocalisedFrame`, not /practice's SiteFrame, which follows the cookie and
 * marks its `<main>` English. The view draws its own structured data — it is
 * built from the practices it fetched for this visitor — so the frame gets none.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: Locale; skill: FreeSkill }[] {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).flatMap((locale) =>
    LOCALISED_PRACTICE.map((skill) => ({ locale, skill })),
  );
}

type Params = Promise<{ locale: string; skill: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, skill } = await params;
  if (!isFreeSkill(skill)) return {};
  return practiceMetadata(skill, isLocale(locale) ? locale : DEFAULT_LOCALE);
}

export default async function LocalisedFreePracticePage({ params }: { params: Params }) {
  const { locale, skill } = await params;
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  if (!isFreeSkill(skill) || !LOCALISED_PRACTICE.includes(skill)) notFound();
  return (
    <LocalisedFrame locale={locale} css={[BLOG_CSS]}>
      <main>
        <FreePracticeView skill={skill} locale={locale} />
      </main>
    </LocalisedFrame>
  );
}
