/**
 * The three public marking routes, executed with the list and the data stubbed
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

type Entry = { day: string; item: { key: string }; done: boolean };
const list = vi.hoisted(() => ({ keys: [] as string[], done: false }));
const calls = vi.hoisted(() => ({ engine: [] as unknown[], grader: [] as unknown[], rate: { allowed: true } }));

vi.mock("@/lib/free-practice/assignment", () => ({
  onTodaysList: async (_skill: string, key: string): Promise<Entry | null> =>
    list.keys.includes(key) ? { day: "2026-09-27", item: { key }, done: list.done } : null,
}));
vi.mock("@/lib/free-practice/visitor", () => ({
  DONE_COOKIE: "ep_free_done",
  DONE_COOKIE_OPTIONS: {},
  doneToday: async () => new Set(),
  writeDone: () => "signed",
}));
vi.mock("@/lib/free-practice/engine", () => ({
  EngineUnavailable: class extends Error {},
  listeningPublic: async (path: string, body: unknown) => {
    calls.engine.push({ path, body });
    return { score: 1, max_score: 10, results: [] };
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
  const rows = [
    { id: "q1", question_type: "tfng", order_index: 0, prompt: "p", options: null, answer_key: "TRUE", supporting_sentence: "s", explanation: "e" },
  ];
  const query = () => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "order"]) q[m] = () => q;
    q.maybeSingle = async () => ({ data: { id: "p1", title: "T", task_type: "task2", prompt_text: "Q?", figure: null } });
    q.then = (res: (v: unknown) => unknown) => res({ data: rows, error: null });
    return q;
  };
  return { createAdminClient: () => ({ from: () => query() }) };
});

const { POST: reading } = await import("./reading/route");
const { POST: listening } = await import("./listening/route");
const { POST: writing } = await import("./writing/route");

const post = (body: unknown) =>
  new Request("http://x/api", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const essay = Array(60).fill("word").join(" ");

beforeEach(() => {
  list.keys = [];
  list.done = false;
  calls.engine = [];
  calls.grader = [];
  calls.rate = { allowed: true };
});

describe("/api/public/practice/reading", () => {
  it("refuses a passage that is not on this visitor's list — so no key leaves for it", async () => {
    list.keys = ["p1"];
    const res = await reading(post({ passageId: "some-other-passage", answers: {} }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "not_today" });
  });

  it("refuses once today's free practice is used", async () => {
    list.keys = ["p1"];
    list.done = true;
    expect((await reading(post({ passageId: "p1", answers: {} }))).status).toBe(429);
  });

  it("marks a listed passage and records the day as done", async () => {
    list.keys = ["p1"];
    const res = await reading(post({ passageId: "p1", answers: { q1: "TRUE" } }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { result: { total: number } }).result.total).toBe(1);
    expect(res.headers.get("set-cookie")).toMatch(/ep_free_done=signed/);
  });
});

describe("/api/public/practice/listening", () => {
  it("refuses a part that is not on the list, without asking the engine", async () => {
    list.keys = ["lib_2"];
    expect((await listening(post({ key: "lib_3", answers: {} }))).status).toBe(409);
    expect(calls.engine).toEqual([]);
  });

  it("refuses once today's free practice is used", async () => {
    list.keys = ["lib_2"];
    list.done = true;
    expect((await listening(post({ key: "lib_2", answers: {} }))).status).toBe(429);
    expect(calls.engine).toEqual([]);
  });

  it("asks the engine for exactly that part, and records the day as done", async () => {
    // A real library id is a UUID — hyphens, never an underscore — so the last
    // underscore is the part, even with hyphens before it.
    list.keys = ["0554e1cc-8fd6-4af1_2"];
    const res = await listening(post({ key: "0554e1cc-8fd6-4af1_2", answers: { "11": "x" } }));
    expect(res.status).toBe(200);
    expect(calls.engine).toEqual([
      { path: "grade", body: { library_id: "0554e1cc-8fd6-4af1", part: 2, answers: { "11": "x" } } },
    ]);
    expect(res.headers.get("set-cookie")).toMatch(/ep_free_done=signed/);
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
