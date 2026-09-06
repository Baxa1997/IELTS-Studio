/**
 * Writing-studio design tokens. The studio chrome reads every colour/border from a
 * single theme object so the look lives in one place. Today there is one theme — the
 * IELTS studio look — captured as tokens.
 *
 * No `"use client"` (server + client both import it).
 */

export interface StudioTheme {
  /** Primary action / identity colour. */
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
  /** Full-bleed studio background. */
  canvas: string;
  /** Card background. */
  panel: string;
  /** Neutral card border. */
  line: string;
  /** Soft inner fill. */
  soft: string;
  /** Soft inner border. */
  softLine: string;
}

/** The IELTS studio look, captured as tokens. */
export const IELTS_STUDIO_THEME: StudioTheme = {
  accent: "#7D0132",
  accentSoft: "#FDF4F7",
  accentLine: "#F0D3DE",
  accentShadow: "0 6px 16px -6px rgba(125,1,50,.55)",
  ink: "#121317",
  body: "#3B4150",
  muted: "#8B919D",
  canvas: "#F6F7F9",
  panel: "#fff",
  line: "#E6E8EC",
  soft: "#FBFBFC",
  softLine: "#ECEEF2",
};

/** A slightly stronger tint of an accent colour, for the generate-surface gradient. */
export function accentStrong(hex: string): string {
  return `${hex}33`;
}
