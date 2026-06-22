/**
 * Contracts for the CEFR writing grader — the input the service accepts and the
 * JSON shape the model must emit. Validated with zod (mirrors lib/reading/types).
 * No server-only imports, so the route and UI can both import the types.
 */

import { z } from "zod";

import { CEFR_LEVELS } from "./levels";

export const cefrLevelEnum = z.enum(CEFR_LEVELS);

// ---- Grader input ----------------------------------------------------------

export const cefrGradeInputSchema = z.object({
  /** The level the task was set at — the bar each subscale is marked against. */
  targetLevel: cefrLevelEnum,
  /** Genre, e.g. "email" / "essay" — drives register/format expectations. */
  genre: z.string().min(1).max(40),
  /** The task the candidate answered. */
  prompt: z.string().min(1).max(4000),
  /** The candidate's writing. */
  text: z.string().min(1).max(12000),
  meta: z.object({
    organizationId: z.string().uuid(),
    userId: z.string().uuid().nullable(),
  }),
});
export type CefrGradeInput = z.infer<typeof cefrGradeInputSchema>;

// ---- Model output ----------------------------------------------------------

export const cefrSubscaleResultSchema = z.object({
  /** 0–5 against the target level (see CEFR_MARK_SCALE). */
  mark: z.number().int().min(0).max(5),
  /** What in the writing earned this mark — evidence-grounded, one or two lines. */
  comment: z.string().min(1),
  /** The single most useful improvement for this subscale. */
  improve: z.string().min(1),
});
export type CefrSubscaleResult = z.infer<typeof cefrSubscaleResultSchema>;

export const cefrGradeSchema = z.object({
  /** The CEFR level the writing actually demonstrates (conservative estimate). */
  estimated_level: cefrLevelEnum,
  /** Echo of the target the task was set at. */
  target_level: cefrLevelEnum,
  /** True only when estimated_level meets or exceeds target_level. */
  on_target: z.boolean(),
  subscales: z.object({
    content: cefrSubscaleResultSchema,
    communicative_achievement: cefrSubscaleResultSchema,
    organisation: cefrSubscaleResultSchema,
    language: cefrSubscaleResultSchema,
  }),
  /** One or two sentences summarising the performance. */
  summary: z.string().min(1),
  /** 2–3 concrete strengths. */
  strengths: z.array(z.string().min(1)).min(1).max(4),
  /** 2–3 prioritised improvements. */
  improvements: z.array(z.string().min(1)).min(1).max(4),
  /** What to work on to reach the next level up. */
  next_level: z.object({
    level: cefrLevelEnum,
    focus: z.string().min(1),
  }),
});
export type CefrGrade = z.infer<typeof cefrGradeSchema>;

/** Grade + provenance returned to the caller. */
export interface CefrGradeResult extends CefrGrade {
  model: string;
  disclaimer: string;
}

export const CEFR_GRADE_DISCLAIMER =
  "Indicative CEFR level from this single piece of writing — not an official CEFR certificate or IELTS® score. Not affiliated with or endorsed by the Council of Europe, Cambridge English, or IELTS®.";

/** The four subscale keys, in display order. */
export const CEFR_SUBSCALE_KEYS = [
  "content",
  "communicative_achievement",
  "organisation",
  "language",
] as const;
