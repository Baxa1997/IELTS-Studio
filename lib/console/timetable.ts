import "server-only";

import { type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The timetable: which class meets when, where, and with whom.
 *
 * A slot is a WEEKLY repeat, not a calendar event. Centers here run courses on
 * a fixed pattern — Mon/Wed/Fri or Tue/Thu/Sat, "toq" and "juft" days — and
 * describing that as a recurring slot per weekday is both how the staff think
 * about it and a hundredth of the rows a materialised calendar would need.
 *
 * The one thing a paper timetable cannot do, and the reason this is worth
 * building rather than photographing a whiteboard: it knows when two classes
 * want the same room, or one teacher is booked twice at once.
 */

export const WEEKDAYS = [
  { index: 0, short: "Sun", long: "Sunday", uz: "Yak" },
  { index: 1, short: "Mon", long: "Monday", uz: "Du" },
  { index: 2, short: "Tue", long: "Tuesday", uz: "Se" },
  { index: 3, short: "Wed", long: "Wednesday", uz: "Chor" },
  { index: 4, short: "Thu", long: "Thursday", uz: "Pa" },
  { index: 5, short: "Fri", long: "Friday", uz: "Ju" },
  { index: 6, short: "Sat", long: "Saturday", uz: "Sha" },
] as const;

export type SlotPattern = "weekly" | "odd" | "even";

export const PATTERN_LABEL: Record<SlotPattern, string> = {
  weekly: "Every week",
  odd: "Odd days (Mon/Wed/Fri)",
  even: "Even days (Tue/Thu/Sat)",
};

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
  branchId: string | null;
}

export interface Slot {
  id: string;
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  roomId: string | null;
  roomName: string | null;
  /** Derived from the room — a lesson has no branch of its own. */
  branchId: string | null;
  weekday: number;
  startsAt: string; // HH:MM
  endsAt: string; // HH:MM
  pattern: SlotPattern;
  studentCount: number;
  /** Ids of the other slots this one collides with. */
  clashesWith: string[];
  clashReason: "room" | "teacher" | "both" | null;
}

export interface Timetable {
  branches: Branch[];
  rooms: Room[];
  slots: Slot[];
  /** Groups with no slot at all — the timetable's own to-do list. */
  unscheduled: { id: string; name: string; teacherName: string | null }[];
  clashCount: number;
  /** Earliest start and latest end across the week, so the grid fits the day. */
  dayStartMin: number;
  dayEndMin: number;
}

/* ── time helpers ─────────────────────────────────────────────────────────── */

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

export const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** `09:00:00` from Postgres, `09:00` from a form — both land as `09:00`. */
export const trimTime = (t: string): string => t.slice(0, 5);

/** Two patterns can only collide if they share a day of the fortnight. */
function patternsOverlap(a: SlotPattern, b: SlotPattern): boolean {
  if (a === "weekly" || b === "weekly") return true;
  return a === b;
}

function slotsCollide(a: Slot, b: Slot): boolean {
  if (a.weekday !== b.weekday) return false;
  if (!patternsOverlap(a.pattern, b.pattern)) return false;
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
  opts: { mine?: boolean } = {},
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
      .select("id, group_id, room_id, weekday, starts_at, ends_at, pattern")
      .order("weekday", { ascending: true })
      .order("starts_at", { ascending: true }),
    supabase.from("groups").select("id, name, teacher_id"),
    supabase.from("group_members").select("group_id"),
    supabase.from("profiles").select("id, full_name").in("role", ["teacher", "center_admin"]),
    supabase
      .from("branches")
      .select("id, name, address, phone, active")
      .order("sort", { ascending: true })
      .order("name", { ascending: true }),
  ]);

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
  }));
  const groupById = new Map(groupRows.map((g) => [g.id, g]));
  const roomRows = ((roomsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    capacity: (r.capacity as number | null) ?? null,
    color: (r.color as string | null) ?? null,
    active: Boolean(r.active),
    branchId: (r.branch_id as string | null) ?? null,
  }));
  const roomById = new Map(roomRows.map((r) => [r.id, r]));

  let slots: Slot[] = ((slotsRes.data ?? []) as Record<string, unknown>[]).map((s) => {
    const group = groupById.get(s.group_id as string);
    const roomId = (s.room_id as string | null) ?? null;
    const room = roomId ? roomById.get(roomId) : undefined;
    return {
      id: s.id as string,
      groupId: s.group_id as string,
      groupName: group?.name ?? "—",
      teacherId: group?.teacherId ?? null,
      teacherName: group?.teacherId ? (staffName.get(group.teacherId) ?? null) : null,
      roomId,
      roomName: room?.name ?? null,
      // A lesson's site is wherever its room is. No second source of truth.
      branchId: room?.branchId ?? null,
      weekday: Number(s.weekday ?? 0),
      startsAt: trimTime(String(s.starts_at ?? "00:00")),
      endsAt: trimTime(String(s.ends_at ?? "00:00")),
      pattern: (s.pattern as SlotPattern) ?? "weekly",
      studentCount: sizes.get(s.group_id as string) ?? 0,
      clashesWith: [],
      clashReason: null,
    };
  });

  // Clashes are computed across the WHOLE center before any narrowing: a
  // teacher filtered to their own classes still needs to know the room they
  // booked is taken by someone else's.
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (!slotsCollide(a, b)) continue;
      const sameRoom = a.roomId != null && a.roomId === b.roomId;
      const sameTeacher = a.teacherId != null && a.teacherId === b.teacherId;
      if (!sameRoom && !sameTeacher) continue;
      const reason: Slot["clashReason"] =
        sameRoom && sameTeacher ? "both" : sameRoom ? "room" : "teacher";
      a.clashesWith.push(b.id);
      b.clashesWith.push(a.id);
      a.clashReason = a.clashReason && a.clashReason !== reason ? "both" : reason;
      b.clashReason = b.clashReason && b.clashReason !== reason ? "both" : reason;
    }
  }
  const clashCount = slots.filter((s) => s.clashesWith.length > 0).length;

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
    if (!room.branchId || !room.active) continue;
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
    clashCount,
    dayStartMin,
    dayEndMin,
  };
}

/** Which slots a single group has — the group page's schedule strip. */
export function slotsForGroup(timetable: Timetable, groupId: string): Slot[] {
  return timetable.slots.filter((s) => s.groupId === groupId);
}

/** "Mon 15:30–17:00 · Room 2" — one slot in a sentence. */
export function describeSlot(slot: Slot): string {
  const day = WEEKDAYS[slot.weekday]?.short ?? "—";
  const room = slot.roomName ? ` · ${slot.roomName}` : "";
  const pattern =
    slot.pattern === "weekly" ? "" : slot.pattern === "odd" ? " (odd days)" : " (even days)";
  return `${day} ${slot.startsAt}–${slot.endsAt}${room}${pattern}`;
}
