import type { Metadata } from "next";

import { LandingPage, landingMetadata } from "@/app/_landing/landing-page";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

/**
 * The English landing page, at the bare URL.
 *
 * ⚠️ ENGLISH IS NOT UNDER A PREFIX, AND THAT IS DELIBERATE. `/` is the page
 * Google has indexed, the one `sitemap.ts` lists and the one every backlink
 * points at. Moving it to `/en` for a symmetrical tree would mean 301ing the
 * site's most valuable URL to buy nothing. Google documents "default locale
 * unprefixed" as a supported pattern; `app/[locale]/page.tsx` serves the other
 * two, and the three declare each other through `hreflang`.
 *
 * The body lives in `app/_landing/landing-page.tsx` so both routes render the
 * same component rather than two copies of a 900-line page drifting apart.
 */
export const metadata: Metadata = landingMetadata(DEFAULT_LOCALE);

export default function Home() {
  return <LandingPage locale={DEFAULT_LOCALE} />;
}
