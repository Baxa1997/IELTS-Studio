import { SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";

import { en } from "./en";
import { ru } from "./ru";
import type { ToolsCopy } from "./types";
import { uz } from "./uz";

export type { FaqItem, HeroCopy, IeltsCopy, MultilevelCopy, PageMeta, ToolChrome, ToolsCopy } from "./types";

const COPY: Record<Locale, ToolsCopy> = { en, uz, ru };

/** The calculators' copy for one locale. Falls back to `SOURCE_LOCALE` — the
 *  one the others are typed against — for the same reason `docsCopy` does. */
export function toolsCopy(locale: Locale): ToolsCopy {
  return COPY[locale] ?? COPY[SOURCE_LOCALE];
}

/** `{name}` slots filled from `vars`; a slot with no value is left visible, so
 *  a missing one shows up in review instead of vanishing. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}

/** A number as the copy shows it: no trailing zeros, at most three places —
 *  "6.125", "6.25", "50.5", "58". */
export const plain = (n: number): string => String(Number(n.toFixed(3)));
