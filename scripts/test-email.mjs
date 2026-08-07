// Prove the SMTP settings work BEFORE you approve a real center.
//
// The app's transactional email (org approval, student credentials) goes out
// over plain SMTP via nodemailer — NOT through Supabase. Supabase's custom-SMTP
// setting only covers the emails Supabase itself sends (confirm signup, magic
// link, password reset), so configuring it there does nothing for these.
//
// Usage:
//   node scripts/test-email.mjs                 # check config + connection only
//   node scripts/test-email.mjs you@gmail.com   # ...and send a real test email
//
// Reads SMTP_HOST/PORT/USER/PASS/FROM from .env.local (same vars lib/env.ts uses).

import { readFileSync } from "node:fs";

import nodemailer from "nodemailer";

function loadEnvLocal() {
  const env = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i)] = t.slice(i + 1).trim();
    }
  } catch {
    // fall back to process.env below
  }
  return env;
}

const file = loadEnvLocal();
const read = (name) => {
  const v = (file[name] ?? process.env[name] ?? "").trim();
  return v || undefined;
};

const host = read("SMTP_HOST");
const port = Number(read("SMTP_PORT") ?? 587);
const user = read("SMTP_USER");
const pass = read("SMTP_PASS");
const from = read("SMTP_FROM") ?? user;

console.log("SMTP config");
console.log(`  SMTP_HOST : ${host ?? "(not set)"}`);
console.log(`  SMTP_PORT : ${port}${port === 465 ? " (implicit TLS)" : " (STARTTLS)"}`);
console.log(`  SMTP_USER : ${user ?? "(not set)"}`);
console.log(`  SMTP_PASS : ${pass ? `set, ${pass.length} chars` : "(not set)"}`);
console.log(`  SMTP_FROM : ${from ?? "(not set)"}`);
console.log();

if (!host) {
  console.error("❌ SMTP_HOST is not set — the app skips every email and says so in the UI.");
  console.error("   Add the five SMTP_* lines to .env.local (see .env.example), then re-run.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

try {
  await transporter.verify();
  console.log("✅ Connected and authenticated.");
} catch (error) {
  console.error("❌ Connection/auth failed:", error.message);
  console.error(explain(error.message));
  process.exit(1);
}

const to = process.argv[2];
if (!to) {
  console.log("\nPass an address to send a real test:  node scripts/test-email.mjs you@gmail.com");
  process.exit(0);
}

try {
  const info = await transporter.sendMail({
    from,
    to,
    subject: "EngProgress SMTP test",
    text:
      "If you're reading this, transactional email works.\n\n" +
      "This is the same path that sends center-approval confirmations and " +
      "student login credentials.",
  });
  console.log(`✅ Sent to ${to} (id ${info.messageId})`);
  console.log("   Check spam too — a brand-new sending domain often lands there first.");
} catch (error) {
  console.error(`❌ Send failed: ${error.message}`);
  console.error(explain(error.message));
  process.exit(1);
}

/** Turn the usual SMTP rejections into the actual thing to go fix. */
function explain(message) {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("535") || m.includes("authentication")) {
    return "   → Wrong user/password. Gmail needs an App Password (16 chars, 2FA on), not your normal one.";
  }
  if (m.includes("etimedout") || m.includes("econnrefused")) {
    return "   → Host/port unreachable. Try 465 (secure) or 587, and check the host spelling.";
  }
  if (m.includes("self signed") || m.includes("certificate")) {
    return "   → TLS mismatch: port 465 needs secure:true, 587 needs STARTTLS. Check SMTP_PORT.";
  }
  if (m.includes("from") || m.includes("sender") || m.includes("domain is not verified")) {
    return "   → The From address isn't verified with this provider. Verify the domain or use its allowed sender.";
  }
  return "";
}
