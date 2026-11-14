/**
 * The daily challenge's board — the pure half: who is called what, who ranks
 * where, and when a board is shown at all. No I/O, so the rules are tested.
 */

/** Where the challenge is sat, and where the landing page keeps its board.
 *  Here, in the pure module, because the landing page's client island needs
 *  them and `daily.ts` is server-only. */
export const CHALLENGE_PATH = "/read/free/challenge";
export const CHALLENGE_ANCHOR = "daily-challenge";

/**
 * ⚠️ A BOARD WITH NOBODY ON IT IS WORSE THAN NO BOARD. On a quiet day three
 * names under "Today's board" tell a visitor the site is empty — the opposite
 * of what a leaderboard is for. So below this many players the page shows the
 * challenge and says the board opens at N, and no row or count leaves the
 * server (`publicBoard`).
 */
export const MIN_BOARD_PLAYERS = 5;

/** How many rows the landing page lists. */
export const BOARD_SIZE = 10;

export interface ScoreRow {
  visitor_hash: string;
  nickname: string;
  score: number;
  total: number;
  created_at: string;
}

export interface BoardEntry {
  rank: number;
  nickname: string;
  score: number;
  total: number;
  you: boolean;
}

export interface PublicBoard {
  /** False until `MIN_BOARD_PLAYERS` have played; then `entries` and `players` are real. */
  open: boolean;
  /** How many must play before the board opens — for the page's own sentence. */
  opensAt: number;
  players: number | null;
  entries: BoardEntry[];
  /** This visitor's own first attempt today, whether or not the board is open. */
  you: { rank: number | null; score: number; total: number } | null;
}

const ADJECTIVES = [
  "Quick", "Calm", "Bright", "Bold", "Clever", "Steady", "Sharp", "Swift",
  "Keen", "Brave", "Patient", "Curious", "Careful", "Lively", "Quiet", "Eager",
];
const ANIMALS = [
  "Falcon", "Otter", "Heron", "Lynx", "Panda", "Fox", "Crane", "Tiger",
  "Dolphin", "Owl", "Eagle", "Koala", "Wolf", "Swan", "Bear", "Hawk",
];

/**
 * The name the board shows for a visitor: "Quick Falcon 42". Derived from the
 * visitor's HASH, so it is the same every day without anything being stored
 * about them, and it is never a person's name — the board is public, and a
 * visitor has given no consent to appear on it as themselves.
 */
export function nicknameFor(visitorHash: string): string {
  const n = (from: number) => Number.parseInt(visitorHash.slice(from, from + 4), 16) || 0;
  return `${ADJECTIVES[n(0) % ADJECTIVES.length]} ${ANIMALS[n(4) % ANIMALS.length]} ${10 + (n(8) % 90)}`;
}

/**
 * Best score first; among equals, whoever finished FIRST.
 *
 * ⚠️ NOT THE FASTEST. Time taken is reported by the browser, so ranking on it
 * would hand the top of the board to anyone who posts "1 second". When a row
 * arrived is the server's own clock.
 */
export function rankBoard(rows: ScoreRow[]): ScoreRow[] {
  return [...rows].sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
}

/** What may leave the server for `viewerHash` — never a hash, and no rows or
 *  count while the board is closed. */
export function publicBoard(rows: ScoreRow[], viewerHash: string | null): PublicBoard {
  const ranked = rankBoard(rows);
  const mine = viewerHash ? ranked.findIndex((r) => r.visitor_hash === viewerHash) : -1;
  const open = ranked.length >= MIN_BOARD_PLAYERS;
  const you =
    mine < 0 ? null : { rank: open ? mine + 1 : null, score: ranked[mine].score, total: ranked[mine].total };
  if (!open) return { open, opensAt: MIN_BOARD_PLAYERS, players: null, entries: [], you };
  return {
    open,
    opensAt: MIN_BOARD_PLAYERS,
    players: ranked.length,
    entries: ranked.slice(0, BOARD_SIZE).map((r, i) => ({
      rank: i + 1,
      nickname: r.nickname,
      score: r.score,
      total: r.total,
      you: i === mine,
    })),
    you,
  };
}

/**
 * Which item of `size` challenge candidates is today's: the same for everyone,
 * one step along the list each day, so a passage does not repeat until the
 * whole list has been through.
 */
export function challengeIndex(size: number, dayNumber: number): number {
  return size <= 0 ? -1 : ((dayNumber % size) + size) % size;
}
