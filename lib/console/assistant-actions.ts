import "server-only";

import type { Profile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ActionRecord {
  action: string;
  actor: string;
  outcome: string;
  ok: boolean;
  at: string;
}

/**
 * Record what an action did — including when it refused.
 *
 * WRITTEN WITH SERVICE-ROLE, deliberately. The record has to survive the thing
 * it records: an action that succeeded and a log line that was rejected by a
 * policy would leave the centre's data changed with nothing saying so. RLS
 * still governs READING it.
 *
 * Best effort, like every other note in this codebase — failing to write
 * history must never fail the thing that made it.
 */
export async function recordAction(args: {
  profile: Profile;
  action: string;
  args: Record<string, string>;
  ok: boolean;
  outcome: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("assistant_actions").insert({
      organization_id: args.profile.organization_id,
      profile_id: args.profile.id,
      actor_name: args.profile.full_name,
      action: args.action,
      args: args.args,
      ok: args.ok,
      outcome: args.outcome.slice(0, 500),
    });
  } catch {
    /* history is a convenience; never let it cost somebody their action */
  }
}

/**
 * What the assistant has done here lately. RLS scopes it to the centre.
 *
 * NO CALLER RIGHT NOW. The "What it has done" rail this fed was removed from
 * the assistant page — it was a third column of yesterday's news beside a
 * conversation that already says what it did. The WRITE side above is still
 * live and still service-role, because the audit trail is the point: it has to
 * survive whether or not anything is currently reading it. This stays as the
 * reader for that table rather than leaving it write-only.
 */
export async function loadRecentActions(limit = 12): Promise<ActionRecord[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("assistant_actions")
      .select("action, actor_name, outcome, ok, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      action: r.action as string,
      actor: (r.actor_name as string | null) ?? "someone",
      outcome: (r.outcome as string | null) ?? "",
      ok: r.ok as boolean,
      at: r.created_at as string,
    }));
  } catch {
    return [];
  }
}
