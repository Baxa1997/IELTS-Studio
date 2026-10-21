/**
 * Free anonymous gradings before the sign-up wall. Mirrors the server's per-IP
 * cap (PUBLIC_GRADER_PER_IP, default 3) so the UI blocks at the same point the
 * API does. ONE count across the three tabs, because the server's is one count
 * too.
 *
 * ⚠️ IN A PLAIN MODULE, NOT IN grader.tsx. The page quotes this number in its
 * "at a glance" facts, and a value exported from a "use client" module arrives
 * in a server component as a client reference, not a number.
 */
export const FREE_LIMIT = 3;

/**
 * The day the page's facts were last checked against the code. Shown on the
 * page and sent as `dateModified`, because answer engines weigh a page's
 * freshness — so it is a promise: move it only when the facts were re-read,
 * never to look recent.
 */
export const GRADE_FACTS_CHECKED = "2026-10-21";

/** The official public IELTS Writing band descriptors (May 2023), on ielts.org —
 *  the document the rubric in .claude/skills/ielts-examiner restates. */
export const IELTS_WRITING_DESCRIPTORS_URL =
  "https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-writing-band-descriptors.pdf";
