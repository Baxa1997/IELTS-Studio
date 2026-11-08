/**
 * The public IELTS Writing Task 2 question bank — the curated practice set's
 * Task 2 essays, grouped by topic and question type, as the pages at
 * /ielts-writing-task-2-questions show them.
 *
 * WHY. A learner asks ChatGPT or Gemini for "Task 2 questions about
 * technology", and the answer quotes whichever page lists them. These are
 * questions we already ship (./starter-set), so the bank is a view of that
 * library, never a second copy: a prompt added there appears here, on the
 * sitemap, in llms.txt and in llms-full.txt with no other edit.
 *
 * ⚠️ THE TEXT IS THE LIBRARY'S, BYTE FOR BYTE. Nothing here trims, retitles or
 * re-punctuates a prompt — the starter set's rule is never to reword a shipped
 * prompt, and a page quoting a "cleaned up" version would be a second wording
 * of it in public. question-bank.test.ts and the page's own test hold this.
 *
 * Every prompt in the set is our own (CLAUDE.md §IP; see the header of
 * ./curated/task2). If one ever arrives that is not, it must not reach this
 * view — the set carries no licence flag today because it has never needed one.
 *
 * Pure and dependency-light on purpose: lib/seo.ts derives the public routes
 * from it, and lib/ may not import from app/.
 */

import { WRITING_TASK } from "@/lib/writing/exam-tasks";

import { TASK2_CATEGORIES, TASK2_CATEGORY_LABELS, type Task2Category } from "./constants";
import { STARTER_PROMPTS, type StarterPrompt } from "./starter-set";

/** The hub page. ⚠️ ALSO SPELLED in PUBLIC_PATHS (lib/supabase/middleware.ts,
 *  which runs on the edge and imports nothing it does not need) — the bank's
 *  test fails if the two drift. */
export const QUESTION_BANK_PATH = "/ielts-writing-task-2-questions";

/**
 * A topic needs this many Task 2 questions for a page of its own.
 *
 * ⚠️ THIN PAGES COST MORE THAN THEY BRING. A "transport questions" page with two
 * questions on it is the kind search engines file as low-value and answer
 * engines skip — and it dilutes the topics that are worth citing. Topics under
 * the bar stay in the library and the free practice; they come onto the site
 * by themselves once the library reaches five.
 */
export const MIN_QUESTIONS_PER_TOPIC = 5;

/**
 * Where "Practise this question free" goes: the free writing checker.
 *
 * ⚠️ NOT THE FREE PRACTICE RUNNER, and that is not an oversight. /write/free/[id]
 * only opens a prompt that is on the visitor's own list for the day (about
 * twenty of the library, rotated per visitor — lib/free-practice/assignment
 * `onTodaysList`, which is also what keeps the marking routes' answer keys
 * fenced) and sends everything else back to /practice/writing. A link from here
 * would land most visitors on a list that does not contain the question they
 * clicked. /grade marks any Task 2 question the visitor pastes, with no account.
 */
export const PRACTISE_HREF = "/grade";

export interface BankQuestion {
  /** The library's prompt_text, untouched. */
  text: string;
  category: Task2Category;
  /** Its position on the topic page, 1-based, in the order the page lists
   *  questions — the page's `#q-N` anchor and the ItemList position. */
  n: number;
}

export interface BankGroup {
  category: Task2Category;
  questions: BankQuestion[];
}

export interface BankTopic {
  /** The library's topic_family — also the URL segment. */
  slug: string;
  /** "Technology" — a heading or a title. */
  label: string;
  /** Question types in TASK2_CATEGORIES order; only those the topic has. */
  groups: BankGroup[];
  count: number;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Task 2 essays only, and only those labelled with a question type (all are —
 *  starter-set.test.ts insists — but a null would have no group to sit in). */
function task2(prompts: readonly StarterPrompt[]) {
  return prompts.filter(
    (p): p is StarterPrompt & { category: Task2Category } => p.task_type === "task2" && p.category !== null,
  );
}

/**
 * The topics with a page, most questions first (ties alphabetical). Each
 * topic's questions keep the library's own order within a type, so the page
 * does not reshuffle when the library grows.
 *
 * Parameterised so the test can feed it a library a topic is short in.
 */
export function bankTopics(
  prompts: readonly StarterPrompt[] = STARTER_PROMPTS,
  min: number = MIN_QUESTIONS_PER_TOPIC,
): BankTopic[] {
  const byTopic = new Map<string, (StarterPrompt & { category: Task2Category })[]>();
  for (const p of task2(prompts)) byTopic.set(p.topic_family, [...(byTopic.get(p.topic_family) ?? []), p]);

  return [...byTopic]
    .filter(([, list]) => list.length >= min)
    .map(([slug, list]) => {
      let n = 0;
      const groups = TASK2_CATEGORIES.map((category) => ({
        category,
        questions: list.filter((p) => p.category === category).map((p) => ({ text: p.prompt_text, category, n: ++n })),
      })).filter((g) => g.questions.length > 0);
      return { slug, label: capitalise(slug), groups, count: list.length };
    })
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export const BANK_TOPICS: readonly BankTopic[] = bankTopics();

/** Every question on the site, across its topics. */
export const BANK_QUESTION_COUNT = BANK_TOPICS.reduce((n, t) => n + t.count, 0);

/** The question types the bank holds, in TASK2_CATEGORIES order. */
export const BANK_CATEGORIES: readonly Task2Category[] = TASK2_CATEGORIES.filter((c) =>
  BANK_TOPICS.some((t) => t.groups.some((g) => g.category === c)),
);

/** How many of the bank's questions are of each type. */
export const bankCountOf = (category: Task2Category) =>
  BANK_TOPICS.reduce((n, t) => n + (t.groups.find((g) => g.category === category)?.questions.length ?? 0), 0);

export const bankTopic = (slug: string) => BANK_TOPICS.find((t) => t.slug === slug);

/** A literal template type, not `string`, so lib/seo can date these pages
 *  (`DatedPath`) without widening the dated paths to any string at all. */
export const topicPath = (slug: string) => `${QUESTION_BANK_PATH}/${slug}` as const;

/** The exam's own length and time for Task 2 — the same numbers the studio and
 *  the checker use. */
export const TASK2_EXAM = WRITING_TASK.task2;

/** "Opinion (agree/disagree)" — the library's own names for the shapes. */
export const categoryLabel = (c: Task2Category) => TASK2_CATEGORY_LABELS[c];

/**
 * How to recognise each question type, and how to approach it — written once
 * per TYPE, never per prompt. A `Record`, so a seventh type cannot be added to
 * the library without a note here.
 *
 * Plain study advice, consistent with what the examiner skill checks (an
 * opinion needs a sustained position, a discussion both views and the writer's
 * own, a two-part question both parts — SKILL.md "On-question" check). It says
 * nothing about how our grader scores, and must not: this copy is public and
 * answer engines repeat it (lib/seo-claims.test.ts reads this file).
 */
export const CATEGORY_GUIDE: Record<Task2Category, { recognise: string; approach: string }> = {
  opinion: {
    recognise: "The question ends “To what extent do you agree or disagree?”",
    approach:
      "Decide how far you agree before you start, say so in the introduction, and keep that position in every paragraph. If you only partly agree, say exactly which part you accept and which you do not. Two or three body paragraphs, each built on one reason that you explain and support with an example, are enough.",
  },
  discussion: {
    recognise: "The question sets out two opposing views and ends “Discuss both views and give your own opinion.”",
    approach:
      "Explain both views fairly, usually one body paragraph each, and give your own opinion clearly: the question asks for it, so state it in the introduction and confirm it in the conclusion. You may side with one view or take a position between them, as long as the reader can tell which.",
  },
  problem_solution: {
    recognise:
      "The question asks for causes or problems, and for solutions or measures — for example “What problems does this cause, and what solutions can you suggest?”",
    approach:
      "Answer exactly the two things the question names. Give each its own paragraph, and tie every solution to a cause or problem you have already described, so the essay reads as one argument rather than two lists.",
  },
  two_part: {
    recognise: "The question asks two separate direct questions, for example “Why is this happening? What can be done about it?”",
    approach:
      "Answer both questions, and give each roughly equal space. A simple plan is one body paragraph per question, with a one-sentence answer to each in the introduction.",
  },
  advantages_disadvantages: {
    recognise: "The question asks whether “the advantages outweigh the disadvantages”.",
    approach:
      "Cover both the advantages and the disadvantages, then say clearly which side you think weighs more — “outweigh” asks for a judgement, not just two lists. State that judgement in the introduction and support it in the conclusion.",
  },
  positive_negative: {
    recognise: "The question asks whether a change or trend is “a positive or negative development”.",
    approach:
      "Say whether you think the development is positive, negative or mixed, and keep to that answer. Support it with reasons and examples; you can acknowledge the other side, but the essay must still answer the question it was asked.",
  },
};

/** What the hub is, in one line — its meta description, and the summary
 *  llms.txt and llms-full.txt give. Kept under ~160 characters, the length a
 *  search result shows. */
export const BANK_DESCRIPTION = `${BANK_QUESTION_COUNT} original IELTS Writing Task 2 practice questions in ${BANK_TOPICS.length} topics, grouped by question type — each one free to practise and have marked.`;

/** A topic page's meta description; held to the same length by the test. */
export const topicDescription = (t: BankTopic) =>
  `${t.label} topic: ${t.count} original IELTS Writing Task 2 practice questions, grouped by question type, with how to approach each type and free marking.`;
