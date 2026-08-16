/**
 * Whether a person still counts.
 *
 * One vocabulary, shared by students and staff, because the question every
 * denominator in the console asks is the same one: is this person still here?
 *
 * NOTHING IS DELETED. A student who leaves keeps their attendance, their
 * invoices and their reports — a parent can still ask for last term's marks in
 * September. What "left" changes is only ever a *forward-looking* count:
 *
 *   counted in                   active   paused   left
 *   ─────────────────────────────────────────────────────
 *   roster size                     ✓        ✓       ·
 *   attendance denominator          ✓        ·       ·
 *   gone-quiet chasing              ✓        ·       ·
 *   invoices for next month         ✓        ·       ·
 *   history, reports, past marks    ✓        ✓       ✓
 *
 * Deliberately not `server-only`: the roster filters and the status control are
 * client components and need the same labels.
 */

export const MEMBER_STATUSES = ["active", "paused", "left"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const isMemberStatus = (v: unknown): v is MemberStatus =>
  typeof v === "string" && (MEMBER_STATUSES as readonly string[]).includes(v);

/**
 * The words each role reads. The stored value is identical — a teacher on leave
 * and a student taking a month off are the same fact to every query — but
 * "Paused" is what a center says about a student and "On leave" about staff.
 */
export const STUDENT_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  paused: "Paused",
  left: "Left",
};

export const STAFF_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  paused: "On leave",
  left: "Left",
};

export const STUDENT_STATUS_NOTE: Record<MemberStatus, string> = {
  active: "Counted everywhere — chased, invoiced, and in every attendance figure.",
  paused: "Still enrolled. Out of attendance, invoicing and gone-quiet alerts until they return.",
  left: "Historical only. Their marks, registers and invoices stay exactly as they are.",
};

/** Statuses that keep someone on the roster. `left` is the only one that doesn't. */
export const ENROLLED: MemberStatus[] = ["active", "paused"];

/** Only active people are counted against attendance, chasing and invoicing. */
export const COUNTS_FOR_METRICS: MemberStatus[] = ["active"];

export const STATUS_TONE: Record<MemberStatus, "green" | "amber" | "neutral"> = {
  active: "green",
  paused: "amber",
  left: "neutral",
};
