import type { MessageKey } from "@/lib/i18n";

import { FREE_SKILLS, type FreeSkill } from "./rotation";

/** Every skill the free section shows, Speaking included — it is the locked one. */
export type PracticeCardSkill = FreeSkill | "speaking";

/** The four cards, in order: the free skills, then Speaking behind sign-in. */
export const PRACTICE_CARD_SKILLS: readonly PracticeCardSkill[] = [...FREE_SKILLS, "speaking"];

/**
 * Where a free practice runs, per skill — the SAME runner a signed-in learner
 * uses (the writing studio, the reading runner, the listening runner), each in
 * its own skill's studio folder so it can reuse that runner without a
 * cross-area import. Never the dashboard: a visitor has none (owner,
 * 2026-09-27 — "it must open in a separate page of practice").
 */
export const FREE_RUNNER_BASE: Record<FreeSkill, string> = {
  writing: "/write/free",
  reading: "/read/free",
  listening: "/listen/free",
  cefr: "/cefr/free",
};

/** One practice's runner: `/read/free/<passageId>` and so on. */
export const freeRunner = (skill: FreeSkill, key: string) =>
  `${FREE_RUNNER_BASE[skill]}/${encodeURIComponent(key)}`;

/** The listing page of dated cards for a skill. */
export const freePracticePage = (skill: FreeSkill) => `/practice/${skill}`;

/** Each listing page's name — its heading, its <title>, and what an article
 *  about the skill calls it when it links there. */
export const FREE_PAGE_TITLE: Record<FreeSkill, MessageKey> = {
  writing: "free.pageTitleWriting",
  reading: "free.pageTitleReading",
  listening: "free.pageTitleListening",
  cefr: "free.pageTitleCefr",
};

/** Each listing page's description — its meta description, its share card's
 *  line, and what llms.txt says about it. */
export const FREE_PAGE_DESCRIPTION: Record<FreeSkill, MessageKey> = {
  writing: "free.metaDescWriting",
  reading: "free.metaDescReading",
  listening: "free.metaDescListening",
  cefr: "free.metaDescCefr",
};

/** The signed-in home of each skill — where "sign in" should land. */
export const SKILL_HUB: Record<PracticeCardSkill, string> = {
  writing: "/write",
  reading: "/read",
  listening: "/listen",
  cefr: "/cefr",
  speaking: "/speak",
};

/** Sign-in that returns the visitor to the skill they were reaching for. */
export const signInFor = (skill: PracticeCardSkill) =>
  `/sign-in?next=${encodeURIComponent(SKILL_HUB[skill])}`;
