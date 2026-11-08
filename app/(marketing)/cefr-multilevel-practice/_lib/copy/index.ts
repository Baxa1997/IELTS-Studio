import { SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";

import { en } from "./en";
import { ru } from "./ru";
import type { CefrPageCopy } from "./types";
import { uz } from "./uz";

export type { CefrPageCopy } from "./types";

const COPY: Record<Locale, CefrPageCopy> = { en, uz, ru };

/** The page's copy for one locale, falling back to the source one — as
 *  `toolsCopy` and `docsCopy` do. */
export function cefrPageCopy(locale: Locale): CefrPageCopy {
  return COPY[locale] ?? COPY[SOURCE_LOCALE];
}
