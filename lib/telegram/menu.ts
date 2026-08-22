import "server-only";

import { callTelegram } from "@/lib/telegram/send";

/**
 * What the bot says it can do, in the two places Telegram lets it say so.
 *
 * A BOT WITH NO MENU IS A COMMAND LINE WITH NO MAN PAGE. Everything here was
 * already possible by typing an English sentence — but "you may ask it
 * anything" is not an interface, it is an absence of one, and the person who
 * does not already know what to ask gets nothing. The commands make the
 * capability visible; the keyboard makes the three daily ones one tap away.
 */

/** Shown in Telegram's own `/` menu. Kept short — a list nobody reads is the
 *  same as no list. */
export const STAFF_COMMANDS = [
  { command: "start", description: "What I can do" },
  { command: "today", description: "What needs your attention" },
  { command: "classes", description: "How every class is doing" },
  { command: "logins", description: "Who still cannot sign in" },
  { command: "reports", description: "Spreadsheets and PDFs you can get" },
  { command: "new", description: "Start a fresh conversation" },
  { command: "help", description: "How this works, and its limits" },
] as const;

/** The question each command really asks. The bot has one brain; a command is
 *  a shortcut to a sentence, not a separate feature with its own rules. */
/* `/new` is not a question and deliberately has no entry below: now that the
   bot remembers, it needs a way to FORGET. Without one, a conversation about
   one class quietly colours the answers about the next — and the person cannot
   tell, because the context that is misleading them is the part they cannot
   see. */
export const COMMAND_QUESTIONS: Record<string, string> = {
  today: "What needs my attention today?",
  classes: "How is each of my classes doing right now?",
  logins: "Which classes still can't collect their logins, and who is missing a phone number?",
  reports: "Which reports can I download, and what is in each one?",
};

/**
 * Three buttons under the text box, always there.
 *
 * The commonest things a centre owner asks, in the words they would use. Not
 * six: a keyboard that fills the screen is one people close, and the fourth
 * most useful question is better typed than hunted for.
 */
export const STAFF_KEYBOARD = {
  keyboard: [
    [{ text: "📋 Today" }, { text: "👥 My classes" }],
    [{ text: "⚠️ Who can't sign in" }, { text: "📥 Reports" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
} as const;

/** What a keyboard button means, so pressing one is the same as asking. */
export const KEYBOARD_QUESTIONS: Record<string, string> = {
  "📋 Today": COMMAND_QUESTIONS.today,
  "👥 My classes": COMMAND_QUESTIONS.classes,
  "⚠️ Who can't sign in": COMMAND_QUESTIONS.logins,
  "📥 Reports": COMMAND_QUESTIONS.reports,
};

/**
 * Register the `/` menu with Telegram.
 *
 * Scoped to PRIVATE CHATS. A class channel has the bot in it too, and a menu of
 * staff commands appearing for thirty students is both confusing and a hint
 * about a surface they cannot use. Telegram scopes commands per chat type, so
 * this is a one-line distinction rather than a filter we have to enforce.
 */
export async function registerStaffCommands(): Promise<boolean> {
  const res = await callTelegram("setMyCommands", {
    commands: STAFF_COMMANDS.map((c) => ({ command: c.command, description: c.description })),
    scope: { type: "all_private_chats" },
  });
  return res != null;
}
