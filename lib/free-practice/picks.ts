import "server-only";

import { practiceList, type PoolItem } from "./assignment";
import { freeRunner, signInFor } from "./links";
import { loadPoolCached } from "./pools";
import { FREE_SKILLS, type FreeSkill } from "./rotation";

/**
 * The landing page's "picked for you" cards: in each free skill, the practice
 * that is THIS visitor's for today — the one their practice page leads with —
 * and only what a card shows. The marking keys never left the pool; `source`
 * (the library id) is not needed on a card, so it is not sent either.
 *
 * Served by GET /api/public/practice/picks and fetched by the browser, so the
 * front door itself stays static (see app/_landing/_components/practice-picks).
 */
export interface PracticePick {
  skill: FreeSkill;
  key: string;
  /** The free runner — the same page the practice list's card opens. */
  href: string;
  /** Where an account brings more, once today's free practice is used. */
  signInHref: string;
  title: string;
  testNo: number;
  paper: PoolItem["paper"];
  format: PoolItem["format"];
  kind: string | null;
  minutes: number;
  questions: number | null;
  /** Today's free practice in this skill is already used. */
  done: boolean;
}

export function toPick(skill: FreeSkill, item: PoolItem, done: boolean): PracticePick {
  return {
    skill,
    key: item.key,
    href: freeRunner(skill, item.key),
    signInHref: signInFor(skill),
    title: item.title,
    testNo: item.testNo,
    paper: item.paper,
    format: item.format,
    kind: item.kind,
    minutes: item.minutes,
    questions: item.questions,
    done,
  };
}

/** One pick per free skill that has practice; a skill with an empty pool is
 *  left out, and its card keeps the generic copy it was rendered with. */
export async function practicePicks(): Promise<PracticePick[]> {
  const lists = await Promise.all(FREE_SKILLS.map((skill) => practiceList(skill, loadPoolCached)));
  return lists.flatMap((list, i) => {
    const lead = list.items[0];
    return lead ? [toPick(FREE_SKILLS[i], lead, list.done)] : [];
  });
}
