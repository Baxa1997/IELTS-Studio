/**
 * Shared contracts for reading generation (generate → validate → store → review).
 *
 * No server-only imports, so UI and server code can both import the constants and
 * validators. The question-type literals are pinned 1:1 to the Postgres enum
 * `reading_question_type` in 20260617120900_reading_generation.sql, and the output
 * schemas mirror the JSON contracts in lib/ai/prompts.ts.
 */

import { z } from "zod";

// ---- Question types --------------------------------------------------------

export const READING_QUESTION_TYPES = [
  "true_false_not_given",
  "yes_no_not_given",
  "matching_headings",
  "matching_information",
  "sentence_completion",
  "summary_completion",
  "multiple_choice",
] as const;
export type ReadingQuestionType = (typeof READING_QUESTION_TYPES)[number];

export const READING_QUESTION_LABELS: Record<ReadingQuestionType, string> = {
  true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given",
  matching_headings: "Matching headings",
  matching_information: "Matching information",
  sentence_completion: "Sentence completion",
  summary_completion: "Summary completion",
  multiple_choice: "Multiple choice",
};

/**
 * The Cambridge-style instruction line shown above each group of same-type
 * questions, exactly as the real exam frames them ("Do the following statements
 * agree with the information…", "Complete the sentences below…"). These are the
 * standard public rubric phrasings — NOT copied from any test book (CLAUDE.md §IP).
 * The "Questions X–Y" range is computed at render time, not stored here.
 */
export const READING_INSTRUCTIONS: Record<ReadingQuestionType, string> = {
  true_false_not_given:
    "Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.",
  yes_no_not_given:
    "Do the following statements agree with the claims of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, or NOT GIVEN if it is impossible to say what the writer thinks.",
  matching_headings:
    "Choose the correct heading for each paragraph from the list of headings below.",
  matching_information:
    "Which paragraph contains the following information? Write the correct letter. You may use any letter more than once.",
  sentence_completion:
    "Complete the sentences below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
  summary_completion:
    "Complete the summary below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
  multiple_choice: "Choose the correct letter.",
};

/** Completion types render a fill-in-the-blank inside the sentence, not a
 *  separate text box. The blank marker the generator writes (and the UI replaces
 *  with an inline input) is a run of underscores. */
export const READING_GAP_TYPES: ReadonlyArray<ReadingQuestionType> = [
  "sentence_completion",
  "summary_completion",
];
export function isReadingGapType(t: ReadingQuestionType): boolean {
  return READING_GAP_TYPES.includes(t);
}
/** Matches the underscore blank the generator places where the answer goes. */
export const READING_GAP_MARKER = /_{2,}/;

export const READING_MODULES = ["academic", "general"] as const;
export type ReadingModule = (typeof READING_MODULES)[number];

export const MIN_TARGET_BAND = 4;
export const MAX_TARGET_BAND = 9;
export const DEFAULT_TARGET_BAND = 7;

// ---- Full test (3 passages, ~40 questions, 60 min) -------------------------

/** A real IELTS Reading test = 3 passages, difficulty rising P1→P3. */
export const FULL_TEST_PASSAGE_COUNT = 3;
/** Questions per passage; sums to 40 like the real exam. */
export const FULL_TEST_QUESTION_SPLIT = [13, 13, 14] as const;
/** 60 minutes for the whole test (the real allowance). */
export const READING_TEST_DURATION_SECONDS = 60 * 60;

/**
 * Question-type mix per passage POSITION (index 0→P1 … 2→P3), escalating in
 * difficulty and spanning all real types across the test. One per passage so the
 * three passages don't feel identical.
 */
export const FULL_TEST_TYPE_SETS: ReadonlyArray<ReadingQuestionType[]> = [
  ["true_false_not_given", "multiple_choice", "sentence_completion"],
  ["matching_information", "summary_completion", "true_false_not_given"],
  ["matching_headings", "yes_no_not_given", "multiple_choice"],
];

/** Below this, the validator's confidence in an answer key trips teacher review. */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Shown on every reading result — the band is per-passage and unofficial, and we
 *  must always carry the not-affiliated-with-IELTS® disclaimer (see CLAUDE.md). */
export const READING_DISCLAIMER =
  "Indicative band from this passage only — not an official IELTS® score. This product is not affiliated with or endorsed by IELTS.";

// ---- Generation input ------------------------------------------------------

export const generateReadingInputSchema = z.object({
  module: z.enum(READING_MODULES).default("academic"),
  topic: z.string().trim().min(2).max(80),
  targetBand: z
    .number()
    .int()
    .min(MIN_TARGET_BAND)
    .max(MAX_TARGET_BAND)
    .default(DEFAULT_TARGET_BAND),
  questionTypes: z.array(z.enum(READING_QUESTION_TYPES)).min(1).max(READING_QUESTION_TYPES.length),
  // Upper bound is above the 13–15 a single passage actually serves: the student
  // path over-requests so that after the answer-key validator drops unconfirmed
  // questions, ~13–15 still survive (keepValidated caps the kept set at 15).
  totalQuestions: z.number().int().min(4).max(18).default(13),
});
export type GenerateReadingInput = z.infer<typeof generateReadingInputSchema>;

// ---- Model output: the generated set (mirrors READING_SET_CONTRACT) --------

export const readingQuestionOutSchema = z.object({
  type: z.enum(READING_QUESTION_TYPES),
  number: z.number().int().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string()).nullish(),
  answer: z.string().min(1),
  supporting_sentence: z.string().default(""),
  explanation: z.string().default(""),
});
export type ReadingQuestionOut = z.infer<typeof readingQuestionOutSchema>;

export const readingSetOutputSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  questions: z.array(readingQuestionOutSchema).min(1),
});
export type ReadingSetOutput = z.infer<typeof readingSetOutputSchema>;

// ---- Model output: the validation pass (mirrors READING_VALIDATION_CONTRACT) -

export const readingValidationItemSchema = z.object({
  number: z.number().int(),
  verdict: z.enum(["correct", "incorrect", "ambiguous", "unsupported"]),
  confidence: z.number().min(0).max(1),
  corrected_answer: z.string().nullish(),
  supporting_sentence_ok: z.boolean().default(true),
  note: z.string().default(""),
});
export type ReadingValidationItem = z.infer<typeof readingValidationItemSchema>;

export const readingValidationOutputSchema = z.object({
  items: z.array(readingValidationItemSchema).min(1),
});
export type ReadingValidationOutput = z.infer<typeof readingValidationOutputSchema>;

export const reviewDecisionSchema = z.enum(["approved", "rejected"]);
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

// ---- Stored shapes ---------------------------------------------------------

export interface StoredReadingQuestion {
  id: string;
  question_type: ReadingQuestionType;
  order_index: number;
  prompt: string;
  options: string[] | null;
  answer_key: string;
  supporting_sentence: string;
  explanation: string;
  confidence: number | null;
  needs_review: boolean;
  validation_verdict: string | null;
  validation_note: string | null;
}

export interface StoredReadingPassage {
  id: string;
  title: string;
  body: string;
  module: ReadingModule;
  topic: string | null;
  difficulty: number | null;
  status: "pending" | "approved" | "rejected";
  source: "ai" | "manual";
  needs_review: boolean;
}

export interface GeneratedReadingSet {
  passage: StoredReadingPassage;
  questions: StoredReadingQuestion[];
  /** How many questions the validator flagged for teacher review. */
  flaggedCount: number;
  /** True when the validation pass itself failed and every item was flagged. */
  validationFailed: boolean;
}

export interface StoredReadingTest {
  id: string;
  module: ReadingModule;
  target_band: number | null;
  status: "pending" | "approved" | "rejected";
  source: "ai" | "manual";
  needs_review: boolean;
}

/** A whole generated test: the grouping row + its 3 passages (each with its
 *  questions), in passage order. */
export interface GeneratedReadingTest {
  test: StoredReadingTest;
  passages: GeneratedReadingSet[];
}
