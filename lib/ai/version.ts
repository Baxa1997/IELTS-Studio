/**
 * Prompt-build versions, stamped on every usage row + trace so a grading-quality
 * regression can be tied to the exact prompt that produced it. Bump the relevant
 * string whenever the grade/generate prompt assembly (lib/ai/prompts.ts) or the
 * grading skill's procedure changes materially.
 */
// v3: Gemini 3 Pro + thinking budget; criterion-by-criterion private reasoning
// un-suppressed; SKILL.md anchor-comparison gate + two-band sanity check; expanded
// anchor ladder (T2 floor 3.0–8.0: adds 3.0/4.0/4.5/5.5; Academic T1 floor + 8).
// v2: Academic Task 1 graded on its own rubric + the figure data (lib/ai/prompts).
export const GRADE_PROMPT_VERSION = "grade-v3-2026.06";
// v2: adds the Academic Task 1 generator (prompt + figure) and file transcription.
export const GENERATE_PROMPT_VERSION = "generate-v2-2026.06";
