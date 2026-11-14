import { computeWeakestReadingType, type AttemptRow, type WeakReadingType } from "@/lib/dashboard/compute";

import type { ReadingQuestionType } from "./constants";

/**
 * "Practise my weak spot" — the question type a learner's next generated
 * passage should lean on, worked out from their own marked attempts.
 *
 * WHY. Generation picked its question types at random, while every marked
 * attempt already recorded which types the learner got wrong
 * (`reading_attempts.type_breakdown`). The dashboard showed the weakest type;
 * nothing ever ACTED on it. This is the missing step: the engine's
 * /reading/next takes the type as `focus_type` and gives it about half the
 * questions.
 *
 * Pure — no I/O — so the rule is tested.
 */

/**
 * The types a single generated passage can be built around.
 *
 * ⚠️ MIRRORS THE ENGINE'S `FOCUSABLE_TYPES` (ielts-ai-engine/reading/types.py),
 * which is derived from the reliable single-passage mixes there. Matching
 * headings and note completion are real exam types the single-passage writer
 * does not produce, so offering "practise your matching headings" would be a
 * promise the engine silently ignores. weak-spot.test.ts reads the engine's
 * file and fails if the two drift.
 */
export const FOCUSABLE_TYPES: readonly ReadingQuestionType[] = [
  "matching_information",
  "true_false_not_given",
  "multiple_choice",
  "sentence_completion",
  "summary_completion",
  "yes_no_not_given",
  "matching_sentence_endings",
  "matching_features",
];

/** Fewer answered questions of a type than this is not a pattern yet: one
 *  passage holds four or five of a type, so this is about two sittings. */
export const MIN_ATTEMPTED = 6;

/** At or above this share right, the type is not a weak spot — and telling a
 *  learner who gets nine in ten that it is would teach them to ignore the card. */
export const WEAK_BELOW = 0.8;

/**
 * The learner's weak spot, or null when there is not one to name: too little
 * evidence, nothing below the bar, or nothing the engine can build around.
 *
 * Only the focusable types are weighed. A learner whose worst type is matching
 * headings still gets a card — for the worst type we CAN generate — rather
 * than no card at all.
 */
export function weakSpot(attempts: AttemptRow[]): WeakReadingType | null {
  const focusable = new Set<string>(FOCUSABLE_TYPES);
  const narrowed = attempts.map((a) => ({
    ...a,
    type_breakdown: a.type_breakdown
      ? Object.fromEntries(Object.entries(a.type_breakdown).filter(([type]) => focusable.has(type)))
      : null,
  }));
  // The dashboard's own rule for "weakest": lowest accuracy, better-evidenced
  // on a tie — one definition of the word, not two.
  const weakest = computeWeakestReadingType(narrowed);
  if (!weakest || weakest.attempted < MIN_ATTEMPTED || weakest.accuracy >= WEAK_BELOW) return null;
  return weakest;
}
