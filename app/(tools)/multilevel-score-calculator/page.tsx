import type { Metadata } from "next";

import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

import { MultilevelCalculatorPage, multilevelCalculatorMetadata } from "./_components/multilevel-page";

/**
 * The Multilevel score calculator in the DEFAULT language, at the bare URL;
 * `app/[locale]/multilevel-score-calculator` serves /uz and /ru. See
 * `./_components/multilevel-page.tsx`.
 */
export const metadata: Metadata = multilevelCalculatorMetadata(DEFAULT_LOCALE);

export default function MultilevelScoreCalculator() {
  return <MultilevelCalculatorPage locale={DEFAULT_LOCALE} />;
}
