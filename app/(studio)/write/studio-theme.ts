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

/** A slightly stronger tint of an accent colour, for the generate-surface gradient. */
export function accentStrong(hex: string): string {
  return `${hex}33`;
}
