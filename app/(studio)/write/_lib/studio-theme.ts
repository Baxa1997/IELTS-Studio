/**
 * Writing-studio design tokens. The studio chrome reads every colour/border from a
 * single theme object so the look lives in one place. Today there is one theme — the
 * IELTS studio look — captured as tokens.
 *
 * No `"use client"` (server + client both import it).
 */

import {
  BRAND,
  BRAND_FILL,
  BRAND_LINE,
  BRAND_SOFT,
  CANVAS,
  PANEL,
  SLATE_INK,
  SLATE_LINE,
  SLATE_MUTED,
  SLATE_STRONG,
  WELL,
  WELL_LINE,
  withAlpha,
} from "@/lib/theme/tokens";

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
  accent: BRAND,
  accentSoft: BRAND_SOFT,
  accentLine: BRAND_LINE,
  accentShadow: `0 6px 16px -6px ${withAlpha(BRAND_FILL, 55)}`,
  ink: SLATE_INK,
  body: SLATE_STRONG,
  muted: SLATE_MUTED,
  canvas: CANVAS,
  panel: PANEL,
  line: SLATE_LINE,
  soft: WELL,
  softLine: WELL_LINE,
};

/** A slightly stronger tint of an accent colour, for the generate-surface gradient.
 *  Delegates to `withAlpha` so it keeps working when the colour handed in is a
 *  `var(--tk-…)` token rather than a hex: `${token}33` yields the string
 *  "var(--tk-brand)33", which is not a colour and which the browser drops
 *  without an error. 0x33/0xFF is the ~20% this used to append. */
export function accentStrong(colour: string): string {
  return withAlpha(colour, 20);
}
