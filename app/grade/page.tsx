import type { Metadata } from "next";

import { SOURCE_LOCALE } from "@/lib/i18n/locales";

import { GradePage, gradeJsonLd, gradeMetadata } from "./_components/grade-page";

/** The English checker, at the bare URL; `/uz/grade` and `/ru/grade` are
 *  app/[locale]/grade and render the same page in their own language. */
export const metadata: Metadata = gradeMetadata(SOURCE_LOCALE);

export default function PublicGradePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Structured data for rich results — WebApplication + FAQPage + breadcrumbs.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gradeJsonLd(SOURCE_LOCALE)) }}
      />
      <GradePage locale={SOURCE_LOCALE} />
    </>
  );
}
