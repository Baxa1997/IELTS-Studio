import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { generatePassword } from "@/lib/passwords";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerOnTelegram } from "@/lib/telegram/assistant-bot";
import { callTelegram, escapeHtml, sendMessage } from "@/lib/telegram/send";
import { COMMAND_QUESTIONS, KEYBOARD_QUESTIONS, STAFF_KEYBOARD } from "@/lib/telegram/menu";
import { startNewThread } from "@/lib/console/assistant-thread";
import { bindStaffChat, staffForChat } from "@/lib/telegram/staff";
import {
  bindStudentChat,
  clearPendingJoin,
  getPendingJoin,
  groupForInviteCode,
  matchStudentByPhone,
  sendCredentialsTelegram,
  setPendingJoin,
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
  const waiting = await getPendingJoin(chat.id);
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
    await handlePrivateCode(text.toUpperCase(), chat.id, { explainUnknown: true });
    return ok();
  }

  const match = /^\/(?:start|link)(?:@\w+)?\s+([A-Za-z0-9-]{4,20})$/.exec(text);
  if (!match) return ok();
  const code = match[1].toUpperCase();

  // ── staff, talking to their own centre ──────────────────────────────────
  // After the code paths, so a member of staff pasting a class code still gets
  // the class-code behaviour, and before the fallbacks, so ordinary sentences
  // reach the assistant rather than a "I don't recognise that" message.
  if (isPrivate) {
    const staffProfile = await staffForChat(chat.id);
    if (staffProfile) {
      // A COMMAND, A BUTTON AND A SENTENCE ARE THE SAME THING. `/today`, the
      // "📋 Today" key and typing "what needs my attention?" all become one
      // question for one brain — so nothing can work in one place and not
      // another, and there is no second set of rules to keep in step.
      const command = /^\/(\w+)/.exec(text)?.[1];
      const asked =
        (command ? COMMAND_QUESTIONS[command] : undefined) ?? KEYBOARD_QUESTIONS[text] ?? null;

      if (command === "help" || command === "start") {
        await sendStaffMenu(chat.id, staffProfile.full_name ?? "there");
        return ok();
      }
      if (command === "new") {
        await startNewThread(staffProfile);
        await sendMessage(
          chat.id,
          "Fresh start — I've put that conversation aside. It's still in the console if you need it.",
        );
        return ok();
      }
      if (command && !asked) {
        await sendMessage(
          chat.id,
          "I don't know that one. Tap <b>/</b> to see what I can do, or just ask in your own words.",
        );
        return ok();
      }

      try {
        await answerOnTelegram(staffProfile, chat.id, (asked ?? text).slice(0, 1200));
      } catch (err) {
        console.error("[telegram-assistant]", err);
        await sendMessage(chat.id, "Something went wrong reading your centre — try again shortly.");
      }
      return ok();
    }
  }

  // ── a code in a private chat ────────────────────────────────────────────
  // The SAME handler as a bare code above, and that is the fix rather than a
  // tidy-up: these were two branches doing nearly the same thing, and the
  // deep-link one only ever tried the per-student table. So tapping "get your
  // login" in a class channel — which sends `/start CODE`, not a bare code —
  // fell past the class invite entirely and answered with the warning meant for
  // somebody pasting a CHANNEL code into a DM. One path cannot drift from
  // itself.
  if (isPrivate && (await handlePrivateCode(code, chat.id, { explainUnknown: false }))) {
    return ok();
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
 * A code someone sent the bot privately — however it arrived.
 *
 * Three things it can be, tried in order: their own student code, a class
 * invite, or nothing we know. Reached both from a bare code pasted into the
 * chat and from `/start CODE` behind a deep link, because those are the same
 * intent typed two ways and keeping them separate is precisely how the class
 * invite came to work for one and not the other.
 *
 * Returns false ONLY for an unrecognised code with `explainUnknown` off, which
 * is the caller's signal to carry on and treat it as a channel code — a real
 * case, since `/start CODE` in a DM can also be a mis-opened group link.
 */
/**
 * What the bot is, in the order somebody needs it.
 *
 * What it can do, then what it deliberately cannot, then how to ask. The limit
 * is stated as plainly as the capability: a person who discovers by accident
 * that it will not change anything concludes it is broken, where a person told
 * up front concludes it is careful.
 */
async function sendStaffMenu(chatId: number, name: string): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    text:
      `👋 <b>Hello ${escapeHtml(name)}.</b> I'm your centre, on your phone.\n\n` +
      "<b>Ask me anything</b> about your classes, rosters, marking or who can't sign in — " +
      "in English, Uzbek or Russian, whichever you write in.\n\n" +
      "<b>Or tap:</b>\n" +
      "📋 <b>Today</b> — what needs your attention\n" +
      "👥 <b>My classes</b> — how each one is doing\n" +
      "⚠️ <b>Who can't sign in</b> — missing phone numbers\n" +
      "📥 <b>Reports</b> — spreadsheets and PDFs\n\n" +
      "<b>What I won't do here:</b> anything that changes your data. I'll draft it and " +
      "hand you a link to confirm it in the console — that way one set of rules decides " +
      "who may do what, instead of two.\n\n" +
      "<i>I only ever see what your own account sees.</i>",
    reply_markup: STAFF_KEYBOARD,
  });
}

async function handlePrivateCode(
  code: string,
  chatId: number,
  opts: { explainUnknown: boolean },
): Promise<boolean> {
  // A STAFF CODE FIRST. It is the only one that confers authority, it is
  // fifteen minutes old at most, and it is the shortest-lived thing here — so
  // it is checked before the codes that merely identify a learner.
  const staff = await bindStaffChat(code, chatId);
  if (staff) {
    if (staff.ok) {
      // Straight into the menu: the moment after connecting is the only moment
      // somebody is definitely looking, and "connected ✅" on its own tells them
      // nothing about what to do next.
      await sendMessage(chatId, `✅ Connected, ${escapeHtml(staff.name)}.`);
      await sendStaffMenu(chatId, staff.name);
    } else {
      await sendMessage(chatId, staff.why);
    }
    return true;
  }

  // Their own code: binds and greets, nothing else needed.
  if (await bindStudent(code, chatId)) return true;

  // A CLASS code. It identifies the roster to search and nothing else — the
  // bind is decided by the phone, which is why this one is safe to post in a
  // channel thirty people can read.
  const group = await groupForInviteCode(code);
  if (group) {
    await setPendingJoin(chatId, group);
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text:
        "Almost there. Tap the button below to confirm your phone number — that is how " +
        "I know which account is yours.\n\nI only use it to find you on your class list.",
      reply_markup: {
        keyboard: [[{ text: "📱 Share my number", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return true;
  }

  if (!opts.explainUnknown) return false;
  await sendMessage(
    chatId,
    "I don't recognise that code. Check it for typos, or ask your teacher — a class " +
      "code keeps working, but a personal one is single use.",
  );
  return true;
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
  const pending = await getPendingJoin(chatId);
  if (!pending) {
    // A student who pressed the button out of context has no idea what a
    // "class code" is or where one comes from, and Telegram keeps that keyboard
    // on screen long after the conversation has moved on — so this is reachable
    // by accident. Say where to find it.
    await sendMessage(
      chatId,
      "First send me the code from your class — your teacher posted it in the class " +
        "Telegram channel, next to the link. It looks like <code>RFSGC9E6</code>.\n\n" +
        "Then I'll ask for your number.",
    );
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
    await setPendingJoin(chatId, { ...pending, phone });
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
  await clearPendingJoin(chatId);

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
