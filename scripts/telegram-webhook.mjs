#!/usr/bin/env node
/**
 * Point the Telegram bot at a webhook URL, or show where it currently points.
 *
 * Telegram will only deliver to a PUBLIC https address, so local testing needs
 * a tunnel (cloudflared, ngrok, localtunnel — any of them). This script is the
 * bit you run afterwards, and the bit worth not retyping: the secret has to
 * match `TELEGRAM_WEBHOOK_SECRET` exactly or every update is rejected with 401
 * and Telegram tells you nothing useful.
 *
 *   node scripts/telegram-webhook.mjs                      # show current state
 *   node scripts/telegram-webhook.mjs https://x.trycloudflare.com
 *   node scripts/telegram-webhook.mjs --delete
 */
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const token = env.TELEGRAM_BOT_TOKEN;
const secret = env.TELEGRAM_WEBHOOK_SECRET;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set in .env.local");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const arg = process.argv[2];

if (!arg) {
  const me = await api("getMe");
  // The `/` menu, registered alongside the webhook because both are "make the
// live bot match this code" and doing them separately means one of them is
// eventually forgotten. Scoped to private chats: a class channel has the bot in
// it too, and a menu of staff commands in front of thirty students is both
// confusing and a hint about a surface they cannot use.
const menu = await api("setMyCommands", {
  commands: [
    { command: "start", description: "What I can do" },
    { command: "today", description: "What needs your attention" },
    { command: "classes", description: "How every class is doing" },
    { command: "logins", description: "Who still cannot sign in" },
    { command: "reports", description: "Spreadsheets and PDFs you can get" },
    { command: "new", description: "Start a fresh conversation" },
    { command: "help", description: "How this works, and its limits" },
  ],
  scope: { type: "all_private_chats" },
});
console.log(menu.ok ? "✅ commands registered" : `❌ commands: ${menu.description}`);

const info = await api("getWebhookInfo");
  console.log(`bot        @${me.result?.username ?? "?"}`);
  console.log(`webhook    ${info.result?.url || "(none set)"}`);
  console.log(`pending    ${info.result?.pending_update_count ?? 0} updates`);
  if (info.result?.last_error_message) {
    console.log(`last error ${info.result.last_error_message}`);
    console.log(
      `           at ${new Date((info.result.last_error_date ?? 0) * 1000).toISOString()}`,
    );
  }
  console.log("\nUsage: node scripts/telegram-webhook.mjs https://your-public-host");
  process.exit(0);
}

if (arg === "--delete") {
  console.log(JSON.stringify(await api("deleteWebhook", { drop_pending_updates: true })));
  process.exit(0);
}

if (!secret) {
  console.error("TELEGRAM_WEBHOOK_SECRET is not set — the webhook would accept forged updates.");
  process.exit(1);
}

const base = arg.replace(/\/+$/, "");
const url = base.endsWith("/api/telegram/webhook") ? base : `${base}/api/telegram/webhook`;

const res = await api("setWebhook", {
  url,
  secret_token: secret,
  // `my_chat_member` arrives by default, but naming the list makes it explicit
  // that the one-tap flow depends on it as well as on plain messages.
  allowed_updates: ["message", "channel_post", "my_chat_member"],
  drop_pending_updates: true,
});
console.log(res.ok ? `✅ webhook → ${url}` : `❌ ${res.description}`);

// The `/` menu, registered alongside the webhook because both are "make the
// live bot match this code" and doing them separately means one of them is
// eventually forgotten. Scoped to private chats: a class channel has the bot in
// it too, and a menu of staff commands in front of thirty students is both
// confusing and a hint about a surface they cannot use.
const menu = await api("setMyCommands", {
  commands: [
    { command: "start", description: "What I can do" },
    { command: "today", description: "What needs your attention" },
    { command: "classes", description: "How every class is doing" },
    { command: "logins", description: "Who still cannot sign in" },
    { command: "reports", description: "Spreadsheets and PDFs you can get" },
    { command: "new", description: "Start a fresh conversation" },
    { command: "help", description: "How this works, and its limits" },
  ],
  scope: { type: "all_private_chats" },
});
console.log(menu.ok ? "✅ commands registered" : `❌ commands: ${menu.description}`);

const info = await api("getWebhookInfo");
if (info.result?.last_error_message) console.log(`last error: ${info.result.last_error_message}`);
