import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  clearReadingProgress,
  countAnswered,
  readProgressBody,
  saveReadingProgress,
} from "./progress";

/**
 * Saving an unfinished reading run, guarded where it fails SILENTLY.
 *
 * Every case below is a defect that reports success:
 *
 *   1. A WRITE THAT TOUCHED NOTHING. `update()` against a filter that matches no
 *      row is not an error — it returns no error and no rows. Without asking for
 *      the rows back, an autosave that saved nothing is indistinguishable from
 *      one that worked, and the learner discovers it only when Resume hands them
 *      an empty test. This repo already records the trap for the finance schema;
 *      these tests hold the line for `reading_attempts`.
 *
 *   2. TWO TABS, TWO ROWS. The live-row rule is a PARTIAL unique index, which
 *      ON CONFLICT cannot address through PostgREST — so the code finds and then
 *      writes, and must handle losing that race. If 23505 is not recognised, the
 *      second tab reports a 500 and keeps retrying forever.
 *
 *   3. A KEY ON THE WRONG COLUMN. A full test is keyed by test_id and a single
 *      passage by passage_id, and the table has an XOR check constraint. Writing
 *      the wrong one produces a row that violates the constraint, or worse, a run
 *      filed against a practice the learner never opened.
 *
 *   4. A STRING WHERE AN INT GOES. `seconds_left` is an int column. A string from
 *      a hand-made request fails the insert at the far end of an autosave that
 *      nobody is watching, so the body parser has to drop it rather than pass it.
 */

// ---- A Supabase test double, only as deep as this module reaches ------------

type Row = Record<string, unknown>;

interface Call {
  table: string;
  op: "select" | "update" | "insert" | "delete";
  filters: Record<string, unknown>;
  payload?: Row;
  /** Whether the caller asked for the written rows back. */
  selected: boolean;
}

/**
 * Records what was asked of it and replays scripted answers. Deliberately not a
 * working database: the point is to assert the SHAPE of the calls (filters,
 * payload, and crucially whether `.select()` was chained onto a write), which is
 * what the failures above are all about.
 */
function fakeDb(script: {
  existing?: Row | null;
  findError?: boolean;
  updateRows?: Row[] | null;
  updateError?: boolean;
  insertRow?: Row | null;
  insertError?: { code?: string } | null;
  deleteRows?: Row[] | null;
  deleteError?: boolean;
}) {
  const calls: Call[] = [];

  function builder(table: string, op: Call["op"], payload?: Row) {
    const call: Call = { table, op, filters: {}, payload, selected: false };
    calls.push(call);
    const chain = {
      eq(col: string, val: unknown) {
        call.filters[col] = val;
        return chain;
      },
      select() {
        call.selected = true;
        if (op === "update") {
          return Promise.resolve({
            data: script.updateRows ?? null,
            error: script.updateError ? { message: "boom" } : null,
          });
        }
        if (op === "delete") {
          return Promise.resolve({
            data: script.deleteRows ?? null,
            error: script.deleteError ? { message: "boom" } : null,
          });
        }
        if (op === "insert") {
          return {
            single: () =>
              Promise.resolve({
                data: script.insertRow ?? null,
                error: script.insertError ?? null,
              }),
          };
        }
        // A read: the find-then-write lookup.
        return chain;
      },
      maybeSingle() {
        return Promise.resolve({
          data: script.existing ?? null,
          error: script.findError ? { message: "boom" } : null,
        });
      },
    };
    return chain;
  }

  const db = {
    from(table: string) {
      return {
        select: () => builder(table, "select").select(),
        update: (payload: Row) => builder(table, "update", payload),
        insert: (payload: Row) => builder(table, "insert", payload),
        delete: () => builder(table, "delete"),
      };
    },
  };
  return { db: db as unknown as SupabaseClient, calls };
}

const input = {
  studentId: "stu-1",
  organizationId: "org-1",
  answers: { q1: "true", q2: "  ", q3: "B" },
  cursorIndex: 2,
  secondsLeft: 1800,
};

// ---- 1. A write that touched nothing ---------------------------------------

describe("a write that saved nothing is reported as a failure", () => {
  it("asks for the rows back after an update", async () => {
    const { db, calls } = fakeDb({ existing: { id: "att-1" }, updateRows: [{ id: "att-1" }] });
    const res = await saveReadingProgress(db, { testId: "t-1" }, input);
    expect(res).toEqual({ ok: true, id: "att-1", created: false });

    const update = calls.find((c) => c.op === "update");
    expect(update, "no update was issued").toBeTruthy();
    // ⚠️ THE ASSERTION THIS FILE EXISTS FOR.
    expect(update!.selected, "update did not chain .select()").toBe(true);
  });

  it("returns not_saved when the update matched no row", async () => {
    // No error, no rows — exactly how a silently-filtered write looks.
    const { db } = fakeDb({ existing: { id: "att-1" }, updateRows: [] });
    const res = await saveReadingProgress(db, { testId: "t-1" }, input);
    expect(res).toEqual({ ok: false, reason: "not_saved" });
  });

  it("asks for the rows back after a delete, and counts them", async () => {
    const { db, calls } = fakeDb({ deleteRows: [{ id: "att-1" }] });
    const res = await clearReadingProgress(db, { testId: "t-1" }, "stu-1");
    expect(res).toEqual({ ok: true, cleared: 1 });
    const del = calls.find((c) => c.op === "delete");
    expect(del!.selected, "delete did not chain .select()").toBe(true);
  });

  it("clearing nothing is success, not an error", async () => {
    // A learner who never paused has no row; submit still calls this every time.
    const { db } = fakeDb({ deleteRows: [] });
    expect(await clearReadingProgress(db, { testId: "t-1" }, "stu-1")).toEqual({
      ok: true,
      cleared: 0,
    });
  });
});

// ---- 2. Two tabs, two rows -------------------------------------------------

describe("losing the race for the live row", () => {
  it("reports already_open on the partial unique index violation", async () => {
    const { db } = fakeDb({ existing: null, insertError: { code: "23505" } });
    const res = await saveReadingProgress(db, { testId: "t-1" }, input);
    expect(res).toEqual({ ok: false, reason: "already_open" });
  });

  it("treats any other insert error as a real failure", async () => {
    const { db } = fakeDb({ existing: null, insertError: { code: "42703" } });
    expect(await saveReadingProgress(db, { testId: "t-1" }, input)).toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("reports a failed lookup rather than inserting a second row", async () => {
    /* If the find errors and the code pressed on to the insert, a learner with an
       existing live row would hit the unique index every time — an autosave that
       can never succeed. It has to fail loudly instead. */
    const { db, calls } = fakeDb({ findError: true });
    expect(await saveReadingProgress(db, { testId: "t-1" }, input)).toEqual({
      ok: false,
      reason: "failed",
    });
    expect(
      calls.some((c) => c.op === "insert"),
      "inserted after a failed lookup",
    ).toBe(false);
  });
});

// ---- 3. A key on the wrong column ------------------------------------------

describe("the run is filed against the right practice", () => {
  it("keys a full test by test_id", async () => {
    const { db, calls } = fakeDb({ existing: null, insertRow: { id: "new-1" } });
    await saveReadingProgress(db, { testId: "t-9" }, input);
    const insert = calls.find((c) => c.op === "insert")!;
    expect(insert.payload!.test_id).toBe("t-9");
    expect(insert.payload).not.toHaveProperty("passage_id");
    expect(insert.payload!.status).toBe("in_progress");
  });

  it("keys a single passage by passage_id", async () => {
    const { db, calls } = fakeDb({ existing: null, insertRow: { id: "new-1" } });
    await saveReadingProgress(db, { passageId: "p-9" }, { ...input, cursorIndex: null });
    const insert = calls.find((c) => c.op === "insert")!;
    expect(insert.payload!.passage_id).toBe("p-9");
    expect(insert.payload).not.toHaveProperty("test_id");
  });

  it("scopes the lookup to this learner and this practice", async () => {
    const { db, calls } = fakeDb({ existing: null, insertRow: { id: "new-1" } });
    await saveReadingProgress(db, { testId: "t-9" }, input);
    const find = calls.find((c) => c.op === "select")!;
    expect(find.filters).toEqual({
      student_id: "stu-1",
      test_id: "t-9",
      status: "in_progress",
    });
  });

  it("only ever clears an in_progress row", async () => {
    /* ⚠️ Without the status filter this delete would wipe the learner's GRADED
       attempts for the test — their whole history for it — every time they
       submitted. */
    const { db, calls } = fakeDb({ deleteRows: [] });
    await clearReadingProgress(db, { testId: "t-9" }, "stu-1");
    expect(calls.find((c) => c.op === "delete")!.filters).toEqual({
      student_id: "stu-1",
      test_id: "t-9",
      status: "in_progress",
    });
  });

  it("stores no marks, band or key on an unfinished run", async () => {
    // A learner must not be able to promote their own draft into a score.
    const { db, calls } = fakeDb({ existing: null, insertRow: { id: "new-1" } });
    await saveReadingProgress(db, { testId: "t-9" }, input);
    const payload = calls.find((c) => c.op === "insert")!.payload!;
    for (const forbidden of [
      "band",
      "raw_score",
      "correct_count",
      "percent",
      "details",
      "type_breakdown",
      "submitted_at",
    ]) {
      expect(payload, `an unfinished run must not carry ${forbidden}`).not.toHaveProperty(
        forbidden,
      );
    }
  });
});

// ---- 4. What the row records about progress --------------------------------

describe("countAnswered", () => {
  it("counts only questions that actually carry an answer", () => {
    // Whitespace is not an answer; the hub would otherwise overstate progress.
    expect(countAnswered({ a: "true", b: "   ", c: "", d: "B" })).toBe(2);
  });

  it("is zero for an untouched run", () => {
    expect(countAnswered({})).toBe(0);
  });

  it("is what gets stored, so the card never needs the answers themselves", async () => {
    const { db, calls } = fakeDb({ existing: null, insertRow: { id: "new-1" } });
    await saveReadingProgress(db, { testId: "t-1" }, input);
    // input has q1 and q3 answered, q2 blank.
    expect(calls.find((c) => c.op === "insert")!.payload!.answered_count).toBe(2);
  });
});

// ---- 5. The body parser ----------------------------------------------------

describe("readProgressBody", () => {
  it("keeps string answers and drops everything else", () => {
    const out = readProgressBody({
      answers: { a: "yes", b: 7, c: null, d: { nested: true }, e: "no" },
      cursorIndex: 2,
      secondsLeft: 1800,
    });
    expect(out.answers).toEqual({ a: "yes", e: "no" });
  });

  it("drops a non-number where an int column is expected", () => {
    // ⚠️ A string here fails the insert at the far end of an unwatched autosave.
    const out = readProgressBody({ cursorIndex: "2", secondsLeft: "1800" });
    expect(out.cursorIndex).toBeNull();
    expect(out.secondsLeft).toBeNull();
  });

  it("drops nonsense numbers rather than storing them", () => {
    expect(readProgressBody({ secondsLeft: -5 }).secondsLeft).toBeNull();
    expect(readProgressBody({ secondsLeft: Number.NaN }).secondsLeft).toBeNull();
    expect(readProgressBody({ secondsLeft: Number.POSITIVE_INFINITY }).secondsLeft).toBeNull();
  });

  it("rounds a fractional second", () => {
    expect(readProgressBody({ secondsLeft: 1799.6 }).secondsLeft).toBe(1800);
  });

  it("survives a missing or junk body", () => {
    for (const raw of [undefined, null, {}, "nonsense", 42, []]) {
      const out = readProgressBody(raw);
      expect(out.answers).toEqual({});
      expect(out.cursorIndex).toBeNull();
      expect(out.secondsLeft).toBeNull();
    }
  });
});
