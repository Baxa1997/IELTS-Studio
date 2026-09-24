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

/**
 * Colour + tier for an overall band. Rounds nothing — pass the real band.
 *
 * ⚠️ THESE ARE `var()`s, SO KEEP THEM IN `style`. They were hex, which left a
 * dark-green 8.0 on a black card and a pale chip under it in dark mode on every
 * result screen. The light values in `--ex-band-*` are the old hex exactly. A
 * var() does not resolve in an SVG `fill=`/`stroke=` attribute — if a score
 * ring ever draws with these, put the colour in `style={{ stroke }}`.
 */
export function bandColor(band: number): BandColor {
  const tier = (t: string, label: string): BandColor => ({
    fg: `var(--ex-band-${t}-fg)`,
    bg: `var(--ex-band-${t}-bg)`,
    label,
  });
  if (band >= 8) return tier("8", "Expert");
  if (band >= 7) return tier("7", "Good");
  if (band >= 6) return tier("6", "Competent");
  if (band >= 5) return tier("5", "Modest");
  if (band >= 4) return tier("4", "Limited");
  if (band >= 3) return tier("3", "Very limited");
  return tier("2", "Extremely limited");
}
