/**
 * Public, no-login essay grader — the marketing funnel.
 *
 * A small curated set of ORIGINAL sample questions for each IELTS task the
 * checker grades — Task 2 essays, Academic Task 1 reports and General Training
 * letters — written by us in IELTS format, on the same conventions as the
 * curated library (fictional places, the real rubric's shape). We never copy
 * from Cambridge/Oxford/Macmillan or official past papers (CLAUDE.md, IP
 * boundaries). This module is PURE (no `server-only`) so the page can render
 * the picker and the route can validate the chosen id — both from one source of
 * truth. The CEFR tab's tasks live beside it in ./cefr.
 */

import type { EssayTaskType } from "@/lib/ai/schema";
import { T1_TAIL } from "@/lib/prompts/curated/shared";
import type { Figure } from "@/lib/writing/figure";

export interface PublicPrompt {
  id: string;
  taskType: EssayTaskType;
  /** Short topic label for the picker chip. */
  title: string;
  /** The full question, shown to the writer and sent to the grader. */
  prompt: string;
  /** Academic Task 1 only: the chart the question is about. Drawn for the
   *  writer, and handed to the grader as text so it can check the numbers. */
  figure?: Figure;
}

/** Every task type the checker grades, in the order its Task 1 toggle shows them. */
export const PUBLIC_TASK_TYPES = ["task1_academic", "task1_general", "task2"] as const satisfies readonly EssayTaskType[];

export function isPublicTaskType(v: unknown): v is EssayTaskType {
  return typeof v === "string" && (PUBLIC_TASK_TYPES as readonly string[]).includes(v);
}

const T1_WORDS = "Write at least 150 words.";

/** An Academic Task 1 sample, in the curated library's shape: the lead, the
 *  rubric's fixed closing sentence, the word count. */
function report(id: string, title: string, lead: string, figure: Figure): PublicPrompt {
  return { id, taskType: "task1_academic", title, prompt: `${lead}\n\n${T1_TAIL}\n\n${T1_WORDS}`, figure };
}

/** A General Training letter: situation, "Write a letter to …. In your letter"
 *  with three bullets, and the salutation cue — the register is never named,
 *  the reader implies it, exactly as in the exam (see curated/task1-general). */
function letter(id: string, title: string, situation: string, reader: string, bullets: [string, string, string], salutation: string): PublicPrompt {
  return {
    id,
    taskType: "task1_general",
    title,
    prompt: [
      situation,
      "",
      `Write a letter to ${reader}. In your letter`,
      ...bullets.map((b) => `• ${b}`),
      "",
      `${T1_WORDS} You do NOT need to write any addresses.`,
      "",
      "Begin your letter as follows:",
      salutation,
    ].join("\n"),
  };
}

export const PUBLIC_PROMPTS: PublicPrompt[] = [
  // ---- Academic Task 1 ------------------------------------------------------
  report(
    "museum-visitors",
    "Museum visitors",
    "The line graph below shows the number of visitors, in thousands, to three museums in the city of Harlow Bay between 2014 and 2024.",
    {
      kind: "line",
      title: "Annual visitors to three museums in Harlow Bay, 2014–2024",
      unit: "k",
      x_label: "Year",
      y_label: "Visitors (thousands)",
      categories: ["2014", "2016", "2018", "2020", "2022", "2024"],
      series: [
        { name: "Science Museum", values: [420, 465, 510, 180, 390, 545] },
        { name: "Art Gallery", values: [310, 300, 285, 95, 240, 270] },
        { name: "Maritime Museum", values: [150, 175, 210, 70, 230, 305] },
      ],
    },
  ),
  report(
    "household-transport",
    "Household transport",
    "The chart below shows the percentage of households in Kestrel County that owned a car, a bicycle and an electric scooter in 2005, 2015 and 2025.",
    {
      kind: "grouped_bar",
      title: "Households owning each type of transport in Kestrel County",
      unit: "%",
      x_label: "Year",
      y_label: "Households (%)",
      categories: ["2005", "2015", "2025"],
      series: [
        { name: "Car", values: [78, 74, 66] },
        { name: "Bicycle", values: [41, 52, 58] },
        { name: "Electric scooter", values: [0, 6, 23] },
      ],
    },
  ),
  report(
    "food-budget",
    "Food spending",
    "The pie chart below shows how the average household in the town of Wrenfield divided its weekly food budget in 2024.",
    {
      kind: "pie",
      title: "Average weekly food budget in Wrenfield, 2024",
      unit: "%",
      slices: [
        { label: "Fresh produce", value: 24 },
        { label: "Meat and fish", value: 21 },
        { label: "Eating out", value: 18 },
        { label: "Ready meals", value: 14 },
        { label: "Dairy and eggs", value: 12 },
        { label: "Bread and cereals", value: 11 },
      ],
    },
  ),

  // ---- General Training Task 1 ----------------------------------------------
  letter(
    "lost-item-hotel",
    "Left at a hotel",
    "You recently stayed at a hotel for two nights, and you think you left something valuable in your room.",
    "the hotel manager",
    ["describe the item you left behind", "explain where in the room you think you left it", "say how you would like the hotel to return it"],
    "Dear Sir or Madam,",
  ),
  letter(
    "noisy-neighbour",
    "Building work next door",
    "Your neighbour is having building work done on their house, and the noise starts very early every morning.",
    "your neighbour",
    ["describe the problem", "explain how it is affecting you", "suggest what your neighbour could do"],
    "Dear ............,",
  ),
  letter(
    "friend-visit",
    "A friend's visit",
    "A friend who lives in another country is planning to spend a week in your city next month.",
    "your friend",
    ["recommend some places to visit", "suggest where your friend could stay", "offer to spend some time together"],
    "Dear ............,",
  ),

  // ---- Task 2 ---------------------------------------------------------------
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

/** The samples a task type's picker offers. */
export function promptsFor(taskType: EssayTaskType): PublicPrompt[] {
  return PUBLIC_PROMPTS.filter((p) => p.taskType === taskType);
}

// ---- Flexible task resolution ----------------------------------------------
// The public grader can grade against (a) one of the sample questions above, (b)
// the user's OWN pasted question, or (c) no question at all — the visitor just
// wants their writing graded. All three resolve to a { taskType, promptText } the
// grader understands.

/** Upper bound on a pasted custom question — bounds cost / abuse. */
export const MAX_PROMPT_CHARS = 1200;

/** Fallback task text when the visitor supplies no question. Keeps grading honest:
 *  the grader is told the specific prompt is unknown and to judge the response on
 *  its own merits as that task type, marking the other three criteria normally.
 *  Academic Task 1 says so out loud: with no figure, the data cannot be checked. */
const NO_QUESTION_PROMPT_TEXT: Record<EssayTaskType, string> = {
  task2:
    "(The candidate did not provide the specific Task 2 question.) Grade this as a general IELTS " +
    "Academic Writing Task 2 argumentative essay. Judge Task Response on how clearly it presents and " +
    "develops a position with relevant, extended and well-supported ideas; grade Coherence & " +
    "Cohesion, Lexical Resource and Grammatical Range & Accuracy exactly as normal.",
  task1_academic:
    "(The candidate did not provide the question or the figure it describes.) Grade this as an " +
    "IELTS Academic Writing Task 1 report. The data cannot be checked, so judge Task Achievement on " +
    "whether it gives a clear overview, selects and reports the key features, and makes relevant " +
    "comparisons; grade Coherence & Cohesion, Lexical Resource and Grammatical Range & Accuracy " +
    "exactly as normal.",
  task1_general:
    "(The candidate did not provide the specific Task 1 question.) Grade this as an IELTS General " +
    "Training Writing Task 1 letter. Judge Task Achievement on whether its purpose is clear, it " +
    "covers what such a letter needs, and its tone fits the reader it addresses; grade Coherence & " +
    "Cohesion, Lexical Resource and Grammatical Range & Accuracy exactly as normal.",
};

export interface ResolvedTask {
  taskType: EssayTaskType;
  promptText: string;
  /** An Academic Task 1 sample's chart — see `PublicPrompt.figure`. */
  figure?: Figure;
}

/**
 * Resolve the task to grade against from the request. Precedence: a non-empty
 * custom question wins; else a valid sample id; else the no-question fallback.
 * Returns null only if a custom question is present but over the length bound.
 *
 * `taskType` is the tab the visitor wrote in; anything unknown is Task 2, which
 * is also what a page opened before the tabs existed sends (nothing at all).
 *
 * ⚠️ A SAMPLE'S OWN TYPE WINS OVER THE TAB'S. An Academic sample is graded as
 * Academic Task 1 WITH its chart whatever the request claims, because the
 * chart is the ground truth Task Achievement is checked against — grading the
 * report as an essay, or without the figure, would mark it on the wrong task.
 */
export function resolveGradeTask(input: {
  promptId?: unknown;
  customPrompt?: unknown;
  taskType?: unknown;
}): ResolvedTask | null {
  const taskType: EssayTaskType = isPublicTaskType(input.taskType) ? input.taskType : "task2";
  const custom = typeof input.customPrompt === "string" ? input.customPrompt.trim() : "";
  if (custom) {
    if (custom.length > MAX_PROMPT_CHARS) return null;
    return { taskType, promptText: custom };
  }
  if (typeof input.promptId === "string") {
    const sample = getPublicPrompt(input.promptId);
    if (sample) {
      return {
        taskType: sample.taskType,
        promptText: sample.prompt,
        ...(sample.figure ? { figure: sample.figure } : {}),
      };
    }
  }
  return { taskType, promptText: NO_QUESTION_PROMPT_TEXT[taskType] };
}

// ---- Free-preview input bounds ---------------------------------------------
// Floor: too short to grade meaningfully (and a cheap abuse vector). Ceiling: caps
// model cost and nudges full-length writers into the app — both are anti-abuse and
// part of the "don't give everything away" line. The same for Task 1 and Task 2:
// 400 is above any real answer to either.
export const MIN_WORDS = 40;
export const MAX_WORDS = 400;

export function countWords(text: string): number {
  const matched = text.trim().match(/\S+/g);
  return matched ? matched.length : 0;
}

/** The seeded marketing org (mirrors 20260617121400_public_grader.sql). All public
 *  grader AI usage is attributed here; it has no members, so RLS hides it. */
export const PUBLIC_ORG_ID = "00000000-0000-4000-a000-000000000001";
