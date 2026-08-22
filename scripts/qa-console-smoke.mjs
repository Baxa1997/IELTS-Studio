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

async function fetchOnce(url, cookie) {
  try {
    return await fetch(url, { headers: { cookie }, redirect: "manual" });
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
    return fetch(url, { headers: { cookie }, redirect: "manual" });
  }
}

/**
 * A 200 is not proof. Next renders its error boundary with a 200 in dev, and a
 * loader that quietly returned nothing renders a page that is technically fine
 * and completely empty. So: status, then the error markers, then a marker that
 * the page's own content actually made it out.
 */
async function loadPage(cookie, path, mustContain) {
  // ONE RETRY, because a dropped connection is not a broken page. The dev
  // server occasionally refuses a socket mid-run — twice in one afternoon —
  // and a whole suite reporting FAILED on a network blip teaches people to
  // re-run it rather than read it, which is how a real failure gets waved
  // through. A genuinely broken page fails both attempts.
  const res = await fetchOnce(`${BASE}${path}`, cookie);
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

/**
 * A COLUMN HEADING THAT DOES NOT SIT OVER ITS VALUES.
 *
 * Every board on the group page draws its heading row and its body rows from
 * ONE `grid-template-columns` string, so the two can only stay in line while
 * they really do use the same one. A `auto` track breaks that silently: it is
 * sized by its own content, so an empty header cell computes to 0px where the
 * body's holds two buttons, and every `fr` track soaks up the difference —
 * walking each heading further right of the values beneath it. The page still
 * returns 200 and every other check passes.
 *
 * So: no `auto` in a template on this page, and every use of the roster's
 * template — its head and each row — has to be byte-identical. Counting rows
 * is deliberately not part of it: the roster shows the ENROLLED members, which
 * is not the same number as the students on the page.
 */
function checkGrids(html, { roster: wantRoster = true } = {}) {
  const templates = [...html.matchAll(/grid-template-columns:([^";]+)/g)].map((m) =>
    m[1].trim(),
  );
  const withAuto = templates.filter((t) => /(^|[\s,])auto([\s,]|$)/.test(t));
  if (withAuto.length > 0) {
    return { ok: false, detail: `content-sized track in a shared template: ${withAuto[0]}` };
  }
  if (!wantRoster) return { ok: true, detail: `${new Set(templates).size} templates, none content-sized` };
  const roster = templates.filter((t) => t.includes("minmax(200px"));
  if (roster.length < 2) {
    return { ok: false, detail: `roster head and rows are not sharing a template (${roster.length} uses)` };
  }
  if (new Set(roster).size !== 1) {
    return { ok: false, detail: `roster head and rows disagree: ${new Set(roster).size} templates` };
  }
  return { ok: true, detail: `${new Set(templates).size} templates, all aligned` };
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

  /* ── a lesson, set to the class, with one student's marks on it ──────────
     THE ONE PATH NOTHING ELSE REACHES. `loadAssignmentReport` had no branch
     for a lesson at all and fell through to the listening one with an
     undefined id, which found nothing and reported a class that had all done
     the work as having none of them started. It builds and typechecks either
     way, so only a real assignment with a real attempt on it can tell. */
  const { data: lesson, error: lessonError } = await admin
    .from("lessons")
    .insert({
      organization_id: org.id,
      title: `${TAG} Present Simple`,
      blueprint: "grammar",
      topic: "present simple",
      brief: "smoke test lesson",
      status: "published",
      content: { sections: [], exercises: [] },
      exercise_count: 4,
    })
    .select("id")
    .single();
  if (lessonError) throw new Error(`lesson: ${lessonError.message}`);

  const { data: lessonAssignment, error: lessonAssignmentError } = await admin
    .from("assignments")
    .insert({
      organization_id: org.id,
      group_id: group.id,
      kind: "lesson",
      title: `${TAG} Present Simple`,
      lesson_id: lesson.id,
      created_by: ownerUser.id,
    })
    .select("id")
    .single();
  if (lessonAssignmentError) throw new Error(`lesson assignment: ${lessonAssignmentError.message}`);

  const { error: attemptError } = await admin.from("lesson_attempts").insert({
    organization_id: org.id,
    lesson_id: lesson.id,
    student_id: students[0].id,
    source: "assignment",
    score: 3,
    max_score: 4,
    tag_breakdown: {
      "third-person-s": { attempted: 2, correct: 1 },
      "auxiliary-do": { attempted: 2, correct: 2 },
    },
  });
  if (attemptError) throw new Error(`lesson attempt: ${attemptError.message}`);

  /* ── as the owner ────────────────────────────────────────────────────── */

  console.log("center_admin");
  const ownerCookie = await signInAs(`${TAG}-owner@example.com`);

  {
    const res = await fetch(`${BASE}/console/groups/${group.id}`, { headers: { cookie: ownerCookie } });
    const r = checkGrids(await res.text());
    check("roster columns line up with their headings", r.ok, r.detail);

    const ask = await fetch(`${BASE}/api/console/assistant`, {
      method: "POST",
      headers: { cookie: ownerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ question: "How many classes do I have, and can they all sign in?" }),
    });
    const answer = await ask.json().catch(() => ({}));
    check(
      "the assistant answers from the centre snapshot",
      ask.status === 200 && typeof answer.reply === "string" && answer.reply.length > 0,
      ask.status === 200 ? `"${String(answer.reply ?? "").slice(0, 90)}…"` : `HTTP ${ask.status}`,
    );
    // Not a fixed id: the registry grows, and a check that has to be edited
    // every time it does is a check that gets edited into passing.
    const ALLOWED = new Set([
      "invite_class_telegram",
      "add_student",
      "add_students_bulk",
      "add_teacher",
      "assign_teacher",
      "assign_practice",
      "move_student",
      "mark_student_left",
      "send_announcement",
      "create_group",
      "close_group",
      "reopen_group",
    ]);
    // THE REGRESSION THIS EXISTS FOR. Asked by a centre owner to create a
    // class, the assistant replied that it could not see how to from here and
    // apologised for not knowing which page would — with `create_group` in its
    // own list the whole time. The snapshot rule had been written so
    // absolutely that it swallowed the action path. A fact question could
    // never have caught it, because a fact question is the case that worked.
    const doIt = await fetch(`${BASE}/api/console/assistant`, {
      method: "POST",
      headers: { cookie: ownerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Create a new class called Morning Intensive.",
      }),
    });
    const did = await doIt.json().catch(() => ({}));
    check(
      "asked to do something on its list, it offers the button",
      doIt.status === 200 && (did.proposals ?? []).some((p) => p.action === "create_group"),
      doIt.status === 200
        ? `${(did.proposals ?? []).length} proposal(s): ${(did.proposals ?? []).map((p) => p.action).join(", ") || "none"} — "${String(did.reply ?? "").slice(0, 70)}"`
        : `HTTP ${doIt.status}`,
    );

    // Asked for a spreadsheet, the owner should get a download link — and it
    // has to point at the export route with the month it was given, not a
    // month the model liked the sound of.
    const wantFile = await fetch(`${BASE}/api/console/assistant`, {
      method: "POST",
      headers: { cookie: ownerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Give me the debtors report for August 2026 as a spreadsheet.",
      }),
    });
    const filed = await wantFile.json().catch(() => ({}));
    const doc = (filed.documents ?? [])[0];
    check(
      "asked for a spreadsheet, it hands over a download",
      wantFile.status === 200 &&
        doc?.href?.startsWith("/api/console/finance/export?report=debtors&format=xlsx"),
      doc ? doc.href : `no document — it said: "${String(filed.reply ?? "").slice(0, 110)}"`,
    );

    // THE CENTRE MARKET IS UZBEK AND RUSSIAN SPEAKING. "Reply in the same
    // language they write in" is one line of prompt, which is exactly the kind
    // of instruction that quietly stops working when the rules around it grow.
    const uz = await fetch(`${BASE}/api/console/assistant`, {
      method: "POST",
      headers: { cookie: ownerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Nechta guruhim bor?" }),
    });
    const uzBody = await uz.json().catch(() => ({}));
    const uzReply = String(uzBody.reply ?? "");
    // Latin-script Uzbek markers, and no long stretch of plain English words.
    const looksUzbek = /\b(guruh|guruhingiz|bor|talaba|sizda|yo'q|hozir|ta)\b/i.test(uzReply);
    check(
      "asked in Uzbek, it answers in Uzbek",
      uz.status === 200 && looksUzbek,
      `"${uzReply.slice(0, 90)}"`,
    );

    check(
      "it proposes only allow-listed actions",
      Array.isArray(answer.proposals) &&
        answer.proposals.length <= 1 &&
        answer.proposals.every((p) => p && ALLOWED.has(p.action)),
      `${(answer.proposals ?? []).length} proposal(s)`,
    );

    // The practice board and the register draw their heads and rows from one
    // template too, and are just as able to drift.
    for (const [tab, label] of [
      ["practice", "practice board"],
      ["attendance", "register"],
    ]) {
      const t = await fetch(`${BASE}/console/groups/${group.id}?tab=${tab}`, {
        headers: { cookie: ownerCookie },
      });
      const g = checkGrids(await t.text(), { roster: false });
      check(`${label} columns line up with their headings`, g.ok, g.detail);
    }
  }

  const ownerPages = [
    ["/console", "Today"],
    ["/console/groups", null],
    [`/console/groups/${group.id}`, "QA Active"],
    [`/console/groups/${group.id}?tab=practice`, "All practice"],
    [`/console/groups/${group.id}?tab=practice`, "Baseline"],
    [`/console/groups/${group.id}?tab=practice&flow=overdue`, "Overdue"],
    [`/console/groups/${group.id}?tab=practice&skill=writing&q=zzz`, "No practice matches"],
    [`/console/groups/${group.id}?tab=attendance`, "Register"],
    [`/console/groups/${group.id}?tab=settings`, "Get the class signed in"],
    [`/console/groups/${group.id}?tab=money`, null],
    // The lesson's own results page: the mark out of its maximum, and the tag
    // the class actually got wrong.
    [`/console/groups/${group.id}/assignments/${lessonAssignment.id}`, "Average mark"],
    [`/console/groups/${group.id}/assignments/${lessonAssignment.id}`, "third person s"],
    ["/console/assistant", "Do something"],
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

/**
 * Anything a PREVIOUS run left behind.
 *
 * WHY THIS EXISTS. `cleanup` only knows what this process created, in memory —
 * so a run that is killed rather than finished (a timeout, a Ctrl-C, a pkill)
 * leaks every account it had made by then. That is not hypothetical: 36 auth
 * users and an organisation accumulated in the real project across one
 * afternoon of interrupted runs, and were then read back as real students,
 * which turned a test artefact into a wrong conclusion about the product.
 *
 * Sweeping at the START is what makes it self-healing: a leak survives at most
 * until the next run, whatever killed the last one — including a SIGKILL that
 * no handler can catch.
 *
 * STRICTLY PREFIX-SCOPED. Everything this script creates is named
 * `qa-smoke-<timestamp>`; anything without that prefix belongs to somebody real
 * and is never touched, whatever else it looks like.
 */
async function sweepLeftovers() {
  let orgs = 0;
  let users = 0;
  try {
    const { data: stale } = await admin
      .from("organizations")
      .select("id")
      .like("name", "qa-smoke-%");
    for (const o of stale ?? []) {
      await admin.from("organizations").delete().eq("id", o.id);
      orgs += 1;
    }
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (!/^qa-smoke-\d+/.test(u.email ?? "")) continue;
      await admin.auth.admin.deleteUser(u.id);
      users += 1;
    }
  } catch (err) {
    console.log(`  (could not sweep leftovers: ${err.message})`);
  }
  if (orgs || users) {
    console.log(`Swept ${orgs} org(s) and ${users} account(s) left by an interrupted run.\n`);
  }
}

async function cleanup() {
  if (keep) {
    console.log("--keep: the centre is still there.\n");
    return;
  }
  // ORGS FIRST, THEN ACCOUNTS, and the order is the whole fix.
  //
  // `writing_prompts.created_by` and `reading_tests.created_by` reference
  // `profiles (id)` with no delete rule at all, which defaults to NO ACTION —
  // so deleting the teacher's auth user cascades into their profile and is then
  // blocked by the prompt they generated. GoTrue reports that as a bare 500
  // with an empty body, which is why it looked like nothing was wrong.
  //
  // Deleting the organisation first takes the prompts and tests with it
  // (they cascade on organization_id), leaving nothing pointing at the profile.
  // `sweepLeftovers` already worked in this order, which is how the difference
  // was spotted: it could delete the very account `cleanup` could not.
  for (const id of made.orgIds) {
    const { error } = await admin.from("organizations").delete().eq("id", id);
    if (error) console.log(`  (leftover org ${id}: ${error.message})`);
  }
  for (const id of made.users) {
    // SAY WHY IT FAILED. This used to swallow the error, and one account
    // survived every single run while the script printed "Cleaned up." — the
    // exact shape of bug this suite exists to catch, in the suite itself.
    try {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) {
        console.log(
          `  (could not delete account ${id}: ${error.message || error.name || "?"}` +
            ` status=${error.status ?? "?"} code=${error.code ?? "?"})`,
        );
      }
    } catch (err) {
      console.log(`  (could not delete account ${id}: ${err.message})`);
    }
  }
  console.log("Cleaned up.\n");
}

// A killed run still tears down what it can. SIGKILL cannot be caught — which
// is exactly why `sweepLeftovers` runs at the start as well.
let tearingDown = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    if (tearingDown) return;
    tearingDown = true;
    console.log(`\nInterrupted (${signal}) — cleaning up before exit.`);
    await cleanup();
    process.exit(1);
  });
}

try {
  await sweepLeftovers();
  await main();
} catch (err) {
  console.error("\nFAILED:", err.message, "\n");
  fail += 1;
} finally {
  await cleanup();
}

process.exit(fail === 0 ? 0 : 1);
