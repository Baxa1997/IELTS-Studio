/**
 * Does the assistant actually PASS ON what it was told?
 *
 * This file exists because of a failure nobody had a test for. The action
 * allow-list named three arguments for `create_group` while `createGroup`
 * read eleven, so "Monday, Wednesday and Friday, 15:30 to 17:00, room 2" made
 * a class with a name and nothing else — no timetable, therefore no register
 * to mark and no lesson count for any prorated fee or salary to divide by. The
 * person was told the class had been created, which was true, and never told
 * what had been thrown away, which was most of what they said.
 *
 * `assign_practice` was worse: it sent neither the question type nor the topic
 * that `createAssignment` refuses to run without, so the button could not
 * succeed at all.
 *
 * The two existing test files pin WHO may run each action and WHETHER a
 * proposal is safe to show. Neither could see this, because both are about the
 * gate and this is about what gets through it. So the rule under test here is:
 * an argument the server action reads is either offered by the assistant, or
 * listed below as deliberately withheld.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACTIONS, argsFor, type ActionSpec } from "./assistant";
import { listDays, parseClockTime, parseWeekdays } from "./timetable-days";

const ROOT = join(__dirname, "..", "..");

/** The server action each assistant action hands off to, and where it lives. */
const BACKED_BY: Record<string, { file: string; fn: string }> = {
  create_group: { file: "app/(app)/console/groups/actions.ts", fn: "createGroup" },
  set_schedule: { file: "app/(app)/console/groups/actions.ts", fn: "setGroupSchedule" },
  add_student: { file: "app/(app)/console/groups/actions.ts", fn: "addStudentAccount" },
  add_teacher: { file: "app/(app)/console/groups/actions.ts", fn: "addTeacherAccount" },
  assign_practice: { file: "app/(app)/console/groups/actions.ts", fn: "createAssignment" },
  send_announcement: { file: "app/(app)/console/center-actions.ts", fn: "sendAnnouncement" },
};

/**
 * Fields the assistant deliberately does NOT offer, each with the reason.
 *
 * A field belongs here when a person talking to an assistant should not be
 * setting it — not when it was merely awkward to wire. Anything not listed and
 * not offered fails the test, which is the point: the default is that a detail
 * somebody said out loud reaches the database.
 */
const WITHHELD: Record<string, Record<string, string>> = {
  create_group: {
    teacher_id: "resolved from the teacher's NAME, server-side, through RLS",
    branch_id: "resolved from the branch's name",
    subject_id: "resolved from the subject's name",
    room_id: "resolved from the room's name, within the chosen branch",
    weekdays: "supplied from the `days` argument, parsed out of plain language",
  },
  set_schedule: {
    group_id: "resolved from the class NAME through RLS",
    room_id: "resolved from the room's name",
    weekdays: "supplied from the `days` argument",
    series_id:
      "never sent: the assistant cannot say WHICH of a class's bookings is meant, and guessing would delete the other one",
  },
  add_student: {
    group_id: "resolved from the class name",
    password: "generated; a model must never choose or echo one",
    photo: "an uploaded file; there is nothing for a model to put here",
  },
  add_teacher: {
    password: "generated; a model must never choose or echo one",
  },
  assign_practice: {
    group_id: "resolved from the class name",
    kind: "offered as `skill`",
    due_at: "offered as `due`",
    library_id: "the shelf-reuse path; the assistant sets fresh practice",
    library_test_id: "an id no model can know — resolved from the `band` argument",
    title: "defaulted by the server action from the content it generated",
    is_placement: "a placement sets a student's baseline band; too consequential to infer",
  },
  send_announcement: {
    audience: "derived: a class was named, or it goes to everyone",
    group_id: "resolved from the class name",
    telegram_groups:
      "the composer's ticked destinations; a named class supplies its own, and choosing channels for a centre-wide post stays on the page",
  },
};

/** The source of one function, exported or not. */
function bodyOf(source: string, fn: string): string | null {
  const start = source.search(new RegExp(`(?:export )?(?:async )?function ${fn}\\(`));
  if (start === -1) return null;
  const next = source.slice(start + 1).search(/\n(?:export )?(?:async )?function /);
  return next === -1 ? source.slice(start) : source.slice(start, start + 1 + next);
}

/**
 * Every `formData.get("x")` an action reaches — its own body AND every helper
 * it hands the form to, followed transitively.
 *
 * Following matters more than it sounds. `createGroup` does not read a single
 * schedule field itself: `readSchedule` does, and that in turn calls
 * `readWeekdays`. A scan that stopped at the exported function would have
 * declared `create_group` complete while the days were being dropped, which is
 * the exact bug this file exists to catch.
 */
function fieldsRead(file: string, fn: string): string[] {
  const source = readFileSync(join(ROOT, file), "utf8");

  const seen = new Set<string>();
  const bodies: string[] = [];
  const queue = [fn];
  while (queue.length > 0) {
    const name = queue.shift() as string;
    if (seen.has(name)) continue;
    seen.add(name);
    const body = bodyOf(source, name);
    if (!body) continue;
    bodies.push(body);
    // Anything handed the form itself is part of how this action reads it.
    for (const m of body.matchAll(/\b([a-zA-Z_]\w*)\((?:\s*\w+\s*,)?\s*formData\b/g)) {
      if (m[1] !== fn) queue.push(m[1]);
    }
  }

  const text = bodies.join("\n");
  const direct = [...text.matchAll(/formData\s*\.\s*get(?:All)?\(\s*"([^"]+)"/g)].map((m) => m[1]);
  // `readFee(formData, "monthly_fee", …)` — the field name is an argument.
  const named = [...text.matchAll(/\(formData,\s*"([^"]+)"/g)].map((m) => m[1]);
  return [...new Set([...direct, ...named])];
}

describe("an argument the server action reads is offered, or deliberately withheld", () => {
  for (const [id, backing] of Object.entries(BACKED_BY)) {
    it(`${id} → ${backing.fn}`, () => {
      const spec = ACTIONS.find((a) => a.id === id) as ActionSpec;
      expect(spec, `${id} is not in ACTIONS`).toBeDefined();

      // Every role's arguments together: some are narrower than the action.
      const offered = new Set(spec.args.map((a) => a.name));
      const withheld = WITHHELD[id] ?? {};

      for (const field of fieldsRead(backing.file, backing.fn)) {
        const covered = offered.has(field) || field in withheld;
        expect(
          covered,
          `${backing.fn} reads "${field}" and ${id} neither offers it nor explains why not — ` +
            `add it to the action's args, or to WITHHELD with the reason.`,
        ).toBe(true);
      }
    });
  }

  it("nothing is withheld that is also offered", () => {
    // A stale entry here is how a real gap hides: the field gets added to the
    // action, the excuse stays, and the next removal passes silently.
    for (const [id, fields] of Object.entries(WITHHELD)) {
      const spec = ACTIONS.find((a) => a.id === id) as ActionSpec;
      for (const field of Object.keys(fields)) {
        expect(
          spec.args.some((a) => a.name === field),
          `${id} both offers and withholds "${field}" — drop the WITHHELD entry`,
        ).toBe(false);
      }
    }
  });

  it("every withheld field is one the action actually reads", () => {
    for (const [id, fields] of Object.entries(WITHHELD)) {
      const read = new Set(fieldsRead(BACKED_BY[id].file, BACKED_BY[id].fn));
      for (const field of Object.keys(fields)) {
        expect(
          read.has(field),
          `${id} withholds "${field}", which ${BACKED_BY[id].fn} never reads`,
        ).toBe(true);
      }
    }
  });
});

describe("the price fields belong to the owner", () => {
  it("a teacher is not offered a fee they cannot set", () => {
    // `createGroup` writes monthly_fee_minor/teacher_rate_minor only for a
    // center_admin. Offering a teacher the field would accept the number, show
    // it on the confirm card and drop it — this whole file's failure again.
    const create = ACTIONS.find((a) => a.id === "create_group") as ActionSpec;
    const teacher = argsFor(create, "teacher").map((a) => a.name);
    expect(teacher).not.toContain("monthly_fee");
    expect(teacher).not.toContain("teacher_rate");

    const owner = argsFor(create, "center_admin").map((a) => a.name);
    expect(owner).toContain("monthly_fee");
    expect(owner).toContain("teacher_rate");
  });

  it("a teacher still gets the schedule fields", () => {
    // The narrowing must not take the days with it: a teacher creating their
    // own class is the commonest way one gets made.
    const create = ACTIONS.find((a) => a.id === "create_group") as ActionSpec;
    const teacher = argsFor(create, "teacher").map((a) => a.name);
    expect(teacher).toEqual(expect.arrayContaining(["days", "starts_at", "ends_at", "room"]));
  });
});

describe("parseWeekdays", () => {
  it("reads the days out of an English sentence", () => {
    expect(parseWeekdays("Monday, Tuesday and Friday")).toEqual([1, 2, 5]);
    expect(parseWeekdays("mon/wed/fri")).toEqual([1, 3, 5]);
    expect(parseWeekdays("Tue & Thu")).toEqual([2, 4]);
  });

  it("reads Uzbek, where the trap is", () => {
    // `shanba` IS Saturday, and it is also the tail of four other day names. A
    // substring sweep put every class on a Saturday; this is that regression.
    expect(parseWeekdays("dushanba, chorshanba, juma")).toEqual([1, 3, 5]);
    expect(parseWeekdays("seshanba va payshanba")).toEqual([2, 4]);
    expect(parseWeekdays("shanba")).toEqual([6]);
    expect(parseWeekdays("yakshanba")).toEqual([0]);
  });

  it("reads Russian", () => {
    expect(parseWeekdays("понедельник, среда, пятница")).toEqual([1, 3, 5]);
    expect(parseWeekdays("вт, чт")).toEqual([2, 4]);
  });

  it("reads the rhythms a centre sells", () => {
    expect(parseWeekdays("odd days")).toEqual([1, 3, 5]);
    expect(parseWeekdays("toq kunlar")).toEqual([1, 3, 5]);
    expect(parseWeekdays("juft kunlar")).toEqual([2, 4, 6]);
    expect(parseWeekdays("weekend")).toEqual([6, 0]);
  });

  it("comes back empty rather than guessing", () => {
    // Empty means "they did not ask for a schedule". A wrong guess would put a
    // class on a day it does not meet, which nobody would think to check.
    expect(parseWeekdays("")).toEqual([]);
    expect(parseWeekdays("sometime next week")).toEqual([]);
  });

  it("round-trips through the editable form the confirm card shows", () => {
    expect(listDays(parseWeekdays("dushanba, chorshanba, juma"))).toBe("Monday, Wednesday, Friday");
    expect(parseWeekdays(listDays(parseWeekdays("odd days")))).toEqual([1, 3, 5]);
  });
});

describe("parseClockTime", () => {
  it("accepts a time however it was written", () => {
    expect(parseClockTime("15:30")).toBe("15:30");
    expect(parseClockTime("15.30")).toBe("15:30");
    expect(parseClockTime("1530")).toBe("15:30");
    expect(parseClockTime("3:30 pm")).toBe("15:30");
    expect(parseClockTime("9am")).toBe("09:00");
    expect(parseClockTime("12am")).toBe("00:00");
    expect(parseClockTime("8")).toBe("08:00");
  });

  it("refuses what is not a time", () => {
    expect(parseClockTime("")).toBeNull();
    expect(parseClockTime("25:00")).toBeNull();
    expect(parseClockTime("15:75")).toBeNull();
    expect(parseClockTime("after lunch")).toBeNull();
  });
});
