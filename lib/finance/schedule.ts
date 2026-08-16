import "server-only";

import { createClient } from "@/lib/supabase/server";

import { monthEnd, monthStart } from "./period";
import { lessonDatesInMonth, type LessonSlotLite } from "./tuition";

/**
 * The bridge between the timetable and the money: how many times each group
 * actually met in a month.
 *
 * This is the whole reason proration can be honest. The center already books
 * every lesson into a room (`lesson_slots`, one row per weekday since
 * 20260810160000), so nobody has to type "12 lessons" anywhere — a Mon/Wed/Fri
 * group simply produces 13 dates in a long month and 12 in a short one, and a
 * course that ended in July produces none in August.
 *
 * LESSONS THAT DID NOT HAPPEN ARE SUBTRACTED. A cancelled lesson and a day the
 * center was shut both come out of this list, which means they come out of the
 * fee divisor and out of every payslip built on it. Without that, the first time
 * a teacher is ill the center charges a full month for eleven lessons and pays
 * a full month for eleven lessons taught — and finds out from a parent.
 *
 * One query set for every group at once: a month of invoices touches every group
 * in the center, and asking per group was a round trip per row.
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
  const [{ data }, { data: cancelled }, { data: holidays }] = await Promise.all([
    supabase
      .from("lesson_slots")
      .select("group_id, weekday, effective_from, effective_to")
      .in("group_id", groupIds)
      // A booking is relevant to this month if its run overlaps the month at all.
      .lte("effective_from", to)
      .or(`effective_to.is.null,effective_to.gte.${from}`),
    supabase
      .from("lesson_cancellations")
      .select("group_id, held_on")
      .in("group_id", groupIds)
      .gte("held_on", from)
      .lte("held_on", to),
    supabase
      .from("center_holidays")
      .select("starts_on, ends_on")
      .lte("starts_on", to)
      .gte("ends_on", from),
  ]);

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

  // Per group, and center-wide. A holiday closes everyone; a cancellation is
  // one group's Tuesday.
  const skipOf = new Map<string, Set<string>>();
  for (const c of (cancelled ?? []) as { group_id: string; held_on: string }[]) {
    const gid = c.group_id;
    if (!skipOf.has(gid)) skipOf.set(gid, new Set());
    skipOf.get(gid)!.add(String(c.held_on).slice(0, 10));
  }
  const shut = ((holidays ?? []) as Record<string, unknown>[]).map((h) => ({
    startsOn: String(h.starts_on).slice(0, 10),
    endsOn: String(h.ends_on).slice(0, 10),
  }));
  const isShut = (date: string) => shut.some((h) => h.startsOn <= date && date <= h.endsOn);

  for (const [gid, slots] of byGroup) {
    const skip = skipOf.get(gid);
    out.set(
      gid,
      lessonDatesInMonth(slots, month).filter((d) => !skip?.has(d) && !isShut(d)),
    );
  }
  return out;
}

/** One class's lesson dates — the group page and the fee preview. */
export async function loadLessonDatesFor(groupId: string, month: string): Promise<string[]> {
  return (await loadLessonDates([groupId], month)).get(groupId) ?? [];
}
