import type { Metadata } from "next";

import { SOURCE_LOCALE } from "@/lib/i18n/locales";

import { CefrPracticeArticle, cefrPracticeMetadata } from "./_components/cefr-page";

/** The English page, at the bare URL; `/uz/…` and `/ru/…` are
 *  app/[locale]/cefr-multilevel-practice and render the same article. */
export const metadata: Metadata = cefrPracticeMetadata(SOURCE_LOCALE);

export default function CefrMultilevelPracticePage() {
  return <CefrPracticeArticle locale={SOURCE_LOCALE} />;
}
