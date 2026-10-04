import "server-only";

import { CATEGORIES, CATEGORY_LABEL } from "@/lib/blog";
import { en } from "@/lib/i18n/messages/en";

import type { CategoryOption } from "../_components/post-editor";

/** The category picker's options, labelled as the site labels them. Built on
 *  the server so the client editor does not ship the whole dictionary. */
export const CATEGORY_OPTIONS: CategoryOption[] = CATEGORIES.map((c) => ({ value: c, label: en[CATEGORY_LABEL[c]] }));

/** Today in Tashkent, `YYYY-MM-DD` — the audience's day, whatever zone the
 *  server runs in. */
export function todayInTashkent(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
