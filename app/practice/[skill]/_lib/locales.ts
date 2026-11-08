import type { FreeSkill } from "@/lib/free-practice/rotation";

/**
 * The free-practice pages that also exist in Uzbek and Russian
 * (`/uz/practice/<skill>`, `/ru/practice/<skill>`, app/[locale]/practice).
 *
 * CEFR first (owner, 2026-11-08): it is Uzbekistan's own exam, and its
 * candidates search in Uzbek and Russian. The page around the practices
 * follows the language; the practices themselves stay English — they are the
 * exam. Adding a skill here is the whole change for that skill's page, plus
 * the two LOCALISED sets below.
 *
 * ⚠️ MIRRORED, as "/practice/<skill>", in `LOCALISED` (app/sitemap.ts) and
 * `LOCALISED_ROUTES` (shared/components/i18n/locale-provider.tsx). Those are
 * string lists a test parses, so they cannot import this; the route test
 * asserts the three agree.
 */
export const LOCALISED_PRACTICE: readonly FreeSkill[] = ["cefr"];
