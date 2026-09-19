import type { MessageKey } from "@/lib/i18n";

/**
 * The sections of a solo learner's settings (`/settings/<section>`).
 *
 * Only solo learners have this page — staff have /console/settings, and a
 * center student's account is run by their center.
 *
 * The labels are dictionary KEYS rather than English text: this list is the
 * settings nav, so it is chrome, and chrome is what i18n covers. `satisfies`
 * rather than a plain annotation so `key` keeps its literal union type — the
 * router and `LearnerSectionKey` depend on it — while still forcing every
 * `labelKey` to be a real message.
 */
export const LEARNER_SECTIONS = [
  { key: "account", labelKey: "settings.account", noteKey: "settings.account.note" },
  { key: "goal", labelKey: "settings.goal", noteKey: "settings.goal.note" },
  { key: "appearance", labelKey: "appearance.title", noteKey: "settings.appearance.note" },
  { key: "billing", labelKey: "settings.billing", noteKey: "settings.billing.note" },
  { key: "delete", labelKey: "settings.delete", noteKey: "settings.delete.note" },
] as const satisfies readonly { key: string; labelKey: MessageKey; noteKey: MessageKey }[];

export type LearnerSectionKey = (typeof LEARNER_SECTIONS)[number]["key"];

/** The section a URL names, or null for anything else. */
export function resolveLearnerSection(raw: string): LearnerSectionKey | null {
  return LEARNER_SECTIONS.find((s) => s.key === raw)?.key ?? null;
}
