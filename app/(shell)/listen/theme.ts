/**
 * Listening's two looks, in one place.
 *
 * The hub wears the learner app's brand (Hanken over Newsreader, indigo). The
 * in-test runner is a different surface on purpose — a flat, full-bleed light
 * exam screen with a violet accent and DM Sans throughout, mapping to the IELTS
 * Listening handoff so the runner recreates it closely.
 *
 * Split out of `listening-client.tsx` so the hub, the runner, the player and the
 * question panels can each import what they draw with, instead of all living in
 * one file because that is where the constants happened to be.
 */

export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const INDIGO = "#4338CA";
export const INK = "#1C1B2E";
export const MUTED = "#56556A";
export const TINT = "#EFEEFC";
export const GOOD = "#15803d";
export const BAD = "#b91c1c";

/* ---- Runner design tokens (IELTS Listening handoff) -------------------------
 * The in-test screen is a flat, full-bleed light exam surface with a violet
 * accent (#7c5cfc / #6d4aef on #f4f4f7) and DM Sans throughout. Values map to
 * the IELTS Listening.dc.html handoff so the runner recreates it closely. */
export const DM = "var(--font-dmsans), -apple-system, system-ui, sans-serif";
export const RUN = {
  // fonts — one family across the whole surface
  display: DM,
  sans: DM,
  mono: DM,
  // violet accent
  v: "#7c5cfc",
  vHover: "#6b4be0",
  vDeep: "#6d4aef",
  vBg: "#f3f0ff",
  vSoft: "#f5f2ff",
  vBorder: "#e4defb",
  vTrack: "#e8e4fb",
  field: "#ffffff",
  fieldFocus: "#ffffff",
  focusBorder: "#b3a5f7",
  // surfaces
  desk: "#f4f4f7",
  frame: "#ffffff",
  strip: "#faf9ff",
  rail: "#e8e4fb",
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
