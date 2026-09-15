/**
 * The shape and the shared wording of the curated writing practice set.
 *
 * Its own module so the per-task files and `../starter-set` can both import it
 * without a runtime cycle: starter-set imports the task files, so a constant
 * the task files read back from starter-set would still be uninitialised when
 * they evaluate.
 */

import type { Task2Category } from "@/lib/prompts/constants";
import type { Figure } from "@/lib/writing/figure";

export type LetterRegister = "formal" | "semi_formal" | "informal";

export interface StarterPrompt {
  task_type: "task1_academic" | "task1_general" | "task2";
  category: Task2Category | null;
  topic_family: string;
  difficulty: number;
  prompt_text: string;
  figure?: Figure;
  /** General Training letters only, and never stored. It records which reader
   *  the situation sets up, so the test can hold the salutation to it — the
   *  grader caps Task Achievement at 5 for a register that doesn't fit. */
  register?: LetterRegister;
}

/** The fixed closing sentence of every Academic Task 1 rubric. */
export const T1_TAIL =
  "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";
