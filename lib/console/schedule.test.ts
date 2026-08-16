import { describe, expect, it } from "vitest";

import {
  centerNow,
  holidayOn,
  lockDateFor,
  minutesOf,
  registerIsLocked,
  registersToMark,
  slotRuns,
  weekdayOf,
  type DayLesson,
  type DaySchedule,
  type SlotRow,
} from "./schedule";

/**
 * These are the rules two pages disagreed about.
 *
 * The Overview called every group in the center a lesson happening today, so it
 * reported open registers on days the timetable had nothing on while Attendance
 * said nothing was scheduled. The fix was one shared definition; these tests
 * pin it, because "which lessons are on today" is the question every alert,
 * every attendance percentage and every part-month fee is built on top of.
 */

const slot = (over: Partial<SlotRow> = {}): SlotRow => ({
  groupId: "g1",
  roomId: null,
  weekday: 1, // Monday
  startsAt: "18:00",
  endsAt: "19:30",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  ...over,
});

describe("slotRuns", () => {
  it("puts a lesson on its own weekday only", () => {
    expect(slotRuns(slot(), "2026-08-17")).toBe(true); // a Monday
    expect(slotRuns(slot(), "2026-08-18")).toBe(false); // Tuesday
  });

  it("reads the weekday in UTC, so a date never drifts by a day", () => {
    expect(weekdayOf("2026-08-17")).toBe(1);
    expect(weekdayOf("2026-08-16")).toBe(0);
  });

  it("has not started before its effective date", () => {
    expect(slotRuns(slot({ effectiveFrom: "2026-09-01" }), "2026-08-17")).toBe(false);
    expect(slotRuns(slot({ effectiveFrom: "2026-08-17" }), "2026-08-17")).toBe(true);
  });

  it("has finished after its last date — a course that ended stops appearing", () => {
    expect(slotRuns(slot({ effectiveTo: "2026-08-10" }), "2026-08-17")).toBe(false);
    expect(slotRuns(slot({ effectiveTo: "2026-08-17" }), "2026-08-17")).toBe(true);
  });
});

describe("holidayOn", () => {
  const holidays = [
    { name: "Navruz", startsOn: "2026-03-21", endsOn: "2026-03-25" },
    { name: "Independence Day", startsOn: "2026-09-01", endsOn: "2026-09-01" },
  ];

  it("covers every day of a range, both ends included", () => {
    expect(holidayOn(holidays, "2026-03-21")?.name).toBe("Navruz");
    expect(holidayOn(holidays, "2026-03-23")?.name).toBe("Navruz");
    expect(holidayOn(holidays, "2026-03-25")?.name).toBe("Navruz");
  });

  it("does not leak past the range", () => {
    expect(holidayOn(holidays, "2026-03-20")).toBeNull();
    expect(holidayOn(holidays, "2026-03-26")).toBeNull();
  });

  it("handles a single-day holiday", () => {
    expect(holidayOn(holidays, "2026-09-01")?.name).toBe("Independence Day");
  });
});

describe("register locking", () => {
  const now = (iso: string) => new Date(`${iso}T12:00:00Z`);

  it("stays open for exactly seven days", () => {
    expect(lockDateFor("2026-08-10")).toBe("2026-08-17");
    expect(registerIsLocked("2026-08-10", null, now("2026-08-16"))).toBe(false);
    expect(registerIsLocked("2026-08-10", null, now("2026-08-17"))).toBe(true);
  });

  it("today's register is never locked", () => {
    expect(registerIsLocked("2026-08-16", null, now("2026-08-16"))).toBe(false);
  });

  it("an unlock in the future reopens it", () => {
    const until = "2026-08-20T10:00:00.000Z";
    expect(registerIsLocked("2026-08-01", until, now("2026-08-19"))).toBe(false);
  });

  it("an expired unlock does not", () => {
    const until = "2026-08-15T10:00:00.000Z";
    expect(registerIsLocked("2026-08-01", until, now("2026-08-19"))).toBe(true);
  });
});

describe("centerNow", () => {
  it("reads the center's calendar day, not the server's", () => {
    // 02:00 in Tashkent on the 17th is still 21:00 UTC on the 16th. A console
    // that takes the UTC day shows yesterday's lessons every morning.
    const at = new Date("2026-08-16T21:00:00Z");
    expect(centerNow("Asia/Tashkent", at).date).toBe("2026-08-17");
    expect(centerNow("UTC", at).date).toBe("2026-08-16");
  });

  it("reads the wall clock, so an 18:00 lesson has finished by 20:00 local", () => {
    const at = new Date("2026-08-17T15:00:00Z"); // 20:00 in Tashkent
    expect(centerNow("Asia/Tashkent", at).minutes).toBe(20 * 60);
    expect(centerNow("UTC", at).minutes).toBe(15 * 60);
  });

  it("parses a lesson time to minutes", () => {
    expect(minutesOf("18:00")).toBe(1080);
    expect(minutesOf("09:30")).toBe(570);
  });
});

/* ── the counter that used to cry wolf ─────────────────────────────────────── */

const lesson = (over: Partial<DayLesson> = {}): DayLesson => ({
  groupId: "g1",
  groupName: "Evening IELTS",
  teacherId: "t1",
  teacherName: "Madina",
  roomName: "Room 12",
  startsAt: "18:00",
  endsAt: "19:30",
  timeLabel: "18:00–19:30",
  scheduled: true,
  cancelledReason: null,
  sessionId: null,
  state: "open",
  locked: false,
  students: 12,
  ratePct: 88,
  presentToday: null,
  ...over,
});

const day = (lessons: DayLesson[], over: Partial<DaySchedule> = {}): DaySchedule => ({
  date: "2026-08-17",
  timezone: "Asia/Tashkent",
  holiday: null,
  lessons,
  ...over,
});

describe("registersToMark", () => {
  // 20:00 in Tashkent on the day in question.
  const evening = new Date("2026-08-17T15:00:00Z");
  // 13:00 in Tashkent — before the 18:00 lesson.
  const lunchtime = new Date("2026-08-17T08:00:00Z");

  it("counts a lesson that finished and was never marked", () => {
    const d = day([lesson()]);
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(1);
  });

  it("does not chase a lesson that has not finished yet", () => {
    // The whole reason the old alert was ignored: it fired all day for a
    // register nobody could sensibly fill in until the evening.
    const d = day([lesson()]);
    expect(registersToMark(d, d.timezone, lunchtime)).toHaveLength(0);
  });

  it("ignores a lesson that was marked", () => {
    const d = day([lesson({ state: "marked" })]);
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(0);
  });

  it("ignores a lesson that was cancelled", () => {
    const d = day([lesson({ cancelledReason: "teacher ill" })]);
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(0);
  });

  it("ignores a group that is not timetabled today", () => {
    const d = day([lesson({ scheduled: false, endsAt: null, startsAt: null })]);
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(0);
  });

  it("ignores a register that has already locked", () => {
    const d = day([lesson({ locked: true })]);
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(0);
  });

  it("expects nothing on a day the center is shut", () => {
    const d = day([lesson()], { holiday: { name: "Navruz", startsOn: "2026-08-17", endsOn: "2026-08-17" } });
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(0);
  });

  it("counts every finished lesson on a past day", () => {
    const d = day([lesson(), lesson({ groupId: "g2", endsAt: "21:00" })], { date: "2026-08-10" });
    expect(registersToMark(d, d.timezone, evening)).toHaveLength(2);
  });
});
