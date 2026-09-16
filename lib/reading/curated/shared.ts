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

/** A full library test: three passages rising in difficulty, 13 + 13 + 14 questions. */
export interface CuratedTest {
  /** Stable slug; the library test id is derived from it, like a passage's. */
  key: string;
  /** Centre band. Passage 1 is pitched below it and Passage 3 above. */
  targetBand: number;
  passages: [CuratedPassage, CuratedPassage, CuratedPassage];
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

// ---- Builders for the full tests -------------------------------------------

type NoteLineOptions = { indent?: number; before?: { text: string; indent: number }[] };

export function tfng(
  prompt: string,
  answer: string,
  support: string,
  why: string,
): CuratedQuestion {
  return plain("true_false_not_given", prompt, answer, support, why);
}

export function ynng(
  prompt: string,
  answer: string,
  support: string,
  why: string,
): CuratedQuestion {
  return plain("yes_no_not_given", prompt, answer, support, why);
}

/** Sentence or summary completion answered with words from the passage. */
export function gapFill(
  type: "sentence_completion" | "summary_completion",
  wordLimit: string,
  prompt: string,
  answer: string,
  support: string,
  why: string,
): CuratedQuestion {
  return { ...plain(type, prompt, answer, support, why), word_limit: wordLimit };
}

/** One line of a notes box or flow-chart. */
export function noteLine(
  box: { title: string; layout: "notes" | "flowchart"; wordLimit: string },
  section: string | null,
  prompt: string,
  answer: string,
  support: string,
  why: string,
  line: NoteLineOptions = {},
): CuratedQuestion {
  return {
    ...plain("note_completion", prompt, answer, support, why),
    word_limit: box.wordLimit,
    section,
    note_meta: {
      title: box.title,
      indent: line.indent ?? 0,
      before: line.before ?? [],
      layout: box.layout,
    },
  };
}

/** A question answered from a shared list: paragraphs, people, headings, endings or a word bank. */
export function fromList(
  type:
    | "matching_information"
    | "matching_features"
    | "matching_headings"
    | "matching_sentence_endings"
    | "summary_completion",
  options: string[],
  prompt: string,
  answer: string,
  support: string,
  why: string,
): CuratedQuestion {
  return { ...plain(type, prompt, answer, support, why), options };
}

export function mcq(
  prompt: string,
  options: string[],
  answer: string,
  support: string,
  why: string,
): CuratedQuestion {
  return { ...plain("multiple_choice", prompt, answer, support, why), options };
}

/** One row of a "Choose TWO letters" pair; both rows carry the same stem, options and "A or C" key. */
export function pickTwo(
  prompt: string,
  options: string[],
  letters: string,
  support: string,
  why: string,
): CuratedQuestion {
  return { ...plain("multiple_choice", prompt, letters, support, why), options };
}
