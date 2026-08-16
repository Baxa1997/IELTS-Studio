/**
 * Does this booking collide with one that already exists?
 *
 * §5: "Add conflict checking on save: same teacher two places at once, same
 * room two places at once. Warn and block." §10 asks for the same thing.
 *
 * WHAT WAS THERE BEFORE. The timetable already DETECTED clashes — it drew them
 * in red with a sentence naming the other group. But detection ran when you
 * looked at the grid, not when you saved, so the way you found out you had
 * double-booked a teacher was by going to look. Nothing stopped the save. A
 * teacher in two rooms at 15:30 is not a display problem; it is two classes
 * turning up and one of them having nobody to teach them.
 *
 * Pure, and NOT `server-only`, for the reason this codebase keeps relearning:
 * the save action needs it on the server, the schedule form should be able to
 * warn before you press the button, and a rule that exists twice is a rule that
 * will disagree with itself.
 */

export type ClashKind = "room" | "teacher";

/** A booking, reduced to what deciding a collision actually needs. */
export interface SlotLike {
  id?: string;
  groupId: string;
  groupName?: string;
  /** JS `getDay()`: 0 = Sunday. */
  weekday: number;
  /** `HH:MM`. */
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  roomName?: string | null;
  teacherId: string | null;
  teacherName?: string | null;
  /** The series being edited. Slots in it are being replaced, not collided with. */
  seriesId?: string | null;
}

export interface Clash {
  kind: ClashKind;
  /** A whole sentence naming who, where and when. */
  message: string;
  withGroupId: string;
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Do two bookings occupy the same minutes on the same weekday?
 *
 * Half-open on purpose: a lesson ending at 15:30 and the next starting at 15:30
 * do not overlap. Treating them as a clash would make back-to-back teaching —
 * which is what a busy centre's timetable is entirely made of — impossible to
 * save.
 */
export function overlaps(a: SlotLike, b: SlotLike): boolean {
  if (a.weekday !== b.weekday) return false;
  return toMinutes(a.startsAt) < toMinutes(b.endsAt) && toMinutes(b.startsAt) < toMinutes(a.endsAt);
}

/**
 * Every reason `proposed` cannot be saved against `existing`.
 *
 * TWO THINGS ARE DELIBERATELY NOT CLASHES:
 *
 * Slots in the same series being edited — they are what is being replaced, so
 * colliding with them means colliding with your own previous answer.
 *
 * The same GROUP meeting twice at once. That is real, and the grid already
 * flags it as `self`, but it is a data-entry mess rather than a physical
 * impossibility: nobody is left standing in a corridor. Blocking the save would
 * strand a centre that already has one and cannot edit their way out of it.
 */
export function findClashes(proposed: SlotLike, existing: SlotLike[]): Clash[] {
  const clashes: Clash[] = [];

  for (const other of existing) {
    if (other.groupId === proposed.groupId) continue;
    if (proposed.seriesId && other.seriesId && proposed.seriesId === other.seriesId) continue;
    if (!overlaps(proposed, other)) continue;

    const when = `${WEEKDAY[proposed.weekday] ?? "that day"} ${proposed.startsAt}`;

    if (proposed.roomId && other.roomId === proposed.roomId) {
      clashes.push({
        kind: "room",
        withGroupId: other.groupId,
        message: `${proposed.roomName ?? "That room"} already holds ${other.groupName ?? "another group"} on ${when}.`,
      });
    }
    if (proposed.teacherId && other.teacherId === proposed.teacherId) {
      clashes.push({
        kind: "teacher",
        withGroupId: other.groupId,
        message: `${proposed.teacherName ?? "That teacher"} already has ${other.groupName ?? "another group"} on ${when}.`,
      });
    }
  }

  // One mention per collision. A booking that clashes on room AND teacher with
  // the same group is one problem to go and fix, not two.
  return dedupe(clashes);
}

function dedupe(clashes: Clash[]): Clash[] {
  const seen = new Set<string>();
  return clashes.filter((c) => {
    const key = `${c.kind}:${c.withGroupId}:${c.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The sentence shown when a save is refused. */
export function explainClashes(clashes: Clash[]): string {
  if (clashes.length === 0) return "";
  if (clashes.length === 1) return clashes[0].message;
  return `${clashes[0].message} And ${clashes.length - 1} more like it.`;
}
