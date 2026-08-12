import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Which handed-in work this member of staff has not opened yet.
 *
 * WHY THE NOTIFICATIONS TABLE AND NOT A "LAST VISITED" TIMESTAMP. "New since
 * you last loaded the Reports page" marks work read by walking past it — open
 * the page on a phone at a bus stop and everything is silently seen. What a
 * teacher means by "new" is "I have not looked at this piece yet", and that is
 * exactly what an unread `attempt_graded` notification already records. It is
 * also per-person, so two teachers sharing a class each get their own answer,
 * and it clears the moment someone actually opens the feedback.
 *
 * Keyed by href because that is the one field a notification and a report row
 * both hold — the notification carries no attempt id of its own, and giving it
 * one would mean a migration to store what the link already says.
 *
 * RLS returns only the caller's own notifications, so there is no recipient
 * filter here to get wrong.
 */

export interface NewWork {
  /** Report links whose work has not been opened. */
  hrefs: Set<string>;
  count: number;
}

export const NO_NEW_WORK: NewWork = { hrefs: new Set(), count: 0 };

export async function loadNewWork(limit = 200): Promise<NewWork> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("href")
    .eq("type", "attempt_graded")
    .is("read_at", null)
    .not("href", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[loadNewWork] failed:", error.message);
    return NO_NEW_WORK;
  }

  const hrefs = new Set((data ?? []).map((n) => n.href as string));
  return { hrefs, count: hrefs.size };
}
