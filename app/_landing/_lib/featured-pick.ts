import { PRACTICE_CARD_SKILLS } from "@/lib/free-practice/links";
import { isFreeSkill, type FreeSkill } from "@/lib/free-practice/rotation";

/** The order "Start here" walks — the section's own card order, free skills
 *  only (Speaking has no free practice to start). */
export const FEATURE_ORDER: FreeSkill[] = PRACTICE_CARD_SKILLS.filter(isFreeSkill);

/**
 * Which skill's card the landing page puts first, as "Start here" (owner,
 * 2026-10-17): the first in card order that has a pick and is not done today.
 *
 * ⚠️ A FIXED ORDER, NOT A SCORE, ON PURPOSE. The picks arrive in the browser
 * after the page is drawn, and the page is drawn with the first skill already
 * in the "Start here" frame. Ranking by anything the picks carry — the
 * quickest, the newest — would move the cards around under a reader a moment
 * after the page appears. With a fixed order the frame only changes for a
 * visitor who has already done that skill today.
 */
export function featuredSkill(
  picks: Partial<Record<FreeSkill, { done: boolean }>> | null,
): FreeSkill {
  if (!picks) return FEATURE_ORDER[0];
  return FEATURE_ORDER.find((skill) => picks[skill] && !picks[skill]?.done) ?? FEATURE_ORDER[0];
}
