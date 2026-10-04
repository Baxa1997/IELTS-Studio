import "server-only";

import { cache } from "react";

import { composeTestSubtitle } from "@/lib/reading/titles";
import { createAdminClient } from "@/lib/supabase/admin";

import { alternate, mixSlots } from "./mix";
import type { FreeSkill } from "./rotation";

/**
 * What the free daily practice rotates through: the SHARED practice content —
 * the rows with no owner (migration 20260926150000) — never an account's own.
 *
 *   writing    every shared prompt — Task 1 Academic, Task 1 General, Task 2 —
 *              the same set a signed-in learner practises in the studio
 *   reading    the library's FULL TESTS (three passages, ~40 questions), with
 *              one passage of another test mixed in after every second one
 *   listening  the same for the library's full tests (four parts, 40
 *              questions) and their parts — see ./mix for the mix
 *   cefr       the shared CEFR (Multilevel) papers — a full Reading paper
 *              (five parts, 35 questions) or a full Writing paper (three
 *              tasks), alternating. Made by the engine's
 *              scripts/seed_multilevel_library.py; empty until it has run
 *
 * ⚠️ FULL TESTS, NOT PARTS (owner, 2026-09-27: "practice must be full
 * practice, not part"). Until then Reading was the standalone ~14-question
 * passages and Listening one part at a time. The standalone passages are left
 * out now: a part is always a part OF a numbered test, so "Test 12 · Part
 * reading" on a card means passage N of the Test 12 the hub also shows.
 *
 * Read with the service role because a visitor has no session for RLS to use.
 * Nothing here selects an answer key: these rows feed cards and pickers, and
 * the runners load their own answer-free material.
 *
 * ⚠️ ORDER IS LOAD-BEARING. The rotation indexes into these arrays, so an
 * unstable order would hand a visitor a different practice on every request.
 * Every order below ends on `id`. Adding content shifts some visitors'
 * positions once — fine; reshuffling on every read is not.
 */

/** A whole test, one part of one, or — Writing — one task. */
export type PracticeFormat = "full" | "part" | "task";

export interface PoolItem {
  /** The runner's last path segment: a reading test or passage id, a
   *  listening `libraryId` or `libraryId_part`, a prompt id. URL-safe. */
  key: string;
  /** What the runner and the marking route ask for — the reading test or
   *  passage, the listening library row, the writing prompt. */
  source: string;
  format: PracticeFormat;
  /** The "Test N" on the cover: the test's number in the signed-in hub's
   *  library ("Practice test N"), counted the way that hub counts — so a part
   *  carries the number of the test it comes from. Writing: the prompt's
   *  number within its task, as the writing hub numbers its tabs. */
  testNo: number;
  /** The passage or part number when `format` is "part"; otherwise null. */
  part: number | null;
  /** CEFR only: which of the exam's papers this is. Null for every other
   *  skill, whose pools hold one kind of paper each. */
  paper: "reading" | "writing" | null;
  title: string;
  topic: string | null;
  /** The facts line's first word: "3 passages", "Passage 2", "4 parts",
   *  "Part 3", "Task 2". Plain English — the practice pages are English. */
  kind: string | null;
  /** 1–9-ish difficulty, where the source has one. */
  level: number | null;
  minutes: number;
  questions: number | null;
}

/** The exam's own time for each — also what the practice page's "How long
 *  does one practice take?" answer says, so the two cannot disagree. */
export const MINUTES = {
  readingTest: 60,
  readingPassage: 20,
  listeningTest: 30,
  listeningPart: 8,
  // The Multilevel exam's own: an hour for Reading, about an hour for the
  // three Writing tasks (CEFR_MULTILEVEL_GENERATION_SPEC.md).
  cefrReading: 60,
  cefrWriting: 60,
} as const;

/** A full Multilevel Reading paper: Parts 1–5 hold questions 1–35. */
const CEFR_READING_QUESTIONS = 35;

/** The exam's own names for the writing tasks, and the time each is given. */
export const WRITING_TASK: Record<string, { kind: string; minutes: number }> = {
  task2: { kind: "Task 2", minutes: 40 },
  task1_academic: { kind: "Academic Task 1", minutes: 20 },
  task1_general: { kind: "General Training Task 1", minutes: 20 },
};

/** The first sentence of a prompt, for a card — the full text is on the page. */
function firstSentence(text: string, max = 110): string {
  const s = text.split(/(?<=[.?!])\s/)[0]?.trim() ?? text.trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

type Admin = ReturnType<typeof createAdminClient>;

/** PostgREST's default ceiling on rows per response. */
const PAGE = 1000;

/**
 * How many questions each shared reading passage has.
 *
 * ⚠️ PAGED, because the hundred-odd tests are ~4,500 question rows and a select
 * stops at 1,000 without an error — the counts would come out short, and
 * whichever passages fell past the cut would drop out of the pool as
 * "no questions". The first page asks for the total; the rest go in parallel.
 */
async function questionCounts(admin: Admin): Promise<Map<string, number>> {
  const page = (from: number, count: boolean) =>
    admin
      .from("reading_questions")
      .select("passage_id", count ? { count: "exact" } : undefined)
      .is("organization_id", null)
      .order("id")
      .range(from, from + PAGE - 1);
  const first = await page(0, true);
  const total = first.count ?? 0;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Math.ceil(total / PAGE) - 1) }, (_, i) => page((i + 1) * PAGE, false)),
  );
  const counts = new Map<string, number>();
  for (const res of [first, ...rest]) {
    for (const q of res.data ?? []) counts.set(q.passage_id as string, (counts.get(q.passage_id as string) ?? 0) + 1);
  }
  return counts;
}

async function readingPool(admin: Admin): Promise<PoolItem[]> {
  const [{ data: tests }, { data: passages }, counts] = await Promise.all([
    // The hub's own order (app/(shell)/read/page.tsx), so "Test N" here is
    // "Practice test N" there.
    admin
      .from("reading_tests")
      .select("id, target_band")
      .eq("is_library", true)
      .order("target_band", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    admin
      .from("reading_passages")
      .select("id, test_id, title, topic, difficulty, order_in_test")
      .eq("is_library", true)
      .not("test_id", "is", null)
      .order("order_in_test", { ascending: true })
      .order("id", { ascending: true }),
    questionCounts(admin),
  ]);

  const byTest = new Map<string, NonNullable<typeof passages>>();
  for (const p of passages ?? []) {
    const list = byTest.get(p.test_id as string) ?? [];
    list.push(p);
    byTest.set(p.test_id as string, list);
  }

  // Numbered BEFORE any is dropped, so a test's number stays the hub's even
  // when an earlier one is skipped here. A test goes in only if every passage
  // has questions: a "full" test that is short a passage is not one.
  const library = (tests ?? [])
    .map((t, i) => ({ id: t.id as string, band: (t.target_band as number | null) ?? null, no: i + 1, passages: byTest.get(t.id as string) ?? [] }))
    .filter((t) => t.passages.length > 0 && t.passages.every((p) => (counts.get(p.id as string) ?? 0) > 0));

  return mixSlots(library.map((t) => t.passages.length)).map(({ test, part }) => {
    const t = library[test];
    if (part === null) {
      return {
        key: t.id,
        source: t.id,
        format: "full",
        testNo: t.no,
        part: null,
        paper: null,
        // The passages' own titles, as the hub's subtitle lists them — their
        // topics are whole sentences, and three of those make no headline.
        title: composeTestSubtitle(t.passages.map((p) => p.title as string)),
        topic: null,
        kind: `${t.passages.length} passages`,
        level: t.band,
        minutes: MINUTES.readingTest,
        questions: t.passages.reduce((n, p) => n + (counts.get(p.id as string) ?? 0), 0),
      };
    }
    const p = t.passages[part - 1];
    const order = (p.order_in_test as number | null) ?? part;
    return {
      key: p.id as string,
      source: p.id as string,
      format: "part",
      testNo: t.no,
      part: order,
      paper: null,
      title: (p.title as string) ?? "Reading passage",
      // The passage's topic is a whole sentence ("how heat pumps work and
      // why …"), which the headline already says better.
      topic: null,
      kind: `Passage ${order}`,
      level: (p.difficulty as number | null) ?? null,
      minutes: MINUTES.readingPassage,
      questions: counts.get(p.id as string) ?? null,
    };
  });
}

async function listeningPool(admin: Admin): Promise<PoolItem[]> {
  // Full tests only (`part` 0 — the rest are single-recording quick
  // practices), and only their topics: `content` also holds the scripts and
  // the answers.
  const { data } = await admin
    .from("listening_library")
    .select(
      "id, difficulty, created_at, version:content->version, t1:content->parts->0->>topic, t2:content->parts->1->>topic, t3:content->parts->2->>topic, t4:content->parts->3->>topic",
    )
    .is("organization_id", null)
    .eq("active", true)
    .eq("part", 0)
    .order("id");
  const rows = (data ?? []) as Record<string, unknown>[];

  /* The hub's own order (shared/components/listening/listening-client.tsx:
     newest format first, then easiest, then oldest — the engine's catalogue
     order, re-sorted by version), so "Test N" here is "Practice test N" there. */
  const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
  rows.sort(
    (a, b) =>
      num(b.version, 1) - num(a.version, 1) ||
      num(a.difficulty, 3) - num(b.difficulty, 3) ||
      String(a.created_at).localeCompare(String(b.created_at)) ||
      String(a.id).localeCompare(String(b.id)),
  );

  const library = rows
    .map((r, i) => ({
      id: r.id as string,
      no: i + 1,
      level: (r.difficulty as number | null) ?? null,
      // Part number → its topic, for the parts this test really has.
      parts: ([1, 2, 3, 4] as const)
        .map((n) => ({ n, topic: r[`t${n}`] as string | null }))
        .filter((p): p is { n: 1 | 2 | 3 | 4; topic: string } => Boolean(p.topic)),
    }))
    .filter((t) => t.parts.length > 0);

  return mixSlots(library.map((t) => t.parts.length)).map(({ test, part }) => {
    const t = library[test];
    if (part === null) {
      return {
        key: t.id,
        source: t.id,
        format: "full",
        testNo: t.no,
        part: null,
        paper: null,
        title: composeTestSubtitle(t.parts.map((p) => p.topic)),
        topic: null,
        kind: `${t.parts.length} parts`,
        level: t.level,
        minutes: MINUTES.listeningTest,
        questions: t.parts.length * 10,
      };
    }
    const p = t.parts[part - 1];
    return {
      key: `${t.id}_${p.n}`,
      source: t.id,
      format: "part",
      testNo: t.no,
      part: p.n,
      paper: null,
      title: p.topic,
      topic: null,
      kind: `Part ${p.n}`,
      level: t.level,
      minutes: MINUTES.listeningPart,
      questions: 10,
    };
  });
}

async function writingPool(admin: Admin): Promise<PoolItem[]> {
  const { data } = await admin
    .from("writing_prompts")
    .select("id, task_type, prompt_text, topic_family, difficulty, created_at")
    .is("organization_id", null)
    .order("id");
  const rows = (data ?? []).filter((r) => WRITING_TASK[r.task_type as string]);

  /* The writing hub numbers each task's tab by difficulty, easiest first,
     newest first within a level (app/(shell)/write/_components/library.tsx) —
     counted the same way here so "Test N" matches "Practice test N". */
  const noById = new Map<string, number>();
  for (const task of Object.keys(WRITING_TASK)) {
    rows
      .filter((r) => r.task_type === task)
      .sort(
        (a, b) =>
          ((a.difficulty as number | null) ?? 99) - ((b.difficulty as number | null) ?? 99) ||
          String(b.created_at).localeCompare(String(a.created_at)) ||
          String(a.id).localeCompare(String(b.id)),
      )
      .forEach((r, i) => noById.set(r.id as string, i + 1));
  }

  return rows.map((r) => ({
    key: r.id as string,
    source: r.id as string,
    format: "task",
    testNo: noById.get(r.id as string) ?? 0,
    part: null,
    paper: null,
    title: firstSentence((r.prompt_text as string) ?? ""),
    topic: (r.topic_family as string | null) ?? null,
    kind: WRITING_TASK[r.task_type as string].kind,
    level: (r.difficulty as number | null) ?? null,
    minutes: WRITING_TASK[r.task_type as string].minutes,
    questions: null,
  }));
}

async function cefrPool(admin: Admin): Promise<PoolItem[]> {
  /* The SHARED papers only (no owner — app migration 20261004130000), whole
     papers only, and only what a card shows: `content` also holds the answer
     keys and the model answers. Parts and tasks are stored in exam order, so
     index 0 is Part 1 / Task 1.1. */
  const { data } = await admin
    .from("multilevel_items")
    .select(
      "id, paper, created_at, r1:content->parts->0->>title, r4:content->parts->3->>title, r5:content->parts->4->>title, w1:content->tasks->0->>situation, w2:content->tasks->2->>question",
    )
    .is("organization_id", null)
    .eq("scope", "full")
    .in("paper", ["reading", "writing"])
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  const rows = (data ?? []) as Record<string, unknown>[];
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  // Numbered within each paper, oldest first: "Test 3" is the third Reading
  // paper, or the third Writing paper — the caption under it says which.
  const reading = rows
    .filter((r) => r.paper === "reading")
    .map((r, i): PoolItem => ({
      key: r.id as string,
      source: r.id as string,
      format: "full",
      testNo: i + 1,
      part: null,
      paper: "reading",
      title:
        composeTestSubtitle([r.r1, r.r4, r.r5].map(text).filter((t): t is string => Boolean(t))) ||
        "CEFR Reading paper",
      topic: null,
      kind: "5 parts",
      level: null,
      minutes: MINUTES.cefrReading,
      questions: CEFR_READING_QUESTIONS,
    }));
  const writing = rows
    .filter((r) => r.paper === "writing")
    .map((r, i): PoolItem => ({
      key: r.id as string,
      source: r.id as string,
      format: "full",
      testNo: i + 1,
      part: null,
      paper: "writing",
      // Task 2's forum question is the paper's real headline; Section 1's
      // situation stands in when a paper has none.
      title: firstSentence(text(r.w2) ?? text(r.w1) ?? "CEFR Writing paper"),
      topic: null,
      kind: "3 tasks",
      level: null,
      minutes: MINUTES.cefrWriting,
      questions: null,
    }));
  return alternate(reading, writing);
}

export const loadPool = cache(async function loadPool(skill: FreeSkill): Promise<PoolItem[]> {
  const admin = createAdminClient();
  if (skill === "writing") return writingPool(admin);
  if (skill === "reading") return readingPool(admin);
  if (skill === "cefr") return cefrPool(admin);
  return listeningPool(admin);
});
