/**
 * The IELTS exam's own facts about each writing task: what the paper calls it,
 * the time it is given, and the length it asks for.
 *
 * Pure, so a client screen can read it as well as the server. It lived in
 * lib/free-practice/pools.ts, which is `server-only`, and the /grade checker
 * needs the same numbers in the browser — a second copy there is how the two
 * would have come to disagree. pools.ts re-exports it, so its importers are
 * unchanged.
 */

/** Typed by string, not EssayTaskType, because callers index it with a
 *  task_type read from the database and filter on what is found. */
export const WRITING_TASK: Record<string, { kind: string; minutes: number; minWords: number }> = {
  task2: { kind: "Task 2", minutes: 40, minWords: 250 },
  task1_academic: { kind: "Academic Task 1", minutes: 20, minWords: 150 },
  task1_general: { kind: "General Training Task 1", minutes: 20, minWords: 150 },
};
