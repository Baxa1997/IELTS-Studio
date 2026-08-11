import "server-only";

import { type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { addDays, describeDays, toMinutes, trimTime, WEEKDAYS } from "./timetable-days";

/**
 * The timetable: which class meets when, where, and with whom.
 *
 * A slot is a WEEKLY repeat, not a calendar event. Centers here run courses on
 * a fixed rhythm — Mon/Wed/Fri or Tue/Thu/Sat, "toq" and "juft" kunlar — for
 * months at a time, so a recurring weekly row is both how the staff think about
 * it and a hundredth of the rows a materialised calendar would need.
 *
 * ONE ROW PER DAY THE CLASS ACTUALLY MEETS, tied by `series_id`.
 *
 * That is the correction made in migration 20260810160000, and it matters. The
 * table used to carry a `pattern` column beside the weekday, so a single row
 * claimed to mean "Mon/Wed/Fri" while sitting on Wednesday — invisible on the
 * Monday and Friday tabs, and free to contradict itself ("Tuesday, odd days").
 * Now the grid shows exactly what is stored, and a lesson that meets three
 * times a week is three rows the app edits, moves and deletes as one.
 *
 * The one thing a paper timetable cannot do, and the reason this is worth
 * building rather than photographing a whiteboard: it knows when two classes
 * want the same room, or one teacher is booked twice at once.
 */

// Shared with the client form, which cannot import a `server-only` module.
export {
  addDays,
  DAY_PRESETS,
  datesOfWeek,
  describeDays,
  isoDate,
  orderedWeekdays,
  startOfWeek,
  toHHMM,
  toMinutes,
  trimTime,
  WEEK_ORDER,
  WEEKDAYS,
  weekLabel,
} from "./timetable-days";

/**
 * Why two lessons cannot both happen.
 *
 * `self` is separated from the rest because it is a different KIND of problem.
 * A room shared by two classes, or a teacher wanted by two classes, is a
 * judgement call the center is allowed to make — small groups share rooms, a
 * senior teacher covers the first half hour. One class booked over ITSELF is
 * never a decision; it is a mis-click, and saying "the same room or the same
 * teacher" about it sends the reader looking for a conflict that isn't there.
 */
export type ClashReason = "self" | "room" | "teacher" | "both";

/** One collision, named well enough to act on without hunting for it. */
export interface Conflict {
  weekday: number;
  startsAt: string;
  reason: ClashReason;
  /** A whole sentence: who, where, when. */
  label: string;
  slotIds: string[];
}

/** A site. A center with one address has none of these, which is fine. */
export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  roomCount: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number | null;
  color: string | null;
  active: boolean;
  /** Required since 20260810170000 — every room is at exactly one site. */
  branchId: string;
}

export interface Slot {
  id: string;
  /** Every day of this lesson shares it — the unit the staff edit. */
  seriesId: string;
  /** All weekdays in the series, this one included. */
  seriesDays: number[];
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  roomId: string | null;
  roomName: string | null;
  roomCapacity: number | null;
  /**
   * Taken from the CLASS, not the room. Both always have one and the two are
   * kept equal by a database trigger, but a lesson can be temporarily roomless
   * (its room was deleted, or moved to another site) and it still belongs to
   * the branch that teaches it.
   */
  branchId: string;
  weekday: number;
  startsAt: string; // HH:MM
  endsAt: string; // HH:MM
  /** The term this lesson runs for. `null` end = until further notice. */
  effectiveFrom: string;
  effectiveTo: string | null;
  studentCount: number;
  /** Ids of the other slots this one collides with. */
  clashesWith: string[];
  clashReason: ClashReason | null;
  /** "Room 2 · Aziza Karimova" — who else wants this hour, for the tooltip. */
  clashWithNames: string[];
  /** Set when the class has more students than the room has seats. */
  overCapacityBy: number;
}

export interface Timetable {
  branches: Branch[];
  rooms: Room[];
  slots: Slot[];
  /** Groups with no slot at all — the timetable's own to-do list. */
  unscheduled: { id: string; name: string; teacherName: string | null }[];
  /** One entry per collision, not per lesson involved in one. */
  conflicts: Conflict[];
  /** Earliest start and latest end across the week, so the grid fits the day. */
  dayStartMin: number;
  dayEndMin: number;
  /**
   * Queries that came back with an error. supabase-js reports a failed read as
   * `{ data: null, error }` rather than throwing, so without this a missing
   * column renders as an empty timetable and looks like lost data. The page
   * shows these; see `scripts/check-finance-queries.mjs`.
   */
  issues: string[];
}

/* ── clashes ──────────────────────────────────────────────────────────────── */

/**
 * Two lessons collide when they are on the same day and their hours overlap.
 *
 * That is the whole rule now. It used to need pattern arithmetic on top —
 * "does Mon/Wed/Fri share a day with Tue/Thu/Sat" — which was both a source of
 * wrong answers and impossible to explain to the person reading the red box.
 */
function slotsCollide(a: Slot, b: Slot): boolean {
  if (a.weekday !== b.weekday) return false;
  return toMinutes(a.startsAt) < toMinutes(b.endsAt) && toMinutes(b.startsAt) < toMinutes(a.endsAt);
}

/* ── loading ──────────────────────────────────────────────────────────────── */

/**
 * The whole week in one read.
 *
 * A teacher sees only their own classes' slots on the grid by default — RLS
 * lets any member of the org read the timetable (a student needs their own),
 * so the narrowing is a product decision made here, not a security boundary.
 *
 * No PostgREST embeds anywhere: `lesson_slots` reaches rooms and groups through
 * composite FKs, which embeds cannot resolve — see `lib/finance/names.ts` for
 * the full story. Names are fetched separately and joined here.
 */
export async function loadTimetable(
  profile: Profile,
  opts: { mine?: boolean; week?: string } = {},
): Promise<Timetable> {
  const supabase = await createClient();

  const [roomsRes, slotsRes, groupsRes, membersRes, staffRes, branchesRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, capacity, color, active, branch_id")
      .order("sort", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("lesson_slots")
      .select(
        "id, series_id, group_id, room_id, weekday, starts_at, ends_at, effective_from, effective_to",
      )
      .order("weekday", { ascending: true })
      .order("starts_at", { ascending: true }),
    supabase.from("groups").select("id, name, teacher_id, branch_id"),
    supabase.from("group_members").select("group_id"),
    supabase.from("profiles").select("id, full_name").in("role", ["teacher", "center_admin"]),
    supabase
      .from("branches")
      .select("id, name, address, phone, active")
      .order("sort", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  // Never let a failed read pass for an empty one.
  const issues: string[] = [];
  for (const [label, res] of [
    ["rooms", roomsRes],
    ["lessons", slotsRes],
    ["classes", groupsRes],
    ["students", membersRes],
    ["staff", staffRes],
    ["branches", branchesRes],
  ] as const) {
    if (!res.error) continue;
    issues.push(`${label}: ${res.error.message}`);
    console.error(`[timetable] ${label} query failed`, res.error);
  }

  const sizes = new Map<string, number>();
  for (const m of (membersRes.data ?? []) as Record<string, unknown>[]) {
    const key = m.group_id as string;
    sizes.set(key, (sizes.get(key) ?? 0) + 1);
  }

  const staffName = new Map(
    ((staffRes.data ?? []) as Record<string, unknown>[]).map((p) => [
      p.id as string,
      (p.full_name as string | null) ?? "—",
    ]),
  );
  const groupRows = ((groupsRes.data ?? []) as Record<string, unknown>[]).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    teacherId: (g.teacher_id as string | null) ?? null,
    branchId: g.branch_id as string,
  }));
  const groupById = new Map(groupRows.map((g) => [g.id, g]));
  const roomRows = ((roomsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    capacity: (r.capacity as number | null) ?? null,
    color: (r.color as string | null) ?? null,
    active: Boolean(r.active),
    branchId: r.branch_id as string,
  }));
  const roomById = new Map(roomRows.map((r) => [r.id, r]));

  const slotRows = (slotsRes.data ?? []) as Record<string, unknown>[];

  // Which days each series runs. Built before the slots so every day of a
  // lesson can show the whole rhythm — "Toq kunlar" on a Monday block tells
  // the reader more than "Monday" does.
  const daysInSeries = new Map<string, number[]>();
  for (const s of slotRows) {
    const key = (s.series_id as string | null) ?? (s.id as string);
    const days = daysInSeries.get(key) ?? [];
    days.push(Number(s.weekday ?? 0));
    daysInSeries.set(key, days);
  }

  let slots: Slot[] = slotRows.map((s) => {
    const group = groupById.get(s.group_id as string);
    const roomId = (s.room_id as string | null) ?? null;
    const room = roomId ? roomById.get(roomId) : undefined;
    const seriesId = (s.series_id as string | null) ?? (s.id as string);
    const studentCount = sizes.get(s.group_id as string) ?? 0;
    return {
      id: s.id as string,
      seriesId,
      seriesDays: [...(daysInSeries.get(seriesId) ?? [])].sort((a, b) => a - b),
      groupId: s.group_id as string,
      groupName: group?.name ?? "—",
      teacherId: group?.teacherId ?? null,
      teacherName: group?.teacherId ? (staffName.get(group.teacherId) ?? null) : null,
      roomId,
      roomName: room?.name ?? null,
      roomCapacity: room?.capacity ?? null,
      branchId: group?.branchId ?? "",
      weekday: Number(s.weekday ?? 0),
      startsAt: trimTime(String(s.starts_at ?? "00:00")),
      endsAt: trimTime(String(s.ends_at ?? "00:00")),
      effectiveFrom: (s.effective_from as string) ?? "",
      effectiveTo: (s.effective_to as string | null) ?? null,
      studentCount,
      clashesWith: [],
      clashReason: null,
      clashWithNames: [],
      // A class of 20 in a room of 12 is a problem the schedule can see coming
      // and the wall chart cannot.
      overCapacityBy:
        room?.capacity != null && studentCount > room.capacity ? studentCount - room.capacity : 0,
    };
  });

  // A lesson only exists in the weeks it actually runs. `effective_from` /
  // `effective_to` have been on the table since the beginning and were never
  // read, which is why every week looked identical; a course that finished in
  // October should stop appearing in November rather than being deleted, or
  // last term's timetable is lost.
  if (opts.week) {
    const weekEnd = addDays(opts.week, 6);
    slots = slots.filter(
      (s) =>
        (!s.effectiveFrom || s.effectiveFrom <= weekEnd) &&
        (s.effectiveTo == null || s.effectiveTo >= opts.week!),
    );
  }

  // Clashes are computed across the WHOLE center before any narrowing: a
  // teacher filtered to their own classes still needs to know the room they
  // booked is taken by someone else's. Within the visible week only — two
  // courses in different terms never meet.
  //
  // Counted as CONFLICTS, one per colliding pair. Counting the lessons caught
  // up in them reported a single mistake as "2 lessons are double-booked",
  // which reads like two separate problems to go and find.
  const conflicts: Conflict[] = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (!slotsCollide(a, b)) continue;

      const sameClass = a.groupId === b.groupId;
      const sameRoom = a.roomId != null && a.roomId === b.roomId;
      const sameTeacher = a.teacherId != null && a.teacherId === b.teacherId;
      if (!sameClass && !sameRoom && !sameTeacher) continue;

      const reason: ClashReason = sameClass
        ? "self"
        : sameRoom && sameTeacher
          ? "both"
          : sameRoom
            ? "room"
            : "teacher";

      a.clashesWith.push(b.id);
      b.clashesWith.push(a.id);
      a.clashReason = a.clashReason && a.clashReason !== reason ? "both" : reason;
      b.clashReason = b.clashReason && b.clashReason !== reason ? "both" : reason;
      // Naming the other class is the difference between a warning you can act
      // on and a red border you learn to ignore.
      a.clashWithNames.push(`${b.groupName} ${b.startsAt}–${b.endsAt}`);
      b.clashWithNames.push(`${a.groupName} ${a.startsAt}–${a.endsAt}`);

      const day = WEEKDAYS[a.weekday]?.long ?? "—";
      const when = `${day} ${a.startsAt}`;
      const where = [a.roomName, b.roomName].filter(Boolean);
      conflicts.push({
        weekday: a.weekday,
        startsAt: a.startsAt,
        reason,
        slotIds: [a.id, b.id],
        label: sameClass
          ? `${a.groupName} is booked twice on ${when}${
              where.length === 2 && a.roomId !== b.roomId ? ` — ${where.join(" and ")}` : ""
            }.`
          : reason === "room"
            ? `${a.roomName} holds ${a.groupName} and ${b.groupName} on ${when}.`
            : reason === "teacher"
              ? `${a.teacherName ?? "One teacher"} has ${a.groupName} and ${b.groupName} on ${when}.`
              : `${a.groupName} and ${b.groupName} want ${a.roomName} and ${a.teacherName ?? "the same teacher"} on ${when}.`,
      });
    }
  }

  const allGroups = groupRows.map((g) => ({
    ...g,
    teacherName: g.teacherId ? (staffName.get(g.teacherId) ?? null) : null,
  }));

  const mine = opts.mine && profile.role === "teacher";
  if (mine) slots = slots.filter((s) => s.teacherId === profile.id);

  const scheduled = new Set(slots.map((s) => s.groupId));
  const unscheduled = allGroups
    .filter((g) => !scheduled.has(g.id))
    .filter((g) => !mine || g.teacherId === profile.id)
    .map((g) => ({ id: g.id, name: g.name, teacherName: g.teacherName }));

  // The grid always covers a full teaching day, and stretches if a lesson falls
  // outside it. An empty timetable still has to be a GRID — rows you can click
  // to book something — rather than an empty-state message, which is the whole
  // difference between a schedule you can edit and a picture of one.
  //
  // Bounds snap to the half hour so every row is a clean 30-minute band.
  const DEFAULT_OPEN = 8 * 60;
  const DEFAULT_CLOSE = 21 * 60;
  const starts = slots.map((s) => toMinutes(s.startsAt));
  const ends = slots.map((s) => toMinutes(s.endsAt));
  const floorHalf = (m: number) => Math.floor(m / 30) * 30;
  const ceilHalf = (m: number) => Math.ceil(m / 30) * 30;
  const dayStartMin = Math.max(0, floorHalf(Math.min(DEFAULT_OPEN, ...starts)));
  const dayEndMin = Math.min(24 * 60, ceilHalf(Math.max(DEFAULT_CLOSE, ...ends)));

  const roomsPerBranch = new Map<string, number>();
  for (const room of roomRows) {
    if (!room.active) continue;
    roomsPerBranch.set(room.branchId, (roomsPerBranch.get(room.branchId) ?? 0) + 1);
  }

  return {
    branches: ((branchesRes.data ?? []) as Record<string, unknown>[]).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      address: (b.address as string | null) ?? null,
      phone: (b.phone as string | null) ?? null,
      active: Boolean(b.active),
      roomCount: roomsPerBranch.get(b.id as string) ?? 0,
    })),
    rooms: roomRows,
    slots,
    unscheduled,
    conflicts: conflicts.sort(
      (a, b) => a.weekday - b.weekday || a.startsAt.localeCompare(b.startsAt),
    ),
    dayStartMin,
    dayEndMin,
    issues,
  };
}

/** Which slots a single group has — the group page's schedule strip. */
export function slotsForGroup(timetable: Timetable, groupId: string): Slot[] {
  return timetable.slots.filter((s) => s.groupId === groupId);
}

/** "Mon 15:30–17:00 · Room 2" — one day of a lesson in a sentence. */
export function describeSlot(slot: Slot): string {
  const day = WEEKDAYS[slot.weekday]?.short ?? "—";
  const room = slot.roomName ? ` · ${slot.roomName}` : "";
  return `${day} ${slot.startsAt}–${slot.endsAt}${room}`;
}

/** "Toq kunlar 15:30–17:00 · Room 2" — the whole lesson, once. */
export function describeSeries(slot: Slot): string {
  const room = slot.roomName ? ` · ${slot.roomName}` : "";
  return `${describeDays(slot.seriesDays)} ${slot.startsAt}–${slot.endsAt}${room}`;
}

/** One entry per lesson rather than per day, for lists that shouldn't repeat. */
export function bySeries(slots: Slot[]): Slot[] {
  const seen = new Set<string>();
  return slots.filter((s) => (seen.has(s.seriesId) ? false : (seen.add(s.seriesId), true)));
}
