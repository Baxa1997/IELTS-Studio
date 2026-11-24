import type { Metadata } from "next";

import { SOURCE_LOCALE } from "@/lib/i18n/locales";

import { PlatformArticle, platformPageMetadata } from "./_components/platform-page";

/** The English page, at the bare URL; `/uz/…` and `/ru/…` are
 *  app/[locale]/ielts-ai-platform-uzbekistan and render the same article. */
export const metadata: Metadata = platformPageMetadata(SOURCE_LOCALE);

export default function IeltsAiPlatformUzbekistanPage() {
  return <PlatformArticle locale={SOURCE_LOCALE} />;
}
