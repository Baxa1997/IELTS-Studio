import type { Translate } from "@/lib/i18n";

import { signInFor, type PracticeCardSkill } from "./links";

/**
 * What the free practice says to a visitor about signing in — once, here.
 *
 * THE OWNER'S RULE (2026-09-27): every time a visitor uses a free practice,
 * recommend signing in to get more free practices. So the same message appears
 * as a strip while the practice is in use and as a card on the result; the
 * runners take it as props rather than writing their own, which is how three
 * runners in three folders stay saying the same thing.
 */
export interface FreeTrialCopy {
  /** The strip's opening words, while the practice is in use. */
  lead: string;
  /** The result card's heading. */
  title: string;
  body: string;
  /** The link text — the recommendation itself. */
  cta: string;
  /** Sign-in, returning the visitor to this skill afterwards. */
  href: string;
}

export function freeTrialCopy(t: Translate, skill: PracticeCardSkill): FreeTrialCopy {
  return {
    lead: t("free.stripLead"),
    title: t("free.moreTitle"),
    body: t("free.moreBody"),
    cta: t("free.moreCta"),
    href: signInFor(skill),
  };
}
