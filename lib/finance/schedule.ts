import "server-only";

import { createClient } from "@/lib/supabase/server";

import { monthEnd, monthStart } from "./period";
import { lessonDatesInMonth, type LessonSlotLite } from "./tuition";

/**
 * The bridge between the timetable and the money: how many times each class
 * actually met in a month.
 *
 * This is the whole reason proration can be honest. The center already books
 * every lesson into a room (`lesson_slots`, one row per weekday since
 * 20260810160000), so nobody has to type "12 lessons" anywhere — a Mon/Wed/Fri
 * class simply produces 13 dates in a long month and 12 in a short one, and a
 * course that ended in July produces none in August.
 *
 * One query for every class at once: a month of invoices touches every group in
 * the center, and asking per class was a round trip per row.
 */
export async function loadLessonDates(
  groupIds: string[],
  month: string,
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>(groupIds.map((id) => [id, []]));
  if (groupIds.length === 0) return out;

  const from = monthStart(month);
  const to = monthEnd(from);

  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_slots")
    .select("group_id, weekday, effective_from, effective_to")
    .in("group_id", groupIds)
    // A booking is relevant to this month if its run overlaps the month at all.
    .lte("effective_from", to)
    .or(`effective_to.is.null,effective_to.gte.${from}`);

  const byGroup = new Map<string, LessonSlotLite[]>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const gid = row.group_id as string;
    if (!byGroup.has(gid)) byGroup.set(gid, []);
    byGroup.get(gid)!.push({
      weekday: Number(row.weekday),
      effectiveFrom: String(row.effective_from ?? from).slice(0, 10),
      effectiveTo: row.effective_to ? String(row.effective_to).slice(0, 10) : null,
    });
  }

  for (const [gid, slots] of byGroup) out.set(gid, lessonDatesInMonth(slots, month));
  return out;
}

/** One class's lesson dates — the group page and the fee preview. */
export async function loadLessonDatesFor(groupId: string, month: string): Promise<string[]> {
  return (await loadLessonDates([groupId], month)).get(groupId) ?? [];
}
