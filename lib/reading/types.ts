/**
 * Shared contracts for reading generation (generate → validate → store → review).
 *
 * The zod-free half — question types, labels, limits, the test blueprint — lives in
 * `./constants` and is re-exported below, so every existing `@/lib/reading/types`
 * import keeps working. This module adds the validators and the stored row shapes;
 * importing it pulls in zod, so Client Components should import `./constants`
 * instead (or use `import type`, which is erased).
 *
 * The output schemas mirror the JSON contracts in lib/ai/prompts.ts.
 */

import { z } from "zod";

import {
  DEFAULT_TARGET_BAND,
  MAX_TARGET_BAND,
  MIN_TARGET_BAND,
  READING_MODULES,
  READING_QUESTION_TYPES,
  type ReadingModule,
  type ReadingQuestionType,
} from "./constants";

export * from "./constants";

// ---- Generation input ------------------------------------------------------

export const generateReadingInputSchema = z.object({
  module: z.enum(READING_MODULES).default("academic"),
  topic: z.string().trim().min(2).max(80),
  // Optional lens the passage is framed through (from the topic taxonomy's angles) —
  // a mechanism explainer vs a history vs a debate vs a single study. Steers the
  // prompt so the same topic yields unrelated passages; omitted for author specs.
  angle: z.string().trim().min(2).max(160).optional(),
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
  // Optional EXACT block plan (ordered {type,count}). When present the generator
  // must produce these blocks, in this order, with these counts (the full-test
  // path uses it to match the Cambridge structure); single-passage practice omits
  // it and lets the model distribute `totalQuestions` across `questionTypes`.
  questionPlan: z
    .array(
      z.object({
        type: z.enum(READING_QUESTION_TYPES),
        count: z.number().int().min(1).max(15),
        // summary_completion answered from an A–J word bank (not words-from-passage).
        wordBank: z.boolean().optional(),
        // note_completion drawn as a flow-chart of process stages.
        layout: z.literal("flowchart").optional(),
        // multiple_choice "Choose TWO letters" pair (count is always 2).
        pickTwo: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(6)
    .optional(),
});
export type GenerateReadingInput = z.infer<typeof generateReadingInputSchema>;

// ---- Rich note-completion layout (the Cambridge notes box) -----------------

/**
 * A context line inside a note-completion box that is NOT itself answerable — a
 * lead-in bullet that introduces sub-points ("has a large bulbous nose … that"),
 * or a plain note with no blank sitting between gapped lines. `indent` nests it
 * (0 = bullet, 1 = sub-dash).
 */
export const noteContextLineSchema = z.object({
  text: z.string().min(1),
  indent: z.coerce.number().int().min(0).max(2).default(0),
});
export type NoteContextLine = z.infer<typeof noteContextLineSchema>;

/**
 * The structured layout for ONE note-completion line, so the block renders like
 * the real exam notes box (a title, bullets, nested sub-dashes, and gap-less
 * context lines). Carried per question but `title` is group-level (repeated). It
 * is render-only — it never touches the answer key or grading.
 */
export const noteMetaSchema = z.object({
  /** The notes box title ("The saiga"); same on every line of the block. */
  title: z.string().nullish(),
  /** This line's own nesting: 0 = bullet, 1 = sub-dash. */
  indent: z.coerce.number().int().min(0).max(2).default(0),
  /** Gap-less context lines shown immediately before this line. */
  before: z.array(noteContextLineSchema).nullish(),
  /** "flowchart" draws the block as connected process stages; "notes"/absent = box. */
  layout: z.enum(["notes", "flowchart"]).nullish(),
});
export type NoteMeta = z.infer<typeof noteMetaSchema>;

// ---- Model output: the generated set (mirrors READING_SET_CONTRACT) --------

export const readingQuestionOutSchema = z.object({
  type: z.enum(READING_QUESTION_TYPES),
  number: z.number().int().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string()).nullish(),
  answer: z.string().min(1),
  supporting_sentence: z.string().default(""),
  explanation: z.string().default(""),
  // Completion groups only: the exact word-limit phrase for THIS group (rendered as
  // the group heading, never inside a prompt). Null/absent for non-completion types.
  word_limit: z.string().nullish(),
  // Note/table completion only: an optional sub-heading (e.g. "Adaptations") that
  // groups consecutive note lines under it, exactly like the Cambridge notes layout.
  section: z.string().nullish(),
  // Note completion only: the structured layout for this line (title/indent/context).
  note_meta: noteMetaSchema.nullish(),
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
  /** Completion groups: the group's word-limit phrase (rendered in the heading). */
  word_limit: string | null;
  /** Note/table completion: optional sub-heading grouping consecutive note lines. */
  section: string | null;
  /** Note completion: structured layout for this line (title/indent/context). */
  note_meta: NoteMeta | null;
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
