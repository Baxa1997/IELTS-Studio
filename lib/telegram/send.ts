import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Posting to a center's Telegram channel.
 *
 * One platform bot serves every center (see docs/telegram-channels-options.md).
 * The token is server-only and never reaches a client — a leaked bot token lets
 * anyone post as us into every channel we're in.
 *
 * Best-effort, always. A channel post must never fail the thing it is
 * announcing: setting practice succeeds whether or not Telegram answered. Same
 * rule as `lib/notifications/send.ts`, for the same reason.
 */

const API = "https://api.telegram.org";

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/** Raw Bot API call. Returns null on any failure, having logged it. */
export async function callTelegram<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Telegram is fast; a slow call must not hold a server action open.
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: T;
      description?: string;
    };
    if (!res.ok || !json.ok) {
      console.error("[telegram]", method, json.description ?? res.status);
      return null;
    }
    return (json.result ?? null) as T | null;
  } catch (err) {
    console.error("[telegram] request failed:", method, err);
    return null;
  }
}

/** Telegram's HTML parse mode accepts a small tag set; everything else must be escaped. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendMessage(chatId: number, html: string): Promise<boolean> {
  const result = await callTelegram("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    // Practice links are announcements, not previews of our own site.
    disable_web_page_preview: true,
  });
  return result != null;
}

const KIND_LABEL: Record<string, string> = {
  writing: "📝 New writing practice",
  reading: "📖 New reading practice",
  listening: "🎧 New listening practice",
};

/**
 * Announce an assignment in each linked group's channel.
 *
 * Deliberately says only that work exists. No student names, no bands, no
 * scores — a channel is visible to everyone in it, parents included in most
 * centers, and the work itself stays behind a login. Getting this wrong is a
 * privacy incident, not a bug.
 */
export async function notifyAssignmentTelegram(args: {
  organizationId: string;
  groupIds: string[];
  kind: string;
  title: string;
  url: string;
  dueAt?: string | null;
}): Promise<void> {
  if (!telegramConfigured() || args.groupIds.length === 0) return;

  try {
    const admin = createAdminClient();
    // Only verified links: a half-finished handshake has no confirmed channel.
    const { data: links } = await admin
      .from("telegram_links")
      .select("chat_id, group_id")
      .eq("organization_id", args.organizationId)
      .in("group_id", args.groupIds)
      .not("verified_at", "is", null)
      .not("chat_id", "is", null);

    const rows = (links ?? []) as { chat_id: number; group_id: string }[];
    if (rows.length === 0) return;

    const due = args.dueAt
      ? `\nDue ${new Date(args.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      : "";
    const text =
      `<b>${escapeHtml(KIND_LABEL[args.kind] ?? "New practice")}</b>\n` +
      `${escapeHtml(args.title)}${escapeHtml(due)}\n\n` +
      `Open it here: ${escapeHtml(args.url)}`;

    // Sequential, not Promise.all: Telegram throttles ~20 messages a minute to
    // one chat and ~30 a second overall, and a class list is short enough that
    // ordering costs nothing.
    for (const row of rows) {
      await sendMessage(row.chat_id, text);
    }
  } catch (err) {
    console.error("[telegram] assignment announce failed:", err);
  }
}

/**
 * Post a center announcement to the linked class channels.
 *
 * Safe to post in full, unlike assignment notices: an announcement is text the
 * center wrote for its own people, so there is no student name, band or score
 * to leak. That is the whole reason this can carry the body while
 * `notifyAssignmentTelegram` deliberately cannot.
 *
 * Returns how many channels took it, so the console can say "and 3 channels"
 * rather than implying a reach it did not have.
 */
export async function sendAnnouncementTelegram(args: {
  organizationId: string;
  /** The classes to post into. EMPTY MEANS NOWHERE — never "everywhere". */
  groupIds: string[];
  subject: string;
  body: string;
}): Promise<number> {
  if (!telegramConfigured() || args.groupIds.length === 0) return 0;

  try {
    const admin = createAdminClient();
    const query = admin
      .from("telegram_links")
      .select("chat_id, group_id")
      .eq("organization_id", args.organizationId)
      .not("verified_at", "is", null)
      .not("chat_id", "is", null)
      .in("group_id", args.groupIds);

    const { data } = await query;
    const rows = (data ?? []) as { chat_id: number; group_id: string }[];
    if (rows.length === 0) return 0;

    const text = `<b>${escapeHtml(args.subject)}</b>\n\n${escapeHtml(args.body)}`;

    // Sequential: Telegram throttles ~30 messages a second overall, and a
    // center has tens of channels at most.
    let delivered = 0;
    for (const row of rows) {
      if (await sendMessage(row.chat_id, text)) delivered += 1;
    }
    return delivered;
  } catch (err) {
    console.error("[telegram] announcement failed:", err);
    return 0;
  }
}
