import type { PoolItem } from "@/lib/free-practice/assignment";
import type { FreeSkill } from "@/lib/free-practice/rotation";

/** One block of the practice list: today's new practice leading it, or not. */
export interface PracticeSection {
  /** CEFR only: which paper the section holds. Null is the whole list. */
  paper: "reading" | "writing" | null;
  /** Today's new practice — in the one section that holds it. */
  lead: PoolItem | null;
  items: PoolItem[];
}

/**
 * The visitor's list as the page lays it out: one section for every skill but
 * CEFR, whose Reading and Writing papers each get their own.
 *
 * ⚠️ THE CEFR POOL IS INTERLEAVED ON PURPOSE (`alternate(reading, writing)` in
 * lib/free-practice/pools), so that every visitor's twenty hold both papers —
 * and laid out as it comes, the list read Reading, Writing, Reading, Writing:
 * "mixed up" (owner, 2026-10-17). The rotation is left alone; only the page
 * groups. The section holding today's new practice comes first, with that
 * practice leading it, so "new today" is still the first thing on the page.
 */
export function practiceSections(skill: FreeSkill, items: PoolItem[]): PracticeSection[] {
  const [lead] = items;
  if (!lead) return [];
  if (skill !== "cefr") return [{ paper: null, lead, items: items.slice(1) }];
  const leadPaper = lead.paper ?? "reading";
  const order =
    leadPaper === "writing" ? (["writing", "reading"] as const) : (["reading", "writing"] as const);
  return order
    .map((paper): PracticeSection => {
      const mine = items.filter((item) => (item.paper ?? "reading") === paper);
      return paper === leadPaper
        ? { paper, lead, items: mine.slice(1) }
        : { paper, lead: null, items: mine };
    })
    .filter((section) => section.lead !== null || section.items.length > 0);
}
