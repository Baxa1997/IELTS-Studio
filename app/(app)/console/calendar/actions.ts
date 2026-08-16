"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { WEEKDAYS } from "@/lib/console/timetable-days";
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
 * The one thing refused outright is a class booked over itself, which is never
 * a plan. The database refuses it too — an EXCLUDE constraint over (class, day,
 * overlapping hours) added in 20260810170000 — so it cannot arrive by any other
 * route either. A room at a different branch from the class is likewise refused
 * by a trigger; the form only offers rooms at the right branch, so nobody
 * should ever see it.
 */
export async function saveSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Only staff can edit the timetable." };

  const groupId = str(formData, "group_id");
  if (!groupId) return { error: "Pick a group." };

  const weekdays = readWeekdays(formData);
  if (weekdays.length === 0) return { error: "Pick at least one day." };

  const startsAt = str(formData, "starts_at");
  const endsAt = str(formData, "ends_at");
  if (!TIME.test(startsAt) || !TIME.test(endsAt)) return { error: "Use times like 15:30." };
  if (endsAt <= startsAt) return { error: "The lesson has to end after it starts." };

  const roomId = str(formData, "room_id") || null;
  const seriesId = str(formData, "series_id") || null;

  // The term. `effective_to` is what lets the week picker mean something: a
  // course that finished stops appearing in later weeks instead of being
  // deleted, so last term's timetable survives to be looked at.
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const effectiveFrom = str(formData, "effective_from");
  const effectiveTo = str(formData, "effective_to") || null;
  if (effectiveFrom && !DATE.test(effectiveFrom)) return { error: "Use a date like 2026-09-01." };
  if (effectiveTo && !DATE.test(effectiveTo)) return { error: "Use a date like 2026-12-31." };
  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
    return { error: "The lesson cannot stop before it starts." };
  }

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

  // ── the one thing that is never a plan ───────────────────────────────────
  // A class cannot be in two places at once. Two DIFFERENT classes sharing a
  // room is a warning (centers split rooms on purpose); the same class booked
  // over itself is a mistake every time, whether the second booking is in the
  // same room or another one. Checked against overlapping hours, not identical
  // ones, so 09:00–10:30 catches an existing 10:00–11:00.
  const { data: twins } = await supabase
    .from("lesson_slots")
    .select("id, series_id, weekday, starts_at, ends_at, room_id")
    .eq("group_id", groupId)
    .in("weekday", weekdays);
  const selfOverlap = ((twins ?? []) as Record<string, unknown>[]).find((s) => {
    if ((s.series_id as string) === seriesId) return false;
    const from = String(s.starts_at).slice(0, 5);
    const to = String(s.ends_at).slice(0, 5);
    return startsAt < to && from < endsAt;
  });
  if (selfOverlap) {
    const day = WEEKDAYS[Number(selfOverlap.weekday)]?.long ?? "that day";
    const from = String(selfOverlap.starts_at).slice(0, 5);
    const to = String(selfOverlap.ends_at).slice(0, 5);
    return {
      error: `This group already meets ${day} ${from}–${to}. One group cannot be in two places at once — move or remove that lesson first.`,
    };
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
    ...(effectiveFrom ? { effective_from: effectiveFrom } : {}),
    effective_to: effectiveTo,
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
    if (error) return { error: explain(error) };
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
    if (error) return { error: explain(error) };
    if ((data ?? []).length === 0) return { error: notAllowed("change") };
  }

  if (add.length > 0) {
    const newSeries = seriesId ?? crypto.randomUUID();
    const { data, error } = await supabase
      .from("lesson_slots")
      .insert(add.map((weekday) => ({ ...base, weekday, series_id: newSeries })))
      .select("id");
    if (error) return { error: explain(error) };
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
  return ` Note: ${(other?.name as string) ?? "another group"} is already in that room then.`;
}

/**
 * Turn the database's own guards into sentences.
 *
 * These are backstops, not the main path — the form pre-checks both — but a
 * constraint that fires must still explain itself rather than leaking
 * "23P01" at whoever is trying to book a lesson.
 */
function explain(error: { code?: string; message: string }): string {
  if (error.code === "23P01") {
    return "This group already has a lesson at that hour on one of those days. One group cannot be in two places at once.";
  }
  if (error.code === "23514" && /branch/i.test(error.message)) {
    return "That room is at a different branch from the group. Pick a room at the group's branch, or move the group.";
  }
  if (error.code === "23505") {
    return "That lesson is already on the timetable.";
  }
  if (error.code === "23503") {
    return "Something still belongs to this — move it first.";
  }
  return error.message;
}

/** The message for a write RLS silently discarded. */
function notAllowed(verb: string): string {
  return `Nothing changed — you may not ${verb} this group's timetable. Ask the center owner, or reload the page if it was just deleted.`;
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

  const supabase = await createClient();

  // Rooms, classes and desks are all ON DELETE RESTRICT, so the database would
  // stop this anyway — but it would stop it with a foreign-key error naming a
  // constraint. Counting first turns that into an instruction.
  const [roomsRes, groupsRes, desksRes] = await Promise.all([
    supabase.from("rooms").select("id").eq("branch_id", id),
    supabase.from("groups").select("id").eq("branch_id", id),
    supabase.from("finance_accounts").select("id").eq("branch_id", id),
  ]);
  const holding = [
    [(roomsRes.data ?? []).length, "room"],
    [(groupsRes.data ?? []).length, "group", "s"],
    [(desksRes.data ?? []).length, "cash desk"],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, word, plural]) => `${n} ${word}${(n as number) === 1 ? "" : (plural ?? "s")}`);
  if (holding.length > 0) {
    return {
      error: `Still has ${holding.join(", ")}. Move them to another branch first — deleting the branch would leave them nowhere.`,
    };
  }

  const { data, error } = await supabase.from("branches").delete().eq("id", id).select("id");
  if (error) return { error: explain(error) };
  if ((data ?? []).length === 0) return { error: notAllowed("remove from") };

  revalidatePath("/console/calendar");
  revalidatePath("/console/finance");
  return { ok: "Branch removed." };
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

  // Every room is at a branch. The form always sends one (hidden when the
  // center has a single site), so an empty value means a stale page.
  const branchId = str(formData, "branch_id");
  if (!branchId) return { error: "Pick the branch this room is at." };

  const supabase = await createClient();
  const id = str(formData, "id") || null;
  const payload = {
    organization_id: profile.organization_id,
    name,
    capacity,
    branch_id: branchId,
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
  return { ok: "Room removed. Groups booked in it are now unassigned." };
}
