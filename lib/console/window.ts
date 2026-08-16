/**
 * The window every figure on a page is measured over — R1.
 *
 * ONE RANGE, AND IT GOVERNS EVERYTHING. The console used to hardcode 90 days in
 * the loader and print "last 90 days" in three different captions, so a picker
 * would have moved some numbers and not others — which is worse than no picker,
 * because the reader cannot tell which is which.
 *
 * The other half of R1 matters just as much: some figures are DELIBERATELY
 * fixed. "Gone quiet in 14 days", "practised since Monday", "today's registers"
 * are always relative to now and must never move when the picker does. Those
 * carry `ALWAYS_CURRENT` as their caption so the page says so out loud rather
 * than leaving the reader to guess why one number didn't budge.
 *
 * Pure, and deliberately not `server-only`: the picker is a client component
 * and has to label itself with the same words the loader measures by.
 */

export const RANGES = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "180d", label: "Last 6 months", days: 180 },
  { key: "365d", label: "Last 12 months", days: 365 },
  // No "all time": every band in it would be averaged with work from a student's
  // first week, and a center that has run for two years would look like it is
  // going backwards the better it teaches.
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export const DEFAULT_RANGE: RangeKey = "90d";

export interface Window {
  key: RangeKey;
  label: string;
  days: number;
  /** ISO instant the window opens at — what loaders filter on. */
  since: string;
}

/** The caption for a figure that ignores the picker on purpose. */
export const ALWAYS_CURRENT = "always current";

export function resolveWindow(key: string | undefined, now: Date = new Date()): Window {
  const found = RANGES.find((r) => r.key === key) ?? RANGES.find((r) => r.key === DEFAULT_RANGE)!;
  return {
    key: found.key,
    label: found.label,
    days: found.days,
    since: new Date(now.getTime() - found.days * 86400_000).toISOString(),
  };
}

/** `in the last 90 days` — the phrase a caption appends, from one place. */
export const overWindow = (w: Window): string => `in the ${w.label.toLowerCase()}`;
