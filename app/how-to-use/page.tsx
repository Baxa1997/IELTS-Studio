import type { Metadata } from "next";

import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

import { LearnerGuide, learnerMetadata } from "./_components/learner-guide";

/**
 * The learner's guide in the DEFAULT language, at the bare URL. That is English.
 *
 * ⚠️ THE DEFAULT LOCALE IS NOT UNDER A PREFIX, matching `app/page.tsx` and the
 * rule the whole site follows: `/how-to-use` is the URL that is linked, shared
 * and indexed, so it stays put and the other two languages sit under `/uz` and
 * `/ru`. `app/[locale]/how-to-use/page.tsx` serves those, and the three declare
 * each other through `hreflang`.
 *
 * ⚠️ WHAT THIS URL SAYS HAS CHANGED LANGUAGE TWICE. It answered in English,
 * then in Uzbek (September), and since 2026-10-05 in English again, with the
 * Uzbek copy at `/uz/how-to-use`. Each flip is an SEO event: expect Google to
 * re-crawl and re-decide which of the three to show a searcher.
 *
 * The body lives in `./learner-guide.tsx` so both routes render one component
 * rather than two copies of a 400-line page drifting apart.
 */
export const metadata: Metadata = learnerMetadata(DEFAULT_LOCALE);

export default function HowToUse() {
  return <LearnerGuide locale={DEFAULT_LOCALE} />;
}
