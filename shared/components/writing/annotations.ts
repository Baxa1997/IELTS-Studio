/**
 * Pure annotation helpers — no "use client", so server components (the Activities
 * essay page) can call cleanAnnotations() directly, and any client renderer
 * works from the same shapes/colors.
 *
 * The original client renderer, <AnnotatedEssay>, was deleted on 2026-09-20:
 * nothing had imported it since the writing feedback rebuild. These helpers are
 * still live — the Activities page uses them — so the shapes below stay.
 */

import { BRAND, withAlpha } from "@/lib/theme/tokens";

export interface Annotation {
  text: string;
  type: "spelling" | "grammar" | "vocabulary" | "cohesion";
  fix?: string;
  note?: string;
}

/** The mark colours in a graded essay. `fg` is a token (the dark-red/amber/teal inks
 *  were unreadable on a dark card); the washes stay rgba because a 16% tint of the
 *  hue reads as the same mark on either ground. Vocabulary follows the brand, so its
 *  wash does too. Style-only — never an SVG attribute. */
export const ANN_STYLE: Record<Annotation["type"], { bg: string; fg: string; label: string }> = {
  spelling: { bg: "rgba(192,57,43,.16)", fg: "var(--ex-ann-spelling)", label: "Spelling" },
  grammar: { bg: "rgba(194,138,26,.16)", fg: "var(--ex-ann-grammar)", label: "Grammar" },
  vocabulary: { bg: withAlpha(BRAND, 14), fg: BRAND, label: "Vocabulary" },
  cohesion: { bg: "rgba(47,143,124,.16)", fg: "var(--ex-ann-cohesion)", label: "Cohesion" },
};
export const ANN_ORDER: Annotation["type"][] = ["spelling", "grammar", "vocabulary", "cohesion"];

/** Keep only annotations with a usable verbatim span and a known type. */
export function cleanAnnotations(raw: unknown): Annotation[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Annotation[]).filter(
    (a) => a && typeof a.text === "string" && a.text.trim().length >= 2 && a.type in ANN_STYLE,
  );
}

export interface AnnRange {
  start: number;
  end: number;
  ann: Annotation;
}

/**
 * Match each annotation's verbatim text to its first free position in the essay,
 * returned in reading order. Shared by the studio Results card and the full-page
 * essay-feedback view so a highlight's number is identical in both. Case-insensitive,
 * non-overlapping; annotations whose span isn't found verbatim are dropped.
 */
export function matchRanges(text: string, anns: Annotation[]): AnnRange[] {
  const lower = text.toLowerCase();
  const ranges: AnnRange[] = [];
  for (const a of anns) {
    const needle = a.text.trim().toLowerCase();
    if (needle.length < 2) continue;
    let from = 0;
    while (from <= lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx < 0) break;
      const end = idx + needle.length;
      if (!ranges.some((r) => idx < r.end && end > r.start)) {
        ranges.push({ start: idx, end, ann: a });
        break;
      }
      from = idx + 1;
    }
  }
  return ranges.sort((x, y) => x.start - y.start);
}
