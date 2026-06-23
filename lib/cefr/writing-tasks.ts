/**
 * CEFR writing tasks — original, level-graded practice prompts (A1–C2). The
 * formats and word targets follow the well-established public Cambridge English
 * qualification structure (A2 Key → C2 Proficiency): short messages low down,
 * structured essays/reports high up. All prompts are ORIGINAL (no copyrighted test
 * material, CLAUDE.md §IP). Stored in code (no DB) so the CEFR writing flow is
 * stateless and self-serve.
 */

import type { CefrLevel } from "./levels";

/** The text genre a CEFR task asks for — drives register/format expectations. */
export type CefrTaskGenre =
  | "note"
  | "message"
  | "email"
  | "letter"
  | "story"
  | "article"
  | "essay"
  | "review"
  | "report"
  | "proposal";

export interface CefrWritingTask {
  id: string;
  level: CefrLevel;
  genre: CefrTaskGenre;
  /** Short label for the card, e.g. "Email · invite a friend". */
  title: string;
  /** The full task the learner sees (the situation + what to cover). */
  prompt: string;
  /** Bullet points the writer must address (Content subscale checks these). */
  points: string[];
  /** Word target for the level (min, max). */
  words: [number, number];
}

const TASKS: CefrWritingTask[] = [
  // ── A1 — very short, controlled, personal ──────────────────────────────────
  {
    id: "a1-note-friend",
    level: "A1",
    genre: "note",
    title: "Note · message to a friend",
    prompt:
      "Write a short note to your friend Sam. In your note, tell Sam where you are, what you are doing, and what time you will be home.",
    points: ["where you are", "what you are doing", "what time you will be home"],
    words: [25, 45],
  },
  {
    id: "a1-message-class",
    level: "A1",
    genre: "message",
    title: "Message · about a class",
    prompt:
      "Write a short message to a classmate. Tell them the name of your favourite class, the day it happens, and one thing you like about it.",
    points: ["your favourite class", "the day it happens", "one thing you like about it"],
    words: [25, 45],
  },

  // ── A2 — short everyday email/message ──────────────────────────────────────
  {
    id: "a2-email-invite",
    level: "A2",
    genre: "email",
    title: "Email · invite a friend",
    prompt:
      "You are having a small birthday party. Write an email to your friend Alex inviting them. Say when and where the party is, and ask Alex to bring some music.",
    points: ["when and where the party is", "invite Alex", "ask Alex to bring some music"],
    words: [45, 70],
  },
  {
    id: "a2-email-thanks",
    level: "A2",
    genre: "email",
    title: "Email · say thank you",
    prompt:
      "A friend helped you move to a new flat last weekend. Write an email to thank them. Say what they did, how you feel, and invite them to visit your new flat.",
    points: ["what your friend did", "how you feel", "invite them to visit"],
    words: [45, 70],
  },

  // ── B1 — connected text on a familiar topic ────────────────────────────────
  {
    id: "b1-email-news",
    level: "B1",
    genre: "email",
    title: "Email · news to a friend",
    prompt:
      "You have just started a new hobby. Write an email to an English-speaking friend. Explain what the hobby is, why you decided to start it, and describe how you feel about it so far.",
    points: ["what the hobby is", "why you started it", "how you feel about it so far"],
    words: [90, 120],
  },
  {
    id: "b1-article-place",
    level: "B1",
    genre: "article",
    title: "Article · a place you like",
    prompt:
      "A travel website has asked readers to write a short article called 'A place I love'. Write your article. Describe the place, explain why it is special to you, and suggest one thing a visitor should do there.",
    points: ["describe the place", "why it is special to you", "what a visitor should do there"],
    words: [90, 130],
  },

  // ── B2 — clear, detailed text; argue a viewpoint ───────────────────────────
  {
    id: "b2-essay-technology",
    level: "B2",
    genre: "essay",
    title: "Essay · technology and free time",
    prompt:
      "In your English class you have been talking about free time. Now your teacher has asked you to write an essay. Write an essay answering this question: 'Does technology give people more free time, or less?' Explain your view and give reasons.",
    points: ["state your opinion clearly", "give at least two reasons with examples", "reach a conclusion"],
    words: [140, 190],
  },
  {
    id: "b2-review-restaurant",
    level: "B2",
    genre: "review",
    title: "Review · a place to eat",
    prompt:
      "An international student magazine is collecting reviews of places to eat near your school. Write a review of a café or restaurant you know. Describe it, explain what is good and less good about it, and say whether you would recommend it.",
    points: ["describe the place", "what is good and less good", "your recommendation"],
    words: [140, 190],
  },

  // ── C1 — well-structured text on a complex subject ─────────────────────────
  {
    id: "c1-essay-cities",
    level: "C1",
    genre: "essay",
    title: "Essay · the future of cities",
    prompt:
      "You have attended a panel discussion on urban life. The panel raised two main ideas for improving cities: investing in public transport and creating more green spaces. Write an essay evaluating these two ideas, explaining which you think would have the greater impact and why.",
    points: ["evaluate both ideas", "argue which has the greater impact", "support your view with developed reasoning"],
    words: [220, 260],
  },
  {
    id: "c1-proposal-library",
    level: "C1",
    genre: "proposal",
    title: "Proposal · improve the library",
    prompt:
      "The director of your college has money to improve the student library. Write a proposal. Describe two changes you would recommend, explain how each would benefit students, and say which should be the priority.",
    points: ["recommend two specific changes", "explain the benefit of each", "justify your priority"],
    words: [220, 260],
  },

  // ── C2 — sophisticated, nuanced argument ───────────────────────────────────
  {
    id: "c2-essay-progress",
    level: "C2",
    genre: "essay",
    title: "Essay · measuring progress",
    prompt:
      "'A society should be judged by how it treats its weakest members, not by its economic growth.' Write an essay responding to this statement. Develop a nuanced argument that weighs competing perspectives and reaches a clear, well-supported position.",
    points: ["engage with the statement critically", "weigh competing perspectives", "reach a clear, nuanced position"],
    words: [240, 280],
  },
  {
    id: "c2-article-language",
    level: "C2",
    genre: "article",
    title: "Article · why learn a language",
    prompt:
      "A serious magazine has invited contributions on the theme 'Is it still worth learning a foreign language in the age of instant translation?'. Write an article that engages the reader, advances an original line of argument, and anticipates and addresses likely objections.",
    points: ["engage the reader from the start", "advance an original argument", "address likely counter-arguments"],
    words: [240, 280],
  },
];

/** Canonical word target per CEFR level (min, max) — derived from the authored
 *  ladder above, so AI-generated tasks share the same calibrated length demands. */
export const CEFR_WORD_TARGETS: Record<CefrLevel, [number, number]> = {
  A1: [25, 45],
  A2: [45, 70],
  B1: [90, 130],
  B2: [140, 190],
  C1: [220, 260],
  C2: [240, 280],
};

export function cefrWordTarget(level: CefrLevel): [number, number] {
  return CEFR_WORD_TARGETS[level];
}

/** Genres that suit each level — used to steer dynamic task generation so a fresh
 *  A1 task is a note/message and a C1 task is an essay/proposal/report. */
export const CEFR_GENRES: Record<CefrLevel, CefrTaskGenre[]> = {
  A1: ["note", "message"],
  A2: ["email", "message"],
  B1: ["email", "article", "story"],
  B2: ["essay", "review", "article"],
  C1: ["essay", "proposal", "report"],
  C2: ["essay", "article"],
};

/** All tasks for one CEFR level (kept in authored order). */
export function cefrTasksForLevel(level: CefrLevel): CefrWritingTask[] {
  return TASKS.filter((t) => t.level === level);
}

/** Look up a single task by id. */
export function getCefrTask(id: string): CefrWritingTask | undefined {
  return TASKS.find((t) => t.id === id);
}

export const CEFR_WRITING_TASKS = TASKS;
