import { describe, expect, it } from "vitest";

import { figureSchema } from "@/lib/writing/figure";

import { TASK2_CATEGORIES } from "./constants";
import { T1_TAIL } from "./curated/shared";
import { STARTER_PROMPTS, type StarterPrompt } from "./starter-set";

/**
 * The curated practice set is content, but it is content the product parses:
 * the studio draws each figure, the grader reads it as the ground truth a report
 * is marked against, and the letter grader judges tone against the reader the
 * prompt sets up. A wrong number of values in a series, or an essay labelled one
 * question type while asking another, is invisible in review and only surfaces
 * when a learner is marked against it. These tests are that review.
 */

const byTask = (t: StarterPrompt["task_type"]) => STARTER_PROMPTS.filter((p) => p.task_type === t);
const task2 = byTask("task2");
const academic = byTask("task1_academic");
const letters = byTask("task1_general");

/** What each Task 2 shape must ask, in the exam's own wording. */
const CATEGORY_WORDING: Record<string, RegExp> = {
  opinion: /To what extent do you agree or disagree\?$/,
  discussion: /Discuss both (these )?views and give your own opinion\.$/,
  advantages_disadvantages: /outweigh the disadvantages\?$/,
  positive_negative: /positive or (a )?negative development\?$/,
  problem_solution: /\b(solutions?|measures|be done)\b[^?]*\?$/,
  two_part: /\?$/,
};

/** How many questions each shape asks: a discussion instructs, a two-part asks twice. */
const QUESTION_COUNT: Record<string, number> = {
  opinion: 1,
  discussion: 0,
  advantages_disadvantages: 1,
  positive_negative: 1,
  problem_solution: 1,
  two_part: 2,
};

const AXIS_KINDS = new Set(["bar", "grouped_bar", "line"]);

describe("curated writing practice set", () => {
  it("offers at least 150 practices, with every tab stocked", () => {
    expect(STARTER_PROMPTS.length).toBeGreaterThanOrEqual(150);
    expect(task2.length).toBeGreaterThanOrEqual(70);
    expect(academic.length).toBeGreaterThanOrEqual(50);
    expect(letters.length).toBeGreaterThanOrEqual(30);
  });

  it("never repeats a prompt", () => {
    // The top-up script matches rows on prompt_text, so a duplicate would also
    // make it undercount what an org is missing.
    const norm = STARTER_PROMPTS.map((p) =>
      p.prompt_text.toLowerCase().replace(/\s+/g, " ").trim(),
    );
    expect(new Set(norm).size).toBe(norm.length);
  });

  it("pitches every prompt at a band the library's filter offers", () => {
    for (const p of STARTER_PROMPTS) {
      expect(Number.isInteger(p.difficulty), p.prompt_text).toBe(true);
      expect(p.difficulty, p.prompt_text).toBeGreaterThanOrEqual(5);
      expect(p.difficulty, p.prompt_text).toBeLessThanOrEqual(9);
    }
  });

  describe("Task 2", () => {
    it("covers all six question shapes", () => {
      for (const c of TASK2_CATEGORIES) {
        expect(task2.filter((p) => p.category === c).length, c).toBeGreaterThanOrEqual(8);
      }
    });

    it("asks each question shape in the exam's wording", () => {
      for (const p of task2) {
        expect(p.category, p.prompt_text).not.toBeNull();
        const category = p.category as string;
        expect(p.prompt_text, category).toMatch(CATEGORY_WORDING[category]);
        expect((p.prompt_text.match(/\?/g) ?? []).length, `${category}: ${p.prompt_text}`).toBe(
          QUESTION_COUNT[category],
        );
      }
    });

    it("is a single paragraph with no figure", () => {
      for (const p of task2) {
        expect(p.prompt_text, p.prompt_text).not.toContain("\n");
        expect(p.figure).toBeUndefined();
      }
    });
  });

  describe("Academic Task 1", () => {
    it("carries a figure the studio can draw and the grader can read", () => {
      for (const p of academic) {
        const parsed = figureSchema.safeParse(p.figure);
        const why = parsed.success ? "" : parsed.error.issues[0]?.message;
        expect(parsed.success, `${p.prompt_text}\n${why}`).toBe(true);
      }
    });

    it("draws on every figure kind", () => {
      for (const kind of ["bar", "grouped_bar", "line", "pie", "table"]) {
        expect(academic.filter((p) => p.figure?.kind === kind).length, kind).toBeGreaterThanOrEqual(
          5,
        );
      }
    });

    it("names the figure the learner will see and ends with the rubric sentence", () => {
      const LEAD: Record<string, RegExp> = {
        line: /^The line graph below/,
        bar: /^The (bar )?chart below/,
        grouped_bar: /^The (bar )?chart below/,
        pie: /^The pie chart below/,
        table: /^The table below/,
      };
      for (const p of academic) {
        expect(p.prompt_text).toMatch(LEAD[p.figure!.kind]);
        expect(p.prompt_text.endsWith(`\n\n${T1_TAIL}`), p.prompt_text).toBe(true);
        expect(p.category).toBeNull();
      }
    });

    it("keeps x-axis labels short enough not to be cut off", () => {
      // components/writing/figure.tsx truncates an axis label past 12 characters
      // in the in-studio chart: "Electricity" fits, "Electricity bills" would
      // read "Electricity…".
      for (const p of academic) {
        const f = p.figure!;
        if (f.kind !== "bar" && f.kind !== "grouped_bar" && f.kind !== "line") continue;
        for (const c of f.categories) expect(c.length, `${f.title}: ${c}`).toBeLessThanOrEqual(12);
      }
    });

    it("never plots a negative value or names two series the same", () => {
      for (const p of academic) {
        const f = p.figure!;
        if (!AXIS_KINDS.has(f.kind) || !("series" in f)) continue;
        expect(new Set(f.series.map((s) => s.name)).size, f.title).toBe(f.series.length);
        for (const s of f.series)
          for (const v of s.values) expect(v, f.title).toBeGreaterThanOrEqual(0);
      }
    });

    it("has percentage pie charts that add up to 100", () => {
      for (const p of academic) {
        const f = p.figure!;
        if (f.kind !== "pie" || f.unit !== "%") continue;
        const total = f.slices.reduce((n, s) => n + s.value, 0);
        expect(Math.abs(total - 100), f.title).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("General Training letters", () => {
    it("gives a situation, a reader and exactly three bullet points", () => {
      for (const p of letters) {
        expect(p.prompt_text).toMatch(/\n\nWrite a letter to [^.\n]+\. In your letter\n/);
        const bullets = p.prompt_text.split("\n").filter((l) => l.startsWith("• "));
        expect(bullets.length, p.prompt_text).toBe(3);
        expect(p.category).toBeNull();
        expect(p.figure).toBeUndefined();
      }
    });

    it("cues the salutation the reader calls for", () => {
      // The grader caps Task Achievement at 5 when the tone doesn't fit the
      // reader, so a formal situation cued "Dear ...," would teach the wrong
      // letter.
      for (const p of letters) {
        const salutation = p.register === "formal" ? "Dear Sir or Madam," : "Dear ............,";
        expect(
          p.prompt_text.endsWith(`\nBegin your letter as follows:\n${salutation}`),
          p.prompt_text,
        ).toBe(true);
      }
    });

    it("writes every informal letter to a friend", () => {
      for (const p of letters.filter((l) => l.register === "informal")) {
        expect(p.prompt_text).toMatch(/Write a letter to (your|an old|one of the) friends?\b/);
      }
    });

    it("balances formal, semi-formal and informal letters", () => {
      for (const register of ["formal", "semi_formal", "informal"] as const) {
        expect(
          letters.filter((p) => p.register === register).length,
          register,
        ).toBeGreaterThanOrEqual(10);
      }
    });
  });
});
