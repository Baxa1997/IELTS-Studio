/**
 * One source of truth for how an IELTS band (0–9) is coloured and named across the
 * app — the big overall-score numbers on every result screen (writing feedback,
 * reading passage + full-test results) all read from here so the same band always
 * looks the same.
 *
 * The scale is deliberately conservative in its *naming* (only 7+ earns a "green"
 * treatment), matching the grader's anti-inflation philosophy (CLAUDE.md §2): a 6
 * reads as competent/indigo, not "good/green". `fg` is the strong text colour for
 * the number; `bg` is a soft chip background; `label` is the official band tier.
 *
 * No "use client" / no imports — server components and client components both use it.
 */

export interface BandColor {
  /** Strong foreground — use for the big number and the chip text. */
  fg: string;
  /** Soft background — use for the tier chip behind `label`. */
  bg: string;
  /** Official IELTS band-tier name (Expert … Extremely limited). */
  label: string;
}

/** Colour + tier for an overall band. Rounds nothing — pass the real band. */
export function bandColor(band: number): BandColor {
  if (band >= 8) return { fg: "#15803D", bg: "#E6F5EB", label: "Expert" };
  if (band >= 7) return { fg: "#16A34A", bg: "#E9F7EE", label: "Good" };
  if (band >= 6) return { fg: "#4338CA", bg: "#ECEBFB", label: "Competent" };
  if (band >= 5) return { fg: "#D97706", bg: "#FCF1DE", label: "Modest" };
  if (band >= 4) return { fg: "#EA580C", bg: "#FDEADD", label: "Limited" };
  if (band >= 3) return { fg: "#DC2626", bg: "#FCE4E0", label: "Very limited" };
  return { fg: "#B91C1C", bg: "#FBE0DD", label: "Extremely limited" };
}
