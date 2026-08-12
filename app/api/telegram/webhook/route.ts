import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, sendMessage } from "@/lib/telegram/send";

// Writes with the service-role client and calls out to Telegram — Node runtime,
// never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/webhook
 *
 * The bot's ear. Registered once with Telegram's `setWebhook`, passing a
 * `secret_token`; Telegram then sends that value back in a header on every
 * update. Checking it is what stops anyone who knows the URL from forging
 * updates and binding channels they don't own — this endpoint is necessarily
 * public, so the header is the only thing authenticating it.
 *
 * THREE WAYS A CHAT GETS CONNECTED, in the order a non-technical admin meets
 * them:
 *
 *   1. `/start CODE` — Telegram sends this by itself when the bot is added
 *      through a `?startgroup=CODE` deep link. The admin taps one button in the
 *      app, picks a group, and never sees a code at all. This is the path we
 *      want everyone on.
 *   2. `/link CODE` — typed by hand. The fallback for a chat the bot is already
 *      in, or when the deep link was opened on a machine with no Telegram.
 *   3. Neither — the bot was added some other way. It asks for the code in the
 *      chat rather than sitting there silently, because a bot that joins and
 *      says nothing looks broken.
 *
 * The code is what carries authority in all three: matching it proves the
 * person holds a secret the app only shows to staff who manage that class, and
 * posting it (or adding the bot) proves they can act in that chat. A typed-in
 * chat id would prove neither.
 *
 * Always answers 200. A non-2xx makes Telegram retry the same update for hours,
 * so failures are logged and swallowed rather than surfaced.
 */
export async function POST(req: Request): Promise<Response> {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return ok(); // not configured — accept and ignore
  if (req.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    // Not from Telegram. 401 rather than 200: nothing legitimate lands here.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return ok();
  }

  // ── the bot was added to a chat ─────────────────────────────────────────
  // A deep link delivers `/start CODE` as well, and that arrives as its own
  // update — so this only has to cover the case where no code follows.
  if (update.my_chat_member) {
    const { chat, new_chat_member: member } = update.my_chat_member;
    const joined = member?.status === "member" || member?.status === "administrator";
    if (joined && chat) {
      // Give the /start update a moment to land first; only prompt if this chat
      // is still unknown to us a beat later.
      await new Promise((r) => setTimeout(r, 1200));
      const admin = createAdminClient();
      const { data: already } = await admin
        .from("telegram_links")
        .select("id")
        .eq("chat_id", chat.id)
        .not("verified_at", "is", null)
        .maybeSingle();
      if (!already) {
        await sendMessage(
          chat.id,
          "👋 Nearly there. Open the class in your center console → <b>Settings → Telegram</b>, " +
            "and post the code it shows you here as <code>/link CODE</code>.",
        );
      }
    }
    return ok();
  }

  const msg = update.message ?? update.channel_post;
  const text = msg?.text?.trim();
  const chat = msg?.chat;
  if (!text || !chat) return ok();

  // `/start CODE` (deep link) or `/link CODE` (typed), tolerating the @botname
  // suffix Telegram adds in groups.
  // A bare `/start` in the bot's own chat — what you get by tapping the bot in
  // search, or by opening the deep link on a device that shows the bot instead
  // of the group picker. Saying what the bot is for costs one message and saves
  // the admin guessing whether it is broken.
  if (/^\/start(?:@\w+)?$/.test(text) && (chat.type === "private" || chat.id > 0)) {
    await sendMessage(
      chat.id,
      "👋 I post class announcements into your center's Telegram groups.\n\n" +
        "I don't do anything in this chat. To connect a class: open it in the console → " +
        "<b>Settings → Telegram</b>, press <b>Add to a group</b>, and pick the group there.",
    );
    return ok();
  }

  const match = /^\/(?:start|link)(?:@\w+)?\s+([A-Za-z0-9-]{4,20})$/.exec(text);
  if (!match) return ok();
  const code = match[1].toUpperCase();

  // A CLASS CHANNEL IS NEVER A PRIVATE CHAT, and this check is not pedantry —
  // it is the failure we actually hit. Opening the `?startgroup=` deep link on
  // a device where Telegram would rather show the bot's own chat lands you in
  // a private conversation, and pressing Start there sends the same
  // `/start CODE`. Without this the class binds to one person's DMs: every
  // announcement goes to them alone, the channel gets nothing, and the app
  // shows a confident green "Connected" the whole time.
  //
  // Private chat ids are positive; groups, supergroups and channels are
  // negative. `type` is checked first because it says so explicitly, with the
  // sign as a fallback for updates that omit it.
  const isPrivate = chat.type === "private" || (chat.type == null && chat.id > 0);
  if (isPrivate) {
    await sendMessage(
      chat.id,
      "That connected nothing — this is our private chat, not your class channel.\n\n" +
        "Open the <b>group or channel</b> the class uses, add me to it, and post " +
        `<code>/link ${escapeHtml(code)}</code> there. The code still works.`,
    );
    return ok();
  }

  try {
    const admin = createAdminClient();
    const { data: link } = await admin
      .from("telegram_links")
      .select("id, organization_id, code_expires_at, verified_at")
      .eq("link_code", code)
      .maybeSingle();

    if (!link) {
      await sendMessage(chat.id, "That code isn't recognised. Generate a fresh one in the app.");
      return ok();
    }
    if (link.verified_at) {
      await sendMessage(chat.id, "That code has already been used.");
      return ok();
    }
    if (link.code_expires_at && new Date(link.code_expires_at) < new Date()) {
      await sendMessage(chat.id, "That code has expired. Generate a fresh one in the app.");
      return ok();
    }

    const { error } = await admin
      .from("telegram_links")
      .update({
        chat_id: chat.id,
        chat_title: chat.title ?? null,
        verified_at: new Date().toISOString(),
        // Burn the code so the same one can't bind a second channel.
        link_code: null,
        code_expires_at: null,
      })
      .eq("id", link.id);

    if (error) {
      // The most likely cause by far is the (organization_id, chat_id) unique:
      // this channel is already wired to another class in the same center.
      console.error("[telegram/webhook] link failed:", error.message);
      await sendMessage(
        chat.id,
        "This channel is already connected to another class in your center. Disconnect it there first.",
      );
      return ok();
    }

    await sendMessage(
      chat.id,
      `✅ Connected${chat.title ? ` — <b>${escapeHtml(chat.title)}</b>` : ""}.\nNew practice will be announced here.`,
    );
  } catch (err) {
    console.error("[telegram/webhook] unexpected:", err);
  }

  return ok();
}

function ok() {
  return NextResponse.json({ ok: true });
}

interface TelegramChat {
  id: number;
  title?: string;
  type?: string;
}
interface TelegramMessage {
  text?: string;
  chat?: TelegramChat;
}
interface TelegramUpdate {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
  my_chat_member?: {
    chat?: TelegramChat;
    new_chat_member?: { status?: string };
  };
}
