import "server-only";

import { randomUUID } from "node:crypto";
import { explainClashes, findClashes, type SlotLike } from "@/lib/console/slot-clash";
import { createClient } from "@/lib/supabase/server";

/* ── when the class meets ─────────────────────────────────────────────────── */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The weekdays ticked on a schedule form, as JS `getDay()` numbers. */
function readWeekdays(formData: FormData): number[] {
  return [
    ...new Set(
      formData
        .getAll("weekdays")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    ),
  ].sort();
}

/**
 * Read a schedule off a form, or `null` when none was filled in.
 *
 * Returns a string when it was filled in WRONGLY, so a half-typed schedule
 * refuses the whole form rather than silently creating a class that meets on no
 * days — the failure a teacher would only notice a week later when the register
 * had nothing to mark.
 */
export function readSchedule(
  formData: FormData,
): { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null } | null | string {
  const weekdays = readWeekdays(formData);
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (weekdays.length === 0 && !startsAt && !endsAt) return null;

  if (weekdays.length === 0) return "Pick the days this group meets.";
  if (!TIME_RE.test(startsAt) || !TIME_RE.test(endsAt)) return "Use times like 15:30.";
  if (endsAt <= startsAt) return "The lesson has to end after it starts.";

  return {
    weekdays,
    startsAt,
    endsAt,
    roomId: String(formData.get("room_id") ?? "").trim() || null,
  };
}

/**
 * Put a class's weekly schedule on the timetable: ONE ROW PER DAY IT MEETS,
 * tied together by a `series_id`.
 *
 * That shape is not incidental — see migration 20260810160000. A single row
 * carrying "Mon/Wed/Fri" was drawn on one day only, so two thirds of a class's
 * lessons were invisible and staff re-added them by hand. The series id is what
 * lets three rows still be edited and deleted as one thing.
 *
 * Reconciles rather than deletes-and-recreates: a day that is still ticked
 * keeps its row, and therefore its `effective_from` and its id. Dropping and
 * re-inserting would silently reset the term on every edit.
 *
 * SCOPED TO ONE SERIES, ALWAYS. A class can legitimately hold several — the
 * live data has one running Tue and Wed at 08:00 AND at 15:30, which is four
 * rows in two independent bookings. An earlier version of this reconciled
 * every slot on the group into a single series and would have deleted three of
 * those four. So `seriesId` is required to edit; omit it and a NEW series is
 * added alongside whatever is already there.
 */
export async function writeSchedule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  groupId: string,
  schedule: { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null },
  seriesIdInput?: string | null,
): Promise<string | null> {
  const seriesId = seriesIdInput || randomUUID();

  // §5/§10: WARN AND BLOCK. The timetable already drew clashes in red, but only
  // when you went to look at the grid — nothing stopped the save. A teacher
  // booked into two rooms at 15:30 is not a display problem; it is two classes
  // turning up and one of them having nobody to teach them.
  //
  // Checked against the whole centre, not this group's own bookings: the room
  // you are taking is taken by somebody else's class, and RLS already limits
  // what this person can see to their own centre.
  const clashError = await refuseOnClash(supabase, groupId, schedule, seriesId);
  if (clashError) return clashError;

  const { data: existingRows, error: readError } = await supabase
    .from("lesson_slots")
    .select("id, weekday, series_id")
    .eq("group_id", groupId)
    .eq("series_id", seriesId);
  if (readError) return readError.message;

  const existing = (existingRows ?? []) as { id: string; weekday: number; series_id: string }[];
  const wanted = new Set(schedule.weekdays);

  const drop = existing.filter((r) => !wanted.has(r.weekday)).map((r) => r.id);
  if (drop.length > 0) {
    const { error } = await supabase.from("lesson_slots").delete().in("id", drop);
    if (error) return error.message;
  }

  const keep = existing.filter((r) => wanted.has(r.weekday));
  if (keep.length > 0) {
    const { error } = await supabase
      .from("lesson_slots")
      .update({ starts_at: schedule.startsAt, ends_at: schedule.endsAt, room_id: schedule.roomId })
      .in(
        "id",
        keep.map((r) => r.id),
      );
    if (error) return error.message;
  }

  const have = new Set(keep.map((r) => r.weekday));
  const add = schedule.weekdays.filter((d) => !have.has(d));
  if (add.length > 0) {
    const { error } = await supabase.from("lesson_slots").insert(
      add.map((weekday) => ({
        organization_id: organizationId,
        group_id: groupId,
        room_id: schedule.roomId,
        series_id: seriesId,
        weekday,
        starts_at: schedule.startsAt,
        ends_at: schedule.endsAt,
      })),
    );
    if (error) return explainSlotError(error);
  }
  return null;
}


/**
 * The save-time half of §5's conflict rule: read what the centre already has,
 * ask the shared rule, and refuse.
 *
 * Returns a sentence to show the user, or null to proceed. Uses the SAME
 * `findClashes` the grid draws with, so "the timetable says this is fine" and
 * "the save says it is not" can never both be true.
 */
async function refuseOnClash(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  schedule: { weekdays: number[]; startsAt: string; endsAt: string; roomId: string | null },
  seriesId: string,
): Promise<string | null> {
  const [{ data: slots }, { data: groups }, { data: rooms }] = await Promise.all([
    supabase.from("lesson_slots").select("id, group_id, series_id, weekday, starts_at, ends_at, room_id"),
    supabase.from("groups").select("id, name, teacher_id"),
    supabase.from("rooms").select("id, name"),
  ]);
  if (!slots?.length) return null;

  const groupById = new Map(
    ((groups ?? []) as { id: string; name: string; teacher_id: string | null }[]).map((g) => [g.id, g]),
  );
  const roomName = new Map(((rooms ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]));

  const existing: SlotLike[] = (slots as Record<string, unknown>[]).map((r) => {
    const g = groupById.get(r.group_id as string);
    return {
      id: r.id as string,
      groupId: r.group_id as string,
      groupName: g?.name,
      seriesId: (r.series_id as string | null) ?? null,
      weekday: Number(r.weekday),
      startsAt: String(r.starts_at).slice(0, 5),
      endsAt: String(r.ends_at).slice(0, 5),
      roomId: (r.room_id as string | null) ?? null,
      roomName: r.room_id ? (roomName.get(r.room_id as string) ?? null) : null,
      teacherId: g?.teacher_id ?? null,
    };
  });

  const mine = groupById.get(groupId);
  const teacherName = mine?.teacher_id
    ? ((
        await supabase.from("profiles").select("full_name").eq("id", mine.teacher_id).maybeSingle()
      ).data?.full_name as string | null)
    : null;

  // Every weekday being saved, because a Mon/Wed/Fri booking can be fine on
  // Monday and collide on Wednesday — and saving two of the three would leave
  // the timetable half-changed.
  const clashes = schedule.weekdays.flatMap((weekday) =>
    findClashes(
      {
        groupId,
        groupName: mine?.name,
        seriesId,
        weekday,
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        roomId: schedule.roomId,
        roomName: schedule.roomId ? (roomName.get(schedule.roomId) ?? null) : null,
        teacherId: mine?.teacher_id ?? null,
        teacherName,
      },
      existing,
    ),
  );

  return clashes.length > 0 ? explainClashes(clashes) : null;
}

/** The two constraints a schedule can trip, in words a teacher can act on. */
function explainSlotError(error: { code?: string; message: string }): string {
  if (error.code === "23P01") {
    return "That clashes with a lesson this group already has at the same hour.";
  }
  if (error.code === "23514" || /branch/i.test(error.message)) {
    return "That room is at a different branch from this group.";
  }
  return error.message;
}
