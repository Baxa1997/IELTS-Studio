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
  "matching_features",
  "matching_sentence_endings",
  "sentence_completion",
  "summary_completion",
  "note_completion",
  "multiple_choice",
] as const;
export type ReadingQuestionType = (typeof READING_QUESTION_TYPES)[number];

export const READING_QUESTION_LABELS: Record<ReadingQuestionType, string> = {
  true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given",
  matching_headings: "Matching headings",
  matching_information: "Matching information",
  matching_features: "Matching features",
  matching_sentence_endings: "Matching sentence endings",
  sentence_completion: "Sentence completion",
  summary_completion: "Summary completion",
  note_completion: "Note completion",
  multiple_choice: "Multiple choice",
};

/**
 * The word-limit options a completion group can carry, exactly as the real exam
 * phrases them ("Choose ONE WORD ONLY …", "… NO MORE THAN TWO WORDS …"). The limit
 * is a GROUP-LEVEL property generated WITH the questions — never part of an
 * individual question's text — and is rendered once in the group heading. This is
 * the fix for the limit being conflated with the questions.
 */
export const READING_WORD_LIMITS = [
  "ONE WORD ONLY",
  "ONE WORD AND/OR A NUMBER",
  "NO MORE THAN TWO WORDS",
  "NO MORE THAN TWO WORDS AND/OR A NUMBER",
  "NO MORE THAN THREE WORDS",
  "NO MORE THAN THREE WORDS AND/OR A NUMBER",
] as const;
export type ReadingWordLimit = (typeof READING_WORD_LIMITS)[number];

/** Fallback when the generator omits a limit for a completion group. */
export const DEFAULT_WORD_LIMIT: ReadingWordLimit = "NO MORE THAN TWO WORDS AND/OR A NUMBER";

/** The completion family — the "Complete the … below" lead that prefixes the
 *  word-limit line in the group heading. */
const COMPLETION_LEAD: Partial<Record<ReadingQuestionType, string>> = {
  sentence_completion: "Complete the sentences below.",
  summary_completion: "Complete the summary below.",
  note_completion: "Complete the notes below.",
};

/** The fixed instruction for the non-completion types (no word limit). */
const FIXED_INSTRUCTIONS: Partial<Record<ReadingQuestionType, string>> = {
  true_false_not_given:
    "Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.",
  yes_no_not_given:
    "Do the following statements agree with the claims of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, or NOT GIVEN if it is impossible to say what the writer thinks.",
  matching_headings:
    "Choose the correct heading for each paragraph from the list of headings below.",
  matching_information:
    "Which paragraph contains the following information? Write the correct letter. You may use any letter more than once.",
  matching_features:
    "Look at the following statements and the list of people below. Match each statement with the correct person. You may use any letter more than once.",
  matching_sentence_endings:
    "Complete each sentence with the correct ending from the list below.",
  multiple_choice: "Choose the correct letter.",
};

/** Cambridge real-exam VARIANTS that ride on an existing type (no new enum):
 *  a summary filled from a lettered list, a notes box drawn as a flow-chart, and
 *  a multiple-choice PAIR answered by two letters from one shared option set. */
export interface ReadingGroupVariant {
  /** summary_completion answered from an A–J word bank, not words from the passage. */
  wordBank?: boolean;
  /** note_completion rendered as a flow-chart of connected process stages. */
  layout?: "flowchart";
  /** multiple_choice "Choose TWO letters" pair: 2 questions, one stem + option set. */
  pickTwo?: boolean;
}

/**
 * The Cambridge-style instruction line shown above each group of same-type
 * questions, exactly as the real exam frames them. For completion groups the
 * GROUP'S word limit is folded into the lead ("Complete the notes below. Choose
 * ONE WORD ONLY from the passage for each answer.") — the limit lives in the
 * heading, never inside a question. Two variants reword the lead: a word-bank
 * summary points at the list (and carries no word limit, since you pick from it),
 * and a flow-chart note block says "Complete the flow-chart below." These are the
 * standard public rubric phrasings, NOT copied from any test book (CLAUDE.md §IP).
 * The "Questions X–Y" range is computed at render time, not stored here.
 */
export function readingGroupInstruction(
  type: ReadingQuestionType,
  wordLimit?: string | null,
  variant?: ReadingGroupVariant,
): string {
  // A word-bank summary is filled from a lettered list, not from the passage, so it
  // has no word limit — the rubric names the list instead of a limit.
  if (type === "summary_completion" && variant?.wordBank) {
    return "Complete the summary using the list of words, A–J, below.";
  }
  // A "Choose TWO letters" pair: one stem, one shared option set, two answers.
  if (type === "multiple_choice" && variant?.pickTwo) {
    return "Choose TWO letters.";
  }
  const lead =
    type === "note_completion" && variant?.layout === "flowchart"
      ? "Complete the flow-chart below."
      : COMPLETION_LEAD[type];
  if (lead) {
    const limit = (wordLimit?.trim() || DEFAULT_WORD_LIMIT).toUpperCase();
    return `${lead} Choose ${limit} from the passage for each answer.`;
  }
  return FIXED_INSTRUCTIONS[type] ?? "";
}

/** Completion types render a fill-in-the-blank inside the sentence/note line, not
 *  a separate text box. The blank marker the generator writes (and the UI replaces
 *  with an inline input) is a run of underscores. */
export const READING_GAP_TYPES: ReadonlyArray<ReadingQuestionType> = [
  "sentence_completion",
  "summary_completion",
  "note_completion",
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
/** 60 minutes for the whole test (the real allowance). */
export const READING_TEST_DURATION_SECONDS = 60 * 60;

/** One question-type block within a passage: the type, how many, and (optionally)
 *  which Cambridge variant it is. The flags ride on the existing type so no enum or
 *  migration is needed — see ReadingGroupVariant. */
export interface ReadingGroupPlan extends ReadingGroupVariant {
  type: ReadingQuestionType;
  count: number;
}

/**
 * The full-test LAYOUTS — each models a real Cambridge Academic Reading paper as an
 * ordered list of typed blocks per passage (summing to 13/13/14 = 40), difficulty
 * rising P1→P3. ONE layout is chosen at random per generated test and the block
 * ORDER within each passage is then shuffled, so two tests rarely share a shape and
 * the question types rotate across the real Cambridge repertoire instead of being
 * fixed. No two passages in a layout repeat the same type mix. Content is always
 * original (CLAUDE.md §IP) — only the STRUCTURE mirrors the real exam.
 *
 * PLACEMENT RULES (verified against all 12 tests in Cambridge 19–21): P1 is always
 * TRUE/FALSE/NOT GIVEN plus a completion block (notes/sentences/flow-chart);
 * YES/NO/NOT GIVEN appears only in P3 (it asks about the WRITER'S views, which
 * needs the argumentative P3 passage — some real tests have none at all); and
 * matching_information sits in P2 or P3, never P1.
 *
 * Four Cambridge variants ride on existing types (no new enum / migration):
 *   • summary_completion + `wordBank` → "choose from the list A–J" summary.
 *   • note_completion + `layout:"flowchart"` → a flow-chart of process stages.
 *   • multiple_choice + `pickTwo` → a "Choose TWO letters" pair: exactly 2
 *     questions sharing one stem and one 5-option set, each worth one mark.
 *   • matching_information → the "which paragraph contains X" (A–G) task, the ONLY
 *     type whose passage is printed with LETTERED paragraphs. Exactly one passage
 *     per layout carries it (P2 or P3), so every full test has one lettered
 *     passage and the other two are plain prose.
 * matching_features (statements ↔ the people who made them, a shared A–E list) is
 * a full type of its own — it appears in half of all recent Cambridge tests.
 */
export const FULL_TEST_LAYOUTS: ReadonlyArray<ReadonlyArray<ReadingGroupPlan[]>> = [
  // Layout A — the Cambridge-21-Test-1 shape: notes-led P1 · lettered P2 with
  // people-matching · MCQ + word-bank summary + writer's-views P3.
  [
    [
      { type: "note_completion", count: 7 },
      { type: "true_false_not_given", count: 6 },
    ],
    [
      { type: "matching_information", count: 4 },
      { type: "summary_completion", count: 4 },
      { type: "matching_features", count: 5 },
    ],
    [
      { type: "multiple_choice", count: 4 },
      { type: "summary_completion", count: 6, wordBank: true },
      { type: "yes_no_not_given", count: 4 },
    ],
  ],
  // Layout B — the Cambridge-19 shape: sentences P1 · lettered P2 with a
  // choose-TWO pair · sentence-endings + writer's-views P3.
  [
    [
      { type: "true_false_not_given", count: 7 },
      { type: "sentence_completion", count: 6 },
    ],
    [
      { type: "matching_information", count: 5 },
      { type: "multiple_choice", count: 2, pickTwo: true },
      { type: "summary_completion", count: 6 },
    ],
    [
      { type: "multiple_choice", count: 4 },
      { type: "matching_sentence_endings", count: 4 },
      { type: "yes_no_not_given", count: 6 },
    ],
  ],
  // Layout C — the Cambridge-20/21-Test-4 shape: flow-chart P1 · people-matching +
  // word-bank + choose-TWO P2 · lettered P3 that pairs matching types (no YNNG,
  // like real C20 T3/T4).
  [
    [
      { type: "true_false_not_given", count: 7 },
      { type: "note_completion", count: 3, layout: "flowchart" },
      { type: "sentence_completion", count: 3 },
    ],
    [
      { type: "matching_features", count: 5 },
      { type: "summary_completion", count: 6, wordBank: true },
      { type: "multiple_choice", count: 2, pickTwo: true },
    ],
    [
      { type: "matching_information", count: 5 },
      { type: "matching_features", count: 5 },
      { type: "summary_completion", count: 4 },
    ],
  ],
];

/** Pick one full-test layout at random and return a deep copy of its 3 passage
 *  plans (P1→P3), so the caller can shuffle block order without mutating the source. */
export function pickFullTestLayout(): ReadingGroupPlan[][] {
  const layout = FULL_TEST_LAYOUTS[Math.floor(Math.random() * FULL_TEST_LAYOUTS.length)];
  return layout.map((groups) => groups.map((g) => ({ ...g })));
}

/** A representative single blueprint (Layout A), kept for the derived exports below
 *  and any caller that only needs one canonical shape. */
export const FULL_TEST_BLUEPRINT: ReadonlyArray<ReadingGroupPlan[]> = FULL_TEST_LAYOUTS[0];

/** The distinct types per passage (derived from the blueprint), kept for callers
 *  that only need the type inventory. */
export const FULL_TEST_TYPE_SETS: ReadonlyArray<ReadingQuestionType[]> =
  FULL_TEST_BLUEPRINT.map((groups) => [...new Set(groups.map((g) => g.type))]);

/** Questions per passage (derived from the blueprint); sums to 40 like the real exam. */
export const FULL_TEST_QUESTION_SPLIT: ReadonlyArray<number> = FULL_TEST_BLUEPRINT.map((groups) =>
  groups.reduce((n, g) => n + g.count, 0),
);

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
