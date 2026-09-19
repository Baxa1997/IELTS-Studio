import type { Metadata } from "next";

import { LandingPage, landingMetadata } from "@/app/_landing/landing-page";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

/**
 * The landing page in the DEFAULT language, at the bare URL. That is Uzbek.
 *
 * ⚠️ THE DEFAULT LOCALE IS NOT UNDER A PREFIX, AND THAT IS DELIBERATE. `/` is
 * the page Google has indexed, the one `sitemap.ts` lists and the one every
 * backlink points at. Putting the default under a prefix for a symmetrical tree
 * would mean 301ing the site's most valuable URL to buy nothing. Google
 * documents "default locale unprefixed" as a supported pattern;
 * `app/[locale]/page.tsx` serves the other two, and the three declare each
 * other through `hreflang`.
 *
 * ⚠️ WHAT THIS URL SAYS CHANGED LANGUAGE, WHICH IS AN SEO EVENT EVEN THOUGH NO
 * URL MOVED. `/` used to answer in English and now answers in Uzbek; the
 * English copy lives at `/en`. Expect Google to re-evaluate which of the three
 * to show an English-language searcher, and expect that to take a re-crawl.
 * `x-default` in `landingMetadata` points at `/en` for exactly this reason —
 * the international visitor with no matching language still gets English.
 *
 * The body lives in `app/_landing/landing-page.tsx` so both routes render the
 * same component rather than two copies of a 900-line page drifting apart.
 */
export const metadata: Metadata = landingMetadata(DEFAULT_LOCALE);

export default function Home() {
  return <LandingPage locale={DEFAULT_LOCALE} />;
}
