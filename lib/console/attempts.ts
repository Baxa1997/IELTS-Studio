/**
 * What an attempt is, in terms both sides of the client boundary can hold.
 *
 * DELIBERATELY NOT `server-only`. The review panel is a client component and
 * needs the criterion list and the report route; `lib/console/marking.ts` is
 * server-only because it queries. Keeping the constants there and importing
 * them into the panel pulled `next/headers` into the client bundle and failed
 * the build with a Pages-Router error that names none of this — the same trap
 * as the admin menu icons, and worth a separate file to make impossible.
 */

export type AttemptKind = "writing" | "reading" | "listening" | "speaking";

export const ATTEMPT_KINDS: AttemptKind[] = ["writing", "reading", "listening", "speaking"];

export const KIND_LABEL: Record<AttemptKind, string> = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
};

/** What a piece of work in each skill is called, for counting it. */
export const KIND_UNIT: Record<AttemptKind, string> = {
  writing: "essay",
  reading: "test",
  listening: "test",
  speaking: "mock",
};

/**
 * The four writing criteria, in the order the official descriptors list them.
 *
 * TR covers Task Achievement on Task 1 as well; the grader stores both under
 * whichever key the task used, and the label here follows the more common one
 * rather than showing a student two names for the same row.
 */
export const WRITING_CRITERIA = [
  { key: "TR", label: "Task Response" },
  { key: "CC", label: "Coherence & Cohesion" },
  { key: "LR", label: "Lexical Resource" },
  { key: "GRA", label: "Grammatical Range & Accuracy" },
] as const;

/**
 * Where the learner's own full feedback lives.
 *
 * ONE PAGE FOR BOTH. These four routes gate on RLS rather than on role, so a
 * teacher opening a student's work sees exactly the report the student sees —
 * with the marking footer added. Two separate views would let the band a parent
 * is shown and the band a teacher signed drift apart, which is the one failure
 * this whole feature exists to prevent.
 */
export function reportHref(kind: AttemptKind, refId: string): string {
  switch (kind) {
    case "writing":
      return `/activities/essay/${refId}`;
    case "reading":
      return `/activities/reading/${refId}`;
    case "listening":
      return `/listen/results/${refId}`;
    case "speaking":
      return `/speak/mock/${refId}`;
  }
}

/** Bands sit on the 0.5 grid. A 6.3 is not a band, it is a typo. */
export function snapBand(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const snapped = Math.round(value * 2) / 2;
  return snapped >= 0 && snapped <= 9 ? snapped : null;
}
