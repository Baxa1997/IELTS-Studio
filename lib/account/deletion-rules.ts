/**
 * The rules for a learner deleting their own account, kept apart from the code
 * that does the deleting so they can be tested without a database.
 *
 * ⚠️ ONE ORG DELETE CASCADES THROUGH ~60 TABLES. That is how both shared content
 * libraries and the public grader's org were wiped in August 2026 (see
 * supabase/migrations/20260828160000_protect_all_system_orgs.sql). Everything
 * here exists so that a learner can only ever take their OWN single-person
 * workspace with them.
 */

/**
 * Reserved organisations. They look exactly like abandoned personal workspaces —
 * kind 'personal', no members — so they are refused by id, not by shape. The
 * database trigger `protect_system_orgs` refuses them too; this is the second
 * lock, and it must list the same ids.
 */
export const RESERVED_ORG_IDS: ReadonlySet<string> = new Set([
  "00000000-0000-4000-8000-00000000111b", // reading library (READING_LIBRARY_ORG_ID)
  "00000000-0000-4000-8000-00000000111c", // listening library
  "00000000-0000-4000-a000-000000000001", // public grader (PUBLIC_ORG_ID)
]);

/** What the learner must type to confirm. */
export const DELETE_CONFIRMATION = "DELETE";

/**
 * Why this account may not be deleted from its own settings, or null when it may.
 *
 * Read from the database at the moment of deletion, never from the session: the
 * session says who is asking, only the database can say who else is in the org.
 */
export function accountDeletionBlocker(input: {
  userId: string;
  organizationId: string;
  orgKind: string | null | undefined;
  members: { id: string; role: string }[];
}): string | null {
  if (RESERVED_ORG_IDS.has(input.organizationId)) {
    return "This workspace is part of the platform and can't be deleted.";
  }
  if (input.orgKind !== "personal") {
    return "This account belongs to a center. Your center manages it, so it can't be deleted from here.";
  }
  const [only, ...others] = input.members;
  if (!only || others.length > 0 || only.id !== input.userId) {
    return "This workspace has other people in it, so it can't be deleted from here.";
  }
  if (only.role !== "student") {
    return "Only a learner account can be deleted from here.";
  }
  return null;
}

/** Stripe statuses that are still billing — or about to. */
const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "incomplete"]);

/**
 * Whether a card subscription must be cancelled before the account goes.
 *
 * Payme and Click are single payments for a period, so they have nothing to
 * cancel. A Stripe subscription renews on its own, and deleting the account
 * without cancelling it would keep charging a card for an account that no longer
 * exists.
 */
export function needsStripeCancellation(
  sub: {
    provider: string | null;
    status: string | null;
    external_subscription_id: string | null;
    external_customer_id: string | null;
  } | null,
): boolean {
  if (!sub || sub.provider !== "stripe") return false;
  if (!LIVE_STATUSES.has(sub.status ?? "")) return false;
  return Boolean(sub.external_subscription_id || sub.external_customer_id);
}

/**
 * Every stored recording of this workspace's speaking practice.
 *
 * The rows go with the org's cascade; the FILES in the `speaking-audio` bucket do
 * not — storage is not part of the foreign-key graph — so they are collected
 * before the rows disappear.
 */
export function speakingAudioPaths(
  attempts: { audio_path: string | null }[],
  sessions: { candidate_audio_path: string | null; examiner_audio_path: string | null }[],
): string[] {
  const all = [
    ...attempts.map((a) => a.audio_path),
    ...sessions.flatMap((s) => [s.candidate_audio_path, s.examiner_audio_path]),
  ];
  return [...new Set(all.filter((p): p is string => typeof p === "string" && p.length > 0))];
}
