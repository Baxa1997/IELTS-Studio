/**
 * The daily challenge's marking route, with the day and the data stubbed —
 * because what it must REFUSE is the point of it.
 *
 * ⚠️ IT RETURNS ANSWER KEYS. The free-practice routes guard theirs with the
 * visitor's own list (../public-practice-routes.test.ts); this one has no list,
 * only the one passage the day offers. If it marked whatever id it was handed,
 * every key in the library could be read through it.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ marked: [] as string[], recorded: [] as unknown[] }));

vi.mock("@/lib/challenge/daily", () => ({
  todaysChallenge: async () => ({ day: "2026-11-14", item: { key: "today-passage", source: "today-passage" } }),
  challengeToday: async () => ({ challenge: null, board: null }),
  recordScore: async (row: unknown) => void calls.recorded.push(row),
}));
vi.mock("@/lib/reading/mark-library-passage", () => ({
  markLibraryPassage: async (id: string) => {
    calls.marked.push(id);
    return { ok: true, result: { passageTitle: "T", total: 13, correctCount: 9, percent: 69, band: 6, typeBreakdown: {}, items: [] } };
  },
}));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("https://x/api/public/practice/challenge", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  calls.marked.length = 0;
  calls.recorded.length = 0;
});

describe("POST /api/public/practice/challenge", () => {
  it("refuses any passage but today's, before reading anything", async () => {
    const res = await post({ passageId: "some-other-passage", answers: {} });
    expect(res.status).toBe(409);
    expect(calls.marked).toEqual([]);
    expect(calls.recorded).toEqual([]);
  });

  it("refuses a body with no passage", async () => {
    expect((await post({ answers: {} })).status).toBe(409);
    expect(calls.marked).toEqual([]);
  });

  it("marks today's passage and keeps the score the marking gave, not one the browser sent", async () => {
    const res = await post({ passageId: "today-passage", answers: { q1: "A" }, score: 13, durationSeconds: 400.4 });
    expect(res.status).toBe(200);
    expect(calls.marked).toEqual(["today-passage"]);
    expect(calls.recorded).toEqual([
      { day: "2026-11-14", practiceKey: "today-passage", score: 9, total: 13, durationSeconds: 400 },
    ]);
  });
});
