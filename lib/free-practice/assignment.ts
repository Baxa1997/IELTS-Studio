import "server-only";

import { loadPool, type PoolItem } from "./pools";
import { listIndices, practiceDay, type FreeSkill } from "./rotation";
import { doneToday, visitorId } from "./visitor";

export type { PoolItem } from "./pools";

export interface FreeList {
  day: string;
  /** This visitor's practices, today's new one first — see `listIndices`. */
  items: PoolItem[];
  /** Whether today's one free practice for this skill is already used. */
  done: boolean;
}

/** The list a free-practice page shows this visitor for `skill`. */
export async function practiceList(skill: FreeSkill): Promise<FreeList> {
  const day = practiceDay();
  const [pool, visitor, done] = await Promise.all([loadPool(skill), visitorId(), doneToday(day)]);
  return {
    day,
    items: listIndices(pool.length, visitor, skill, day).map((i) => pool[i]),
    done: done.has(skill),
  };
}

/**
 * The practice `key` from this visitor's list today, or null when it is not on
 * it. What every free runner and marking route checks first.
 *
 * ⚠️ THE LIST IS THE BOUNDARY. The marking routes return answer keys; without
 * this, a visitor could have any practice in the library marked — and so read
 * its keys — by id. With it, they can only reach the twenty on their own list.
 */
export async function onTodaysList(
  skill: FreeSkill,
  key: string,
): Promise<{ day: string; item: PoolItem; done: boolean } | null> {
  const list = await practiceList(skill);
  const item = list.items.find((i) => i.key === key);
  return item ? { day: list.day, item, done: list.done } : null;
}
