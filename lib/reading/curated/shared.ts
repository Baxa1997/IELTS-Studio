/**
 * The shape of a hand-written library reading passage.
 *
 * Mirrors the generator's output (ReadingQuestionOut) field for field, so the
 * seed stores curated passages through exactly the columns generated ones use,
 * and the tests run the production code checks on them unchanged.
 */

import type { NoteMeta, ReadingQuestionType } from "@/lib/reading/types";

export interface CuratedQuestion {
  type: ReadingQuestionType;
  prompt: string;
  /** Choices, headings, endings, people, or a word bank; null when the type has none. */
  options: string[] | null;
  /** The key the grader marks against, in the form the generator would store. */
  answer: string;
  /** Verbatim sentence from the body proving the answer; empty only for Not Given. */
  supporting_sentence: string;
  explanation: string;
  word_limit: string | null;
  section: string | null;
  note_meta: NoteMeta | null;
}

export interface CuratedPassage {
  /** Stable slug. The library row's id is derived from it, so a re-seed after a
   *  wipe recreates the SAME id and learners' copies (library_key) still match. */
  key: string;
  title: string;
  /** Shown under the card title in the hub. */
  topic: string;
  /** Target band the passage is pitched at (4–9). */
  difficulty: number;
  body: string;
  /** In exam order; numbered 1..n by position when stored. */
  questions: CuratedQuestion[];
}

/** A question with no options, word limit, section or notes layout. */
export function plain(
  type: ReadingQuestionType,
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    type,
    prompt,
    options: null,
    answer,
    supporting_sentence,
    explanation,
    word_limit: null,
    section: null,
    note_meta: null,
  };
}
