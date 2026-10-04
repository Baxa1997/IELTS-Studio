import "server-only";

import type { MessageKey, Translate } from "@/lib/i18n";

import { MINUTES, WRITING_TASK } from "./pools";
import type { FreeSkill } from "./rotation";

/**
 * The questions a searcher would type about one skill's free practice, and
 * their answers — shown on the practice page, published as its FAQPage data,
 * and written into /llms-full.txt, all from this one list, so none of the three
 * can say something the others do not.
 *
 * ⚠️ WRITTEN FOR ANSWER ENGINES AS MUCH AS FOR READERS. Each answer is lifted
 * on its own, so each one says what it is about. Every claim must be true of
 * the free practice as built: the times come from the pool's own MINUTES, and
 * the marking from what each free runner actually returns.
 */

const MARKED: Record<FreeSkill, MessageKey> = {
  writing: "free.faqMarkedAWriting",
  reading: "free.faqMarkedAReading",
  listening: "free.faqMarkedAListening",
  cefr: "free.faqMarkedACefr",
};

function timeAnswer(skill: FreeSkill, t: Translate): string {
  switch (skill) {
    case "writing":
      return t("free.faqTimeAWriting", { t1: WRITING_TASK.task1_academic.minutes, t2: WRITING_TASK.task2.minutes });
    case "reading":
      return t("free.faqTimeAReading", { full: MINUTES.readingTest, part: MINUTES.readingPassage });
    case "listening":
      return t("free.faqTimeAListening", { full: MINUTES.listeningTest, part: MINUTES.listeningPart });
    case "cefr":
      return t("free.faqTimeACefr", { reading: MINUTES.cefrReading, writing: MINUTES.cefrWriting });
  }
}

export function practiceFaq(skill: FreeSkill, t: Translate): { q: string; a: string }[] {
  return [
    { q: t("free.faqAccountQ"), a: t("free.faqAccountA") },
    { q: t("free.faqMarkedQ"), a: t(MARKED[skill]) },
    { q: t("free.faqTimeQ"), a: timeAnswer(skill, t) },
    { q: t("free.faqDailyQ"), a: t("free.faqDailyA") },
    { q: t("free.faqOriginalQ"), a: t("free.faqOriginalA") },
  ];
}
