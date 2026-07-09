/**
 * Public, no-login essay grader — the marketing funnel.
 *
 * A small curated set of ORIGINAL IELTS Academic Task 2 prompts, written by us in
 * IELTS format. We never copy from Cambridge/Oxford/Macmillan or official past
 * papers (CLAUDE.md, IP boundaries). This module is PURE (no `server-only`) so the
 * page can render the picker and the route can validate the chosen id — both from
 * one source of truth.
 */

import type { EssayTaskType } from "@/lib/ai/schema";

export interface PublicPrompt {
  id: string;
  taskType: EssayTaskType;
  /** Short topic label for the picker chip. */
  title: string;
  /** The full Task 2 question, shown to the writer and sent to the grader. */
  prompt: string;
}

/** Task 2 only — the marquee task. Keeps the free preview focused and the grader
 *  anchored to its Task 2 exemplars. */
export const PUBLIC_PROMPTS: PublicPrompt[] = [
  {
    id: "tech-work",
    taskType: "task2",
    title: "Technology & work",
    prompt:
      "Some people believe that the increasing use of computers and smartphones in everyday " +
      "life has made people less able to think for themselves. To what extent do you agree or " +
      "disagree?\n\nGive reasons for your answer and include any relevant examples from your own " +
      "knowledge or experience. Write at least 250 words.",
  },
  {
    id: "education-funding",
    taskType: "task2",
    title: "Education",
    prompt:
      "In many countries, governments are spending large amounts of money on university " +
      "education. Some argue this money would be better spent on primary and secondary schools " +
      "instead. Discuss both views and give your own opinion.\n\nGive reasons for your answer and " +
      "include any relevant examples from your own knowledge or experience. Write at least 250 words.",
  },
  {
    id: "environment-individual",
    taskType: "task2",
    title: "Environment",
    prompt:
      "Many environmental problems are now too large to be solved by individuals; they can only " +
      "be addressed by governments and large companies. To what extent do you agree or disagree?" +
      "\n\nGive reasons for your answer and include any relevant examples from your own knowledge " +
      "or experience. Write at least 250 words.",
  },
  {
    id: "work-life-balance",
    taskType: "task2",
    title: "Work & society",
    prompt:
      "In some cultures, people are increasingly expected to be available for work outside normal " +
      "working hours. Some people think this improves productivity, while others believe it harms " +
      "well-being. Discuss both views and give your own opinion.\n\nGive reasons for your answer and " +
      "include any relevant examples from your own knowledge or experience. Write at least 250 words.",
  },
  {
    id: "urban-living",
    taskType: "task2",
    title: "Cities",
    prompt:
      "As more and more people move to large cities, some believe governments should focus on " +
      "improving public transport rather than building more roads. To what extent do you agree or " +
      "disagree?\n\nGive reasons for your answer and include any relevant examples from your own " +
      "knowledge or experience. Write at least 250 words.",
  },
];

export function getPublicPrompt(id: string): PublicPrompt | undefined {
  return PUBLIC_PROMPTS.find((p) => p.id === id);
}

// ---- Flexible task resolution ----------------------------------------------
// The public grader can grade against (a) one of the sample questions above, (b)
// the user's OWN pasted question, or (c) no question at all — the visitor just
// wants their writing graded. All three resolve to a { taskType, promptText } the
// grader understands; Task 2 is the only public task.

/** Upper bound on a pasted custom question — bounds cost / abuse. */
export const MAX_PROMPT_CHARS = 1200;

/** Fallback task text when the visitor supplies no question. Keeps grading honest:
 *  the grader is told the specific prompt is unknown and to judge the response on
 *  its own argumentative merits, marking the other three criteria normally. */
const NO_QUESTION_PROMPT_TEXT =
  "(The candidate did not provide the specific Task 2 question.) Grade this as a general IELTS " +
  "Academic Writing Task 2 argumentative essay. Judge Task Response on how clearly it presents and " +
  "develops a position with relevant, extended and well-supported ideas; grade Coherence & " +
  "Cohesion, Lexical Resource and Grammatical Range & Accuracy exactly as normal.";

export interface ResolvedTask {
  taskType: EssayTaskType;
  promptText: string;
}

/**
 * Resolve the task to grade against from the request. Precedence: a non-empty
 * custom question wins; else a valid sample id; else the no-question fallback.
 * Returns null only if a custom question is present but over the length bound.
 */
export function resolveGradeTask(input: {
  promptId?: unknown;
  customPrompt?: unknown;
}): ResolvedTask | null {
  const custom = typeof input.customPrompt === "string" ? input.customPrompt.trim() : "";
  if (custom) {
    if (custom.length > MAX_PROMPT_CHARS) return null;
    return { taskType: "task2", promptText: custom };
  }
  if (typeof input.promptId === "string") {
    const sample = getPublicPrompt(input.promptId);
    if (sample) return { taskType: sample.taskType, promptText: sample.prompt };
  }
  return { taskType: "task2", promptText: NO_QUESTION_PROMPT_TEXT };
}

// ---- Free-preview input bounds ---------------------------------------------
// Floor: too short to grade meaningfully (and a cheap abuse vector). Ceiling: caps
// model cost and nudges full-length writers into the app — both are anti-abuse and
// part of the "don't give everything away" line.
export const MIN_WORDS = 40;
export const MAX_WORDS = 400;

export function countWords(text: string): number {
  const matched = text.trim().match(/\S+/g);
  return matched ? matched.length : 0;
}

/** The seeded marketing org (mirrors 20260617121400_public_grader.sql). All public
 *  grader AI usage is attributed here; it has no members, so RLS hides it. */
export const PUBLIC_ORG_ID = "00000000-0000-4000-a000-000000000001";
