/**
 * Writing-prompt vocabulary: the Task 2 question shapes, prompt statuses/sources,
 * topic families, difficulty bounds, and the three essay tasks.
 *
 * Zero runtime dependencies on purpose — the writing library and the assign panel
 * are Client Components and import `TASK2_CATEGORIES` from here, so this module
 * must not pull zod into the browser bundle. The validators live in `./types`,
 * which re-exports everything below.
 *
 * The category/status/source literals stay pinned 1:1 to the Postgres enums in
 * `supabase/migrations/20260617120700_prompt_generation.sql`.
 */

/** The six IELTS Writing Task 2 question shapes we generate — the full rotation
 *  the real exam draws from (Cambridge 19–21 use all six across their 12 tests). */
export const TASK2_CATEGORIES = [
  "opinion",
  "discussion",
  "problem_solution",
  "two_part",
  "advantages_disadvantages",
  "positive_negative",
] as const;
export type Task2Category = (typeof TASK2_CATEGORIES)[number];

/** Human labels for UI / logging. */
export const TASK2_CATEGORY_LABELS: Record<Task2Category, string> = {
  opinion: "Opinion (agree/disagree)",
  discussion: "Discussion (both views + opinion)",
  problem_solution: "Problem–solution (causes/effects)",
  two_part: "Two-part question",
  advantages_disadvantages: "Advantages vs disadvantages",
  positive_negative: "Positive or negative development",
};

/** `pending` is the library's Drafts tab (staff-only, RLS hides it from
 *  students), `approved` is Published, `archived` is retired-but-kept — a
 *  student's graded work points at the prompt, so it is never deleted. */
export const PROMPT_STATUSES = ["pending", "approved", "rejected", "archived"] as const;
export type PromptStatus = (typeof PROMPT_STATUSES)[number];

export const PROMPT_SOURCES = ["ai", "manual", "seed"] as const;
export type PromptSource = (typeof PROMPT_SOURCES)[number];

/** Suggested topic families for even coverage. The DB column is free-text, so
 *  callers may pass others, but these keep tagging consistent and analytics clean. */
export const TOPIC_FAMILIES = [
  "environment",
  "education",
  "technology",
  "health",
  "work",
  "society",
  "government",
  "globalisation",
  "crime",
  "media",
  "culture",
  "transport",
  "tourism",
  "family",
] as const;

/** Coarse difficulty = the target band the prompt's wording/abstraction is pitched at. */
export const MIN_DIFFICULTY = 4;
export const MAX_DIFFICULTY = 9;
export const DEFAULT_DIFFICULTY = 7;

/** The three IELTS Writing tasks a student can practice. */
export const ESSAY_TASK_TYPES = ["task2", "task1_academic", "task1_general"] as const;
export type EssayTaskKind = (typeof ESSAY_TASK_TYPES)[number];

export const ESSAY_TASK_LABELS: Record<EssayTaskKind, string> = {
  task2: "Task 2 — Essay",
  task1_academic: "Task 1 — Academic",
  task1_general: "Task 1 — Letter",
};
