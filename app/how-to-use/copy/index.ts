import { SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";

import { en } from "./en";
import { ru } from "./ru";
import type { DocsCopy } from "./types";
import { uz } from "./uz";

export type { CentersCopy, DocPoint, DocsCopy, DocStepCopy, DocTabCopy, LearnerCopy } from "./types";

const COPY: Record<Locale, DocsCopy> = { en, uz, ru };

/**
 * The documentation copy for one locale.
 *
 * ⚠️ THE FALLBACK IS `SOURCE_LOCALE`, NOT `DEFAULT_LOCALE` — the same rule as
 * `lib/i18n`'s `translate()`, and for the same reason. English is the language
 * the other two are typed against, so it is the only one guaranteed complete.
 * Falling back to the default (Uzbek) would mean a section added in English and
 * not yet translated renders as nothing at all.
 *
 * In practice the types make the fallback unreachable from TypeScript: `uz.ts`
 * and `ru.ts` do not compile until they carry every field. It exists for a
 * locale arriving as a plain string at runtime.
 */
export function docsCopy(locale: Locale): DocsCopy {
  return COPY[locale] ?? COPY[SOURCE_LOCALE];
}
