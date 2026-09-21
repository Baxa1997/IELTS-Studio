import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export { ago } from "./time";

/**
 * Writing down what a super admin did.
 *
 * Every call here is deliberate: one row per administrative act on someone
 * else's account — approving a centre, changing a plan, lifting a limit. Reads
 * are not logged, and nor are background jobs; a log padded with noise is a log
 * nobody scrolls, which is the same as no log.
 *
 * NEVER THROWS. An audit write that fails must not take the action down with
 * it: the approval a centre is waiting on matters more than the record of it,
 * and a half-applied action is worse than an unlogged one. Failures are logged
 * to the server console so they are visible without being fatal.
 */

export type AuditAction =
  | "center.approve"
  | "center.reject"
  | "center.suspend"
  | "center.restore"
  | "center.plan_change"
  | "user.plan_change"
  | "user.limits_change"
  | "user.suspend"
  | "user.restore"
  | "referral.approve"
  | "referral.reject"
  /* Two stops, logged apart. The log is the only place that later says WHY a
     code died, and "closed" and "revoked" carry very different implications for
     the money already on the ledger. */
  | "referral.close"
  | "referral.revoke"
  /* Settling a month. The only entry here that records money LEAVING, so it is
     also the only one whose detail carries a `reference` — the bank or Payme id
     is what a payout can be reconciled against a year later, and the audit row
     is the one place it is guaranteed to survive. */
  | "referral.payout"
  /* A marketing broadcast. The only act here that reaches people OUTSIDE the
     platform, which is exactly why it is logged: "who mailed the entire user
     base, when, and saying what" has no other record, and the detail carries
     the subject and the headcount so the answer does not depend on the
     broadcast row still existing. */
  | "platform.broadcast";

export interface AuditEntry {
  action: AuditAction;
  targetKind: "organization" | "user" | "plan" | "platform" | "referral";
  targetId?: string | null;
  targetLabel?: string | null;
  detail?: Record<string, unknown>;
  actor: { id?: string | null; email?: string | null };
}

export async function recordAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("admin_audit_log").insert({
      actor_id: entry.actor.id ?? null,
      actor_email: entry.actor.email ?? null,
      action: entry.action,
      target_kind: entry.targetKind,
      target_id: entry.targetId ?? null,
      target_label: entry.targetLabel ?? null,
      detail: entry.detail ?? {},
    });
    if (error) console.error("[audit] could not record", entry.action, error.message);
  } catch (err) {
    console.error("[audit] could not record", entry.action, (err as Error).message);
  }
}

export interface AuditRow {
  id: string;
  when: string;
  action: AuditAction | string;
  actor: string;
  target: string;
  detail: Record<string, unknown>;
}

/** Human wording for each action, so the log reads as sentences, not slugs. */
const PHRASING: Record<string, string> = {
  "center.approve": "Approved",
  "center.reject": "Rejected the application from",
  "center.suspend": "Suspended",
  "center.restore": "Restored",
  "center.plan_change": "Changed the plan for",
  "user.plan_change": "Changed the plan for",
  "user.limits_change": "Changed the limits for",
  "user.suspend": "Suspended",
  "user.restore": "Restored",
  "platform.broadcast": "Sent a broadcast from",
};

export function phraseAction(action: string): string {
  return PHRASING[action] ?? action.replaceAll(".", " ").replaceAll("_", " ");
}

export async function loadAuditLog(limit = 40): Promise<AuditRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_audit_log")
    .select("id, created_at, action, actor_email, target_label, target_kind, detail")
    .order("created_at", { ascending: false })
    .limit(limit);

  // An empty log is a legitimate answer (nothing has been done since it was
  // switched on); a broken query is not, and would look identical on screen.
  if (error) {
    console.error("[audit] could not read the log:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    when: r.created_at as string,
    action: r.action as string,
    actor: (r.actor_email as string | null) ?? "—",
    target: (r.target_label as string | null) ?? (r.target_kind as string),
    detail: (r.detail ?? {}) as Record<string, unknown>,
  }));
}

