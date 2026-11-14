import { describe, expect, it } from "vitest";

import { BOARD_SIZE, challengeIndex, MIN_BOARD_PLAYERS, nicknameFor, publicBoard, rankBoard, type ScoreRow } from "./board";

const row = (n: number, score: number, at: string): ScoreRow => ({
  visitor_hash: `hash-${n}`,
  nickname: `Player ${n}`,
  score,
  total: 13,
  created_at: at,
});

describe("the daily challenge's board", () => {
  it("ranks by score, then by who finished first", () => {
    const ranked = rankBoard([
      row(1, 9, "2026-11-14T08:00:00Z"),
      row(2, 12, "2026-11-14T10:00:00Z"),
      row(3, 12, "2026-11-14T09:00:00Z"),
    ]);
    expect(ranked.map((r) => r.visitor_hash)).toEqual(["hash-3", "hash-2", "hash-1"]);
  });

  /**
   * THE EMPTY-ROOM RULE. Below the minimum, nothing about the other players
   * leaves the server — not their rows, not how few they are.
   */
  it("stays closed, and says nothing of the others, until enough have played", () => {
    const few = Array.from({ length: MIN_BOARD_PLAYERS - 1 }, (_, i) => row(i, 10 - i, `2026-11-14T0${i}:00:00Z`));
    const board = publicBoard(few, "hash-1");
    expect(board.open).toBe(false);
    expect(board.entries).toEqual([]);
    expect(board.players).toBeNull();
    // The visitor still sees their own score — but no rank, which would count the room.
    expect(board.you).toEqual({ rank: null, score: 9, total: 13 });
  });

  it("opens at the minimum, lists the top rows and marks the viewer's own", () => {
    const many = Array.from({ length: BOARD_SIZE + 3 }, (_, i) => row(i, 13 - (i % 13), `2026-11-14T00:${String(i).padStart(2, "0")}:00Z`));
    const board = publicBoard(many, "hash-12");
    expect(board.open).toBe(true);
    expect(board.players).toBe(BOARD_SIZE + 3);
    expect(board.entries).toHaveLength(BOARD_SIZE);
    expect(board.entries.map((e) => e.rank)).toEqual(Array.from({ length: BOARD_SIZE }, (_, i) => i + 1));
    // Outside the listed rows, the viewer still learns their place.
    const mine = rankBoard(many).findIndex((r) => r.visitor_hash === "hash-12") + 1;
    expect(board.you?.rank).toBe(mine);
  });

  it("never sends a visitor's hash to the page", () => {
    const many = Array.from({ length: MIN_BOARD_PLAYERS }, (_, i) => row(i, i, `2026-11-14T0${i}:00:00Z`));
    expect(JSON.stringify(publicBoard(many, "hash-0"))).not.toContain("hash-");
  });

  it("names a visitor the same way every time, and never by the hash itself", () => {
    const hash = "a3f19c0d77e2b4c8";
    expect(nicknameFor(hash)).toBe(nicknameFor(hash));
    expect(nicknameFor(hash)).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ \d{2}$/);
    expect(nicknameFor(hash)).not.toContain(hash.slice(0, 6));
  });

  it("gives everyone the same passage on a day and the next one the day after", () => {
    expect(challengeIndex(7, 20_000)).toBe(challengeIndex(7, 20_000));
    expect(challengeIndex(7, 20_001)).toBe((challengeIndex(7, 20_000) + 1) % 7);
    expect(challengeIndex(0, 20_000)).toBe(-1);
  });
});
