/**
 * The pools against a stubbed database — the two things that break without
 * an error:
 *  - a select stops at 1,000 rows, and the library's questions are ~4,500, so
 *    counting them unpaged would quietly drop every passage past the cut;
 *  - "Test N" must be the hub's own number, so a test skipped here must not
 *    renumber the ones after it.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const db = vi.hoisted(() => ({ tables: {} as Record<string, Row[]> }));

vi.mock("react", async (real) => ({ ...(await real<typeof import("react")>()), cache: <T>(fn: T) => fn }));
vi.mock("@/lib/supabase/admin", () => {
  /** Enough of PostgREST: `range` pages, and nothing past 1,000 per response. */
  const query = (table: string) => {
    let from = 0;
    let to = Infinity;
    let count = false;
    const q: Record<string, unknown> = {};
    for (const m of ["eq", "is", "not", "order"]) q[m] = () => q;
    q.select = (_cols: string, opts?: { count?: string }) => ((count = Boolean(opts?.count)), q);
    q.range = (a: number, b: number) => ((from = a), (to = b), q);
    q.then = (res: (v: unknown) => unknown) => {
      const all = db.tables[table] ?? [];
      const page = all.slice(from, Math.min(to + 1, from + 1000));
      return res({ data: page, count: count ? all.length : null, error: null });
    };
    return q;
  };
  return { createAdminClient: () => ({ from: (t: string) => query(t) }) };
});

const { loadPool } = await import("./pools");

/** `n` library tests of three passages, `perPassage` questions each. */
function readingLibrary(n: number, perPassage: number) {
  const tests = Array.from({ length: n }, (_, i) => ({ id: `t${String(i).padStart(3, "0")}`, target_band: 6 }));
  const passages = tests.flatMap((t) =>
    [1, 2, 3].map((o) => ({ id: `${t.id}-p${o}`, test_id: t.id, title: `${t.id} passage ${o}`, topic: "x", difficulty: 5, order_in_test: o })),
  );
  const questions = passages.flatMap((p) =>
    Array.from({ length: perPassage }, (_, k) => ({ id: `${p.id}-q${k}`, passage_id: p.id })),
  );
  return { reading_tests: tests, reading_passages: passages, reading_questions: questions };
}

beforeEach(() => {
  db.tables = {};
});

describe("the reading pool", () => {
  it("counts every question, past the 1,000-row page", async () => {
    db.tables = readingLibrary(30, 13); // 1,170 questions
    const pool = await loadPool("reading");
    const full = pool.filter((i) => i.format === "full");
    expect(full).toHaveLength(30); // the last tests' passages were not cut off
    expect(full.every((i) => i.questions === 39)).toBe(true);
  });

  it("keeps the hub's number for every test, even after it skips a broken one", async () => {
    db.tables = readingLibrary(6, 13);
    // Test 2 loses its questions — it is not a whole test, so it is left out.
    db.tables.reading_questions = db.tables.reading_questions.filter((q) => !String(q.passage_id).startsWith("t001"));
    const pool = await loadPool("reading");
    const numbers = pool.filter((i) => i.format === "full").map((i) => [i.key, i.testNo]);
    expect(numbers).toEqual([
      ["t000", 1],
      ["t002", 3],
      ["t003", 4],
      ["t004", 5],
      ["t005", 6],
    ]);
  });

  it("gives a part its own test's number and its passage's", async () => {
    db.tables = readingLibrary(6, 13);
    const part = (await loadPool("reading")).find((i) => i.format === "part")!;
    expect(part.testNo).toBe(Number(part.key.slice(1, 4)) + 1);
    expect(part.key.endsWith(`-p${part.part}`)).toBe(true);
    expect(part.questions).toBe(13);
  });
});

describe("the listening pool", () => {
  it("numbers the tests in the hub's order — newest format, then easiest, then oldest", async () => {
    const test = (id: string, version: number, difficulty: number, created_at: string) => ({
      id,
      version,
      difficulty,
      created_at,
      t1: "a",
      t2: "b",
      t3: "c",
      t4: "d",
    });
    db.tables.listening_library = [
      test("old-hard", 1, 2, "2026-01-01"),
      test("new-hard", 2, 4, "2026-01-01"),
      test("new-easy-late", 2, 2, "2026-03-01"),
      test("new-easy-early", 2, 2, "2026-02-01"),
    ];
    const full = (await loadPool("listening")).filter((i) => i.format === "full");
    expect(full.map((i) => [i.key, i.testNo])).toEqual([
      ["new-easy-early", 1],
      ["new-easy-late", 2],
      ["new-hard", 3],
      ["old-hard", 4],
    ]);
  });
});
