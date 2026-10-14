/**
 * The no-login checker's two grading routes, executed with the model, the
 * engine and the database stubbed — because both spend money for anyone who
 * asks, and what they must REFUSE, and in which order, is the point of them.
 *
 * ⚠️ THE ORDER IS THE BUDGET. A request that is out of bounds must be refused
 * before the per-IP ceiling records it (or a typo costs the visitor one of
 * their free grades), and a request over the ceiling must be refused before
 * the model or the engine is called (or the ceiling caps nothing).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { cefrSamplesFor } from "@/lib/public-grader/cefr";
import { promptsFor } from "@/lib/public-grader/prompts";

const calls = vi.hoisted(() => ({
  grader: [] as Record<string, unknown>[],
  engine: [] as { path: string; body: Record<string, unknown> }[],
  rateChecks: 0,
  rate: { allowed: true } as { allowed: boolean },
  engineDown: false,
  engineConfigured: true,
}));

vi.mock("@/lib/ai", () => ({
  gradeEssay: async (input: Record<string, unknown>) => {
    calls.grader.push(input);
    const c = { band: 6, evidence: "e", what_caps_it: "w", fix: "f" };
    return {
      overall_band: 6,
      band_with_fixes: 6.5,
      criteria: { TR: c, CC: c, LR: c, GRA: c },
      score_blocker: { criterion: "TR", why: "x" },
      model: "m",
      disclaimer: "d",
    };
  },
}));
vi.mock("@/lib/public-grader/rate-limit", () => ({
  checkAndRecord: async () => {
    calls.rateChecks += 1;
    return { ...calls.rate, reason: "ip", retryAfterSeconds: 60 };
  },
  clientIp: () => "1.2.3.4",
  hashIp: () => "h",
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/free-practice/engine", () => {
  class EngineUnavailable extends Error {}
  return {
    EngineUnavailable,
    engineConfigured: () => calls.engineConfigured,
    multilevelPublic: async (path: string, body: Record<string, unknown>) => {
      calls.engine.push({ path, body });
      if (calls.engineDown) throw new EngineUnavailable("down");
      return { task_id: body.task_id, gradable: true, estimated_cefr: "B1" };
    },
  };
});

const { POST: ielts } = await import("./route");
const { POST: cefr } = await import("./cefr/route");

const post = (body: unknown) =>
  new Request("http://x/api", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const words = (n: number) => Array(n).fill("word").join(" ");

beforeEach(() => {
  calls.grader = [];
  calls.engine = [];
  calls.rateChecks = 0;
  calls.rate = { allowed: true };
  calls.engineDown = false;
  calls.engineConfigured = true;
});

describe("/api/public/grade — the IELTS tabs", () => {
  it("sends an Academic sample's chart to the grader, as Academic Task 1", async () => {
    const sample = promptsFor("task1_academic")[0];
    const res = await ielts(post({ taskType: "task1_academic", promptId: sample.id, essay: words(160) }));
    expect(res.status).toBe(200);
    expect(calls.grader[0].taskType).toBe("task1_academic");
    expect(String(calls.grader[0].figure)).toContain(sample.figure && "title" in sample.figure ? sample.figure.title : "");
    const { teaser } = await res.json();
    expect(teaser.taskType).toBe("task1_academic");
    expect(teaser.criteria[0].label).toBe("Task Achievement");
  });

  it("grades a pasted letter as General Training, with no chart", async () => {
    await ielts(post({ taskType: "task1_general", customPrompt: "Write to your landlord about a leak.", essay: words(160) }));
    expect(calls.grader[0].taskType).toBe("task1_general");
    expect(calls.grader[0].figure).toBeUndefined();
  });

  it("refuses a too-short answer before the ceiling records it", async () => {
    const res = await ielts(post({ taskType: "task2", essay: words(10) }));
    expect(res.status).toBe(422);
    expect(calls.rateChecks).toBe(0);
    expect(calls.grader).toEqual([]);
  });

  it("calls no model once the ceiling is reached", async () => {
    calls.rate = { allowed: false };
    const res = await ielts(post({ taskType: "task2", essay: words(260) }));
    expect(res.status).toBe(429);
    expect(calls.grader).toEqual([]);
  });
});

describe("/api/public/grade/cefr — the CEFR tab", () => {
  it("grades the visitor's own task through the engine's own-task route", async () => {
    const res = await cefr(post({ task: "1.2", customTask: "Write to the manager about the noise.", answer: words(130) }));
    expect(res.status).toBe(200);
    expect(calls.engine).toEqual([
      { path: "writing/grade-own", body: { task_id: "1.2", task: "Write to the manager about the noise.", answer: words(130) } },
    ]);
    expect((await res.json()).grade.estimated_cefr).toBe("B1");
  });

  it("grades a sample against its own text and task", async () => {
    const sample = cefrSamplesFor("2")[0];
    await cefr(post({ task: "1.1", sampleId: sample.id, answer: words(190) }));
    expect(calls.engine[0].body).toMatchObject({ task_id: "2", task: sample.prompt });
  });

  it.each([
    ["an unknown task", { task: "3", answer: words(50) }, "bad_task"],
    ["a task over the bound", { task: "2", customTask: "x".repeat(1501), answer: words(190) }, "prompt_too_long"],
    ["a too-short answer", { task: "1.1", answer: words(5) }, "too_short"],
    ["a too-long answer", { task: "2", answer: words(601) }, "too_long"],
  ])("refuses %s before the ceiling records it", async (_label, body, error) => {
    const res = await cefr(post(body));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error });
    expect(calls.rateChecks).toBe(0);
    expect(calls.engine).toEqual([]);
  });

  it("calls no engine once the ceiling is reached", async () => {
    calls.rate = { allowed: false };
    const res = await cefr(post({ task: "1.1", answer: words(50) }));
    expect(res.status).toBe(429);
    expect(calls.engine).toEqual([]);
  });

  it("charges no free grade when there is no engine to call", async () => {
    calls.engineConfigured = false;
    const res = await cefr(post({ task: "1.1", answer: words(50) }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
    expect(calls.rateChecks).toBe(0);
  });

  it("says the grader is unavailable when the engine is", async () => {
    calls.engineDown = true;
    const res = await cefr(post({ task: "1.1", answer: words(50) }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });
});
