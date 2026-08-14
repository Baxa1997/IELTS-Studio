import { z } from "zod";

/**
 * What a generated lesson IS.
 *
 * One JSONB document with two halves, and the split is the whole design:
 *
 *  - `sections` are prose. The model writes rich HTML — tables of forms, boxes
 *    of examples, a timeline — because that is what a lesson page needs to look
 *    like and a fixed set of components could never cover it. It is allow-list
 *    sanitised before it is ever rendered (see `sanitize.ts`).
 *
 *  - `exercises` are DATA. Never HTML. An exercise that arrives as markup can
 *    never be marked in code, never roll into a teacher's report, and never be
 *    safe to serve on a public link. Everything the runner needs to mark an
 *    answer is a field here.
 *
 * This module is pure and isomorphic — no `server-only`, no I/O — because the
 * browser runner, the server submit route and the engine's validator all have
 * to agree on exactly one definition of a lesson.
 */

/* ── exercise kinds ────────────────────────────────────────────────────────── */

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

/* ── one exercise ──────────────────────────────────────────────────────────── */

const baseExercise = z.object({
  id: z.string().min(1),
  stage: z.enum(STAGES),
  /** The point being practised, e.g. "third-person-s". This is what lets a
   *  report say WHICH thing a class missed rather than only how many marks. */
  tag: z.string().min(1).max(60),
  prompt: z.string().min(1),
  /** Shown after marking, whatever the outcome — the reason, not just a tick. */
  why: z.string().optional(),
});

const closedExercise = baseExercise.extend({
  type: z.enum(CLOSED_TYPES),
  /** MCQ choices. Absent for typed answers. */
  options: z.array(z.string().min(1)).min(2).max(8).optional(),
  /**
   * Every answer that counts as right, compared after normalisation.
   *
   * An array even when there is one, because "don't" / "do not" and
   * "colour" / "color" are the same answer and a learner should not lose a mark
   * to a spelling convention. For `mcq_*` these are option INDEXES as strings;
   * for `matching`/`ordering` they are the ordered sequence.
   */
  answers: z.array(z.string()).min(1),
  /** `a`/`an` and British/American pairs are accepted unless this is false. */
  strict: z.boolean().optional(),
});

const openExercise = baseExercise.extend({
  type: z.enum(OPEN_TYPES),
  /**
   * 2–4 concrete, independently checkable requirements, written by the
   * GENERATOR — before the learner exists.
   *
   * This is what stops open marking being a vibe check: at marking time the
   * model is not asked "is this good?", it is asked to check a fixed list it
   * did not write, quoting the learner's own words for each. The same list is
   * shown to a learner on the public page, where nothing is marked at all.
   */
  criteria: z.array(z.string().min(1)).min(2).max(4),
  /** What a good answer looks like. The only feedback on the public page. */
  model_answer: z.string().min(1),
});

/**
 * A plain union, not a discriminated one. The two `type` enums are disjoint, so
 * zod can tell them apart by trying each — and a discriminated union here would
 * mean spelling out ten literal variants for no gain.
 */
export const exerciseSchema = z.union([closedExercise, openExercise]);

/** A marked-in-code exercise: carries `answers`, never `criteria`. */
export type ClosedExercise = z.infer<typeof closedExercise>;
/** A model-marked exercise: carries `criteria` + `model_answer`, no answer key. */
export type OpenExercise = z.infer<typeof openExercise>;

/**
 * A union, NOT an intersection. Intersecting the two collapses to `never`
 * (their `type` fields conflict), and every consumer then loses all its fields.
 * Narrow with `isOpen()` below before touching a half-specific property.
 */
export type Exercise = ClosedExercise | OpenExercise;

export function isOpen(exercise: Exercise): exercise is OpenExercise {
  return isOpenType(exercise.type);
}

/* ── the document ──────────────────────────────────────────────────────────── */

export const sectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1).max(120),
  /** Allow-listed HTML. Sanitised at render; the engine refuses to store
   *  anything outside the list in the first place. */
  html: z.string(),
  /**
   * The hard part of this section, said again in the learner's first language.
   *
   * A separate field, not mixed into `html`, so the page can collapse it: a
   * learner who does not need it should not read past it, and a teacher marking
   * should be able to see the English alone. Absent on English-only lessons.
   */
  html_l1: z.string().nullish(),
});

export const lessonContentSchema = z.object({
  meta: z.object({
    title: z.string().min(1).max(160),
    subtitle: z.string().max(240).optional(),
    blueprint: z.string().min(1),
    topic: z.string().min(1),
    level: z.string().optional(),
    language: z.string().default("en"),
    /** One measurable line: "by the end you can …". */
    objective: z.string().min(1),
  }),
  sections: z.array(sectionSchema).min(1).max(12),
  exercises: z.array(exerciseSchema).min(1).max(40),
});

export type LessonSection = z.infer<typeof sectionSchema>;
export type LessonContent = {
  meta: z.infer<typeof lessonContentSchema>["meta"];
  sections: LessonSection[];
  exercises: Exercise[];
};

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
