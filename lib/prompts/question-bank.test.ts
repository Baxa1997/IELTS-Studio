/**
 * The public Task 2 question bank — a VIEW of the curated library, and these
 * are the rules that keep it one.
 *
 *  - A topic below the bar gets no page: a two-question page is the thin page
 *    search engines discount, and it would drag the others down with it.
 *  - Every question is the library's text byte for byte, and nothing else: the
 *    library's rule is never to reword a shipped prompt, and a public page
 *    with a tidied copy is a second wording of it.
 *  - The hub is public. Without its PUBLIC_PATHS entry the proxy 307s every
 *    crawler to /sign-in, and the pages exist for crawlers.
 *
 * The rendered pages, the sitemap and llms.txt are pinned beside the route
 * (app/(marketing)/ielts-writing-task-2-questions), because lib/ may not import
 * from app/.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PUBLIC_ROUTES } from "@/lib/seo";

import { TASK2_CATEGORIES } from "./constants";
import type { StarterPrompt } from "./curated/shared";
import {
  BANK_DESCRIPTION,
  BANK_QUESTION_COUNT,
  BANK_TOPICS,
  bankTopics,
  CATEGORY_GUIDE,
  MIN_QUESTIONS_PER_TOPIC,
  QUESTION_BANK_PATH,
  topicDescription,
  topicPath,
} from "./question-bank";
import { STARTER_PROMPTS } from "./starter-set";

/** The library's Task 2 essays per topic, read straight off the set — not
 *  through the bank, which is what is under test. */
const library = new Map<string, string[]>();
for (const p of STARTER_PROMPTS.filter((x) => x.task_type === "task2")) {
  library.set(p.topic_family, [...(library.get(p.topic_family) ?? []), p.prompt_text]);
}

const essay = (topic_family: string, i: number): StarterPrompt => ({
  task_type: "task2",
  category: TASK2_CATEGORIES[i % TASK2_CATEGORIES.length],
  topic_family,
  difficulty: 6,
  prompt_text: `${topic_family} question ${i}. To what extent do you agree or disagree?`,
});

describe("which topics get a page", () => {
  it("is five questions, so a topic one short of it gets none", () => {
    expect(MIN_QUESTIONS_PER_TOPIC).toBe(5);
    const set = [
      ...Array.from({ length: 4 }, (_, i) => essay("short", i)),
      ...Array.from({ length: 5 }, (_, i) => essay("enough", i)),
    ];
    expect(bankTopics(set).map((t) => t.slug)).toEqual(["enough"]);
  });

  it("counts Task 2 essays only — a topic's Task 1 reports do not lift it over the bar", () => {
    const set = [
      ...Array.from({ length: 4 }, (_, i) => essay("mixed", i)),
      { ...essay("mixed", 9), task_type: "task1_academic" as const, category: null },
    ];
    expect(bankTopics(set)).toEqual([]);
  });

  it("gives every library topic with five or more a page, and none of the rest", () => {
    const due = [...library].filter(([, list]) => list.length >= 5).map(([topic]) => topic).sort();
    expect(BANK_TOPICS.map((t) => t.slug).sort()).toEqual(due);
    for (const [topic, list] of library) {
      if (list.length < 5) expect(BANK_TOPICS.find((t) => t.slug === topic), topic).toBeUndefined();
    }
  });

  it("is a real filter on today's library — some topics are left out", () => {
    // Without this the test above passes vacuously once every topic is big.
    expect([...library.values()].some((list) => list.length < 5)).toBe(true);
  });
});

describe("the questions", () => {
  it("are each topic's library prompts, byte for byte — none added, none dropped, none reworded", () => {
    for (const t of BANK_TOPICS) {
      const shown = t.groups.flatMap((g) => g.questions.map((q) => q.text));
      expect([...shown].sort(), t.slug).toEqual([...(library.get(t.slug) ?? [])].sort());
    }
  });

  it("sit under the question type the library gives them", () => {
    for (const t of BANK_TOPICS) {
      for (const g of t.groups) {
        for (const q of g.questions) {
          const source = STARTER_PROMPTS.find((p) => p.prompt_text === q.text);
          expect(source?.category, q.text).toBe(g.category);
        }
      }
    }
  });

  it("are numbered 1…N down the page, so each #q-N anchor and list position is unique", () => {
    for (const t of BANK_TOPICS) {
      expect(t.groups.flatMap((g) => g.questions.map((q) => q.n))).toEqual(Array.from({ length: t.count }, (_, i) => i + 1));
    }
  });

  it("add up to the number the pages quote", () => {
    expect(BANK_QUESTION_COUNT).toBe(BANK_TOPICS.reduce((n, t) => n + t.groups.flatMap((g) => g.questions).length, 0));
  });

  it("have a guide for every question type, so a new type cannot ship without one", () => {
    expect(Object.keys(CATEGORY_GUIDE).sort()).toEqual([...TASK2_CATEGORIES].sort());
  });
});

describe("the descriptions", () => {
  it("fit in a search result (about 160 characters)", () => {
    expect(BANK_DESCRIPTION.length).toBeLessThanOrEqual(160);
    for (const t of BANK_TOPICS) expect(topicDescription(t).length, t.slug).toBeLessThanOrEqual(160);
  });
});

describe("reaching the pages", () => {
  const mw = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");
  const start = mw.indexOf("const PUBLIC_PATHS = [");
  const publicPaths = [...mw.slice(start, mw.indexOf("];", start)).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  /** The proxy's own test: the path itself, or anything under it. */
  const isPublic = (path: string) => publicPaths.some((p) => path === p || path.startsWith(`${p}/`));

  it("is public to a signed-out visitor and a crawler — the hub and every topic", () => {
    expect(publicPaths).toContain(QUESTION_BANK_PATH);
    for (const t of BANK_TOPICS) expect(isPublic(topicPath(t.slug)), t.slug).toBe(true);
  });

  it("lists the hub and every topic as public routes, so the sitemap, llms.txt and robots carry them", () => {
    const routes = PUBLIC_ROUTES.map((r) => r.path as string);
    expect(routes).toContain(QUESTION_BANK_PATH);
    for (const t of BANK_TOPICS) expect(routes).toContain(topicPath(t.slug));
    // …and no page for a topic under the bar.
    const banked = new Set([QUESTION_BANK_PATH, ...BANK_TOPICS.map((t) => topicPath(t.slug))]);
    expect(routes.filter((p) => p.startsWith(`${QUESTION_BANK_PATH}`) && !banked.has(p))).toEqual([]);
  });
});
