import { describe, expect, it } from "vitest";

import { explainClashes, findClashes, overlaps, type SlotLike } from "./slot-clash";

/**
 * The rule that decides whether a timetable can be saved.
 *
 * Getting it too strict is as damaging as too loose: refuse back-to-back
 * lessons and a busy centre cannot save its real timetable at all, which is a
 * worse outcome than the double-booking this is meant to prevent.
 */

const slot = (over: Partial<SlotLike> = {}): SlotLike => ({
  groupId: "g1",
  groupName: "Evening B2",
  weekday: 1,
  startsAt: "15:30",
  endsAt: "17:00",
  roomId: "r1",
  roomName: "Room 12",
  teacherId: "t1",
  teacherName: "Madina",
  ...over,
});

describe("overlaps", () => {
  it("is half-open, so back-to-back lessons are fine", () => {
    // A centre's timetable is mostly this. Treating 17:00→17:00 as a collision
    // would make it unsaveable.
    const a = slot({ startsAt: "15:30", endsAt: "17:00" });
    const b = slot({ startsAt: "17:00", endsAt: "18:30" });
    expect(overlaps(a, b)).toBe(false);
  });

  it("catches a one-minute overlap", () => {
    const a = slot({ startsAt: "15:30", endsAt: "17:00" });
    const b = slot({ startsAt: "16:59", endsAt: "18:30" });
    expect(overlaps(a, b)).toBe(true);
  });

  it("catches full containment either way round", () => {
    const outer = slot({ startsAt: "15:00", endsAt: "19:00" });
    const inner = slot({ startsAt: "16:00", endsAt: "17:00" });
    expect(overlaps(outer, inner)).toBe(true);
    expect(overlaps(inner, outer)).toBe(true);
  });

  it("does not collide across weekdays", () => {
    expect(overlaps(slot({ weekday: 1 }), slot({ weekday: 2 }))).toBe(false);
  });
});

describe("findClashes", () => {
  const other = (over: Partial<SlotLike> = {}) =>
    slot({ groupId: "g2", groupName: "Morning A2", ...over });

  it("blocks a room already in use", () => {
    const clashes = findClashes(slot(), [other({ teacherId: "t9" })]);
    expect(clashes).toHaveLength(1);
    expect(clashes[0].kind).toBe("room");
    expect(clashes[0].message).toBe("Room 12 already holds Morning A2 on Monday 15:30.");
  });

  it("blocks a teacher already teaching", () => {
    // The one that actually strands people: two classes turn up and one has
    // nobody to teach it.
    const clashes = findClashes(slot(), [other({ roomId: "r9" })]);
    expect(clashes).toHaveLength(1);
    expect(clashes[0].kind).toBe("teacher");
    expect(clashes[0].message).toContain("Madina already has Morning A2");
  });

  it("reports room and teacher separately when both collide", () => {
    const clashes = findClashes(slot(), [other()]);
    expect(clashes.map((c) => c.kind).sort()).toEqual(["room", "teacher"]);
  });

  it("ignores the series being edited, which is what is being replaced", () => {
    // Editing Monday 15:30 must not collide with the Monday 15:30 it is about
    // to overwrite — otherwise no timetable could ever be changed.
    const clashes = findClashes(slot({ seriesId: "s1" }), [
      other({ seriesId: "s1", groupId: "g1" }),
    ]);
    expect(clashes).toEqual([]);
  });

  it("ignores the same group, which is a data mess rather than a collision", () => {
    // Real, and the grid flags it — but nobody is left in a corridor, and
    // blocking would strand a centre that already has one.
    expect(findClashes(slot(), [slot({ roomId: "r9", teacherId: "t9" })])).toEqual([]);
  });

  it("does not invent a clash from two unset rooms", () => {
    // Two groups with no room booked are not "in the same room".
    const clashes = findClashes(slot({ roomId: null, teacherId: null }), [
      other({ roomId: null, teacherId: null }),
    ]);
    expect(clashes).toEqual([]);
  });

  it("allows the same room at a different time", () => {
    expect(findClashes(slot(), [other({ startsAt: "17:00", endsAt: "18:30" })])).toEqual([]);
  });

  it("mentions one collision once, however many ways it collides", () => {
    const clashes = findClashes(slot(), [other(), other()]);
    expect(clashes).toHaveLength(2); // room + teacher, not four
  });
});

describe("explainClashes", () => {
  it("leads with the specific one and counts the rest", () => {
    const clashes = findClashes(slot(), [
      slot({ groupId: "g2", groupName: "Morning A2" }),
    ]);
    expect(explainClashes(clashes)).toContain("Room 12 already holds Morning A2");
    expect(explainClashes(clashes)).toContain("And 1 more");
  });

  it("says nothing when there is nothing wrong", () => {
    expect(explainClashes([])).toBe("");
  });
});
