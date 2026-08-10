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

export interface Room {
  id: string;
  name: string;
  capacity: number | null;
  color: string | null;
  active: boolean;
}

export interface Slot {
  id: string;
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  roomId: string | null;
  roomName: string | null;
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

const unwrap = (v: unknown) =>
  (Array.isArray(v) ? v[0] : v) as { name?: string | null; full_name?: string | null } | null;

/**
 * The whole week in one read.
 *
 * A teacher sees only their own classes' slots on the grid by default — RLS
 * lets any member of the org read the timetable (a student needs their own),
 * so the narrowing is a product decision made here, not a security boundary.
 */
export async function loadTimetable(
  profile: Profile,
  opts: { mine?: boolean } = {},
): Promise<Timetable> {
  const supabase = await createClient();

  const [roomsRes, slotsRes, groupsRes, membersRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, capacity, color, active")
      .order("sort", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("lesson_slots")
      .select(
        "id, group_id, room_id, weekday, starts_at, ends_at, pattern, rooms:room_id ( name ), groups:group_id ( name, teacher_id, teacher:teacher_id ( full_name ) )",
      )
      .order("weekday", { ascending: true })
      .order("starts_at", { ascending: true }),
    supabase.from("groups").select("id, name, teacher_id, teacher:teacher_id ( full_name )"),
    supabase.from("group_members").select("group_id"),
  ]);

  const sizes = new Map<string, number>();
  for (const m of (membersRes.data ?? []) as Record<string, unknown>[]) {
    const key = m.group_id as string;
    sizes.set(key, (sizes.get(key) ?? 0) + 1);
  }

  let slots: Slot[] = ((slotsRes.data ?? []) as unknown as Record<string, unknown>[]).map((s) => {
    const group = unwrap(s.groups) as {
      name?: string;
      teacher_id?: string | null;
      teacher?: unknown;
    } | null;
    return {
      id: s.id as string,
      groupId: s.group_id as string,
      groupName: group?.name ?? "—",
      teacherId: (group?.teacher_id as string | null) ?? null,
      teacherName: unwrap(group?.teacher)?.full_name ?? null,
      roomId: (s.room_id as string | null) ?? null,
      roomName: unwrap(s.rooms)?.name ?? null,
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

  const allGroups = ((groupsRes.data ?? []) as unknown as Record<string, unknown>[]).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    teacherId: (g.teacher_id as string | null) ?? null,
    teacherName: unwrap(g.teacher)?.full_name ?? null,
  }));

  const mine = opts.mine && profile.role === "teacher";
  if (mine) slots = slots.filter((s) => s.teacherId === profile.id);

  const scheduled = new Set(slots.map((s) => s.groupId));
  const unscheduled = allGroups
    .filter((g) => !scheduled.has(g.id))
    .filter((g) => !mine || g.teacherId === profile.id)
    .map((g) => ({ id: g.id, name: g.name, teacherName: g.teacherName }));

  // Fit the grid to the day the center actually runs, with an hour of headroom
  // either side — an 07:00–22:00 grid for a center that opens at 15:00 is
  // mostly empty rows.
  const starts = slots.map((s) => toMinutes(s.startsAt));
  const ends = slots.map((s) => toMinutes(s.endsAt));
  const dayStartMin = starts.length ? Math.max(0, Math.min(...starts) - 30) : 8 * 60;
  const dayEndMin = ends.length ? Math.min(24 * 60, Math.max(...ends) + 30) : 21 * 60;

  return {
    rooms: ((roomsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      capacity: (r.capacity as number | null) ?? null,
      color: (r.color as string | null) ?? null,
      active: Boolean(r.active),
    })),
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
