/**
 * Study-plan contracts: the zod validator, over the shapes and pure helpers in
 * `./constants` (re-exported below, so every existing `@/lib/plan/types` import
 * keeps working).
 *
 * Client Components should import `./constants` — importing this module pulls in
 * zod. `import type { StudyPlanInput }` is fine either way; type imports are erased.
 */

import { z } from "zod";

export * from "./constants";

// ---- Validation ------------------------------------------------------------

// ---- Validation ------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const studyPlanInputSchema = z.object({
  /** null = "not sure yet" — difficulty then falls back to the default pitch. */
  selfReportedBand: z.number().min(0).max(9).nullable(),
  targetBand: z.number().min(4).max(9),
  examDate: z
    .string()
    .regex(ISO_DATE)
    .nullable()
    .refine((d) => d == null || !Number.isNaN(Date.parse(d)), "invalid date"),
  /** Optional override; otherwise derived from the gap × time-to-exam. */
  weeklyGoal: z.number().int().min(1).max(21).optional(),
});
export type StudyPlanInput = z.infer<typeof studyPlanInputSchema>;
