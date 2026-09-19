/**
 * Listening's two looks, in one place.
 *
 * The hub wears the learner app's brand (Hanken over Newsreader, burgundy). The
 * in-test runner is a different surface on purpose — a flat, full-bleed light
 * exam screen in DM Sans throughout, mapping to the IELTS Listening handoff so
 * the runner recreates it closely.
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
  BRAND_LINE,
  BRAND_SOFT,
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
 * The in-test screen is a flat, full-bleed light exam surface in DM Sans
 * throughout. Values map to the IELTS Listening.dc.html handoff so the runner
 * recreates it closely — with the accent swapped from the handoff's violet to
 * the product burgundy (see the note at the top of this file). */
export const DM = "var(--font-dmsans), -apple-system, system-ui, sans-serif";
export const RUN = {
  // fonts — one family across the whole surface
  display: DM,
  sans: DM,
  mono: DM,
  // burgundy accent (the handoff's violet, recoloured)
  v: TK_BRAND,
  vHover: BRAND_DEEP,
  vDeep: BRAND_DEEP,
  vBg: BRAND_SOFT,
  vSoft: BRAND_SOFT,
  vBorder: BRAND_LINE,
  vTrack: BRAND_LINE,
  field: "#ffffff",
  fieldFocus: "#ffffff",
  focusBorder: "#dfa3ba",
  // surfaces
  desk: "#f4f4f7",
  frame: "#ffffff",
  strip: "#fffafb",
  rail: BRAND_LINE,
  // borders
  bFrame: "#ececf1",
  bBar: "#ececf1",
  bCard: "#ececf1",
  bHair: "#f2f2f6",
  bRow: "#f2f2f6",
  bField: "#e6e6ed",
  bPill: "#ececf1",
  bTab: "#ececf1",
  // text
  t1: "#1a1a24",
  t2: "#6b6f7e",
  t3: "#9497a4",
  t4: "#b9bcc9",
  t5: "#c7cad6",
  t6: "#9497a4",
  // success (answered)
  ok: "#1b9e54",
  okBg: "#e7f7ee",
  okBorder: "#c4ead3",
  okTint: "#f4fbf7",
  // flag / amber
  flag: "#e0952f",
  flagText: "#b9772a",
  flagBg: "#fdf3e3",
  flagBorder: "#f2d9a8",
  flagFill: "#f0c06a",
  // report
  report: "#dc2626",
  reportBg: "#fef6f6",
  reportBorder: "#f3c4c4",
} as const;

/** Part → its "genre" subtitle, shown next to the Part label in the runner. */
export const PART_GENRE: Record<number, string> = {
  1: "Conversation",
  2: "Monologue",
  3: "Discussion",
  4: "Lecture",
};
