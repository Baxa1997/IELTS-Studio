import { CEFR_READING_QUESTIONS, MINUTES, WRITING_TASK } from "@/lib/free-practice/pools";
import type { FreeSkill } from "@/lib/free-practice/rotation";
import type { MessageKey, Translate } from "@/lib/i18n";

/**
 * What the practice page says a practice IS — the answer-first summary under
 * the heading, and the facts strip beside it.
 *
 * Written for the reader who arrives from a search, and for the answer engines
 * that quote a page's first paragraph: the format, the time, and how it is
 * marked, as plain statements. ⚠️ EVERY NUMBER IS DERIVED from the constants
 * the pools time practices by (`MINUTES`, `WRITING_TASK`), so the page cannot
 * promise a sixty-minute test the runner times at forty.
 */
function timeVars(skill: FreeSkill): Record<string, number> {
  switch (skill) {
    case "writing":
      return { t1: WRITING_TASK.task1_academic.minutes, t2: WRITING_TASK.task2.minutes };
    case "reading":
      return { full: MINUTES.readingTest, part: MINUTES.readingPassage };
    case "listening":
      return { full: MINUTES.listeningTest, part: MINUTES.listeningPart };
    case "cefr":
      return {
        reading: MINUTES.cefrReading,
        writing: MINUTES.cefrWriting,
        questions: CEFR_READING_QUESTIONS,
      };
  }
}

const SUMMARY: Record<FreeSkill, MessageKey> = {
  writing: "free.summaryWriting",
  reading: "free.summaryReading",
  listening: "free.summaryListening",
  cefr: "free.summaryCefr",
};

/** The paragraph under the heading. */
export function practiceSummary(skill: FreeSkill, t: Translate): string {
  return t(SUMMARY[skill], timeVars(skill));
}

export type FactKind = "format" | "time" | "marking";

const FACT: Record<FreeSkill, Record<FactKind, MessageKey>> = {
  writing: {
    format: "free.factFormatWriting",
    time: "free.factTimeWriting",
    marking: "free.factMarkingWriting",
  },
  reading: {
    format: "free.factFormatReading",
    time: "free.factTimeReading",
    marking: "free.factMarkingReading",
  },
  listening: {
    format: "free.factFormatListening",
    time: "free.factTimeListening",
    marking: "free.factMarkingListening",
  },
  cefr: {
    format: "free.factFormatCefr",
    time: "free.factTimeCefr",
    marking: "free.factMarkingCefr",
  },
};

const FACT_LABEL: Record<FactKind, MessageKey> = {
  format: "free.factFormat",
  time: "free.factTime",
  marking: "free.factMarking",
};

/** The facts strip: format, time, marking — in that order. */
export function practiceFacts(
  skill: FreeSkill,
  t: Translate,
): { kind: FactKind; label: string; value: string }[] {
  const vars = timeVars(skill);
  return (["format", "time", "marking"] as const).map((kind) => ({
    kind,
    label: t(FACT_LABEL[kind]),
    value: t(FACT[skill][kind], vars),
  }));
}
