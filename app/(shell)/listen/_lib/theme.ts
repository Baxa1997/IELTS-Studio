/**
 * Listening's two looks, in one place.
 *
 * The hub wears the learner app's brand (Hanken over Newsreader, burgundy). The
 * in-test runner is a different surface on purpose — a flat, full-bleed exam
 * screen in DM Sans throughout, mapping to the IELTS Listening handoff so the
 * runner recreates it closely.
 *
 * The handoff authored that runner with a violet accent. Only the ACCENT moved to
 * the burgundy; the handoff's layout, type, spacing and neutral scale are
 * untouched. A violet exam screen was the last surface in the learner app still
 * wearing the old brand, and it read as a leftover rather than as a deliberate
 * change of gear.
 *
 * Split out of `listening-client.tsx` so the hub, the runner, the player and the
 * question panels can each import what they draw with, instead of all living in
 * one file because that is where the constants happened to be.
 */

import {
  BRAND as TK_BRAND,
  BRAND_DEEP,
  BRAND_FILL,
  BRAND_LINE,
  BRAND_SOFT,
  PANEL,
  SLATE_BODY,
  SLATE_INK,
  WARM_GREEN as TK_WARM_GREEN,
  WARM_RED as TK_WARM_RED,
} from "@/lib/theme/tokens";

export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const BRAND = TK_BRAND;
export const INK = SLATE_INK;
export const MUTED = SLATE_BODY;
export const TINT = BRAND_SOFT;
export const GOOD = TK_WARM_GREEN;
export const BAD = TK_WARM_RED;

/* ---- Runner design tokens (IELTS Listening handoff) -------------------------
 * The in-test screen is a flat, full-bleed exam surface in DM Sans throughout.
 * Values map to the IELTS Listening.dc.html handoff so the runner recreates it
 * closely — with the accent swapped from the handoff's violet to the product
 * burgundy (see the note at the top of this file).
 *
 * ⚠️ EVERY ENTRY IS A TOKEN, AND HALF OF THEM USED TO BE HEX. The header and the
 * question area had already moved onto `PANEL`, so in dark mode they went black
 * while the question text (`t1`), the answer fields and the part-tab track kept
 * their light-mode literals: navy text on a black page, white boxes floating on
 * it. A half-converted surface is worse than an unconverted one. The `--ex-lr-*`
 * values in globals.css carry the handoff's exact light hex, so light mode did
 * not move; don't put a literal back in here.
 *
 * ⚠️ `v` IS FOR TEXT AND EDGES, `vFill` IS FOR ANYTHING CARRYING WHITE. In light
 * they are the same burgundy. In dark `BRAND` is an orange light enough to read
 * as text, and white on it is 3.8:1 — the current-question chip, the checked
 * box and the Next button all need the darker fill. */
export const DM = "var(--font-dmsans), -apple-system, system-ui, sans-serif";
export const RUN = {
  // fonts — one family across the whole surface
  display: DM,
  sans: DM,
  mono: DM,
  // burgundy accent (the handoff's violet, recoloured)
  v: TK_BRAND,
  vFill: BRAND_FILL,
  vHover: BRAND_DEEP,
  vDeep: BRAND_DEEP,
  vBg: BRAND_SOFT,
  vSoft: BRAND_SOFT,
  vBorder: BRAND_LINE,
  vTrack: BRAND_LINE,
  field: PANEL,
  fieldFocus: PANEL,
  focusBorder: "var(--ex-lr-focus)",
  // surfaces
  desk: "var(--ex-lr-desk)",
  frame: PANEL,
  strip: "var(--ex-lr-strip)",
  rail: BRAND_LINE,
  // borders
  bFrame: "var(--ex-lr-line)",
  bBar: "var(--ex-lr-line)",
  bCard: "var(--ex-lr-line)",
  bHair: "var(--ex-lr-hair)",
  bRow: "var(--ex-lr-hair)",
  bField: "var(--ex-lr-field-line)",
  bPill: "var(--ex-lr-line)",
  bTab: "var(--ex-lr-line)",
  /** An unticked box, an unset flag, the scrollbar thumb. */
  bIdle: "var(--ex-idle)",
  // text
  t1: "var(--ex-lr-t1)",
  t2: "var(--ex-lr-t2)",
  t3: "var(--ex-lr-t3)",
  t4: "var(--ex-lr-t4)",
  t5: "var(--ex-lr-t5)",
  t6: "var(--ex-lr-t3)",
  // success (answered)
  ok: "var(--ex-lr-ok)",
  okBg: "var(--ex-lr-ok-bg)",
  okBorder: "var(--ex-lr-ok-line)",
  okTint: "var(--ex-lr-ok-tint)",
  // wrong (after grading) — shared with the reading runner and the results page
  badTint: "var(--ex-bad-tint)",
  badBg: "var(--ex-bad-bg)",
  badBorder: "var(--ex-bad-line)",
  // flag / amber
  flag: "var(--ex-lr-flag)",
  flagText: "var(--ex-lr-flag-ink)",
  flagBg: "var(--ex-lr-flag-bg)",
  flagBorder: "var(--ex-lr-flag-line)",
  flagFill: "var(--ex-lr-flag-fill)",
  // report
  report: "var(--ex-red)",
  reportBg: "var(--ex-lr-report-bg)",
  reportBorder: "var(--ex-lr-report-line)",
} as const;

/** Part → its "genre" subtitle, shown next to the Part label in the runner. */
export const PART_GENRE: Record<number, string> = {
  1: "Conversation",
  2: "Monologue",
  3: "Discussion",
  4: "Lecture",
};
