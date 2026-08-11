"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Timetable writes.
 *
 * Authority differs from finance on purpose: a teacher may schedule the classes
 * they own (RLS: `can_manage_group`), because the person who knows when a class
 * meets is the person teaching it. Rooms and branches belong to the center, so
 * only a center_admin creates those.
 *
 * TWO RULES THIS FILE EXISTS TO ENFORCE.
 *
 * 1. A LESSON IS A SERIES. "Mon/Wed/Fri 15:30 in room 2" is one thing the staff
 *    think about, stored as three rows sharing a `series_id`. Every write here
 *    reconciles the whole series, so moving a class an hour later moves all
 *    three days and nobody has to remember the other two.
 *
 * 2. A WRITE THAT CHANGED NOTHING IS AN ERROR, NOT A SUCCESS. PostgREST reports
 *    an update or delete that RLS filtered away as `{ error: null }` with zero
 *    rows — no exception, no warning. Reporting "Saved" on that is how a
 *    timetable quietly stops accepting edits. Every statement below asks for
 *    the affected rows back and says so when none come.
 */

export interface ActionState {
  error?: string;
  ok?: string;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function readWeekdays(formData: FormData): number[] {
  const days = formData
    .getAll("weekdays")
    .map((v) => Number(String(v)))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * Add, move or re-day one lesson.
 *
 * A clash is a WARNING, not a rejection. Centers double-book on purpose — a
 * room split between two small groups, a teacher covering the first half hour —
 * and a scheduler that refuses is a scheduler people stop using. The grid shows
 * the collision instead, in red, on both blocks.
 *
 * The one thing refused outright is the same class twice in the same room at
 * the same hour, which is never a plan; the database refuses it too, via the
 * unique indexes in migration 20260810160000.
 */
export async function saveSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Only staff can edit the timetable." };

  const groupId = str(formData, "group_id");
  if (!groupId) return { error: "Pick a class." };

  const weekdays = readWeekdays(formData);
  if (weekdays.length === 0) return { error: "Pick at least one day." };

  const startsAt = str(formData, "starts_at");
  const endsAt = str(formData, "ends_at");
  if (!TIME.test(startsAt) || !TIME.test(endsAt)) return { error: "Use times like 15:30." };
  if (endsAt <= startsAt) return { error: "The lesson has to end after it starts." };

  const roomId = str(formData, "room_id") || null;
  const seriesId = str(formData, "series_id") || null;

  const supabase = await createClient();

  // ── what is already there ────────────────────────────────────────────────
  let existing: { id: string; weekday: number }[] = [];
  if (seriesId) {
    const { data, error } = await supabase
      .from("lesson_slots")
      .select("id, weekday")
      .eq("series_id", seriesId);
    if (error) return { error: error.message };
    existing = (data ?? []) as { id: string; weekday: number }[];
    if (existing.length === 0) {
      return { error: "That lesson is no longer on the timetable — reload the page." };
    }
  }

  // Another row of THIS class already sitting where we are about to write —
  // excluding our own series, which we are allowed to overwrite.
  const { data: twins } = await supabase
    .from("lesson_slots")
    .select("id, series_id, weekday, starts_at, ends_at, room_id")
    .eq("group_id", groupId)
    .in("weekday", weekdays);
  const duplicate = ((twins ?? []) as Record<string, unknown>[]).find(
    (s) =>
      (s.series_id as string) !== seriesId &&
      String(s.starts_at).slice(0, 5) === startsAt &&
      String(s.ends_at).slice(0, 5) === endsAt &&
      ((s.room_id as string | null) ?? null) === roomId,
  );
  if (duplicate) {
    return { error: "That class is already on the timetable at that hour, in that room." };
  }

  // ── reconcile the series to the days that were ticked ────────────────────
  const wanted = new Set(weekdays);
  const keep = existing.filter((row) => wanted.has(row.weekday));
  const drop = existing.filter((row) => !wanted.has(row.weekday));
  const add = weekdays.filter((day) => !existing.some((row) => row.weekday === day));

  const base = {
    organization_id: profile.organization_id,
    group_id: groupId,
    room_id: roomId,
    starts_at: startsAt,
    ends_at: endsAt,
  };

  if (drop.length > 0) {
    const { data, error } = await supabase
      .from("lesson_slots")
      .delete()
      .in(
        "id",
        drop.map((row) => row.id),
      )
      .select("id");
    if (error) return { error: error.message };
    if ((data ?? []).length === 0) return { error: notAllowed("remove those days from") };
  }

  if (keep.length > 0) {
    const { data, error } = await supabase
      .from("lesson_slots")
      .update(base)
      .in(
        "id",
        keep.map((row) => row.id),
      )
      .select("id");
    if (error) return { error: error.message };
    if ((data ?? []).length === 0) return { error: notAllowed("change") };
  }

  if (add.length > 0) {
    const newSeries = seriesId ?? crypto.randomUUID();
    const { data, error } = await supabase
      .from("lesson_slots")
      .insert(add.map((weekday) => ({ ...base, weekday, series_id: newSeries })))
      .select("id");
    if (error) {
      if (error.code === "23505") {
        return { error: "That class is already on the timetable at that hour, in that room." };
      }
      return { error: error.message };
    }
    if ((data ?? []).length === 0) return { error: notAllowed("add to") };
  }

  revalidatePath("/console/calendar");
  revalidatePath(`/console/groups/${groupId}`);

  const warning = await clashWarning(supabase, { roomId, weekdays, startsAt, endsAt, seriesId });
  const days = weekdays.length === 1 ? "" : ` on ${weekdays.length} days`;
  return { ok: `${seriesId ? "Lesson updated" : "Added to the timetable"}${days}.${warning}` };
}

/**
 * Remove one day of a lesson, or the whole thing.
 *
 * Both are offered because both are real: a class that has stopped meeting on
 * Saturdays is not a class that has stopped.
 */
export async function deleteSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Only staff can edit the timetable." };

  const scope = str(formData, "scope") === "series" ? "series" : "day";
  const id = str(formData, "id");
  const seriesId = str(formData, "series_id");
  if (scope === "series" ? !seriesId : !id) return { error: "Nothing to remove." };

  const supabase = await createClient();
  const { data: doomed } = await supabase
    .from("lesson_slots")
    .select("group_id")
    .eq(scope === "series" ? "series_id" : "id", scope === "series" ? seriesId : id)
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("lesson_slots")
    .delete()
    .eq(scope === "series" ? "series_id" : "id", scope === "series" ? seriesId : id)
    .select("id");
  if (error) return { error: error.message };

  const removed = (data ?? []).length;
  if (removed === 0) return { error: notAllowed("remove from") };

  revalidatePath("/console/calendar");
  if (doomed?.group_id) revalidatePath(`/console/groups/${doomed.group_id as string}`);
  return { ok: removed === 1 ? "Lesson removed." : `Removed all ${removed} days.` };
}

/** Who else wants that room at that hour. Said after the write, never before. */
async function clashWarning(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: {
    roomId: string | null;
    weekdays: number[];
    startsAt: string;
    endsAt: string;
    seriesId: string | null;
  },
): Promise<string> {
  if (!opts.roomId) return "";
  const { data } = await supabase
    .from("lesson_slots")
    .select("series_id, group_id, weekday, starts_at, ends_at")
    .eq("room_id", opts.roomId)
    .in("weekday", opts.weekdays);

  const overlapping = ((data ?? []) as Record<string, unknown>[]).filter((s) => {
    if ((s.series_id as string) === opts.seriesId) return false;
    const from = String(s.starts_at).slice(0, 5);
    const to = String(s.ends_at).slice(0, 5);
    return opts.startsAt < to && from < opts.endsAt;
  });
  if (overlapping.length === 0) return "";

  // Separate lookup, not an embed: lesson_slots → groups is a composite FK and
  // PostgREST cannot join through one (see lib/finance/names.ts).
  const { data: other } = await supabase
    .from("groups")
    .select("name")
    .eq("id", overlapping[0].group_id as string)
    .maybeSingle();
  return ` Note: ${(other?.name as string) ?? "another class"} is already in that room then.`;
}

/** The message for a write RLS silently discarded. */
function notAllowed(verb: string): string {
  return `Nothing changed — you may not ${verb} this class's timetable. Ask the center owner, or reload the page if it was just deleted.`;
}

/* ── branches (filiallar) ─────────────────────────────────────────────────── */

export async function saveBranch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only the center owner can manage branches." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "Give the branch a name." };

  const supabase = await createClient();
  const id = str(formData, "id") || null;
  const payload = {
    organization_id: profile.organization_id,
    name,
    address: str(formData, "address") || null,
    phone: str(formData, "phone") || null,
    active: str(formData, "active") !== "off",
  };

  const { data, error } = id
    ? await supabase.from("branches").update(payload).eq("id", id).select("id")
    : await supabase.from("branches").insert(payload).select("id");
  if (error) {
    if (error.code === "23505") return { error: "There is already a branch with that name." };
    return { error: error.message };
  }
  if ((data ?? []).length === 0) return { error: notAllowed("change") };

  revalidatePath("/console/calendar");
  revalidatePath("/console/finance");
  return { ok: id ? "Branch updated." : `${name} added.` };
}

export async function deleteBranch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") {
    return { error: "Only the center owner can manage branches." };
  }

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to remove." };

  // rooms.branch_id and finance_accounts.branch_id are both ON DELETE SET NULL,
  // so the rooms and the cash desks survive and simply stop belonging to a site.
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").delete().eq("id", id).select("id");
  if (error) return { error: error.message };
  if ((data ?? []).length === 0) return { error: notAllowed("remove from") };

  revalidatePath("/console/calendar");
  revalidatePath("/console/finance");
  return { ok: "Branch removed. Its rooms and desks are now unassigned." };
}

export async function saveRoom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only the center owner can manage rooms." };

  const name = str(formData, "name");
  if (!name) return { error: "Give the room a name." };

  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw === "" ? null : Number(capacityRaw);
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 0)) {
    return { error: "Capacity has to be a whole number." };
  }

  const supabase = await createClient();
  const id = str(formData, "id") || null;
  const payload = {
    organization_id: profile.organization_id,
    name,
    capacity,
    branch_id: str(formData, "branch_id") || null,
    color: str(formData, "color") || null,
    active: str(formData, "active") !== "off",
  };

  const { data, error } = id
    ? await supabase.from("rooms").update(payload).eq("id", id).select("id")
    : await supabase.from("rooms").insert(payload).select("id");
  if (error) {
    if (error.code === "23505") {
      return { error: "That branch already has a room with that name." };
    }
    return { error: error.message };
  }
  if ((data ?? []).length === 0) return { error: notAllowed("change") };

  revalidatePath("/console/calendar");
  return { ok: id ? "Room updated." : `${name} added.` };
}

export async function deleteRoom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only the center owner can manage rooms." };

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to remove." };

  // The FK is ON DELETE SET NULL, so the classes booked into it stay on the
  // timetable and simply lose their room — better than losing the slot.
  const supabase = await createClient();
  const { data, error } = await supabase.from("rooms").delete().eq("id", id).select("id");
  if (error) return { error: error.message };
  if ((data ?? []).length === 0) return { error: notAllowed("remove from") };

  revalidatePath("/console/calendar");
  return { ok: "Room removed. Classes booked in it are now unassigned." };
}
