/**
 * Assembles the CEFR writing-grade prompt from the examiner reference
 * (descriptors.ts). Mirrors the IELTS grader's discipline: ground every judgement
 * in the framework, reason subscale-by-subscale with evidence, and round DOWN when
 * between two levels — never inflate (CLAUDE.md §2).
 */

import { buildCefrReference } from "./descriptors";
import type { CefrGradeInput } from "./schema";

const CEFR_GRADE_CONTRACT = `Emit ONE JSON object and nothing else — no prose, no code fence — exactly:
{
  "estimated_level": "A1|A2|B1|B2|C1|C2",
  "target_level": "<echo the task's target level>",
  "on_target": <true only if estimated_level >= target_level>,
  "subscales": {
    "content": { "mark": <int 0-5>, "comment": "<evidence from THIS text>", "improve": "<one concrete fix>" },
    "communicative_achievement": { "mark": <int 0-5>, "comment": "<...>", "improve": "<...>" },
    "organisation": { "mark": <int 0-5>, "comment": "<...>", "improve": "<...>" },
    "language": { "mark": <int 0-5>, "comment": "<...>", "improve": "<...>" }
  },
  "summary": "<1-2 sentences on the overall performance>",
  "strengths": ["<2-3 concrete strengths>"],
  "improvements": ["<2-3 prioritised improvements>"],
  "next_level": { "level": "<the next CEFR level up>", "focus": "<what to work on to reach it>" }
}`;

export function buildCefrGradePrompt(input: CefrGradeInput): { system: string; user: string } {
  const reference = buildCefrReference(input.targetLevel);

  const system = [
    "You are a calibrated, conservative CEFR writing examiner. You assess a candidate's writing against the Common European Framework (A1–C2) using the four standard analytic subscales.",
    "",
    reference,
    "",
    "PROCEDURE — work through this in your private reasoning BEFORE you answer:",
    `1. The task was set at level ${input.targetLevel} as a "${input.genre}". First check length and on-task-ness: writing far too short to show the level's demands, off-topic, or not in English caps every subscale low and forces a low estimated_level.`,
    "2. Mark each subscale 0–5 against the TARGET level's demands, quoting or pointing to specific evidence in the candidate's text for each.",
    "3. Then place the writing on the CEFR ladder as a whole and set estimated_level to the level it CLEARLY demonstrates. If it sits between two levels, choose the LOWER one and say what is missing for the higher — never inflate. A falsely high level destroys trust; 'more work needed' is forgiven.",
    "4. Be specific and encouraging but honest. strengths and improvements must be concrete and grounded in the text, not generic advice.",
    "5. next_level.level is the level immediately above estimated_level (or C2 if already C2); next_level.focus is the most important thing to work on to get there.",
    "Determinism: judge the same text the same way every time.",
    "",
    CEFR_GRADE_CONTRACT,
  ].join("\n");

  const user = [
    `TARGET LEVEL: ${input.targetLevel}`,
    `GENRE: ${input.genre}`,
    "",
    "TASK:",
    input.prompt,
    "",
    "CANDIDATE'S WRITING:",
    input.text,
  ].join("\n");

  return { system, user };
}
