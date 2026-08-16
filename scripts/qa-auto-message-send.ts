/**
 * Send a real automatic message end to end, twice, and check it arrives once.
 *
 * WHAT THIS PROVES THAT THE RLS SCRIPT DOES NOT. qa-phase4-rls.mjs shows the
 * tables accept the right writes from the right people. It does not run
 * `sendAutoMessage`, so it says nothing about whether the toggle is read, the
 * template is filled, the claim is made before the send, or the notification
 * actually lands.
 *
 * The dedupe in particular rests on a supabase-js detail worth verifying rather
 * than assuming: `upsert(..., { ignoreDuplicates: true }).select()` is expected
 * to return ONLY the rows this call actually inserted. If it returned all the
 * rows it was given, every retry of the gone-quiet job would re-notify the whole
 * centre — and the code would look completely correct.
 *
 * The service is `server-only`, so this needs the react-server condition — the
 * same flag package.json already uses for `calibrate` and `seed:reading`:
 *
 *   node --conditions=react-server --import tsx scripts/qa-auto-message-send.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

import { sendAutoMessage } from "@/lib/console/auto-message-service";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  if (!line.includes("=") || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  const key = line.slice(0, i).trim();
  if (!process.env[key]) {
    process.env[key] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const TAG = `qa-msg-${Date.now()}`;
let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) {
    pass += 1;
    console.log(`  ✅ ${name}`);
  } else {
    fail += 1;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const made: { orgId?: string; userId?: string } = {};

async function main() {
  console.log(`\nAutomatic message, end to end — ${TAG}\n`);

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: `${TAG} Centre`, kind: "center", status: "active", billing_enforced: false })
    .select("id")
    .single();
  if (orgError) throw new Error(`org: ${orgError.message}`);
  made.orgId = org.id as string;

  const { data: user, error: userError } = await admin.auth.admin.createUser({
    email: `${TAG}@example.com`,
    password: "QaMsg!2026x",
    email_confirm: true,
    user_metadata: { full_name: "Aziza Karimova" },
  });
  if (userError) throw new Error(`user: ${userError.message}`);
  made.userId = user.user.id;

  // handle_new_user built them a personal org; move them into the centre.
  const { data: stray } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.user.id)
    .maybeSingle();
  if (stray) await admin.from("organizations").delete().eq("id", stray.organization_id as string);
  await admin.from("profiles").insert({
    id: user.user.id,
    organization_id: org.id,
    role: "student",
    full_name: "Aziza Karimova",
  });

  const inbox = async () => {
    const { data } = await admin
      .from("notifications")
      .select("title, body, type")
      .eq("recipient_id", user.user.id)
      .order("created_at", { ascending: false });
    return data ?? [];
  };

  /* ── off by default ──────────────────────────────────────────────────── */

  const whenOff = await sendAutoMessage({
    organizationId: org.id as string,
    key: "gone_quiet",
    recipientIds: [user.user.id],
    values: { student: "Aziza" },
    subjectKey: "2026-08-16",
  });
  check(
    "gone_quiet sends nothing until the centre asks for it",
    whenOff === 0 && (await inbox()).length === 0,
    `sent ${whenOff}`,
  );

  /* ── switched on ─────────────────────────────────────────────────────── */

  await admin.from("auto_messages").insert({
    organization_id: org.id,
    key: "gone_quiet",
    enabled: true,
  });

  const first = await sendAutoMessage({
    organizationId: org.id as string,
    key: "gone_quiet",
    recipientIds: [user.user.id],
    values: { student: "Aziza" },
    subjectKey: "2026-08-16",
  });
  const afterFirst = await inbox();
  check("switched on, it sends", first === 1 && afterFirst.length === 1, `sent ${first}`);
  check(
    "with the default wording, filled in",
    afterFirst[0]?.body ===
      "Aziza, you have not practised for a week. Even one task today keeps you moving.",
    afterFirst[0]?.body,
  );

  /* ── THE ONE THAT MATTERS: run it again ──────────────────────────────── */

  const second = await sendAutoMessage({
    organizationId: org.id as string,
    key: "gone_quiet",
    recipientIds: [user.user.id],
    values: { student: "Aziza" },
    subjectKey: "2026-08-16",
  });
  check(
    "running the job twice the same day does NOT send twice",
    second === 0 && (await inbox()).length === 1,
    `second run sent ${second}, inbox has ${(await inbox()).length}`,
  );

  const tomorrow = await sendAutoMessage({
    organizationId: org.id as string,
    key: "gone_quiet",
    recipientIds: [user.user.id],
    values: { student: "Aziza" },
    subjectKey: "2026-08-17",
  });
  check("but a different day is a different message", tomorrow === 1, `sent ${tomorrow}`);

  /* ── the centre's own wording ────────────────────────────────────────── */

  await admin
    .from("auto_messages")
    .update({ template: "Salom {student}! Bir haftadan beri mashq qilmadingiz." })
    .eq("organization_id", org.id)
    .eq("key", "gone_quiet");

  await sendAutoMessage({
    organizationId: org.id as string,
    key: "gone_quiet",
    recipientIds: [user.user.id],
    values: { student: "Aziza" },
    subjectKey: "2026-08-18",
  });
  const latest = (await inbox())[0];
  check(
    "the centre's own wording is used",
    latest?.body === "Salom Aziza! Bir haftadan beri mashq qilmadingiz.",
    latest?.body,
  );

  /* ── a fact we do not have ───────────────────────────────────────────── */

  await admin.from("auto_messages").insert({
    organization_id: org.id,
    key: "results_ready",
    enabled: true,
  });
  const before = (await inbox()).length;
  const missing = await sendAutoMessage({
    organizationId: org.id as string,
    key: "results_ready",
    recipientIds: [user.user.id],
    // The default template names {band}, and this attempt has none.
    values: { practice: "Reading 3", band: null },
    subjectKey: "attempt-1",
  });
  check(
    "a template it cannot fill sends nothing, rather than a sentence with a hole",
    missing === 0 && (await inbox()).length === before,
    `sent ${missing}`,
  );

  /* ── switched back off ───────────────────────────────────────────────── */

  await admin
    .from("auto_messages")
    .update({ enabled: false })
    .eq("organization_id", org.id)
    .eq("key", "gone_quiet");
  const afterOff = await sendAutoMessage({
    organizationId: org.id as string,
    key: "gone_quiet",
    recipientIds: [user.user.id],
    values: { student: "Aziza" },
    subjectKey: "2026-08-19",
  });
  check("switching it off really stops it", afterOff === 0, `sent ${afterOff}`);

  console.log(`\n${pass} passed, ${fail} failed\n`);
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (err) {
    console.error("\nFAILED:", err instanceof Error ? err.message : err, "\n");
    fail += 1;
  } finally {
    if (made.userId) {
      try {
        await admin.auth.admin.deleteUser(made.userId);
      } catch {
        /* already gone */
      }
    }
    if (made.orgId) {
      const { error } = await admin.from("organizations").delete().eq("id", made.orgId);
      if (error) console.log(`  (leftover org ${made.orgId}: ${error.message})`);
    }
    console.log("Cleaned up.\n");
  }
  process.exit(fail === 0 ? 0 : 1);
}

run();
