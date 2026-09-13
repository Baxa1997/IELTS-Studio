/**
 * The sections of a solo learner's settings (`/settings/<section>`).
 *
 * Only solo learners have this page — staff have /console/settings, and a
 * center student's account is run by their center.
 */
export const LEARNER_SECTIONS = [
  { key: "account", label: "Account", note: "Name, phone and password" },
  { key: "goal", label: "Study goal", note: "Target band and test date" },
  { key: "billing", label: "Billing & plan", note: "Your plan and this month's use" },
  { key: "delete", label: "Delete account", note: "Remove your account for good" },
] as const;

export type LearnerSectionKey = (typeof LEARNER_SECTIONS)[number]["key"];

/** The section a URL names, or null for anything else. */
export function resolveLearnerSection(raw: string): LearnerSectionKey | null {
  return LEARNER_SECTIONS.find((s) => s.key === raw)?.key ?? null;
}
