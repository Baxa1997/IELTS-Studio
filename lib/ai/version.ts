/**
 * Prompt-build versions, stamped on every usage row + trace so a grading-quality
 * regression can be tied to the exact prompt that produced it. Bump the relevant
 * string whenever the grade/generate prompt assembly (lib/ai/prompts.ts) or the
 * grading skill's procedure changes materially.
 */
// v2: Academic Task 1 graded on its own rubric + the figure data (lib/ai/prompts).
export const GRADE_PROMPT_VERSION = "grade-v2-2026.06";
// v2: adds the Academic Task 1 generator (prompt + figure) and file transcription.
export const GENERATE_PROMPT_VERSION = "generate-v2-2026.06";
