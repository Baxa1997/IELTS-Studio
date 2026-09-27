/**
 * Which free practice a visitor gets today — pure, so the rule is testable.
 *
 * THE RULE (owner, 2026-09-27): one free Writing, Reading and Listening
 * practice per day, and different visitors get a different mix. So each
 * visitor starts at their own place in each pool (an offset hashed from their
 * visitor id) and moves one step along it every day:
 *
 *     index = (offset(visitor, skill) + dayNumber) mod poolSize
 *
 * Two properties fall out of that, and both are tested:
 *  - one visitor never sees a repeat until they have been through the whole
 *    pool (the index walks it in order);
 *  - two visitors on the same day usually see different practices (their
 *    offsets differ), without anything being stored per visitor.
 *
 * ⚠️ THE DAY IS TASHKENT'S. "Today" turns over at midnight in Uzbekistan, where
 * the audience is — not at midnight UTC, which is 5am there, and not at
 * midnight wherever the server happens to run.
 */

export const FREE_SKILLS = ["writing", "reading", "listening"] as const;
export type FreeSkill = (typeof FREE_SKILLS)[number];

export function isFreeSkill(v: unknown): v is FreeSkill {
  return typeof v === "string" && (FREE_SKILLS as readonly string[]).includes(v);
}

const ZONE = "Asia/Tashkent";

/** Today's date in Tashkent, `YYYY-MM-DD`. */
export function practiceDay(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the key we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Whole days since 1970-01-01 for a `YYYY-MM-DD` key. */
export function dayNumber(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

/** `day`, then the `count - 1` days before it, newest first. */
export function recentDays(day: string, count: number): string[] {
  const base = Date.parse(`${day}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) =>
    new Date(base - i * 86_400_000).toISOString().slice(0, 10),
  );
}

/** FNV-1a, 32-bit — small, stable across runtimes, and well spread. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The index into a pool of `size` that `visitor` gets for `skill` on `day`. */
export function pickIndex(size: number, visitor: string, skill: FreeSkill, day: string): number {
  if (size <= 0) return -1;
  return (hash(`${visitor}:${skill}`) + dayNumber(day)) % size;
}

/**
 * How many practices a free-practice page lists (owner, 2026-09-27: "each
 * practice list must show at least 20"). A pool smaller than this is shown
 * whole rather than padded with repeats.
 */
export const FREE_LIST_SIZE = 20;

/**
 * The indices of the list itself: the visitor's pick for today first (the
 * "New today" card), then the next ones along the pool. Tomorrow the window
 * moves one step, so the list changes by one practice a day, per visitor.
 */
export function listIndices(size: number, visitor: string, skill: FreeSkill, day: string): number[] {
  const start = pickIndex(size, visitor, skill, day);
  if (start < 0) return [];
  return Array.from({ length: Math.min(FREE_LIST_SIZE, size) }, (_, k) => (start + k) % size);
}
