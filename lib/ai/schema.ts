/**
 * Domain contracts for the AI service.
 *
 *  - The GRADE OUTPUT shape is owned by the skill's canonical
 *    `assets/output-schema.json` and validated at runtime with ajv (see
 *    `./skill`). The TS types here mirror it; they are not the gate.
 *  - INPUTS to the service are validated here with zod (our own code calls
 *    these, so a cheap guard against bad calls).
 *
 * The grade shape maps 1:1 onto the `gradings` table
 * (criteria {TR/TA,CC,LR,GRA} → {band,evidence,what_caps_it,fix},
 *  score_blocker {criterion,why}, overall_band, band_with_fixes).
 */

import { z } from "zod";

/** The four IELTS Writing criteria. The "TR" slot is Task Response (Task 2) or
 *  Task Achievement (Task 1) depending on the task type. */
export const CRITERIA = ["TR", "CC", "LR", "GRA"] as const;
export type Criterion = (typeof CRITERIA)[number];

export type EssayTaskType = "task1_academic" | "task1_general" | "task2";

// ---- Grade output (mirrors output-schema.json) -----------------------------

export interface CriterionScore {
  band: number; // 0–9, 0.5 steps
  evidence: string; // specifics quoted from the essay
  what_caps_it: string; // why it isn't the next band up
  fix: string; // single highest-value next move
}

/** One in-text mistake for the marked-up-essay view. `text` is a verbatim
 *  substring of the essay so the UI can locate and highlight it. Optional output. */
export interface Annotation {
  text: string;
  type: "spelling" | "grammar" | "vocabulary" | "cohesion";
  fix?: string;
  note?: string;
}

/** Exactly what the skill's schema validates — no `model`/`disclaimer`; those
 *  are stamped by the service. */
export interface Grade {
  overall_band: number;
  criteria: Record<Criterion, CriterionScore>;
  score_blocker: { criterion: Criterion; why: string };
  band_with_fixes: number;
  /** Optional in-text mistakes for the marked-up essay (newer grades only). */
  annotations?: Annotation[];
}

/** What `gradeEssay()` returns: the validated grade + provenance + the
 *  non-affiliation disclaimer (attached by the service from the skill). */
export type EssayGrade = Grade & { model: string; disclaimer: string };

// ---- Service inputs (zod-validated) ----------------------------------------

const metaSchema = z.object({
  organizationId: z.string().min(1),
  /** The auth user who triggered the call, or `null` for an anonymous/public call
   *  (the no-login grader). `ai_usage.user_id` is nullable to match. */
  userId: z.string().min(1).nullable(),
});

export const gradeEssayInputSchema = z.object({
  taskType: z.enum(["task1_academic", "task1_general", "task2"]),
  /** The question/task the student was answering. */
  promptText: z.string().min(1),
  essayText: z.string().min(1),
  /** Academic Task 1 only: the figure's data flattened to text (figureToText), so
   *  the examiner can check the accuracy of what the student reported. */
  figure: z.string().optional(),
  /** Optional caller-supplied exemplar blocks; otherwise anchors are retrieved. */
  anchors: z.array(z.string()).optional(),
  meta: metaSchema.extend({ essayId: z.string().optional() }),
});
export type GradeEssayInput = z.infer<typeof gradeEssayInputSchema>;

export const generateInputSchema = z.object({
  /** "reading_set" = passage + questions (JSON); "reading_validation" = the
   *  second-pass answer-key checker (JSON, deterministic); "writing_tutor" = the
   *  in-studio coaching chat (text, coaching-only — withholds sample answers
   *  until after submit). */
  kind: z.enum([
    "writing_prompt",
    "writing_task1_academic",
    "writing_tutor",
    "writing_samples",
    "reading_passage",
    "reading_set",
    "reading_validation",
    "reading_tutor",
    "study_coach",
    "vocabulary_translate",
  ]),
  /** Free-form spec: task_type, topic_family, difficulty, … */
  spec: z.record(z.string(), z.unknown()),
  meta: metaSchema,
});
export type GenerateInput = z.infer<typeof generateInputSchema>;
export type GenerateKind = GenerateInput["kind"];

/** One band-targeted model answer for the "Model answers" comparison (the Band-8
 *  sample feature). Original AI content, honestly written AT its stated band — a
 *  Band 7 sample must really be a 7, not an inflated one (CLAUDE.md: no inflation,
 *  trust is the moat). */
export const writingSampleSchema = z.object({
  band: z.number().min(4).max(9),
  /** Short label for the column, e.g. "Band 8 model answer". */
  title: z.string().optional().default(""),
  /** The model essay itself. */
  essay: z.string().min(1),
  /** 2–4 specifics that earn this band, tied to the criteria (TR/CC/LR/GRA). */
  highlights: z.array(z.string()).default([]),
  /** What would lift it to the next band (empty for the top sample). */
  to_next: z.string().optional().default(""),
});
export type WritingSample = z.infer<typeof writingSampleSchema>;

export const writingSamplesResultSchema = z.object({
  samples: z.array(writingSampleSchema).min(1),
});

export interface GenerateResult {
  content: string;
  model: string;
}

// ---- Errors ----------------------------------------------------------------

/** Raised when the model's grading reply can't be parsed/validated even after a
 *  repair re-ask. Distinct from transport errors so the service never retries it
 *  as if it were transient. */
export class GradeValidationError extends Error {
  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message);
    this.name = "GradeValidationError";
  }
}
