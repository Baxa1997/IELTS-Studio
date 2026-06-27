/**
 * CEFR visual identity — the design tokens that make the CEFR track look like its
 * OWN product, not the IELTS modules. The whole experience is tinted by the active
 * level's colour (the "ladder you climb"), on cool neutrals instead of the IELTS tan.
 *
 * One token set serves both the CEFR hub and the shared writing studio (themed via
 * `mode`). The IELTS default below reproduces today's studio look exactly, so
 * `mode="ielts"` is visually unchanged — only CEFR passes a level-derived theme.
 *
 * No `"use client"` (server + client both import it, like `levels.ts`).
 */

import { CEFR, type CefrLevel } from "./levels";

export interface StudioTheme {
  /** Primary action / identity colour (IELTS indigo; CEFR = the level's colour). */
  accent: string;
  /** Soft tint of the accent, for pills and the generate surface. */
  accentSoft: string;
  /** Accent-tinted hairline border. */
  accentLine: string;
  /** Drop shadow for the primary button (accent-coloured). */
  accentShadow: string;
  /** Primary heading text. */
  ink: string;
  /** Long-form body / essay text. */
  body: string;
  /** Secondary / muted text. */
  muted: string;
  /** Full-bleed studio background (IELTS warm tan; CEFR cool slate). */
  canvas: string;
  /** Card background. */
  panel: string;
  /** Neutral card border. */
  line: string;
  /** Soft inner fill (IELTS warm; CEFR cool). */
  soft: string;
  /** Soft inner border. */
  softLine: string;
}

/** Today's IELTS studio look, captured as tokens so it stays byte-for-byte the same. */
export const IELTS_STUDIO_THEME: StudioTheme = {
  accent: "#3B43B5",
  accentSoft: "#ECEBFB",
  accentLine: "#E1DFF7",
  accentShadow: "0 6px 16px -6px rgba(59,67,181,.7)",
  ink: "#1A1C33",
  body: "#272C3E",
  muted: "#767C90",
  canvas: "#F4F1E7",
  panel: "#fff",
  line: "#E7E3D5",
  soft: "#FBFAF4",
  softLine: "#F0EDE1",
};

/**
 * The CEFR theme for a level: the level's colour as the accent, on cool neutrals.
 * Cool canvas + a non-indigo accent is what makes the CEFR studio read as a
 * different product at a glance.
 */
export function cefrTheme(level: CefrLevel): StudioTheme {
  const c = CEFR[level];
  return {
    accent: c.color,
    accentSoft: c.bg,
    accentLine: `${c.color}33`,
    accentShadow: `0 10px 22px -10px ${c.color}b3`,
    ink: "#1B2030",
    body: "#26303A",
    muted: "#5C6473",
    canvas: "#EEF1F7",
    panel: "#fff",
    line: "#E3E7F0",
    soft: "#F5F7FB",
    softLine: "#EAEEF5",
  };
}

/** A slightly stronger tint of an accent colour, for the generate-surface gradient. */
export function accentStrong(hex: string): string {
  return `${hex}33`;
}
