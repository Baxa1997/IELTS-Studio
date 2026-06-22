/**
 * CEFR writing-assessment reference — the rulebook the CEFR grader is grounded in.
 *
 * It combines two public frameworks, expressed here in ORIGINAL wording (no
 * copyrighted rubric text copied — CLAUDE.md §IP):
 *   1. The four analytic subscales used across the Cambridge English writing
 *      qualifications — Content, Communicative Achievement, Organisation, Language
 *      — which are themselves CEFR-aligned.
 *   2. The Council of Europe CEFR level definitions (A1 → C2) for written
 *      production.
 *
 * The grader marks each subscale 0–5 against the TARGET level's expectations and
 * also estimates the CEFR level the writing actually demonstrates. Like the IELTS
 * grader, it is conservative: when between two levels it picks the LOWER one
 * (CLAUDE.md §2 — never inflate).
 */

import { CEFR_LEVELS, type CefrLevel } from "./levels";

export interface CefrSubscale {
  key: "content" | "communicative_achievement" | "organisation" | "language";
  name: string;
  /** What this subscale judges (original phrasing of the public framework). */
  definition: string;
}

export const CEFR_SUBSCALES: CefrSubscale[] = [
  {
    key: "content",
    name: "Content",
    definition:
      "Is the task fully and relevantly addressed? Are all the required points covered, developed, and on-topic, with nothing important missing and nothing irrelevant padded in? Content judges WHAT is written, not how well it reads.",
  },
  {
    key: "communicative_achievement",
    name: "Communicative Achievement",
    definition:
      "Does the writing use the right genre, register and tone for its purpose and reader (e.g. an email to a friend vs. a formal proposal), and does it hold the reader and communicate its message with the right effect for the level? This judges HOW APPROPRIATELY the message reaches the reader.",
  },
  {
    key: "organisation",
    name: "Organisation",
    definition:
      "Is the text logically ordered and connected — paragraphing, sequencing, and cohesive devices (linkers, referencing) used so ideas flow? Judges internal structure and cohesion, independent of grammar accuracy.",
  },
  {
    key: "language",
    name: "Language",
    definition:
      "Range and accuracy of vocabulary and grammar for the level: variety and precision of words and structures, control of spelling/punctuation, and whether errors impede communication. Judges the linguistic resource on display.",
  },
];

/** What the 0–5 subscale mark means, RELATIVE to the target level. */
export const CEFR_MARK_SCALE = [
  "5 — Fully meets the demands of the target level on this subscale, with no weakness worth noting.",
  "4 — Meets the target level on this subscale; minor lapses only.",
  "3 — Broadly at the target level but with noticeable gaps; on the borderline.",
  "2 — Below the target level on this subscale; the demands are only partly met.",
  "1 — Well below the target level; the demands are largely not met.",
  "0 — Not assessable on this subscale (off-task, far too little written, or not in English).",
].join("\n");

/**
 * Original, framework-grounded summary of what WRITTEN PRODUCTION looks like at
 * each CEFR level — used both to set the bar for the target level and to let the
 * grader place the writing on the ladder.
 */
export const CEFR_LEVEL_WRITING: Record<CefrLevel, string> = {
  A1: "Can write simple isolated phrases and sentences about themselves and very familiar concrete things (where they live, people they know). Links ideas with the most basic connectors (and, then). Copes only with formulaic, memorised language; frequent basic errors are expected.",
  A2: "Can write a series of simple phrases and sentences linked with simple connectors (and, but, because) on familiar everyday matters — a short personal note, message or simple email. Vocabulary is limited to routine needs; basic structures are mostly controlled in short, predictable text.",
  B1: "Can write straightforward connected text on familiar topics, describing experiences, feelings and events, and a personal letter or email. Reasonably accurate on a repertoire of frequent language; meaning is clear throughout even though range is limited and errors persist on less familiar structures.",
  B2: "Can write clear, detailed text on a range of subjects and argue a viewpoint, giving reasons for and against. Uses a good range of vocabulary and complex structures with generally high control; errors do not lead to misunderstanding. Register and genre are handled appropriately.",
  C1: "Can write clear, well-structured text on complex subjects, expanding and supporting points, selecting an effective style for the reader, and using cohesion and organisational patterns well. Wide, precise vocabulary and a broad range of structures with consistent grammatical control; only occasional slips.",
  C2: "Can write clear, smoothly-flowing, complex text in an appropriate and effective style, with a logical structure that helps the reader find significant points. Sophisticated, precise and natural language; control is near-complete, with errors rare and hard to spot. Tone and nuance are fully managed.",
};

/** Adjacent levels (for the grader to calibrate up/down against). */
export function levelNeighbours(level: CefrLevel): { below: CefrLevel | null; above: CefrLevel | null } {
  const i = CEFR_LEVELS.indexOf(level);
  return {
    below: i > 0 ? CEFR_LEVELS[i - 1] : null,
    above: i < CEFR_LEVELS.length - 1 ? CEFR_LEVELS[i + 1] : null,
  };
}

/**
 * Build the reference block the grade prompt embeds for a given TARGET level: the
 * subscale definitions, the mark scale, and the level ladder focused around the
 * target (target ± neighbours) so the model can place the writing precisely.
 */
export function buildCefrReference(target: CefrLevel): string {
  const { below, above } = levelNeighbours(target);
  const ladder = [below, target, above]
    .filter((l): l is CefrLevel => l != null)
    .map((l) => `- ${l}${l === target ? " (TARGET)" : ""}: ${CEFR_LEVEL_WRITING[l]}`)
    .join("\n");

  const subscales = CEFR_SUBSCALES.map((s) => `- ${s.name}: ${s.definition}`).join("\n");

  return [
    "FOUR SUBSCALES (mark each 0–5 against the TARGET level's demands):",
    subscales,
    "",
    "MARK SCALE (per subscale, relative to the target level):",
    CEFR_MARK_SCALE,
    "",
    `CEFR WRITTEN-PRODUCTION LADDER (target level is ${target}):`,
    ladder,
    "",
    "FULL CEFR ORDER (low → high): " + CEFR_LEVELS.join(" < "),
  ].join("\n");
}
