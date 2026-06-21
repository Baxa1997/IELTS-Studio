/**
 * Shared contracts for the writing-prompt library (generation + review + serving).
 *
 * Kept free of server-only imports so both server code (`./service`) and any UI can
 * import the constants/validators. The category/status/source string literals are
 * pinned 1:1 to the Postgres enums in
 * `supabase/migrations/20260617120700_prompt_generation.sql`.
 */

import { z } from "zod";

import type { Figure } from "@/lib/writing/figure";

/** The four IELTS Writing Task 2 question shapes we generate. */
export const TASK2_CATEGORIES = ["opinion", "discussion", "problem_solution", "two_part"] as const;
export type Task2Category = (typeof TASK2_CATEGORIES)[number];

/** Human labels for UI / logging. */
export const TASK2_CATEGORY_LABELS: Record<Task2Category, string> = {
  opinion: "Opinion (agree/disagree)",
  discussion: "Discussion (both views + opinion)",
  problem_solution: "Problem–solution (causes/effects)",
  two_part: "Two-part question",
};

export const PROMPT_STATUSES = ["pending", "approved", "rejected"] as const;
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

// ---- Validation ------------------------------------------------------------

/** Input to generate one Task 2 prompt. Task 1 generation can extend this later. */
export const generatePromptInputSchema = z.object({
  category: z.enum(TASK2_CATEGORIES),
  topicFamily: z.string().trim().min(2).max(50),
  /** Target band the prompt is pitched at (whole band). */
  difficulty: z.number().int().min(MIN_DIFFICULTY).max(MAX_DIFFICULTY).default(DEFAULT_DIFFICULTY),
});
export type GeneratePromptInput = z.infer<typeof generatePromptInputSchema>;

/** The three IELTS Writing tasks a student can practice. */
export const ESSAY_TASK_TYPES = ["task2", "task1_academic", "task1_general"] as const;
export type EssayTaskKind = (typeof ESSAY_TASK_TYPES)[number];

export const ESSAY_TASK_LABELS: Record<EssayTaskKind, string> = {
  task2: "Task 2 — Essay",
  task1_academic: "Task 1 — Academic",
  task1_general: "Task 1 — Letter",
};

/** Optional filters when serving a student their next prompt. */
export const promptFiltersSchema = z.object({
  /** Which task to serve; defaults to Task 2 in the service. */
  taskType: z.enum(ESSAY_TASK_TYPES).optional(),
  category: z.enum(TASK2_CATEGORIES).optional(),
  topicFamily: z.string().trim().min(2).max(50).optional(),
  difficulty: z.number().int().min(MIN_DIFFICULTY).max(MAX_DIFFICULTY).optional(),
});
export type PromptFilters = z.infer<typeof promptFiltersSchema>;

export const reviewDecisionSchema = z.enum(["approved", "rejected"]);
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

/** A stored prompt row, as returned to callers. */
export interface StoredPrompt {
  id: string;
  task_type: "task1_academic" | "task1_general" | "task2";
  category: Task2Category | null;
  prompt_text: string;
  /** Academic Task 1 only: the chart/table data the candidate describes. */
  figure: Figure | null;
  topic_family: string | null;
  difficulty: number | null;
  status: PromptStatus;
  source: PromptSource;
  created_at: string;
}
