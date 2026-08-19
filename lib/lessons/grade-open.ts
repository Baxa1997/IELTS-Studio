import "server-only";

import { z } from "zod";

import { markLessonOpenItems } from "@/lib/ai";

import type { OpenExercise } from "./types";

/**
 * Marking the freer half of a lesson: the items where a learner writes their own
 * language and no comparison can decide whether they got it right.
 *
 * WHAT MAKES THIS TRUSTWORTHY, and it is not the model. Every open item was
 * generated carrying 2–4 concrete criteria — written before any learner existed,
 * visible to the teacher on the lesson page, and enforced by the engine's
 * validator. So at marking time the model is never asked "is this good?"; it is
 * asked to check a fixed list it did not write, quoting the learner's own words
 * for each. That is the difference between a rubric and a vibe.
 *
 * WHO GETS IT. Only a centre student on assigned homework. That is not enforced
 * here — it is enforced by who can reach the caller, which is the honest place
 * for it: the public share route imports nothing from this module, so a shared
 * lesson cannot spend money however it is called.
 */

/**
 * Long text is TRIMMED, not rejected.
 *
 * These were `.max(n)`, which made an over-long quote a parse failure — and a
 * parse failure throws away the marking for EVERY item in the batch, not just
 * the one that ran on. The caps exist to stop a runaway string reaching the
 * database; they were never a judgement about whether the marking was any good.
 * A learner losing all their written feedback because the model quoted forty
 * words instead of twenty is the worst possible trade.
 */
const capped = (max: number) =>
  z.string().transform((t) => (t.length > max ? `${t.slice(0, max - 1)}…` : t));

const criterionSchema = z.object({
  /**
   * TRUE ONLY IF IT SAYS TRUE. Was `z.boolean()`, which rejected the whole
   * batch when a model wrote `"true"` or `1` — a formatting slip, not a
   * disagreement about the answer. Anything unrecognised, including a missing
   * verdict, becomes NOT met: the same round-down rule the band grader follows,
   * because a learner told they were right when they were not is worse off than
   * one told nothing.
   */
  met: z.unknown().optional().transform((v) => v === true || v === "true" || v === 1),
  /** The learner's own words. A verdict with nothing quoted is a guess. */
  evidence: capped(300).nullish().transform((t) => t ?? ""),
});

const markedSchema = z.object({
  id: z.string(),
  criteria: z.array(criterionSchema).min(1),
  /** Their sentence, put right. The single most useful thing they get back. */
  corrected: capped(600).nullish().transform((t) => t ?? null),
  note: capped(400).nullish().transform((t) => t ?? null),
});

/** `{marked:[…]}` is what is asked for; a bare array is the one other shape a
 *  model reliably returns, and refusing it costs a whole batch over a wrapper. */
export const openMarkingSchema = z.union([
  z.object({ marked: z.array(markedSchema) }),
  z.array(markedSchema).transform((marked) => ({ marked })),
]);

export interface OpenMarkResult {
  criteria: { met: boolean; evidence: string }[];
  corrected: string | null;
  note: string | null;
}

export interface OpenMarkRequest {
  exercise: OpenExercise;
  answer: string;
}

/**
 * Mark every open answer in ONE call.
 *
 * Batched deliberately: three to five items in a single request is ~10–20s and
 * fits inside a serverless window, where one call per item would not — and it
 * lets the model see the whole set, so it marks a learner consistently rather
 * than drifting between items.
 */
/** The first few problems, each with its path, for a log that can be acted on. */
function describe(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export async function markOpenAnswers(
  requests: OpenMarkRequest[],
  meta: { organizationId: string; userId: string; lessonTitle: string },
): Promise<Record<string, OpenMarkResult>> {
  const answered = requests.filter((r) => r.answer.trim() !== "");
  if (answered.length === 0) return {};

  const payload = answered.map((r) => ({
    id: r.exercise.id,
    question: r.exercise.prompt,
    criteria: r.exercise.criteria,
    model_answer: r.exercise.model_answer,
    // Capped. A "write one sentence" box has no business accepting an essay,
    // and an unbounded string is an unbounded bill.
    student_answer: r.answer.slice(0, 1200),
  }));

  // ONE RETRY ON A MALFORMED REPLY. A batch that comes back the wrong shape is
  // usually a formatting slip rather than a model that cannot do the task, and
  // the cost of giving up is total: every written answer in the attempt loses
  // its feedback permanently, because nothing retries a lesson attempt later.
  // One more call is cheap against that.
  let parsed = openMarkingSchema.safeParse(
    await markLessonOpenItems({ lessonTitle: meta.lessonTitle, items: payload, meta }),
  );
  if (!parsed.success) {
    console.warn("[lessons/open-marking] malformed reply, retrying:", describe(parsed.error));
    parsed = openMarkingSchema.safeParse(
      await markLessonOpenItems({ lessonTitle: meta.lessonTitle, items: payload, meta }),
    );
  }
  if (!parsed.success) {
    // Names WHERE it broke, not just that it did. "Required" on its own — which
    // is all this used to report — tells whoever reads the log nothing about
    // which field of which item to look at.
    throw new Error(`Open marking came back malformed: ${describe(parsed.error)}`);
  }

  const byId = new Map(answered.map((r) => [r.exercise.id, r.exercise]));
  const out: Record<string, OpenMarkResult> = {};

  for (const row of parsed.data.marked) {
    const exercise = byId.get(row.id);
    if (!exercise) continue;

    // Align the verdicts to the criteria WE wrote, by position, and pad any the
    // model skipped as not-met. A missing verdict must never read as a pass —
    // rounding down on anything unproven is the same rule the band grader
    // follows, applied at item scale.
    const criteria = exercise.criteria.map((_, i) => ({
      met: row.criteria[i]?.met === true,
      evidence: row.criteria[i]?.evidence ?? "",
    }));

    out[row.id] = {
      criteria,
      corrected: row.corrected?.trim() || null,
      note: row.note?.trim() || null,
    };
  }

  // Anything the model silently dropped is marked not-met rather than left
  // absent, so a learner's score is never quietly inflated by an omission.
  for (const r of answered) {
    if (out[r.exercise.id]) continue;
    out[r.exercise.id] = {
      criteria: r.exercise.criteria.map(() => ({ met: false, evidence: "" })),
      corrected: null,
      note: "This answer could not be checked automatically. Ask your teacher to look at it.",
    };
  }

  return out;
}
