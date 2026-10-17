import type { FreeTrialCopy } from "@/lib/free-practice/copy";

// ---- Types (mirror the engine render views) --------------------------------

export type Options = Record<string, string>;
export type P1 = { part: 1; cefr: string; instruction: string; title: string; text_with_gaps: string };
export type P2 = {
  part: 2;
  cefr: string;
  instruction: string;
  theme: string;
  texts: { letter: string; title: string; body: string }[];
  statements: { number: number; text: string }[];
};
export type P3 = {
  part: 3;
  cefr: string;
  instruction: string;
  headings: Options;
  paragraphs: { number: number; question: number; text: string }[];
};
export type P4 = {
  part: 4;
  cefr: string;
  title: string;
  text: string;
  instruction_mcq: string;
  instruction_tfn: string;
  mcq: { number: number; stem: string; options: Options }[];
  tfn: { number: number; statement: string }[];
};
export type P5 = {
  part: 5;
  cefr: string;
  title: string;
  text: string;
  instruction_gap: string;
  instruction_mcq: string;
  gaps: { number: number; sentence: string }[];
  mcq: { number: number; stem: string; options: Options }[];
};
export type ReadingPart = P1 | P2 | P3 | P4 | P5;
export type ReadingPaper = { id: string; paper: "reading"; parts: ReadingPart[] };

export type QResult = {
  number: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  evidence: string;
};
export type ReadingGrade = {
  score: number;
  max_score: number;
  parts: { part: number; results: QResult[] }[];
  /** Conservative indicative CEFR from the raw score — only sent for a full-length paper. */
  indicative_cefr?: string | null;
};

export type WritingTask = {
  task: string;
  cefr: string;
  register: string;
  target_words: number;
  word_range: [number, number];
  prompt: string;
  required_content_points: string[];
  situation?: string;
  problem?: string;
  question?: string;
  forum_context?: string;
};
export type WritingPaper = { id: string; paper: "writing"; tasks: WritingTask[] };
export type WritingGrade = {
  task_id: string;
  gradable: boolean;
  message?: string;
  cefr?: string;
  model_answer?: string;
  word_count?: number;
  in_range?: boolean;
  scores?: {
    task_achievement: number;
    coherence: number;
    lexical: number;
    grammar: number;
    register: number;
  };
  overall_0_100?: number;
  estimated_cefr?: string;
  strengths?: string[];
  improvements?: string[];
  corrected_sentences?: { original: string; improved: string }[];
  examiner_comment?: string;
};
/**
 * Today's free CEFR paper (/cefr/free/[key]) — the same runners, the same
 * marking, for a visitor with no account.
 *
 * What changes in public mode, and why:
 *  - marking goes to the APP's route (`submitUrl`), never the engine: the
 *    visitor has no token, and the route is what checks that this paper is on
 *    their list today before the engine is asked to mark it;
 *  - no coach and no word lookup — both are signed-in features behind
 *    signed-in APIs;
 *  - no "New paper": a visitor cannot generate one. The way on is the list,
 *    and the sign-in recommendation (owner, 2026-09-27) — a strip while
 *    practising and a card on the result, as in every free runner.
 */
export interface CefrPublicMode {
  submitUrl: string;
  /** This practice's key on the visitor's list today — what the route checks. */
  practiceKey: string;
  /** The visitor's list of free practices. */
  exitHref: string;
  copy: FreeTrialCopy;
}

export type Tab = "reading" | "writing";
export type ReadingReq = { scope: "full" } | { scope: "part"; part: number };
export type WritingReq = { scope: "full" } | { scope: "task"; task: string };
export type ReadingItem = { id: string; scope: string; created_at: string; parts: number[] };
/** How this reading run was started — drives the timer allowance: "full" = the
 *  whole 5-part paper (60 min, like the real DTM exam), "part" = one part on its
 *  own (a 20-minute focused session). */
export type ReadingMode = "full" | "part";
