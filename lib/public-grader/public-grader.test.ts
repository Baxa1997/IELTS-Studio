/**
 * The /grade checker's three tabs — Writing Task 1, Writing Task 2, CEFR
 * Writing — decided here, before any model is called: what each request is
 * graded AS, and against what.
 *
 * ⚠️ THE TASK TYPE IS THE GRADE. The same text graded as Task 2 instead of an
 * Academic Task 1 report, or as a report without its chart, is marked on the
 * wrong descriptors — and nothing downstream can tell. So the rules that pick
 * it are pinned, not left to the tab the browser says it was on.
 */

import { describe, expect, it } from "vitest";

import type { EssayGrade } from "@/lib/ai/schema";
import { parseFigure } from "@/lib/writing/figure";

import {
  CEFR_MAX_TASK_CHARS,
  CEFR_SAMPLES,
  CEFR_TASKS,
  cefrSamplesFor,
  resolveCefrTask,
} from "./cefr";
import { MAX_PROMPT_CHARS, PUBLIC_PROMPTS, PUBLIC_TASK_TYPES, promptsFor, resolveGradeTask } from "./prompts";
import { toPublicTeaser } from "./teaser";

describe("the IELTS samples", () => {
  it("give every task type something to practise on", () => {
    for (const t of PUBLIC_TASK_TYPES) expect(promptsFor(t).length, t).toBeGreaterThan(0);
  });

  it("have unique ids, across the CEFR samples too", () => {
    const ids = [...PUBLIC_PROMPTS.map((p) => p.id), ...CEFR_SAMPLES.map((s) => s.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carry a valid chart on every Academic sample, and on no other", () => {
    for (const p of PUBLIC_PROMPTS) {
      if (p.taskType === "task1_academic") expect(parseFigure(p.figure), p.id).not.toBeNull();
      else expect(p.figure, p.id).toBeUndefined();
    }
  });
});

describe("what an IELTS request is graded as", () => {
  const academic = promptsFor("task1_academic")[0];

  it("grades an Academic sample as Academic Task 1 WITH its chart, whatever tab sent it", () => {
    const r = resolveGradeTask({ promptId: academic.id, taskType: "task2" });
    expect(r?.taskType).toBe("task1_academic");
    expect(r?.promptText).toBe(academic.prompt);
    expect(r?.figure).toEqual(academic.figure);
  });

  it("grades a pasted question as the tab it was written in", () => {
    const r = resolveGradeTask({ customPrompt: "Write a letter to your landlord about a leak.", taskType: "task1_general" });
    expect(r).toEqual({ taskType: "task1_general", promptText: "Write a letter to your landlord about a leak." });
  });

  it("treats a missing or unknown task type as Task 2 — what a page from before the tabs sends", () => {
    expect(resolveGradeTask({ customPrompt: "Discuss both views." })?.taskType).toBe("task2");
    expect(resolveGradeTask({ customPrompt: "Discuss both views.", taskType: "task3" })?.taskType).toBe("task2");
  });

  it("tells the grader the question is missing, as the tab's own task", () => {
    for (const t of PUBLIC_TASK_TYPES) {
      const r = resolveGradeTask({ taskType: t });
      expect(r?.taskType).toBe(t);
      expect(r?.promptText).toMatch(/did not provide/);
      expect(r?.figure).toBeUndefined();
    }
  });

  it("refuses a pasted question over the bound", () => {
    expect(resolveGradeTask({ customPrompt: "x".repeat(MAX_PROMPT_CHARS + 1), taskType: "task2" })).toBeNull();
  });
});

describe("the result's criterion names", () => {
  const criterion = { band: 6, evidence: "", what_caps_it: "", fix: "" };
  const grade = {
    overall_band: 6,
    band_with_fixes: 6.5,
    criteria: { TR: criterion, CC: criterion, LR: criterion, GRA: criterion },
    score_blocker: { criterion: "TR", why: "x" },
    model: "m",
    disclaimer: "d",
  } as unknown as EssayGrade;

  it("call the first criterion what the grader was told to grade it as", () => {
    expect(toPublicTeaser(grade, "task1_academic").criteria[0].label).toBe("Task Achievement");
    expect(toPublicTeaser(grade, "task1_general").criteria[0].label).toBe("Task Achievement");
    expect(toPublicTeaser(grade, "task2").criteria[0].label).toBe("Task Response");
  });
});

describe("what a CEFR request is graded as", () => {
  it("gives every task something to practise on", () => {
    for (const t of CEFR_TASKS) expect(cefrSamplesFor(t.id).length, t.id).toBeGreaterThan(0);
  });

  it("grades a sample as its OWN task, whatever task was sent with it", () => {
    const s = cefrSamplesFor("1.2")[0];
    expect(resolveCefrTask({ task: "2", sampleId: s.id })).toEqual({ task: "1.2", taskText: s.prompt });
  });

  it("grades a pasted task as the task chosen, ahead of any sample id", () => {
    const s = cefrSamplesFor("2")[0];
    expect(resolveCefrTask({ task: "1.1", sampleId: s.id, customTask: "  Write to your cousin.  " })).toEqual({
      task: "1.1",
      taskText: "Write to your cousin.",
    });
  });

  it("sends no task text when the visitor gave none", () => {
    expect(resolveCefrTask({ task: "1.1" })).toEqual({ task: "1.1", taskText: "" });
  });

  it("refuses an unknown task, and a task over the engine's bound", () => {
    expect(resolveCefrTask({ task: "3", customTask: "Write something." })).toBeNull();
    expect(resolveCefrTask({ task: "2", customTask: "x".repeat(CEFR_MAX_TASK_CHARS + 1) })).toBeNull();
  });
});
