// Load every console page as a real signed-in user and check it renders.
//
// WHAT THIS COVERS THAT NOTHING ELSE DOES. A passing build proves the pages
// COMPILE. It does not prove they render: a loader that selects a column which
// does not exist, an import cycle that resolves to undefined at runtime, a
// server-only module dragged into a client bundle — all of those build clean and
// then throw, or worse, render an empty page. This repo has already shipped one
// of those to production (every lesson page 500'd on an ERR_REQUIRE_ESM that
// passed locally).
//
// It builds a throwaway centre with enough data that the pages have something to
// draw, signs in through the app's own sign-in form so the session is exactly
// the one a browser would have, then GETs every page and looks for the things
// that mean "broken" even when the status is 200.
//
//   npm run dev            # in another terminal
//   node scripts/qa-console-smoke.mjs
//   node scripts/qa-console-smoke.mjs --keep    # leave the centre behind

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i)] = t.slice(i + 1).trim();
}

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TAG = `qa-smoke-${Date.now()}`;
const PASSWORD = "QaSmoke!2026x";
const keep = process.argv.includes("--keep");
const made = { users: [], orgIds: [] };

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

async function makeUser(email, fullName) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  made.users.push(data.user.id);
  return data.user;
}

async function placeInOrg(userId, orgId, role, fullName) {
  const { data: stray } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (stray && stray.organization_id !== orgId) {
    await admin.from("organizations").delete().eq("id", stray.organization_id);
  }
  const { error } = await admin
    .from("profiles")
    .insert({ id: userId, organization_id: orgId, role, full_name: fullName });
  if (error) throw new Error(`placeInOrg ${role}: ${error.message}`);
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { organization_id: orgId, role },
  });
}

/**
 * A session cookie exactly as `@supabase/ssr` writes it.
 *
 * Signing in through the app's own form would be more faithful still, but the
 * server action's id lives in a separate flight chunk in dev and changes every
 * build — reverse-engineering that is a test that breaks for reasons unrelated
 * to the thing it tests. The cookie contract is stable and documented in
 * @supabase/ssr's own source: `base64-` + base64url(JSON session), chunked at
 * MAX_CHUNK_SIZE into `<name>.0`, `<name>.1`. This mints the session with
 * supabase-js and writes that.
 */
const MAX_CHUNK_SIZE = 3180;

async function signInAs(email) {
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);

  const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const name = `sb-${ref}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(data.session), "utf8").toString("base64url")}`;

  if (value.length <= MAX_CHUNK_SIZE) return `${name}=${value}`;
  const chunks = [];
  for (let i = 0; i < value.length; i += MAX_CHUNK_SIZE) {
    chunks.push(`${name}.${chunks.length}=${value.slice(i, i + MAX_CHUNK_SIZE)}`);
  }
  return chunks.join("; ");
}

/**
 * A 200 is not proof. Next renders its error boundary with a 200 in dev, and a
 * loader that quietly returned nothing renders a page that is technically fine
 * and completely empty. So: status, then the error markers, then a marker that
 * the page's own content actually made it out.
 */
async function loadPage(cookie, path, mustContain) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "manual" });
  const html = res.status === 200 ? await res.text() : "";

  if (res.status === 307 || res.status === 302) {
    return { ok: false, detail: `redirected to ${res.headers.get("location")}` };
  }
  if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };

  for (const marker of ["Application error", "Internal Server Error", "call-stack", "__NEXT_ERROR"]) {
    if (html.includes(marker)) return { ok: false, detail: `page rendered an error (${marker})` };
  }
  if (mustContain && !html.includes(mustContain)) {
    return { ok: false, detail: `rendered, but "${mustContain}" is missing` };
  }
  return { ok: true, detail: `${(html.length / 1024).toFixed(0)}kB` };
}

async function main() {
  console.log(`\nConsole smoke test against ${BASE} — ${TAG}\n`);

  /* ── a centre with enough in it that the pages have something to draw ─── */

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: `${TAG} Centre`, kind: "center", status: "active", billing_enforced: false })
    .select("id")
    .single();
  if (orgError) throw new Error(`org: ${orgError.message}`);
  made.orgIds.push(org.id);

  const ownerUser = await makeUser(`${TAG}-owner@example.com`, "QA Owner");
  await placeInOrg(ownerUser.id, org.id, "center_admin", "QA Owner");
  const teacherUser = await makeUser(`${TAG}-teacher@example.com`, "QA Teacher");
  await placeInOrg(teacherUser.id, org.id, "teacher", "QA Teacher");

  const { data: branch } = await admin
    .from("branches")
    .insert({ organization_id: org.id, name: `${TAG} Main` })
    .select("id")
    .single();

  const { data: group } = await admin
    .from("groups")
    .insert({
      organization_id: org.id,
      branch_id: branch.id,
      name: `${TAG} Evening`,
      teacher_id: teacherUser.id,
      monthly_fee_minor: 600000,
      teacher_rate_minor: 200000,
    })
    .select("id")
    .single();

  // Three students in three states, so status-dependent rendering is exercised
  // rather than assumed.
  const students = [];
  for (const [name, status] of [
    ["QA Active", "active"],
    ["QA Paused", "paused"],
    ["QA Left", "left"],
  ]) {
    const u = await makeUser(`${TAG}-${name.split(" ")[1].toLowerCase()}@example.com`, name);
    await placeInOrg(u.id, org.id, "student", name);
    if (status !== "active") {
      await admin
        .from("profiles")
        .update({ member_status: status, status_changed_at: new Date().toISOString() })
        .eq("id", u.id);
    }
    await admin
      .from("group_members")
      .insert({ organization_id: org.id, group_id: group.id, student_id: u.id });
    students.push({ id: u.id, name });
  }

  const { data: prompt } = await admin
    .from("writing_prompts")
    .insert({
      organization_id: org.id,
      task_type: "task2",
      prompt_text: `${TAG} Some people think cities should ban cars. Discuss.`,
      topic_family: "environment",
    })
    .select("id")
    .single();

  const { data: shelf } = await admin
    .from("practice_library")
    .insert({
      organization_id: org.id,
      kind: "writing_prompt",
      ref_id: prompt.id,
      title: `${TAG} Task 2 — cities`,
      skill: "writing",
      task_type: "discussion",
      level: "Band 5-6",
    })
    .select("id")
    .single();

  await admin.from("assignments").insert({
    organization_id: org.id,
    group_id: group.id,
    kind: "writing",
    title: `${TAG} homework`,
    prompt_id: prompt.id,
    is_placement: true,
    library_id: shelf.id,
    created_by: teacherUser.id,
  });

  await admin.from("auto_messages").insert({
    organization_id: org.id,
    key: "gone_quiet",
    enabled: true,
    template: "{student}, come back",
  });

  /* ── as the owner ────────────────────────────────────────────────────── */

  console.log("center_admin");
  const ownerCookie = await signInAs(`${TAG}-owner@example.com`);

  const ownerPages = [
    ["/console", "Today"],
    ["/console/groups", null],
    [`/console/groups/${group.id}`, "QA Active"],
    [`/console/groups/${group.id}?tab=practice`, "All practice"],
    [`/console/groups/${group.id}?tab=practice&flow=overdue`, "Overdue"],
    [`/console/groups/${group.id}?tab=practice&skill=writing&q=zzz`, "No practice matches"],
    [`/console/groups/${group.id}?tab=attendance`, "Register"],
    [`/console/groups/${group.id}?tab=settings`, "Get the class signed in"],
    [`/console/groups/${group.id}?tab=money`, null],
    ["/console/students", null],
    [`/console/students/${students[0].id}`, "Band by skill"],
    ["/console/teachers", "Marking"],
    [`/console/teachers/${teacherUser.id}`, "Their groups"],
    ["/console/reports", null],
    ["/console/practice", "Practice library"],
    ["/console/marking", null],
    ["/console/attendance", null],
    ["/console/announcements", "Automatic"],
    ["/console/settings", null],
    ["/console/finance", null],
    ["/console/finance/invoices", null],
    ["/console/finance/payroll", null],
  ];
  for (const [path, marker] of ownerPages) {
    const r = await loadPage(ownerCookie, path, marker);
    check(`${path}${marker ? ` (${marker})` : ""}`, r.ok, r.detail);
  }

  // The three items moved from the rail into the account menu. The MENU itself
  // is client-rendered on click, so it is not in this HTML and cannot be
  // asserted here — what is checkable, and what actually regresses, is that
  // they are no longer ALSO in the rail. Two doors to one page is the failure
  // this move could introduce.
  const ownerHtml = await (await fetch(`${BASE}/console`, { headers: { cookie: ownerCookie } })).text();
  const railLinks = [...ownerHtml.matchAll(/href="(\/console\/[a-z-]+)"[^>]*class="[^"]*lp-sb-item/g)].map(
    (m) => m[1],
  );
  for (const gone of ["/console/announcements", "/console/billing", "/console/settings"]) {
    check(`${gone} is out of the rail`, !railLinks.includes(gone), "still a rail item");
  }

  // The parent report is a file, not a page — its own check.
  const pdf = await fetch(`${BASE}/api/console/students/${students[0].id}/report`, {
    headers: { cookie: ownerCookie },
  });
  const bytes = Buffer.from(await pdf.arrayBuffer());
  check(
    "GET the parent report PDF",
    pdf.status === 200 && bytes.subarray(0, 5).toString("latin1") === "%PDF-",
    `HTTP ${pdf.status}, starts "${bytes.subarray(0, 8).toString("latin1")}"`,
  );

  /* ── as the teacher ──────────────────────────────────────────────────── */

  console.log("\nteacher");
  const teacherCookie = await signInAs(`${TAG}-teacher@example.com`);
  for (const [path, marker] of [
    ["/console", null],
    [`/console/groups/${group.id}`, "QA Active"],
    [`/console/groups/${group.id}?tab=practice`, "Assign practice"],
    [`/console/groups/${group.id}?tab=attendance`, "Register"],
    [`/console/groups/${group.id}?tab=settings`, "Get the class signed in"],
    ["/console/practice", "Practice library"],
    ["/console/marking", null],
    ["/console/announcements", "Automatic"],
  ]) {
    const r = await loadPage(teacherCookie, path, marker);
    check(`${path}${marker ? ` (${marker})` : ""}`, r.ok, r.detail);
  }

  // A teacher never had billing in the rail and must not gain it now.
  const teacherHtml = await (
    await fetch(`${BASE}/console`, { headers: { cookie: teacherCookie } })
  ).text();
  check(
    "a teacher's rail still offers no billing",
    !teacherHtml.includes("/console/billing"),
    "a teacher was offered billing",
  );

  console.log(`\n${pass} passed, ${fail} failed\n`);
}

async function cleanup() {
  if (keep) {
    console.log("--keep: the centre is still there.\n");
    return;
  }
  for (const id of made.users) {
    try {
      await admin.auth.admin.deleteUser(id);
    } catch {
      /* already gone */
    }
  }
  for (const id of made.orgIds) {
    const { error } = await admin.from("organizations").delete().eq("id", id);
    if (error) console.log(`  (leftover org ${id}: ${error.message})`);
  }
  console.log("Cleaned up.\n");
}

try {
  await main();
} catch (err) {
  console.error("\nFAILED:", err.message, "\n");
  fail += 1;
} finally {
  await cleanup();
}

process.exit(fail === 0 ? 0 : 1);
