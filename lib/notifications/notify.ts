import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The one primitive that writes a notification row.
 *
 * Split out of `send.ts` to break a cycle rather than to tidy up: the §12
 * automatic-message service needs to deliver, and `send.ts`'s helpers now need
 * to ask the service whether a message is switched on. Both depend on this;
 * neither depends on the other, so the import graph stays a tree.
 *
 * Always service-role: a notification is the system stating that something
 * happened, so no client may write one (RLS grants clients only `read_at`).
 *
 * Always best-effort. Delivering the news must never break the thing the news
 * is about — a failed insert here cannot be allowed to fail a grading, an
 * assignment, or a submission. Failures are logged and swallowed.
 */

export type NotificationType =
  | "assignment_published"
  | "assignment_due_soon"
  | "attempt_graded"
  | "grading_queued"
  | "grading_failed"
  | "quota_warning"
  | "quota_exhausted"
  /** A center-wide message from the center admin. */
  | "announcement";

export interface NotifyInput {
  organizationId: string;
  recipientIds: string[];
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  payload?: Record<string, unknown>;
}

export async function notify(input: NotifyInput): Promise<void> {
  const recipients = [...new Set(input.recipientIds)].filter(Boolean);
  if (recipients.length === 0) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(
      recipients.map((recipient_id) => ({
        organization_id: input.organizationId,
        recipient_id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        payload: input.payload ?? {},
      })),
    );
    if (error) console.error("[notify] insert failed:", input.type, error.message);
  } catch (err) {
    console.error("[notify] failed:", input.type, err);
  }
}
