import type { Metadata } from "next";

import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

import { LearnerGuide, learnerMetadata } from "./_components/learner-guide";

/**
 * The learner's guide in the DEFAULT language, at the bare URL. That is Uzbek.
 *
 * ⚠️ THE DEFAULT LOCALE IS NOT UNDER A PREFIX, matching `app/page.tsx` and the
 * rule the whole site follows: `/how-to-use` is the URL that is linked, shared
 * and indexed, so it stays put and the other two languages sit under `/en` and
 * `/ru`. `app/[locale]/how-to-use/page.tsx` serves those, and the three declare
 * each other through `hreflang`.
 *
 * ⚠️ WHAT THIS URL SAYS CHANGED LANGUAGE WHEN THIS SHIPPED. It answered in
 * English and now answers in Uzbek; the English copy moved to
 * `/en/how-to-use`. No URL moved, but it is still an SEO event — the same one
 * the landing page went through in September. Expect Google to re-crawl and
 * re-decide which of the three to show an English searcher.
 *
 * The body lives in `./learner-guide.tsx` so both routes render one component
 * rather than two copies of a 400-line page drifting apart.
 */
export const metadata: Metadata = learnerMetadata(DEFAULT_LOCALE);

export default function HowToUse() {
  return <LearnerGuide locale={DEFAULT_LOCALE} />;
}
