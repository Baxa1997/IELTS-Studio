import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

import type { FreeSkill } from "./rotation";

/**
 * What the free daily practice rotates through: the SHARED practice content —
 * the rows with no owner (migration 20260926150000) — never an account's own.
 *
 *   writing    every shared prompt — Task 1 Academic, Task 1 General, Task 2 —
 *              the same set a signed-in learner practises in the studio
 *   reading    the standalone practice passages (~20 min each), not full tests
 *   listening  each PART of each active library test, one at a time (~8 min)
 *
 * Read with the service role because a visitor has no session for RLS to use.
 * Nothing here selects an answer key: these rows feed cards and pickers, and
 * the runners load their own answer-free material.
 *
 * ⚠️ ORDER IS BY ID, AND IT IS LOAD-BEARING. The rotation indexes into these
 * arrays, so an unstable order would hand a visitor a different practice on
 * every request. Adding content shifts some visitors' positions once — fine;
 * reshuffling on every read is not.
 */

export interface PoolItem {
  /** What the runner is given: a prompt id, a passage id, or `libraryId_part`.
   *  URL-safe — it is the last segment of the runner's path. */
  key: string;
  title: string;
  topic: string | null;
  /** Writing's task ("Task 2"), Listening's part ("Part 3"); null for Reading. */
  kind: string | null;
  /** 1–9-ish difficulty, where the source has one. */
  level: number | null;
  minutes: number;
  questions: number | null;
}

const MINUTES: Record<FreeSkill, number> = { writing: 40, reading: 20, listening: 8 };

/** The exam's own names for the writing tasks, and the time each is given. */
const WRITING_TASK: Record<string, { kind: string; minutes: number }> = {
  task2: { kind: "Task 2", minutes: 40 },
  task1_academic: { kind: "Academic Task 1", minutes: 20 },
  task1_general: { kind: "General Training Task 1", minutes: 20 },
};

/** The first sentence of a prompt, for a card — the full text is on the page. */
function firstSentence(text: string, max = 110): string {
  const s = text.split(/(?<=[.?!])\s/)[0]?.trim() ?? text.trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export const loadPool = cache(async function loadPool(skill: FreeSkill): Promise<PoolItem[]> {
  const admin = createAdminClient();

  if (skill === "writing") {
    const { data } = await admin
      .from("writing_prompts")
      .select("id, task_type, prompt_text, topic_family, difficulty")
      .is("organization_id", null)
      .order("id");
    return (data ?? [])
      .filter((r) => WRITING_TASK[r.task_type as string])
      .map((r) => ({
        key: r.id as string,
        title: firstSentence((r.prompt_text as string) ?? ""),
        topic: (r.topic_family as string | null) ?? null,
        kind: WRITING_TASK[r.task_type as string].kind,
        level: (r.difficulty as number | null) ?? null,
        minutes: WRITING_TASK[r.task_type as string].minutes,
        questions: null,
      }));
  }

  if (skill === "reading") {
    const { data } = await admin
      .from("reading_passages")
      .select("id, title, topic, difficulty")
      .is("organization_id", null)
      .is("test_id", null)
      .eq("status", "approved")
      .order("id");
    const rows = data ?? [];
    // One count query for the lot rather than one per passage.
    const { data: qs } = await admin
      .from("reading_questions")
      .select("passage_id")
      .is("organization_id", null)
      .in(
        "passage_id",
        rows.map((r) => r.id as string),
      );
    const counts = new Map<string, number>();
    for (const q of qs ?? []) counts.set(q.passage_id as string, (counts.get(q.passage_id as string) ?? 0) + 1);
    return rows
      .filter((r) => (counts.get(r.id as string) ?? 0) > 0)
      .map((r) => ({
        key: r.id as string,
        title: (r.title as string) ?? "Reading practice",
        topic: (r.topic as string | null) ?? null,
        kind: null,
        level: (r.difficulty as number | null) ?? null,
        minutes: MINUTES.reading,
        questions: counts.get(r.id as string) ?? null,
      }));
  }

  // Listening: every part of every active shared test. Only the part topics are
  // selected — `content` also holds the scripts and the answers.
  const { data } = await admin
    .from("listening_library")
    .select(
      "id, difficulty, t1:content->parts->0->>topic, t2:content->parts->1->>topic, t3:content->parts->2->>topic, t4:content->parts->3->>topic",
    )
    .is("organization_id", null)
    .eq("active", true)
    .order("id");
  const out: PoolItem[] = [];
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    ([1, 2, 3, 4] as const).forEach((part) => {
      const topic = r[`t${part}`] as string | null;
      if (!topic) return;
      out.push({
        key: `${r.id as string}_${part}`,
        title: topic,
        topic: null,
        kind: `Part ${part}`,
        level: (r.difficulty as number | null) ?? null,
        minutes: MINUTES.listening,
        questions: 10,
      });
    });
  }
  return out;
});
