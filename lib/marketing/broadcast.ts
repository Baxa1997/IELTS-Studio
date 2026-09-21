import "server-only";

import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";

import { resolveAddress } from "./audience";
import { isSafeUrl, renderHtml, renderText, type BroadcastLink } from "./render";
import { unsubscribePostUrl, unsubscribeUrl } from "./unsubscribe";

/**
 * Sending a broadcast, a few at a time.
 *
 * ⚠️ IT CANNOT BE ONE LOOP, AND THE REASON IS NOT STYLE. ~180 SMTP handshakes
 * take minutes; a serverless function is killed long before that, leaving a
 * send half-finished with no record of how far it got. So the recipient list is
 * written FIRST, the send is a sequence of small batches, and each batch marks
 * the rows it finished. A retry — after a timeout, a deploy, or a closed tab —
 * resumes rather than restarting, because `queued` is the only thing it picks
 * up.
 *
 * NOTHING HERE THROWS PAST ONE RECIPIENT. A single bad address must not stop
 * the other 179: the failure is written on that row with its reason and the
 * loop continues, which is also what makes the failures reviewable afterwards
 * instead of being one dead 500.
 */

/** Per invocation. Small enough to finish well inside a function timeout even
 *  when SMTP is slow, large enough that 180 people take a handful of rounds. */
export const BATCH_SIZE = 20;

export interface BroadcastSummary {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  queued: number;
}

/**
 * Write the broadcast and freeze its recipient list.
 *
 * THE OPT-OUT IS APPLIED HERE, not at send time, so the number the admin
 * confirms is the number that will be mailed. Anyone who unsubscribes between
 * creation and the last batch is caught by the second check in `sendNextBatch`
 * — both exist because this list can take minutes to drain.
 */
export async function createBroadcast(args: {
  subject: string;
  body: string;
  links: BroadcastLink[];
  profileIds: string[];
  createdBy: string | null;
}): Promise<{ id: string | null; error: string | null; queued: number }> {
  const subject = args.subject.trim();
  const body = args.body.trim();
  if (subject.length < 3) return { id: null, error: "Give it a subject.", queued: 0 };
  if (body.length < 10) return { id: null, error: "The message is empty.", queued: 0 };
  if (args.profileIds.length === 0) return { id: null, error: "Nobody is selected.", queued: 0 };

  const links = args.links
    .map((l) => ({ label: l.label.trim() || l.url.trim(), url: l.url.trim() }))
    .filter((l) => l.url && isSafeUrl(l.url));

  const admin = createAdminClient();

  /* RESOLVED AGAIN SERVER-SIDE, never taken from the form. The browser sends
     profile ids; if it also sent addresses, anyone who could reach this action
     could mail an arbitrary address from our domain. */
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, contact_email, marketing_opt_out")
    .in("id", args.profileIds.slice(0, 5000));

  if (!profiles || profiles.length === 0) {
    return { id: null, error: "None of those accounts exist any more.", queued: 0 };
  }

  const emailById = new Map<string, string>();
  for (const p of profiles) {
    const { data } = await admin.auth.admin.getUserById(String(p.id));
    if (data?.user?.email) emailById.set(String(p.id), data.user.email);
  }

  const rows: { profile_id: string; email: string; status: string; detail: string | null }[] = [];
  for (const p of profiles) {
    const id = String(p.id);
    if (p.marketing_opt_out === true) {
      rows.push({ profile_id: id, email: "", status: "skipped", detail: "unsubscribed" });
      continue;
    }
    const email = resolveAddress(p.contact_email, emailById.get(id));
    if (!email) {
      rows.push({ profile_id: id, email: "", status: "skipped", detail: "no deliverable address" });
      continue;
    }
    rows.push({ profile_id: id, email, status: "queued", detail: null });
  }

  const queued = rows.filter((r) => r.status === "queued").length;
  if (queued === 0) {
    return { id: null, error: "Everyone selected has unsubscribed or has no address.", queued: 0 };
  }

  const { data: broadcast, error } = await admin
    .from("marketing_broadcasts")
    .insert({
      subject,
      body,
      links,
      created_by: args.createdBy,
      status: "sending",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !broadcast) {
    return { id: null, error: `Couldn't save it: ${error?.message ?? "no row"}`, queued: 0 };
  }

  const { error: rowsError } = await admin
    .from("marketing_broadcast_recipients")
    .insert(rows.map((r) => ({ ...r, broadcast_id: broadcast.id })));
  if (rowsError) {
    // Nothing has been mailed yet, so the whole thing can go rather than be
    // left as a broadcast whose recipient list is a mystery.
    await admin.from("marketing_broadcasts").delete().eq("id", broadcast.id);
    return { id: null, error: `Couldn't queue recipients: ${rowsError.message}`, queued: 0 };
  }

  return { id: String(broadcast.id), error: null, queued };
}

/**
 * Mail the next few, and say how far along it is.
 *
 * Returns `done` when nothing is left queued — the caller loops until then.
 */
export async function sendNextBatch(
  broadcastId: string,
): Promise<{ done: boolean; sentNow: number; failedNow: number; remaining: number; error: string | null }> {
  const admin = createAdminClient();

  const { data: broadcast } = await admin
    .from("marketing_broadcasts")
    .select("id, subject, body, links, status")
    .eq("id", broadcastId)
    .maybeSingle();
  if (!broadcast) return { done: true, sentNow: 0, failedNow: 0, remaining: 0, error: "That broadcast is gone." };

  const { data: batch } = await admin
    .from("marketing_broadcast_recipients")
    .select("profile_id, email")
    .eq("broadcast_id", broadcastId)
    .eq("status", "queued")
    // Stable order so two overlapping calls fight over the same rows and lose
    // predictably, rather than interleaving and mailing twice.
    .order("profile_id")
    .limit(BATCH_SIZE);

  if (!batch || batch.length === 0) {
    await finish(admin, broadcastId);
    return { done: true, sentNow: 0, failedNow: 0, remaining: 0, error: null };
  }

  const links = Array.isArray(broadcast.links) ? (broadcast.links as BroadcastLink[]) : [];
  const names = await namesFor(admin, batch.map((b) => String(b.profile_id)));

  let sentNow = 0;
  let failedNow = 0;

  for (const row of batch) {
    const profileId = String(row.profile_id);

    /* CHECKED AGAIN, right before the message goes. A drain can take minutes
       and somebody may have clicked unsubscribe in an earlier batch of this
       very send — mailing them after that is the complaint the whole opt-out
       exists to avoid. */
    const { data: fresh } = await admin
      .from("profiles")
      .select("marketing_opt_out")
      .eq("id", profileId)
      .maybeSingle();
    if (fresh?.marketing_opt_out === true) {
      await mark(admin, broadcastId, profileId, "skipped", "unsubscribed mid-send");
      continue;
    }

    const link = unsubscribeUrl(profileId);
    const name = names.get(profileId) ?? "there";
    const result = await sendEmail({
      to: String(row.email),
      subject: String(broadcast.subject),
      text: renderText({ body: String(broadcast.body), links, name, unsubscribeUrl: link }),
      html: renderHtml({ body: String(broadcast.body), links, name, unsubscribeUrl: link }),
      headers: {
        // The native "Unsubscribe" button in Gmail and Outlook. `One-Click`
        // means the client can honour it without the reader leaving the inbox,
        // which is why /unsubscribe also answers POST.
        // Points at /api/unsubscribe, NOT the page the footer link uses: this
        // one is POSTed by the mail client and App Router will not let a
        // route.ts sit beside a page.tsx. See unsubscribePostUrl.
        "List-Unsubscribe": `<${unsubscribePostUrl(profileId)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (result.sent) {
      sentNow += 1;
      await mark(admin, broadcastId, profileId, "sent", null);
    } else {
      failedNow += 1;
      await mark(admin, broadcastId, profileId, "failed", result.detail ?? "unknown error");
    }
  }

  const { count: remaining } = await admin
    .from("marketing_broadcast_recipients")
    .select("profile_id", { count: "exact", head: true })
    .eq("broadcast_id", broadcastId)
    .eq("status", "queued");

  const left = remaining ?? 0;
  if (left === 0) await finish(admin, broadcastId);
  return { done: left === 0, sentNow, failedNow, remaining: left, error: null };
}

async function mark(
  admin: ReturnType<typeof createAdminClient>,
  broadcastId: string,
  profileId: string,
  status: "sent" | "failed" | "skipped",
  detail: string | null,
): Promise<void> {
  await admin
    .from("marketing_broadcast_recipients")
    .update({ status, detail, sent_at: new Date().toISOString() })
    .eq("broadcast_id", broadcastId)
    .eq("profile_id", profileId)
    .select("profile_id");
}

async function finish(
  admin: ReturnType<typeof createAdminClient>,
  broadcastId: string,
): Promise<void> {
  await admin
    .from("marketing_broadcasts")
    .update({ status: "sent", finished_at: new Date().toISOString() })
    .eq("id", broadcastId)
    .neq("status", "sent")
    .select("id");
}

async function namesFor(
  admin: ReturnType<typeof createAdminClient>,
  profileIds: string[],
): Promise<Map<string, string>> {
  const { data } = await admin.from("profiles").select("id, full_name").in("id", profileIds);
  const out = new Map<string, string>();
  for (const p of data ?? []) {
    // First name only — "Hi Javohir" reads like a person wrote it and
    // "Hi Javohir ABDUMALIKOV" reads like a mail merge.
    const first = (p.full_name as string | null)?.trim().split(/\s+/)[0];
    out.set(String(p.id), first || "there");
  }
  return out;
}

/** Past sends, newest first — what was said, to how many, and what bounced. */
export async function loadBroadcasts(limit = 25): Promise<BroadcastSummary[]> {
  const admin = createAdminClient();
  const { data: broadcasts } = await admin
    .from("marketing_broadcasts")
    .select("id, subject, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!broadcasts || broadcasts.length === 0) return [];

  const ids = broadcasts.map((b) => String(b.id));
  const { data: rows } = await admin
    .from("marketing_broadcast_recipients")
    .select("broadcast_id, status")
    .in("broadcast_id", ids);

  const tally = new Map<string, { sent: number; failed: number; skipped: number; queued: number }>();
  for (const r of rows ?? []) {
    const key = String(r.broadcast_id);
    const t = tally.get(key) ?? { sent: 0, failed: 0, skipped: 0, queued: 0 };
    const status = String(r.status) as keyof typeof t;
    if (status in t) t[status] += 1;
    tally.set(key, t);
  }

  return broadcasts.map((b) => {
    const t = tally.get(String(b.id)) ?? { sent: 0, failed: 0, skipped: 0, queued: 0 };
    return {
      id: String(b.id),
      subject: String(b.subject),
      status: String(b.status),
      createdAt: String(b.created_at),
      total: t.sent + t.failed + t.skipped + t.queued,
      ...t,
    };
  });
}
