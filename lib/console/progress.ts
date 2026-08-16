/**
 * How far a student has come, said in a way that survives a parent reading it.
 *
 * Pure, and not `server-only`: the student page, the roster and the parent
 * report all render this, and two of them are client components.
 */

export type BaselineSource = "first_attempt" | "placement";

export interface Progress {
  /** Bands moved since the baseline. Null when there is nothing to compare. */
  moved: number | null;
  /** `+1.0 since placement` / `+0.5 since their first attempt`. */
  label: string | null;
  /** How much weight the claim carries — drives whether it is shown boldly. */
  confidence: "measured" | "indicative" | "none";
}

/**
 * WHY THE SOURCE IS IN THE SENTENCE.
 *
 * "+1.5 since baseline" is the number a centre puts in front of a parent, and
 * it is worth exactly as much as the starting point behind it. A diagnostic sat
 * in week one is a measurement. Whatever the student happened to open first —
 * possibly before anyone taught them the format, possibly abandoned halfway —
 * is a placeholder. Both produce a number; only one of them is evidence.
 *
 * So the words differ: "since placement" is a claim the centre can defend, and
 * "since their first attempt" quietly tells the reader how much to trust it
 * without printing a disclaimer nobody reads.
 */
export function progressSince(
  current: number | null,
  baseline: number | null,
  source: BaselineSource,
  sampleCount = 0,
): Progress {
  if (current == null || baseline == null) {
    return { moved: null, label: null, confidence: "none" };
  }

  // A baseline that IS the current reading says nothing yet — one measurement
  // is a position, not a journey.
  if (sampleCount < 2) {
    return {
      moved: null,
      label: source === "placement" ? "placement only — no progress yet" : null,
      confidence: "none",
    };
  }

  const moved = Math.round((current - baseline) * 10) / 10;
  const since = source === "placement" ? "since placement" : "since their first attempt";

  if (moved === 0) return { moved: 0, label: `level ${since}`, confidence: sourceWeight(source) };
  return {
    moved,
    label: `${moved > 0 ? "+" : ""}${moved.toFixed(1)} ${since}`,
    confidence: sourceWeight(source),
  };
}

const sourceWeight = (source: BaselineSource): Progress["confidence"] =>
  source === "placement" ? "measured" : "indicative";

/** `Writing 5.5 · +1.0 since placement` — §6's line, assembled in one place. */
export function bandWithProgress(
  skill: string,
  current: number | null,
  progress: Progress,
): string {
  if (current == null) return `${skill} not measured yet`;
  return progress.label
    ? `${skill} ${current.toFixed(1)} · ${progress.label}`
    : `${skill} ${current.toFixed(1)}`;
}
