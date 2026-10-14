/**
 * The /grade checker's CEFR (Uzbekistan Multilevel) tab: the three writing
 * tasks, their bounds, and sample tasks to write to.
 *
 * PURE, like ./prompts — the page renders the pickers from it and the route
 * (app/api/public/grade/cefr) validates against it, from one source.
 *
 * THE GRADING IS THE ENGINE'S, not this module's: the route sends the task and
 * the answer to `/multilevel/public/writing/grade-own`, which composes a
 * one-task paper around them and marks it with the same rubric call a
 * signed-in learner's paper gets. Nothing about how CEFR writing is scored
 * belongs on this side.
 *
 * Samples are ORIGINAL and follow the engine's own task templates
 * (multilevel/prompts.py `_WRITING_BLOCKS`): Tasks 1.1 and 1.2 share one club
 * situation — a message to a friend, then a letter to the manager — and Task 2
 * is a forum question.
 */

/** A Multilevel writing task's id, as the engine names it. */
export type CefrTaskId = "1.1" | "1.2" | "2";

export interface CefrTaskMeta {
  id: CefrTaskId;
  /** What the task asks for — exam vocabulary, English on every locale. */
  title: string;
  /** The level the task is pitched at. */
  level: "B1" | "B2" | "C1";
  /** The word range the task asks for. */
  words: readonly [number, number];
}

/**
 * ⚠️ A MIRROR OF THE ENGINE, NOT A SECOND DEFINITION. The levels and word
 * ranges are the engine's `WRITING_TASK_META` (multilevel/types.py), which is
 * what grades against them; this copy only lets the picker show a target before
 * anything is graded. The grade itself comes back with the engine's own
 * `cefr` and `word_range`, and the result screen shows those.
 */
export const CEFR_TASKS: readonly CefrTaskMeta[] = [
  { id: "1.1", title: "Informal message", level: "B1", words: [45, 60] },
  { id: "1.2", title: "Formal letter", level: "B2", words: [120, 150] },
  { id: "2", title: "Opinion post", level: "C1", words: [180, 200] },
];

export function isCefrTaskId(v: unknown): v is CefrTaskId {
  return CEFR_TASKS.some((t) => t.id === v);
}

export function cefrTask(id: CefrTaskId): CefrTaskMeta {
  // Total by construction: every CefrTaskId has a row above.
  return CEFR_TASKS.find((t) => t.id === id) as CefrTaskMeta;
}

// ---- Bounds — each one the engine's own, checked here first so a refusal
// costs no round trip ---------------------------------------------------------

/** Below this there is nothing for the grader to say. Task 1.1 asks for 45–60;
 *  the same floor as the daily CEFR practice. */
export const CEFR_MIN_WORDS = 20;
/** The engine refuses past this (`PUBLIC_MAX_WORDS`). */
export const CEFR_MAX_WORDS = 600;
/** The engine refuses a task longer than this (`PUBLIC_MAX_TASK_CHARS`). */
export const CEFR_MAX_TASK_CHARS = 1500;

// ---- Samples ----------------------------------------------------------------

export interface CefrSample {
  id: string;
  task: CefrTaskId;
  /** Short topic label for the picker chip. */
  title: string;
  /** The full task, shown to the writer and sent to the grader. */
  prompt: string;
}

const POOL =
  "You are a member of the Riverside Sports Club. The club has announced that its swimming pool will be " +
  "closed for three months for repairs, but members will still pay the full monthly fee.";
const FEES =
  "You go to the Atlas Fitness gym. The gym has suddenly raised its monthly membership fee by 30%, and " +
  "members were told only two days before the change.";

export const CEFR_SAMPLES: readonly CefrSample[] = [
  {
    id: "cefr-11-pool",
    task: "1.1",
    title: "Pool closure",
    prompt: `${POOL}\n\nWrite a letter to your friend, who is also a member, about the closure. Write about your feelings and what you think should be done until the pool reopens. Write about 50 words.`,
  },
  {
    id: "cefr-11-fees",
    task: "1.1",
    title: "Fee rise",
    prompt: `${FEES}\n\nWrite a letter to your friend, who goes to the same gym, about the new fee. Write about your feelings and what you think you should both do. Write about 50 words.`,
  },
  {
    id: "cefr-12-pool",
    task: "1.2",
    title: "Pool closure",
    prompt: `${POOL}\n\nWrite a letter to the manager about the situation. Write about your feelings and what you think the club management should do about it. Write about 120–150 words.`,
  },
  {
    id: "cefr-12-fees",
    task: "1.2",
    title: "Fee rise",
    prompt: `${FEES}\n\nWrite a letter to the manager about the new fee. Write about your feelings and what you think the gym management should do about the situation. Write about 120–150 words.`,
  },
  {
    id: "cefr-2-tablets",
    task: "2",
    title: "Tablets in schools",
    prompt:
      'You are taking part in a discussion on an education website. The question is: "Should schools replace printed ' +
      'textbooks with tablets?" Post your response, giving reasons and examples. Write 180–200 words.',
  },
  {
    id: "cefr-2-city",
    task: "2",
    title: "City or town",
    prompt:
      'You are a member of an online forum about modern life. The question is: "Is it better for young people to live ' +
      'in a big city or in a small town?" Post your response, giving reasons and examples. Write 180–200 words.',
  },
];

/** The samples one task's picker offers. */
export function cefrSamplesFor(task: CefrTaskId): CefrSample[] {
  return CEFR_SAMPLES.filter((s) => s.task === task);
}

// ---- Resolution ---------------------------------------------------------------

export interface ResolvedCefrTask {
  task: CefrTaskId;
  /** The task text to grade against; empty = the visitor gave none, and the
   *  engine grades the answer as its task type on its own merits. */
  taskText: string;
}

/**
 * What a request asks to be graded against. A custom task wins; else a valid
 * sample — whose OWN task id wins over the one sent, so a sample is never
 * graded as a different task; else no task text at all. Null for an unknown
 * task id or a task over the length bound.
 */
export function resolveCefrTask(input: {
  task?: unknown;
  sampleId?: unknown;
  customTask?: unknown;
}): ResolvedCefrTask | null {
  const custom = typeof input.customTask === "string" ? input.customTask.trim() : "";
  if (!custom && typeof input.sampleId === "string") {
    const sample = CEFR_SAMPLES.find((s) => s.id === input.sampleId);
    if (sample) return { task: sample.task, taskText: sample.prompt };
  }
  if (!isCefrTaskId(input.task)) return null;
  if (custom.length > CEFR_MAX_TASK_CHARS) return null;
  return { task: input.task, taskText: custom };
}

/**
 * The five things the Multilevel grader scores, each out of 5, in the order the
 * result shows them. Grader vocabulary, so English on every locale — as the
 * IELTS criterion names are.
 */
export const CEFR_SCORES = [
  { key: "task_achievement", label: "Task achievement" },
  { key: "coherence", label: "Coherence" },
  { key: "lexical", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
  { key: "register", label: "Register" },
] as const satisfies readonly { key: keyof NonNullable<CefrWritingGrade["scores"]>; label: string }[];

/**
 * The engine's CEFR writing grade, as the result screen reads it — the same
 * shape the daily practice's runner renders (shared/components/cefr).
 */
export interface CefrWritingGrade {
  task_id: string;
  gradable: boolean;
  message?: string;
  cefr?: string;
  word_range?: [number, number];
  word_count?: number;
  in_range?: boolean;
  scores?: {
    task_achievement: number;
    coherence: number;
    lexical: number;
    grammar: number;
    register: number;
  };
  overall_0_100?: number;
  estimated_cefr?: string;
  strengths?: string[];
  improvements?: string[];
  corrected_sentences?: { original: string; improved: string }[];
  examiner_comment?: string;
}
