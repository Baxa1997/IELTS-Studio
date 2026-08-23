import { matchesAny, displayAnswer } from "./normalize";
import { isOpen, type ClosedResult, type ExerciseResult, type TagBreakdown } from "./constants";
import type { ClosedExercise, Exercise, LessonContent } from "./types";

/**
 * Marking the closed half of a lesson: multiple choice, gaps, transformations,
 * matching, ordering.
 *
 * NO MODEL CALL. Not squeamishness — an index comparison is already perfect,
 * instant and free, and spending a model call on it would buy nothing while
 * making a shared lesson cost money to serve. This is what lets the public
 * share page mark a learner's work with no API call behind it at all.
 *
 * Pure and isomorphic, deliberately. The browser marks with this so a learner
 * sees their score the instant they submit; the server marks with the SAME
 * function before storing, so what is recorded can never drift from what was
 * shown. A grader that lived only on the server would make the page feel slow;
 * one that lived only in the browser would let anyone post themselves a 10/10.
 */

export interface GradeOutcome {
  /** Per exercise id. Open items are absent until a model has marked them. */
  results: Record<string, ExerciseResult>;
  score: number;
  /** Closed marks only. Open items add to this once marked. */
  maxScore: number;
  tagBreakdown: TagBreakdown;
  /** Open items awaiting a model — the caller decides whether to send them. */
  pendingOpenIds: string[];
}

export type Answers = Record<string, string | string[] | undefined>;

/** One mark per closed exercise; every criterion is a mark on an open one. */
export function openItemMax(exercise: Exercise): number {
  return isOpen(exercise) ? exercise.criteria.length : 1;
}

function asList(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Compare two ordered sequences after normalising each element. */
function sequenceMatches(given: string[], expected: readonly string[]): boolean {
  if (given.length !== expected.length) return false;
  return expected.every((want, i) => matchesAny(given[i] ?? "", [want]));
}

function markClosed(exercise: ClosedExercise, raw: string | string[] | undefined): ClosedResult {
  const expected = displayAnswer(exercise.answers);
  const opts = { strict: exercise.strict === true };

  switch (exercise.type) {
    case "mcq_single": {
      const given = asList(raw)[0] ?? null;
      return {
        // Answers are option INDEXES for MCQ, so this is an exact comparison
        // and none of the language normalisation applies.
        correct: given != null && exercise.answers.includes(given),
        given,
        expected: optionLabel(exercise, expected),
      };
    }
    case "mcq_multi": {
      const given = asList(raw);
      const want = [...exercise.answers].sort();
      const got = [...given].sort();
      return {
        correct: want.length === got.length && want.every((v, i) => v === got[i]),
        given: given.length > 0 ? given.join(", ") : null,
        expected: exercise.answers.map((a: string) => optionLabel(exercise, a)).join(", "),
      };
    }
    case "matching":
    case "ordering": {
      const given = asList(raw);
      return {
        correct: sequenceMatches(given, exercise.answers),
        // Both sides go through optionLabel for the same reason MCQ does: these
        // answers are option INDEXES, and a learner told the right answer was
        // "1 → 2 → 0" has been told nothing. They need the sentences back.
        given: given.length > 0 ? given.map((g) => optionLabel(exercise, g)).join(" → ") : null,
        expected: exercise.answers.map((a: string) => optionLabel(exercise, a)).join(" → "),
      };
    }
    // gap_fill, transform, error_correction: typed text, compared against every
    // accepted phrasing after normalisation.
    default: {
      const given = asList(raw)[0] ?? "";
      return {
        correct: given.trim() !== "" && matchesAny(given, exercise.answers, opts),
        given: given.trim() === "" ? null : given,
        expected,
      };
    }
  }
}

/** Show the option's TEXT, not "2" — a learner reading feedback needs the words. */
function optionLabel(exercise: ClosedExercise, indexOrText: string): string {
  const i = Number(indexOrText);
  if (Number.isInteger(i) && exercise.options?.[i] != null) return exercise.options[i];
  return indexOrText;
}

/**
 * Mark everything that can be marked in code.
 *
 * Open items are counted into `maxScore` but left unmarked and listed in
 * `pendingOpenIds`. Whether they ever get marked is the caller's decision, and
 * it is a permission question, not a technical one: assigned homework for a
 * centre student goes on to the model; a share-link visitor sees the model
 * answer and the criteria to check themselves, and no call is made.
 */
export function gradeClosed(
  content: LessonContent,
  answers: Answers,
  opts: { includeOpenInMax?: boolean } = {},
): GradeOutcome {
  const results: Record<string, ExerciseResult> = {};
  const tagBreakdown: TagBreakdown = {};
  const pendingOpenIds: string[] = [];
  let score = 0;
  let maxScore = 0;

  const tally = (tag: string, correct: boolean) => {
    const row = tagBreakdown[tag] ?? { attempted: 0, correct: 0 };
    row.attempted += 1;
    if (correct) row.correct += 1;
    tagBreakdown[tag] = row;
  };

  for (const exercise of content.exercises) {
    if (isOpen(exercise)) {
      pendingOpenIds.push(exercise.id);
      // On the public page open items are excluded from the total instead, so
      // an unmarked item never drags a visible score down.
      if (opts.includeOpenInMax) maxScore += openItemMax(exercise);
      continue;
    }

    const result = markClosed(exercise, answers[exercise.id]);
    results[exercise.id] = result;
    maxScore += 1;
    if (result.correct) score += 1;
    tally(exercise.tag, result.correct);
  }

  return { results, score, maxScore, tagBreakdown, pendingOpenIds };
}

/**
 * Fold a model's open-item marks into an outcome the closed pass produced.
 *
 * Separate from `gradeClosed` because the two happen at different times and can
 * fail independently: the closed score is stored immediately, and open marks
 * land later — possibly after a retry — without the learner losing what they
 * already earned.
 */
export function mergeOpenResults(
  outcome: GradeOutcome,
  content: LessonContent,
  open: Record<string, { criteria: { met: boolean; evidence: string }[]; corrected?: string | null; note?: string | null }>,
): GradeOutcome {
  const byId = new Map(content.exercises.map((e) => [e.id, e]));
  const results = { ...outcome.results };
  const tagBreakdown: TagBreakdown = { ...outcome.tagBreakdown };
  let score = outcome.score;
  let maxScore = outcome.maxScore;

  for (const [id, marked] of Object.entries(open)) {
    const exercise = byId.get(id);
    if (!exercise) continue;

    const max = openItemMax(exercise);
    const met = marked.criteria.filter((c) => c.met).length;
    results[id] = {
      criteria: marked.criteria,
      score: met,
      max,
      corrected: marked.corrected ?? null,
      note: marked.note ?? null,
    };
    score += met;
    // Only add to the ceiling if the closed pass did not already count it.
    if (!outcome.pendingOpenIds.includes(id) || !hasOpenInMax(outcome, content)) maxScore += max;

    const row = tagBreakdown[exercise.tag] ?? { attempted: 0, correct: 0 };
    row.attempted += 1;
    // An open item counts as "got the point" only when every criterion is met —
    // a report that says a class has a point down should mean it.
    if (met === max && max > 0) row.correct += 1;
    tagBreakdown[exercise.tag] = row;
  }

  return {
    results,
    score,
    maxScore,
    tagBreakdown,
    pendingOpenIds: outcome.pendingOpenIds.filter((id) => !(id in open)),
  };
}

/** Did the closed pass already include open items in the ceiling? */
function hasOpenInMax(outcome: GradeOutcome, content: LessonContent): boolean {
  const closedCount = content.exercises.filter((e) => !isOpen(e)).length;
  return outcome.maxScore > closedCount;
}

/** The two worst-answered points, for a teacher's report line. */
export function worstTags(breakdown: TagBreakdown, limit = 2): string[] {
  return Object.entries(breakdown)
    .map(([tag, v]) => ({ tag, wrong: v.attempted - v.correct }))
    .filter((t) => t.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.tag.localeCompare(b.tag))
    .slice(0, limit)
    .map((t) => `${t.tag.replaceAll("-", " ")} (${t.wrong})`);
}
