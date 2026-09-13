import "server-only";

import { stripeCancelSubscription } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  accountDeletionBlocker,
  needsStripeCancellation,
  speakingAudioPaths,
} from "./deletion-rules";

/**
 * Columns that point at a profile with NO `on delete` rule, so an existing row
 * refuses the profile's deletion outright. Rows inside the learner's own
 * workspace go with its cascade in the same statement; only rows ELSEWHERE could
 * block, and those are detached (the content stays, its attribution goes).
 *
 * From the migrations: writing 20260617120100, invites 20260617120300, prompt
 * generation 20260617120700, reading generation 20260617120900, reading tests
 * 20260620140000. A new profile reference without an `on delete` rule belongs here.
 */
const DETACH: readonly (readonly [table: string, column: string])[] = [
  ["writing_prompts", "created_by"],
  ["writing_prompts", "reviewed_by"],
  ["reading_passages", "created_by"],
  ["reading_passages", "reviewed_by"],
  ["reading_tests", "created_by"],
  ["gradings", "graded_by"],
  ["invites", "invited_by"],
];

const AUDIO_BUCKET = "speaking-audio";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Permanently delete a solo learner: their workspace, everything in it, their
 * recordings and their login.
 *
 * THE ORDER IS THE SAFETY.
 *   1. Re-check, from the database, that this is a one-person personal workspace.
 *      Nothing is touched before this passes.
 *   2. Detach the learner from rows outside their workspace — harmless to them
 *      if a later step fails, because their own rows are untouched.
 *   3. Cancel a live card subscription. If that cannot be confirmed, stop: the
 *      account survives intact, which is better than a card still being charged
 *      for an account that is gone.
 *   4. Note the recordings' paths while the rows still exist.
 *   5. Delete the workspace. This is the step that removes the data, so it runs
 *      before the login: if deleting the login then failed, the person's data is
 *      already gone, which is the promise the page makes.
 *   6. Delete the login, then the recordings. Failures here are logged for
 *      cleanup rather than reported — the data is already gone and the person is
 *      being signed out.
 */
export async function deleteLearnerAccount(input: {
  userId: string;
  organizationId: string;
}): Promise<Result> {
  const { userId, organizationId } = input;
  const admin = createAdminClient();
  const untouched = "Nothing was deleted. Try again in a few minutes.";

  // 1 ─ who is really in this workspace
  const [orgRes, membersRes, subRes] = await Promise.all([
    admin.from("organizations").select("kind").eq("id", organizationId).maybeSingle(),
    admin.from("profiles").select("id, role").eq("organization_id", organizationId),
    admin
      .from("subscriptions")
      .select("provider, status, external_subscription_id, external_customer_id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);
  if (orgRes.error || membersRes.error || subRes.error) {
    console.error("[account-delete] pre-check failed", {
      organizationId,
      org: orgRes.error?.message,
      members: membersRes.error?.message,
      sub: subRes.error?.message,
    });
    return { ok: false, error: `We couldn't check your account. ${untouched}` };
  }
  const blocker = accountDeletionBlocker({
    userId,
    organizationId,
    orgKind: (orgRes.data?.kind as string | undefined) ?? null,
    members: (membersRes.data ?? []) as { id: string; role: string }[],
  });
  if (blocker) return { ok: false, error: blocker };

  // 2 ─ rows elsewhere that would refuse the profile's deletion
  for (const [table, column] of DETACH) {
    const { error } = await admin
      .from(table)
      .update({ [column]: null })
      .eq(column, userId)
      .neq("organization_id", organizationId);
    if (error) {
      console.error("[account-delete] detach failed", { table, column, error: error.message });
      return { ok: false, error: untouched };
    }
  }

  // 3 ─ money
  const sub = subRes.data as Parameters<typeof needsStripeCancellation>[0];
  if (needsStripeCancellation(sub)) {
    const cancelled = await stripeCancelSubscription({
      subscriptionId: sub?.external_subscription_id,
      customerId: sub?.external_customer_id,
    });
    if (!cancelled.ok) {
      console.error("[account-delete] stripe cancel failed", {
        organizationId,
        error: cancelled.error,
      });
      return {
        ok: false,
        error: `We couldn't cancel your card subscription, so your account was kept. ${untouched}`,
      };
    }
  }

  // 4 ─ recordings, while the rows that name them still exist
  const [attempts, sessions] = await Promise.all([
    admin.from("speaking_attempts").select("audio_path").eq("organization_id", organizationId),
    admin
      .from("speaking_sessions")
      .select("candidate_audio_path, examiner_audio_path")
      .eq("organization_id", organizationId),
  ]);
  const paths = speakingAudioPaths(
    (attempts.data ?? []) as { audio_path: string | null }[],
    (sessions.data ?? []) as {
      candidate_audio_path: string | null;
      examiner_audio_path: string | null;
    }[],
  );

  // 5 ─ the workspace, and with it the profile and every row it owns
  const { data: gone, error: orgErr } = await admin
    .from("organizations")
    .delete()
    .eq("id", organizationId)
    .select("id");
  if (orgErr || !gone || gone.length === 0) {
    console.error("[account-delete] org delete failed", { organizationId, error: orgErr?.message });
    return {
      ok: false,
      error: needsStripeCancellation(sub)
        ? "Your card subscription was cancelled, but your account couldn't be deleted. Try again in a few minutes."
        : untouched,
    };
  }

  // 6 ─ the login, then the files
  const { error: userErr } = await admin.auth.admin.deleteUser(userId);
  if (userErr) {
    console.error("[account-delete] auth user left behind — clean up by hand", {
      userId,
      error: userErr.message,
    });
  }
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await admin.storage.from(AUDIO_BUCKET).remove(paths.slice(i, i + 100));
    if (error) {
      console.error("[account-delete] recordings left behind — clean up by hand", {
        organizationId,
        count: paths.length,
        error: error.message,
      });
      break;
    }
  }

  return { ok: true };
}
