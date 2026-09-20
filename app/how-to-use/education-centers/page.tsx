import type { Metadata } from "next";

import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

import { CentersGuide, centersMetadata } from "./centers-guide";

/**
 * The education-centre guide in the DEFAULT language, at the bare URL — Uzbek.
 * `app/[locale]/how-to-use/education-centers/page.tsx` serves `/en` and `/ru`.
 * Same reasoning as the learner guide next door.
 */
export const metadata: Metadata = centersMetadata(DEFAULT_LOCALE);

export default function CentersGuidePage() {
  return <CentersGuide locale={DEFAULT_LOCALE} />;
}
