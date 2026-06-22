/**
 * CEFR domain model — the source of truth for the distinct CEFR practice track
 * (separate from the IELTS band track). CEFR is the Common European Framework of
 * Reference: six levels A1 → C2. Unlike the IELTS modules, CEFR practice is meant
 * to be SHORTER and level-graded, and is reported as a CEFR level + can-do
 * feedback rather than an IELTS band.
 *
 * The IELTS-band overlap below is the widely-published public mapping (used only to
 * pitch generation difficulty and to bridge a learner between the two tracks) — it
 * is NOT a claim that a CEFR result equals an IELTS score. No imports / no
 * "use client", so server and client both read from here.
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export interface CefrLevelInfo {
  code: CefrLevel;
  /** Council-of-Europe tier name. */
  name: string;
  /** One-line "where you are" summary. */
  blurb: string;
  /** Public CEFR↔IELTS overlap, for pitching difficulty + bridging tracks. */
  ieltsApprox: string;
  /** Reading "can-do" the level practice targets. */
  readingCan: string;
  /** Writing "can-do" the level practice targets. */
  writingCan: string;
  /** The writing task this level is practised with (kept short by design). */
  writingTask: string;
  /** Rough word target for the writing task at this level. */
  writingWords: number;
  /** Passage length (words) the reading practice generates at this level. */
  readingWords: number;
  /** Brand colour for the level chip. */
  color: string;
  bg: string;
}

export const CEFR: Record<CefrLevel, CefrLevelInfo> = {
  A1: {
    code: "A1",
    name: "Beginner",
    blurb: "Understands and uses very basic everyday phrases.",
    ieltsApprox: "IELTS < 3.5",
    readingCan: "Understand familiar names, words and very simple sentences on notices and posters.",
    writingCan: "Write a short, simple postcard or fill in a form with personal details.",
    writingTask: "Write a short note or message",
    writingWords: 40,
    readingWords: 120,
    color: "#B45309",
    bg: "#FBEFDD",
  },
  A2: {
    code: "A2",
    name: "Elementary",
    blurb: "Handles short, routine exchanges on familiar topics.",
    ieltsApprox: "IELTS 3.5–4.0",
    readingCan: "Read short, simple texts and find specific information in everyday material.",
    writingCan: "Write short, simple notes and a basic personal letter, e.g. saying thank you.",
    writingTask: "Write a short personal message or email",
    writingWords: 60,
    readingWords: 180,
    color: "#B45309",
    bg: "#FBEFDD",
  },
  B1: {
    code: "B1",
    name: "Intermediate",
    blurb: "Deals with most situations and writes connected text on familiar topics.",
    ieltsApprox: "IELTS 4.0–5.0",
    readingCan: "Understand texts that consist of everyday or job-related language.",
    writingCan: "Write straightforward connected text on familiar topics, or a personal letter describing experiences.",
    writingTask: "Write an informal letter or short opinion",
    writingWords: 120,
    readingWords: 260,
    color: "#1F6FB0",
    bg: "#E6F0F8",
  },
  B2: {
    code: "B2",
    name: "Upper-intermediate",
    blurb: "Argues a viewpoint clearly and reads with a good degree of independence.",
    ieltsApprox: "IELTS 5.5–6.5",
    readingCan: "Read articles and reports on contemporary problems and understand the writer's stance.",
    writingCan: "Write clear, detailed text on a range of subjects and an essay passing on information or reasons.",
    writingTask: "Write a short essay or article",
    writingWords: 180,
    readingWords: 340,
    color: "#1F6FB0",
    bg: "#E6F0F8",
  },
  C1: {
    code: "C1",
    name: "Advanced",
    blurb: "Expresses ideas fluently and structures longer, complex text well.",
    ieltsApprox: "IELTS 7.0–8.0",
    readingCan: "Understand long, demanding texts and appreciate distinctions of style.",
    writingCan: "Write clear, well-structured text on complex subjects, underlining the relevant salient issues.",
    writingTask: "Write a structured essay or report",
    writingWords: 220,
    readingWords: 420,
    color: "#147A4F",
    bg: "#E3F4EA",
  },
  C2: {
    code: "C2",
    name: "Proficient",
    blurb: "Reads and writes with near-native ease and precision.",
    ieltsApprox: "IELTS 8.5–9.0",
    readingCan: "Read with ease virtually all forms of the written language, including abstract texts.",
    writingCan: "Write clear, smoothly-flowing, complex text in an appropriate and effective style.",
    writingTask: "Write a sophisticated essay or critique",
    writingWords: 250,
    readingWords: 480,
    color: "#147A4F",
    bg: "#E3F4EA",
  },
};

export const CEFR_LEVEL_LIST: CefrLevelInfo[] = CEFR_LEVELS.map((l) => CEFR[l]);

export function isCefrLevel(v: string): v is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(v);
}

/** Map a CEFR level to the target band used to pitch reading/writing generation. */
export function cefrToBand(level: CefrLevel): number {
  return { A1: 3, A2: 4, B1: 5, B2: 6, C1: 7, C2: 9 }[level];
}
