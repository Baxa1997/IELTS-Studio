import "server-only";

import {
  AUTO_MESSAGE_BY_KEY,
  composeAutoMessage,
  type AutoMessageKey,
  type AutoMessageSetting,
  type PlaceholderValues,
} from "@/lib/console/auto-messages";
import { notify, type NotificationType } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Sending the six automatic messages, and reading what a centre has chosen.
 *
 * The decision of WHAT to say is pure and tested in `auto-messages.ts`. This
 * file is only the parts that touch the database: which settings a centre has,
 * and delivering without sending twice.
 */

/** What the console page shows: one row per catalogue entry, defaults merged. */
export async function loadAutoMessageSettings(): Promise<Map<AutoMessageKey, AutoMessageSetting>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auto_messages")
    .select("key, enabled, template, updated_at");

  const out = new Map<AutoMessageKey, AutoMessageSetting>();
  for (const row of data ?? []) {
    out.set(row.key as AutoMessageKey, {
      key: row.key as AutoMessageKey,
      enabled: Boolean(row.enabled),
      template: (row.template as string | null) ?? null,
      updatedAt: (row.updated_at as string | null) ?? null,
    });
  }
  return out;
}

/** Same thing for a sender, which has no user session and must not need one. */
async function settingFor(
  organizationId: string,
  key: AutoMessageKey,
): Promise<AutoMessageSetting | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("auto_messages")
    .select("key, enabled, template, updated_at")
    .eq("organization_id", organizationId)
    .eq("key", key)
    .maybeSingle();
  if (!data) return null;
  return {
    key,
    enabled: Boolean(data.enabled),
    template: (data.template as string | null) ?? null,
    updatedAt: (data.updated_at as string | null) ?? null,
  };
}

/** The in-app notification type each automatic message rides on. */
const NOTIFICATION_TYPE: Record<AutoMessageKey, NotificationType> = {
  practice_set: "assignment_published",
  results_ready: "attempt_graded",
  absent_today: "announcement",
  gone_quiet: "announcement",
  two_absences: "announcement",
  invoice_due: "announcement",
};

export interface SendAutoMessageArgs {
  organizationId: string;
  key: AutoMessageKey;
  recipientIds: string[];
  values: PlaceholderValues;
  href?: string | null;
  /**
   * What this send is ABOUT — a date for the scheduled nudges, an attempt id
   * for the event-driven ones. Two messages about different days are two
   * messages; two about the same day are one, however many times the job runs.
   */
  subjectKey: string;
}

/**
 * Deliver one automatic message, at most once per recipient per subject.
 *
 * THE DEDUPE IS NOT OPTIONAL. `gone_quiet` and `two_absences` run from a
 * schedule, and a schedule retries: a timed-out cron, an overlapping
 * invocation, an owner clicking "run now". A student told twice in one morning
 * that they have gone quiet learns to ignore the channel, which costs more than
 * the nudge was worth.
 *
 * The unique index does the work rather than a read-then-write, because a
 * read-then-write races exactly when it matters — two invocations at once.
 * Claim first, send second: a duplicate key means somebody already has it.
 *
 * Best-effort like the rest of the notification layer. Failing to deliver news
 * must never fail the thing the news is about.
 */
export async function sendAutoMessage(args: SendAutoMessageArgs): Promise<number> {
  const spec = AUTO_MESSAGE_BY_KEY[args.key];
  if (!spec) return 0;

  const recipients = [...new Set(args.recipientIds)].filter(Boolean);
  if (recipients.length === 0) return 0;

  try {
    const setting = await settingFor(args.organizationId, args.key);
    const composed = composeAutoMessage({ spec, setting, values: args.values });
    if (!composed) return 0;

    const admin = createAdminClient();

    // Claim before sending. `ignoreDuplicates` turns the unique-index collision
    // into "somebody else already claimed this one" rather than an error, and
    // the returned rows are exactly the recipients this invocation won.
    const { data: claimed, error } = await admin
      .from("auto_message_sends")
      .upsert(
        recipients.map((recipient_id) => ({
          organization_id: args.organizationId,
          key: args.key,
          recipient_id,
          subject_key: args.subjectKey,
        })),
        { onConflict: "organization_id,key,recipient_id,subject_key", ignoreDuplicates: true },
      )
      .select("recipient_id");

    if (error) {
      console.error("[auto-message] claim failed:", args.key, error.message);
      return 0;
    }

    const toSend = (claimed ?? []).map((r) => r.recipient_id as string);
    if (toSend.length === 0) return 0;

    await notify({
      organizationId: args.organizationId,
      recipientIds: toSend,
      type: NOTIFICATION_TYPE[args.key],
      title: composed.title,
      body: composed.body,
      href: args.href ?? null,
      payload: { auto_message: args.key },
    });

    return toSend.length;
  } catch (err) {
    console.error("[auto-message] failed:", args.key, err);
    return 0;
  }
}

/**
 * Is this message on for this centre? For callers that must decide BEFORE
 * doing work — the Telegram fan-out, which costs a network round trip per
 * channel and should not be paid for a message nobody will send.
 */
export async function autoMessageEnabled(
  organizationId: string,
  key: AutoMessageKey,
): Promise<boolean> {
  const spec = AUTO_MESSAGE_BY_KEY[key];
  if (!spec || spec.notWiredYet) return false;
  const setting = await settingFor(organizationId, key);
  return setting ? setting.enabled : spec.onByDefault;
}
