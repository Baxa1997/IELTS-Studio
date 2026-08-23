/**
 * Lesson vocabulary and marking shapes that carry NO runtime dependencies.
 *
 * Split out of `types.ts` so the lesson runner — a Client Component that needs
 * `isOpen` and `isOpenResult` at runtime — can import them without dragging zod
 * into the browser bundle. `types.ts` re-exports everything here, so existing
 * `@/lib/lessons/types` imports keep working.
 *
 * The `import type` from `./types` below is a deliberate type-level cycle:
 * `Exercise` is inferred from the zod schema next door, and a type-only import is
 * erased at compile time, so this module stays a runtime leaf.
 */

import type { Exercise, OpenExercise } from "./types";

/** Marked in code, instantly, for everyone: a comparison, not a judgement. */
export const CLOSED_TYPES = [
  "mcq_single",
  "mcq_multi",
  "gap_fill",
  "transform",
  "error_correction",
  "matching",
  "ordering",
] as const;

/** Marked by a model, and only for a centre student on assigned homework. */
export const OPEN_TYPES = ["short_answer", "write_sentence", "write_short_text"] as const;

export type ClosedType = (typeof CLOSED_TYPES)[number];
export type OpenType = (typeof OPEN_TYPES)[number];
export type ExerciseType = ClosedType | OpenType;

export function isOpenType(type: string): type is OpenType {
  return (OPEN_TYPES as readonly string[]).includes(type);
}

/**
 * Where an item sits in the lesson's arc: recognise it, manipulate it, then
 * produce it. Stored rather than inferred so the runner can group the practice
 * the way the blueprint intended, and so a validator can refuse a "lesson"
 * that is twenty gap-fills and nothing else.
 */
export const STAGES = ["controlled", "semi_controlled", "freer"] as const;
export type Stage = (typeof STAGES)[number];

export function isOpen(exercise: Exercise): exercise is OpenExercise {
  return isOpenType(exercise.type);
}

/* ── marking ───────────────────────────────────────────────────────────────── */

/** What one closed item's marking produced. */
export interface ClosedResult {
  correct: boolean;
  given: string | null;
  expected: string;
}

/** What one open item's marking produced. Absent until a model has run. */
export interface OpenResult {
  criteria: { met: boolean; evidence: string }[];
  score: number;
  max: number;
  corrected: string | null;
  note: string | null;
}

export type ExerciseResult = ClosedResult | OpenResult;

export function isOpenResult(r: ExerciseResult): r is OpenResult {
  return "criteria" in r;
}

/** Per-point tallies: what a class got right and wrong, by teaching point. */
export type TagBreakdown = Record<string, { attempted: number; correct: number }>;
