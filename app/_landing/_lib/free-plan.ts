import { PLAN_ORDER, PLAN_TIERS, planTier } from "@/lib/billing/plans";
import type { MessageKey } from "@/lib/i18n";

/**
 * What a free account gets, said where people decide whether to make one: the
 * sign-up dialog, and the account card under every blog article.
 *
 * ⚠️ THE NUMBERS COME FROM `PLAN_TIERS.trial`, NEVER FROM THE COPY — the copy
 * holds `{n}`. The quota code enforces these limits, so a line typed as "5"
 * goes on promising five the day the plan changes to three, and a sign-up
 * screen is where a learner finds out within the hour whether the promise held.
 *
 * Worded "label — {n} a month", not "{n} gradings": the messages have no plural
 * forms, and a bare number in front of a noun gives "1 live speaking mocks" in
 * English and the wrong one of three forms in Russian.
 *
 * "Free", not "trial", in the copy. The plan's id is `trial`, but nothing about
 * it ends: the monthly limits come back every month and the library unlocks are
 * kept for good. Calling it a trial undersells it, and invites the question of
 * when it stops.
 */

const FREE = PLAN_TIERS.trial;

const LINES: { key: MessageKey; n: number | null }[] = [
  { key: "su.freeGrades", n: FREE.gradeLimit },
  { key: "su.freePractice", n: FREE.generateLimit },
  { key: "su.freeMock", n: FREE.fullMockLimit },
  { key: "su.freeLibrary", n: FREE.libraryLimit },
];

/** One line per limit the free plan meters. A limit that became unlimited would
 *  need its own wording rather than "null a month", so it drops out — and
 *  `free-plan.test.ts` counts the lines, so that is a red test, not a quiet loss. */
export const FREE_PLAN_LINES = LINES.filter((l): l is { key: MessageKey; n: number } => l.n !== null);

/** "From $5.99 a month": the cheapest plan billed monthly, in the dollars the
 *  price cards show in every language. */
export const PAID_FROM = `$${Math.min(
  ...PLAN_ORDER.map(planTier).flatMap((t) => (t.price && t.months === 1 ? [t.price] : [])),
)}`;
