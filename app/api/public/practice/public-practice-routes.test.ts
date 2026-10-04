/**
 * The four public marking routes, executed with the list and the data stubbed
 * — because what they must REFUSE is the point of them.
 *
 * ⚠️ THE KEYS, AND THE GRADES, ARE THE ASSET. /api/public/practice/reading
 * reads answer keys with the service role and returns them in the review; the
 * writing route spends a model call. If either served any practice it was
 * handed, a visitor could fetch every key in the library, or run up the bill,
 * by id. What stops that is the check that the practice is on THIS visitor's
 * list today and today's free practice is unused — so that is what these pin.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

type Item = {
  key: string;
  source: string;
  format: "full" | "part" | "task";
  part: number | null;
  paper?: "reading" | "writing" | null;
};
type Entry = { day: string; item: Item; done: boolean };
/** This visitor's list today. `keys` alone offers writing tasks; `items`
 *  offers a practice with its format (a full test, a part). */
const list = vi.hoisted(() => ({ keys: [] as string[], items: [] as Item[], done: false, spentOn: null as string | null }));
const calls = vi.hoisted(() => ({
  engine: [] as unknown[],
  grader: [] as unknown[],
  rate: { allowed: true },
  writingGrade: { gradable: true } as Record<string, unknown>,
}));

vi.mock("@/lib/free-practice/assignment", () => ({
  onTodaysList: async (_skill: string, key: string): Promise<Entry | null> => {
    const item =
      list.items.find((i) => i.key === key) ??
      (list.keys.includes(key) ? { key, source: key, format: "task" as const, part: null } : null);
    return item ? { day: "2026-09-27", item, done: list.done } : null;
  },
}));
vi.mock("@/lib/free-practice/visitor", () => ({
  DONE_COOKIE: "ep_free_done",
  DONE_COOKIE_OPTIONS: {},
  doneToday: async () => new Set(),
  writeDone: () => "signed",
  SPENT_ON_COOKIE: "ep_free_on",
  spentOnToday: async () => list.spentOn,
  writeSpentOn: (_day: string, _skill: string, key: string) => `on-${key}`,
}));
vi.mock("@/lib/free-practice/engine", async (real) => ({
  publicTarget: (await real<typeof import("@/lib/free-practice/engine")>()).publicTarget,
  EngineUnavailable: class extends Error {},
  listeningPublic: async (path: string, body: unknown) => {
    calls.engine.push({ path, body });
    return { score: 1, max_score: 10, results: [] };
  },
  multilevelPublic: async (path: string, body: unknown) => {
    calls.engine.push({ path, body });
    return path === "writing/grade" ? calls.writingGrade : { score: 3, max_score: 35, parts: [] };
  },
}));
vi.mock("@/lib/ai", () => ({
  gradeEssay: async (input: unknown) => {
    calls.grader.push(input);
    return {
      overall_band: 6,
      band_with_fixes: 6.5,
      criteria: {},
      score_blocker: { criterion: "TR", why: "x" },
      annotations: [],
      model: "m",
      disclaimer: "d",
    };
  },
}));
vi.mock("@/lib/public-grader/rate-limit", () => ({
  checkAndRecord: async () => ({ ...calls.rate, reason: "ip", retryAfterSeconds: 60 }),
  clientIp: () => "1.2.3.4",
  hashIp: () => "h",
}));
vi.mock("@/lib/supabase/admin", () => {
  const question = { question_type: "tfng", order_index: 0, prompt: "p", options: null, answer_key: "TRUE", supporting_sentence: "s", explanation: "e" };
  // A test of two passages, one question each; a lone passage is "p1".
  const rows: Record<string, unknown[]> = {
    reading_passages: [
      { id: "pa", title: "A", order_in_test: 1 },
      { id: "pb", title: "B", order_in_test: 2 },
    ],
    reading_questions: [
      { id: "q1", passage_id: "pa", ...question },
      { id: "q2", passage_id: "pb", ...question },
    ],
  };
  const query = (table: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "in", "order"]) q[m] = () => q;
    q.maybeSingle = async () => ({ data: { id: "p1", title: "T", task_type: "task2", prompt_text: "Q?", figure: null } });
    q.then = (res: (v: unknown) => unknown) => res({ data: rows[table] ?? [], error: null });
    return q;
  };
  return { createAdminClient: () => ({ from: (table: string) => query(table) }) };
});

const { POST: reading } = await import("./reading/route");
const { POST: listening } = await import("./listening/route");
const { POST: writing } = await import("./writing/route");
const { POST: cefr } = await import("./cefr/route");

const post = (body: unknown) =>
  new Request("http://x/api", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const essay = Array(60).fill("word").join(" ");

beforeEach(() => {
  list.keys = [];
  list.items = [];
  list.done = false;
  list.spentOn = null;
  calls.engine = [];
  calls.writingGrade = { gradable: true };
  calls.grader = [];
  calls.rate = { allowed: true };
});

describe("/api/public/practice/reading", () => {
  const passage: Item = { key: "p1", source: "p1", format: "part", part: 2 };
  const test: Item = { key: "t1", source: "t1", format: "full", part: null };

  it("refuses a passage that is not on this visitor's list — so no key leaves for it", async () => {
    list.items = [passage];
    const res = await reading(post({ passageId: "some-other-passage", answers: {} }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "not_today" });
  });

  it("refuses once today's free practice is used", async () => {
    list.items = [passage];
    list.done = true;
    expect((await reading(post({ passageId: "p1", answers: {} }))).status).toBe(429);
  });

  it("marks a listed passage and records the day as done", async () => {
    list.items = [passage];
    const res = await reading(post({ passageId: "p1", answers: { q1: "TRUE" } }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { result: { total: number } }).result.total).toBe(2);
    expect(res.headers.get("set-cookie")).toMatch(/ep_free_done=signed/);
  });

  it("marks a listed full test across all its passages", async () => {
    list.items = [test];
    const res = await reading(post({ testId: "t1", answers: { q1: "TRUE", q2: "FALSE" } }));
    expect(res.status).toBe(200);
    const { result } = (await res.json()) as {
      result: { total: number; correctCount: number; passages: { order: number; total: number }[] };
    };
    expect(result.total).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.passages.map((p) => p.order)).toEqual([1, 2]);
    expect(res.headers.get("set-cookie")).toMatch(/ep_free_done=signed/);
  });

  it("marks only in the format the list offers — a passage is never marked as a whole test", async () => {
    // Offered one passage, a visitor must not get a whole test's keys by
    // sending that id as a test — nor the reverse.
    list.items = [passage, test];
    expect((await reading(post({ testId: "p1", answers: {} }))).status).toBe(409);
    expect((await reading(post({ passageId: "t1", answers: {} }))).status).toBe(409);
  });
});

describe("/api/public/practice/listening", () => {
  const part: Item = { key: "0554e1cc-8fd6-4af1_2", source: "0554e1cc-8fd6-4af1", format: "part", part: 2 };
  const whole: Item = { key: "9a1b-44", source: "9a1b-44", format: "full", part: null };

  it("refuses a practice that is not on the list, without asking the engine", async () => {
    list.items = [part];
    expect((await listening(post({ key: "0554e1cc-8fd6-4af1_3", answers: {} }))).status).toBe(409);
    expect(calls.engine).toEqual([]);
  });

  it("refuses once today's free practice is used", async () => {
    list.items = [part];
    list.done = true;
    expect((await listening(post({ key: part.key, answers: {} }))).status).toBe(429);
    expect(calls.engine).toEqual([]);
  });

  it("asks the engine for exactly that part, and records the day as done", async () => {
    list.items = [part];
    const res = await listening(post({ key: part.key, answers: { "11": "x" } }));
    expect(res.status).toBe(200);
    expect(calls.engine).toEqual([
      { path: "grade", body: { library_id: "0554e1cc-8fd6-4af1", part: 2, answers: { "11": "x" } } },
    ]);
    expect(res.headers.get("set-cookie")).toMatch(/ep_free_done=signed/);
  });

  it("asks the engine for the whole test when the list offers a full test", async () => {
    list.items = [whole];
    const res = await listening(post({ key: whole.key, answers: { "31": "y" } }));
    expect(res.status).toBe(200);
    expect(calls.engine).toEqual([{ path: "grade", body: { library_id: "9a1b-44", answers: { "31": "y" } } }]);
  });
});

describe("/api/public/practice/writing", () => {
  it("never grades a prompt that is not on the list", async () => {
    list.keys = ["w1"];
    expect((await writing(post({ promptId: "w2", content: essay }))).status).toBe(409);
    expect(calls.grader).toEqual([]);
  });

  it("never grades once today's free practice is used", async () => {
    list.keys = ["w1"];
    list.done = true;
    expect((await writing(post({ promptId: "w1", content: essay }))).status).toBe(429);
    expect(calls.grader).toEqual([]);
  });

  it("never grades past the per-IP ceiling — the cookie alone could be cleared", async () => {
    list.keys = ["w1"];
    calls.rate = { allowed: false };
    const res = await writing(post({ promptId: "w1", content: essay }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "rate_limited" });
    expect(calls.grader).toEqual([]);
  });

  it("refuses a few words rather than spend a grade on them", async () => {
    list.keys = ["w1"];
    expect((await writing(post({ promptId: "w1", content: "too short" }))).status).toBe(422);
    expect(calls.grader).toEqual([]);
  });

  it("grades with the prompt from the shared set, in the studio's own shape", async () => {
    list.keys = ["w1"];
    const res = await writing(post({ promptId: "w1", content: essay }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { grading: Record<string, unknown>; disclaimer: string };
    expect(Object.keys(body.grading).sort()).toEqual(
      ["annotations", "band_with_fixes", "criteria", "model", "overall_band", "score_blocker"].sort(),
    );
    expect(calls.grader).toHaveLength(1);
    expect((calls.grader[0] as { promptText: string }).promptText).toBe("Q?"); // from the DB, not the body
    expect(res.headers.get("set-cookie")).toMatch(/ep_free_done=signed/);
  });
});

describe("/api/public/practice/cefr", () => {
  const readingPaper: Item = { key: "r1", source: "r1", format: "full", part: null, paper: "reading" };
  const writingPaper: Item = { key: "w1", source: "w1", format: "full", part: null, paper: "writing" };
  const letter = Array(50).fill("word").join(" ");

  it("refuses a paper that is not on the list, without asking the engine", async () => {
    list.items = [readingPaper];
    expect((await cefr(post({ key: "someone-elses-paper", answers: {} }))).status).toBe(409);
    expect(calls.engine).toEqual([]);
  });

  it("marks a listed Reading paper by the list's id, and spends the day on it", async () => {
    list.items = [readingPaper];
    const res = await cefr(post({ key: "r1", answers: { "1": "astronomers", "7": 3 } }));
    expect(res.status).toBe(200);
    expect(calls.engine).toEqual([{ path: "reading/grade", body: { item_id: "r1", answers: { "1": "astronomers" } } }]);
    const cookies = res.headers.get("set-cookie") ?? "";
    expect(cookies).toMatch(/ep_free_done=signed/);
    expect(cookies).toMatch(/ep_free_on=on-r1/);
  });

  it("refuses once today's free practice went on ANOTHER paper", async () => {
    list.items = [readingPaper, writingPaper];
    list.done = true;
    list.spentOn = "r1";
    expect((await cefr(post({ key: "w1", taskId: "1.1", answer: letter }))).status).toBe(429);
    expect(calls.engine).toEqual([]);
  });

  it("but lets the paper the day went on finish — a Writing paper is three tasks", async () => {
    /* Without this the first task's grade would lock out the other two: the
       visitor would get a third of the practice they were given. */
    list.items = [writingPaper];
    list.done = true;
    list.spentOn = "w1";
    const res = await cefr(post({ key: "w1", taskId: "2", answer: letter }));
    expect(res.status).toBe(200);
    expect(calls.engine).toEqual([{ path: "writing/grade", body: { item_id: "w1", task_id: "2", answer: letter } }]);
  });

  it("never grades Writing past the per-IP ceiling — the cookies alone could be cleared", async () => {
    list.items = [writingPaper];
    calls.rate = { allowed: false };
    const res = await cefr(post({ key: "w1", taskId: "1.1", answer: letter }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "rate_limited" });
    expect(calls.engine).toEqual([]);
  });

  it("refuses a few words, or a task the paper does not have, before any model call", async () => {
    list.items = [writingPaper];
    expect((await cefr(post({ key: "w1", taskId: "1.1", answer: "too short" }))).status).toBe(422);
    expect((await cefr(post({ key: "w1", taskId: "3", answer: letter }))).status).toBe(422);
    expect(calls.engine).toEqual([]);
  });

  it("does not spend the day on an answer the grader could not grade", async () => {
    list.items = [writingPaper];
    calls.writingGrade = { gradable: false, message: "off topic" };
    const res = await cefr(post({ key: "w1", taskId: "1.1", answer: letter }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
