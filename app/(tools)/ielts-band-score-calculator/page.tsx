import type { Metadata } from "next";

import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

import { IeltsCalculatorPage, ieltsCalculatorMetadata } from "./_components/ielts-page";

/**
 * The IELTS band score calculator in the DEFAULT language, at the bare URL;
 * `app/[locale]/ielts-band-score-calculator` serves /uz and /ru, and the three
 * declare each other through hreflang. The body is one component for all
 * three — see `./_components/ielts-page.tsx`.
 */
export const metadata: Metadata = ieltsCalculatorMetadata(DEFAULT_LOCALE);

export default function IeltsBandScoreCalculator() {
  return <IeltsCalculatorPage locale={DEFAULT_LOCALE} />;
}
