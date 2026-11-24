import { SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";

import { platformFacts } from "../facts";
import { en } from "./en";
import { ru } from "./ru";
import type { PlatformCopyFn, PlatformPageCopy } from "./types";
import { uz } from "./uz";

export type { Block, PlatformPageCopy } from "./types";

const COPY: Record<Locale, PlatformCopyFn> = { en, uz, ru };

/** The page's copy for one locale, with today's prices and contacts filled
 *  in, falling back to the source language — as `cefrPageCopy` does. */
export function platformPageCopy(locale: Locale): PlatformPageCopy {
  return (COPY[locale] ?? COPY[SOURCE_LOCALE])(platformFacts());
}
