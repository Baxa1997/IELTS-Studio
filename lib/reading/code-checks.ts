/**
 * Deterministic code checks for a reading question (no model call).
 *
 * Objective properties code can verify outright — the classic authoring failures
 * an LLM checker misses: an answer that breaks the block's word limit, a
 * "verbatim" proof sentence that isn't in the passage, a completion line with no
 * gap to fill, or a key that can't match any option. A failed check flags the
 * question exactly like a validator rejection.
 *
 * Its own pure module (no server-only, no I/O) so the generation service and the
 * curated-passage tests run the SAME checks — hand-written library passages are
 * held to exactly the bar generated ones are.
 */

import { expandOptionalParens, norm, splitAlternatives } from "./grade";
import { READING_GAP_MARKER, type ReadingQuestionOut, type ReadingQuestionType } from "./types";

const GAP_TYPES: ReadonlySet<ReadingQuestionType> = new Set([
  "sentence_completion",
  "summary_completion",
  "note_completion",
]);

/** The group's exact rubric phrase → the most tokens any accepted answer may
 *  have ("AND/OR A NUMBER" allows one extra token for the number). */
const LIMIT_MAX_TOKENS: Record<string, number> = {
  "ONE WORD ONLY": 1,
  "ONE WORD AND/OR A NUMBER": 2,
  "NO MORE THAN TWO WORDS": 2,
  "NO MORE THAN TWO WORDS AND/OR A NUMBER": 3,
  "NO MORE THAN THREE WORDS": 3,
  "NO MORE THAN THREE WORDS AND/OR A NUMBER": 4,
};
const TF_VERDICTS = new Set(["true", "false", "not given", "ng"]);
const YN_VERDICTS = new Set(["yes", "no", "not given", "ng"]);
const ROMAN_INDEX: Record<string, number> = {
  i: 0,
  ii: 1,
  iii: 2,
  iv: 3,
  v: 4,
  vi: 5,
  vii: 6,
  viii: 7,
  ix: 8,
  x: 9,
  xi: 10,
  xii: 11,
  xiii: 12,
  xiv: 13,
  xv: 14,
};

/** Every accepted form of a completion key: alternatives the author listed
 *  ("colour/color", "x or y", "a; b"), each with every optional "(...)" group
 *  both included and dropped — the same folding acceptedKeyForms applies. */
export function keyAlternatives(key: string): string[] {
  const out: string[] = [];
  for (const alt of splitAlternatives(key)) {
    for (const expanded of expandOptionalParens(alt)) {
      const s = expanded.replace(/\s+/g, " ").trim();
      if (s) out.push(s);
    }
  }
  return out.length ? out : [key];
}

/** Return the first objective defect found in a question, or null. */
export function codeCheckProblem(q: ReadingQuestionOut, body: string): string | null {
  const answer = (q.answer ?? "").trim();
  if (!answer) return "empty answer key";
  const options = q.options ?? [];

  // Completion-from-the-passage: the prompt must carry a gap, and at least one
  // accepted form of the key must fit the block's stated word limit.
  if (GAP_TYPES.has(q.type) && !(q.type === "summary_completion" && options.length > 0)) {
    if (!READING_GAP_MARKER.test(q.prompt ?? "")) {
      return "completion prompt has no '______' gap marker";
    }
    const maxTokens = LIMIT_MAX_TOKENS[(q.word_limit ?? "").trim().toUpperCase()];
    if (maxTokens !== undefined) {
      const shortest = Math.min(
        ...keyAlternatives(answer).map((a) => norm(a).split(" ").filter(Boolean).length),
      );
      if (shortest > maxTokens)
        return `answer '${answer}' exceeds the word limit (${q.word_limit})`;
    }
  }

  if (q.type === "true_false_not_given" && !TF_VERDICTS.has(norm(answer))) {
    return `answer '${answer}' is not TRUE/FALSE/NOT GIVEN`;
  }
  if (q.type === "yes_no_not_given" && !YN_VERDICTS.has(norm(answer))) {
    return `answer '${answer}' is not YES/NO/NOT GIVEN`;
  }

  // Matching information: the key is a paragraph letter that must exist as a label.
  if (q.type === "matching_information") {
    const letter = norm(answer);
    if (!/^[a-z]$/.test(letter)) return `answer '${answer}' is not a single paragraph letter`;
    if (!body.includes(`${letter.toUpperCase()})`)) {
      return `paragraph '${letter.toUpperCase()})' is not labelled in the passage`;
    }
  }

  // Option-bank types: the key must resolve to an option (its text, a letter, or
  // a roman numeral index) or the grader can never mark anything correct.
  const optionBankTypes: ReadingQuestionType[] = [
    "multiple_choice",
    "matching_sentence_endings",
    "matching_headings",
    "matching_features",
    "summary_completion",
  ];
  if (options.length > 0 && optionBankTypes.includes(q.type)) {
    const key = norm(answer);
    let resolvable = options.some((o) => norm(o) === key);
    if (!resolvable && /^[a-z]$/.test(key)) resolvable = key.charCodeAt(0) - 97 < options.length;
    if (!resolvable && key in ROMAN_INDEX) resolvable = ROMAN_INDEX[key] < options.length;
    if (!resolvable) return `answer '${answer}' does not match any option in the bank`;
  }

  // The cited proof must actually be in the passage (punctuation-insensitive).
  const support = (q.supporting_sentence ?? "").trim();
  if (support && !norm(body).includes(norm(support))) {
    return "supporting sentence is not found verbatim in the passage";
  }

  return null;
}
