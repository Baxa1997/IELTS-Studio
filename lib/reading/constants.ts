/**
 * Reading contracts that carry NO runtime dependencies — question-type literals,
 * labels, word limits, the full-test blueprint, and the small pure helpers built
 * on them.
 *
 * Split out of `types.ts` so Client Components can import these values without
 * dragging zod into the browser bundle. `types.ts` re-exports everything here, so
 * server code can keep importing from either module; the exam runners import from
 * THIS one on purpose. Anything that needs `z` belongs next door, not here.
 *
 * The question-type literals stay pinned 1:1 to the Postgres enum
 * `reading_question_type` in 20260617120900_reading_generation.sql.
 */

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
  matching_sentence_endings: "Complete each sentence with the correct ending from the list below.",
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
export const FULL_TEST_TYPE_SETS: ReadonlyArray<ReadingQuestionType[]> = FULL_TEST_BLUEPRINT.map(
  (groups) => [...new Set(groups.map((g) => g.type))],
);

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
