import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { generatePassword } from "@/lib/passwords";
import { createAdminClient } from "@/lib/supabase/admin";
import { callTelegram, escapeHtml, sendMessage } from "@/lib/telegram/send";
import {
  bindStudentChat,
  groupForInviteCode,
  matchStudentByPhone,
  sendCredentialsTelegram,
} from "@/lib/telegram/student";

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

  // ── the phone that decides who this is ──────────────────────────────────
  // Only ever accepted from the person who sent it: `contact.user_id` is who
  // the number belongs to according to Telegram, and requiring it to equal the
  // sender is what stops somebody forwarding a classmate's contact card to
  // claim their account.
  if (msg?.contact && msg.chat) {
    await claimByPhone(msg.chat.id, msg.contact, msg.from?.id);
    return ok();
  }

  const text = msg?.text?.trim();
  const chat = msg?.chat;
  if (!text || !chat) return ok();

  // ── the name that separates two siblings ────────────────────────────────
  // Only reachable when a number has already matched more than one student, so
  // this is never a way to be identified BY name — it chooses between people
  // who have already proved they share a phone.
  const waiting = pendingGroup.get(chat.id);
  if (waiting?.phone && !text.startsWith("/")) {
    await resolve(chat.id, waiting, waiting.phone, text);
    return ok();
  }

  // `/start CODE` (deep link) or `/link CODE` (typed), tolerating the @botname
  // suffix Telegram adds in groups.
  // A bare `/start` in the bot's own chat — what you get by tapping the bot in
  // search, or by opening the deep link on a device that shows the bot instead
  // of the group picker. Saying what the bot is for costs one message and saves
  // the admin guessing whether it is broken.
  if (/^\/start(?:@\w+)?$/.test(text) && (chat.type === "private" || chat.id > 0)) {
    await sendMessage(
      chat.id,
      "👋 I'm the EngProgress bot.\n\n" +
        "<b>Students:</b> send me your code and I'll connect you — just the code on its " +
        "own, like <code>K7M4PQ2X</code>. Your teacher has it.\n\n" +
        "<i>(If you opened a link and nothing happened, that is why: Telegram only passes " +
        "the code the very first time you start a bot. Sending it as a message always " +
        "works.)</i>\n\n" +
        "<b>Teachers:</b> to connect a class channel, open the class in the console → " +
        "<b>Settings → Telegram</b>, press <b>Add to a group</b>, and pick the group there.",
    );
    return ok();
  }

  // A BARE CODE, PASTED INTO THE BOT'S OWN CHAT.
  //
  // This is the path most students will actually take, because the deep link
  // silently does nothing for anyone who has started the bot before: Telegram
  // passes `?start=CODE` ONLY on the very first start, and afterwards tapping
  // the link just opens the existing chat. That is invisible from our side —
  // we receive a bare /start — so the recovery has to be something the student
  // can do without understanding any of it.
  //
  // Safe to accept without a command because the alphabet is ours: eight
  // characters, uppercase, no 0/O or 1/I/L. Ordinary chat does not look like
  // that, and a string that is not a live code is answered rather than acted
  // on.
  const isPrivate = chat.type === "private" || (chat.type == null && chat.id > 0);
  if (isPrivate && /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(text.toUpperCase())) {
    const bare = text.toUpperCase();
    if (await bindStudent(bare, chat.id)) return ok();

    // A CLASS code rather than a personal one. It identifies the roster to
    // search and nothing else — the bind is decided by the phone, which is why
    // this code is safe to post in a channel where thirty people can read it.
    const group = await groupForInviteCode(bare);
    if (group) {
      pendingGroup.set(chat.id, group);
      await callTelegram("sendMessage", {
        chat_id: chat.id,
        text:
          "Almost there. Tap the button below to confirm your phone number — that is how " +
          "I know which account is yours.\n\nI only use it to find you on your class list.",
        reply_markup: {
          keyboard: [[{ text: "📱 Share my number", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return ok();
    }
    await sendMessage(
      chat.id,
      "I don't recognise that code. Ask your teacher for a new one — codes stop working " +
        "after 7 days, and each one can only be used once.",
    );
    return ok();
  }

  const match = /^\/(?:start|link)(?:@\w+)?\s+([A-Za-z0-9-]{4,20})$/.exec(text);
  if (!match) return ok();
  const code = match[1].toUpperCase();

  // ── a student binding their own chat ────────────────────────────────────
  // Tried BEFORE the private-chat rejection below, because for a student a
  // private chat is the whole point: this is where their password goes. The two
  // code spaces cannot collide — a channel code lives in telegram_links and a
  // student code in telegram_students, and this only looks in the latter, so a
  // channel code pasted here still falls through to the warning it deserves.
  if (isPrivate) {
    const bound = await bindStudent(code, chat.id);
    if (bound) return ok();
    // Not a student code either — fall through and explain.
  }

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

/**
 * Bind a student to this private chat, and greet them.
 *
 * Returns false when the code is not a student code at all, so the caller can
 * carry on and treat it as a channel code. Returns TRUE for a student code that
 * is expired or used — those are answered here, because the person holding one
 * is a learner who needs telling what went wrong, not a channel admin.
 *
 * Nothing secret is sent here. The credentials go out through
 * `sendCredentialsTelegram`, called by the staff action that knows the
 * password; this only confirms the chat is theirs. A webhook is a public
 * endpoint and the code arrives in the clear, so binding is all it may do.
 */
async function bindStudent(code: string, chatId: number): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("telegram_students")
    .select("id, verified_at, code_expires_at")
    .eq("link_code", code)
    .maybeSingle();
  if (!row) return false;

  if (row.verified_at) {
    await sendMessage(chatId, "That link has already been used. Ask your teacher for a new one.");
    return true;
  }
  if (row.code_expires_at && new Date(row.code_expires_at as string) < new Date()) {
    await sendMessage(chatId, "That link has expired. Ask your teacher for a new one.");
    return true;
  }

  const { error } = await admin
    .from("telegram_students")
    .update({
      chat_id: chatId,
      verified_at: new Date().toISOString(),
      // Burned, so the slip cannot bind a second phone if it is passed around.
      link_code: null,
      code_expires_at: null,
    })
    .eq("id", row.id)
    .select("id");

  if (error) {
    // Almost certainly the (organization_id, chat_id) unique: this Telegram
    // account is already bound to a different student in the same centre.
    console.error("[telegram/webhook] student bind failed:", error.message);
    await sendMessage(
      chatId,
      "This Telegram account is already connected to another student. Ask your teacher to check.",
    );
    return true;
  }

  // Careful about the tense. Connecting does not itself deliver anything: a
  // stored password cannot be read back, so an existing student's details only
  // arrive when a teacher creates the account or resets the password. Saying
  // "your details will come here" to someone whose account already exists
  // leaves them waiting for a message nobody is going to send.
  await sendMessage(
    chatId,
    "✅ Connected.\n\nHomework reminders will arrive here. If you are waiting for your " +
      "sign-in details, ask your teacher to send them now — they will land in this chat.",
  );
  return true;
}

/**
 * Which class a chat is part-way through joining.
 *
 * IN MEMORY, and that is a real limitation rather than a shortcut: serverless
 * instances do not share it, so a student whose code and phone land on
 * different instances is asked to send the code again. That is a recoverable
 * annoyance, and the alternative — a row per half-finished attempt — is state
 * to expire and clean up for a step that takes ten seconds. Revisit if it
 * proves common.
 */
const pendingGroup = new Map<
  number,
  {
    groupId: string;
    organizationId: string;
    /** Kept after a phone that pointed at several people, so the name they
     *  type next can be applied without asking for the number again. */
    phone?: string;
  }
>();

/**
 * Bind the student whose phone this is, and send their sign-in details.
 *
 * The phone is the whole authentication. Everything before it is public: the
 * class code was posted in a channel and no names were ever shown. So the
 * failures here are deliberately quiet about WHY — "no match" reads the same
 * whether the number is absent from the roster, shared with a sibling, or
 * already bound, because a bot that explains which of those it was becomes a
 * tool for working out who is on a class list.
 */
async function claimByPhone(
  chatId: number,
  contact: { phone_number?: string; user_id?: number },
  senderId: number | undefined,
): Promise<void> {
  const pending = pendingGroup.get(chatId);
  if (!pending) {
    await sendMessage(chatId, "Send me your class code first, then share your number.");
    return;
  }

  // Somebody else's contact card, forwarded. Telegram tells us who the number
  // belongs to; if that is not the sender, this is not their number to claim.
  if (contact.user_id != null && senderId != null && contact.user_id !== senderId) {
    await sendMessage(chatId, "That is somebody else's number. Share your own to connect.");
    return;
  }
  if (!contact.phone_number) {
    await sendMessage(chatId, "I did not get a number. Try the button again.");
    return;
  }

  await resolve(chatId, pending, contact.phone_number);
}

/**
 * Turn a phone (and possibly a name) into one student, then finish the job.
 *
 * Split out because it is reached twice: once when the number arrives, and
 * again if that number belonged to more than one person and the student has now
 * typed their name.
 */
async function resolve(
  chatId: number,
  pending: { groupId: string; organizationId: string; phone?: string },
  phone: string,
  name?: string,
): Promise<void> {
  const { match: student, ambiguous } = await matchStudentByPhone({
    groupId: pending.groupId,
    phone,
    name,
  });

  if (ambiguous) {
    // Two people share this number — siblings, almost always. Remember the
    // phone so the name they type next completes it, rather than making them
    // press the share button again.
    pendingGroup.set(chatId, { ...pending, phone });
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text:
        name
          ? "That name did not match anyone on this number. Send your full name exactly as " +
            "your teacher wrote it, or ask them to check."
          : "More than one student uses this number. Send me your full name and I'll finish " +
            "connecting you.",
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (!student) {
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text:
        "I could not find that number on this class list. Ask your teacher to check the " +
        "number they have for you, then try again.",
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  const bound = await bindStudentChat({
    organizationId: pending.organizationId,
    profileId: student.profileId,
    chatId,
  });
  if (!bound) {
    await sendMessage(chatId, "Something went wrong connecting you. Ask your teacher.");
    return;
  }
  pendingGroup.delete(chatId);

  // A NEW PASSWORD, not the old one, because the old one cannot be read back —
  // Supabase stores a hash. Setting one here is what makes this self-service:
  // the student ends the conversation able to sign in, with no teacher step.
  const password = generatePassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(student.profileId, { password });
  if (error) {
    await sendMessage(
      chatId,
      "✅ Connected — but I could not set your password. Ask your teacher to reset it.",
    );
    return;
  }

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", pending.organizationId)
    .maybeSingle();

  await sendCredentialsTelegram({
    profileId: student.profileId,
    fullName: student.fullName,
    login: student.login,
    password,
    centerName: (org?.name as string | null) ?? "your center",
    signInUrl: `${serverEnv.outboundSiteUrl}/sign-in`,
  });
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
  from?: { id?: number };
  /** Sent when the student taps "Share my number". `user_id` is whose number
   *  Telegram says it is, which is what makes a forwarded card detectable. */
  contact?: { phone_number?: string; user_id?: number };
}
interface TelegramUpdate {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
  my_chat_member?: {
    chat?: TelegramChat;
    new_chat_member?: { status?: string };
  };
}
