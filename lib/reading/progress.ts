/**
 * SAVING AN UNFINISHED READING RUN — the data behind the hub's "Paused" card.
 *
 * Reading used to write nothing until the learner submitted, so closing the tab
 * lost the run outright. That was the one state in the practice-card design with
 * nothing underneath it (Writing has stored drafts since day one). An
 * `in_progress` row now holds the answers, where the learner was, and what the
 * clock had left.
 *
 * Both shapes of reading practice come through here — a full 3-passage test
 * (`test_id`) and a single passage (`passage_id`) — because the only difference
 * between them is which column identifies the thing, and the surrounding
 * find-then-write, the race handling and the cleanup are all identical.
 *
 * ⚠️ ONE LIVE ROW PER THING, AND THE DATABASE ENFORCES IT.
 * 20260919120000_practice_resume.sql carries partial unique indexes on
 * (student_id, test_id) and (student_id, passage_id) WHERE status = 'in_progress'.
 * Two tabs on one test would otherwise autosave into two rows and the hub would
 * list it paused twice. The indexes are PARTIAL, so ON CONFLICT cannot address
 * them through PostgREST — its select syntax has nowhere to put the predicate —
 * which is why this finds and then writes instead of upserting. The loser of a
 * real race violates the index and gets `already_open` back.
 *
 * ⚠️ NOTHING SAVED HERE IS GRADED. The row carries the learner's own answers and
 * no key, marks or band; only the submit routes write those. A learner cannot
 * promote their own draft into a score.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Which practice the run belongs to. Exactly one is set — the table has a CHECK
 *  constraint saying so (reading_attempts_passage_xor_test). */
export type ProgressKey = { testId: string } | { passageId: string };

export interface ProgressInput {
  studentId: string;
  organizationId: string;
  answers: Record<string, string>;
  /** 1-based passage index within a full test. Null for a single passage. */
  cursorIndex: number | null;
  secondsLeft: number | null;
}

export type SaveResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; reason: "already_open" | "not_saved" | "failed" };

/** The key as PostgREST filters, plus the column it is NOT keyed by, so a test
 *  run can never match a passage run of the same id. */
function keyColumns(key: ProgressKey): { column: "test_id" | "passage_id"; value: string } {
  return "testId" in key
    ? { column: "test_id", value: key.testId }
    : { column: "passage_id", value: key.passageId };
}

/**
 * Write (or update) this learner's unfinished run. Needs a service-role client:
 * `reading_attempts` is the learner's own row, but the routes already hold one to
 * read the answer keys and using it keeps the write off the RLS path entirely.
 */
export async function saveReadingProgress(
  admin: SupabaseClient,
  key: ProgressKey,
  input: ProgressInput,
): Promise<SaveResult> {
  const { column, value } = keyColumns(key);
  const patch = {
    answers: input.answers,
    answered_count: countAnswered(input.answers),
    cursor_index: input.cursorIndex,
    seconds_left: input.secondsLeft,
  };

  const { data: existing, error: findErr } = await admin
    .from("reading_attempts")
    .select("id")
    .eq("student_id", input.studentId)
    .eq(column, value)
    .eq("status", "in_progress")
    .maybeSingle();
  if (findErr) return { ok: false, reason: "failed" };

  if (existing) {
    /* ⚠️ .select() AFTER THE UPDATE, ALWAYS. A write whose row filter matches
       nothing reports success with zero rows touched, so without asking for the
       rows back an autosave that saved nothing is indistinguishable from one that
       worked. Recorded for this schema in the finance notes; it applies here too. */
    const { data: rows, error: upErr } = await admin
      .from("reading_attempts")
      .update(patch)
      .eq("id", existing.id as string)
      .select("id");
    if (upErr) return { ok: false, reason: "failed" };
    if (!rows || rows.length === 0) return { ok: false, reason: "not_saved" };
    return { ok: true, id: existing.id as string, created: false };
  }

  const { data: created, error: insErr } = await admin
    .from("reading_attempts")
    .insert({
      organization_id: input.organizationId,
      student_id: input.studentId,
      [column]: value,
      status: "in_progress",
      ...patch,
    })
    .select("id")
    .single();
  if (insErr) {
    // 23505 = one of the partial unique indexes: another tab got there first.
    if ((insErr as { code?: string }).code === "23505") {
      return { ok: false, reason: "already_open" };
    }
    return { ok: false, reason: "failed" };
  }
  return { ok: true, id: created.id as string, created: true };
}

/**
 * Drop this learner's unfinished run.
 *
 * ⚠️ THE SUBMIT ROUTES MUST CALL THIS, OR A MARKED TEST LOOKS PAUSED FOREVER.
 * The hub card prefers an open run over a past result — the thing you left open
 * matters more than the thing you finished — so a stale `in_progress` row hides
 * the band the learner just earned behind a "Resume" button.
 *
 * Returns how many rows went, which is the only way to tell "cleared it" from
 * "there was nothing to clear": a delete that matches nothing is not an error.
 */
export async function clearReadingProgress(
  admin: SupabaseClient,
  key: ProgressKey,
  studentId: string,
): Promise<{ ok: boolean; cleared: number }> {
  const { column, value } = keyColumns(key);
  const { data, error } = await admin
    .from("reading_attempts")
    .delete()
    .eq("student_id", studentId)
    .eq(column, value)
    .eq("status", "in_progress")
    .select("id");
  if (error) return { ok: false, cleared: 0 };
  return { ok: true, cleared: data?.length ?? 0 };
}

/** How many questions actually carry an answer. Stored on the row so the hub can
 *  say "17 of 40 answered" without ever being handed the answers themselves. */
export function countAnswered(answers: Record<string, string>): number {
  return Object.values(answers).filter((v) => typeof v === "string" && v.trim() !== "").length;
}

/** Parse a progress request body. Anything unrecognised becomes null rather than
 *  reaching the database — `seconds_left` is an int column and a string would
 *  fail the insert at the far end of an autosave nobody is watching. */
export function readProgressBody(
  raw: unknown,
): Pick<ProgressInput, "answers" | "cursorIndex" | "secondsLeft"> {
  const body = (raw ?? {}) as {
    answers?: unknown;
    cursorIndex?: unknown;
    secondsLeft?: unknown;
  };
  const answers: Record<string, string> = {};
  if (body.answers && typeof body.answers === "object") {
    for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
      if (typeof v === "string") answers[k] = v;
    }
  }
  return {
    answers,
    cursorIndex: wholeNumber(body.cursorIndex),
    secondsLeft: wholeNumber(body.secondsLeft),
  };
}

function wholeNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
}
