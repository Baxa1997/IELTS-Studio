/**
 * Shared contracts for the writing-prompt library (generation + review + serving).
 *
 * The zod-free vocabulary lives in `./constants` and is re-exported below, so every
 * existing `@/lib/prompts/types` import keeps working. This module adds the
 * validators and the stored row shape; importing it pulls in zod, so Client
 * Components should import `./constants` instead.
 */

import { z } from "zod";

import type { Figure } from "@/lib/writing/figure";

import {
  DEFAULT_DIFFICULTY,
  ESSAY_TASK_TYPES,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  TASK2_CATEGORIES,
  type PromptSource,
  type PromptStatus,
  type Task2Category,
} from "./constants";

export * from "./constants";

// ---- Validation ------------------------------------------------------------

/** Input to generate one Task 2 prompt. Task 1 generation can extend this later. */
export const generatePromptInputSchema = z.object({
  category: z.enum(TASK2_CATEGORIES),
  topicFamily: z.string().trim().min(2).max(50),
  /** Target band the prompt is pitched at (whole band). */
  difficulty: z.number().int().min(MIN_DIFFICULTY).max(MAX_DIFFICULTY).default(DEFAULT_DIFFICULTY),
});
export type GeneratePromptInput = z.infer<typeof generatePromptInputSchema>;

/** Optional filters when serving a student their next prompt. */
export const promptFiltersSchema = z.object({
  /** Which task to serve; defaults to Task 2 in the service. */
  taskType: z.enum(ESSAY_TASK_TYPES).optional(),
  category: z.enum(TASK2_CATEGORIES).optional(),
  topicFamily: z.string().trim().min(2).max(50).optional(),
  difficulty: z.number().int().min(MIN_DIFFICULTY).max(MAX_DIFFICULTY).optional(),
  /** Force a brand-new AI generation (the explicit "Generate a topic" button), instead
   *  of re-serving an existing unseen prompt from the pool. */
  fresh: z.boolean().optional(),
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
