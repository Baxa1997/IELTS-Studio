// Walk the center → teacher → group → student path against the real database,
// then delete everything it made.
//
// Why this exists: the B2B schema is fully applied but has never been exercised
// (0 centers, 0 teachers). This proves the parts that are hard to eyeball — the
// handle_new_user trigger's center branch, and the RLS policies — by acting as
// each role through its OWN signed-in client, not with the service-role key.
// Service-role writes prove nothing about RLS; they bypass it.
//
// Usage:
//   node scripts/qa-org-flow.mjs            # run, then clean up
//   node scripts/qa-org-flow.mjs --keep     # run, leave the data for the UI
//   node scripts/qa-org-flow.mjs --cleanup  # remove leftovers from a failed run
//
// Everything it creates is tagged `qa-org-<timestamp>` so leftovers are obvious.

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i)] = t.slice(i + 1).trim();
}

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
/** A client that obeys RLS, signed in as one user — the only honest way to test policies. */
async function clientFor(email, password) {
  const c = createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return c;
}

const TAG = `qa-org-${Date.now()}`;
const PASSWORD = "QaFlow!2026x";
const created = { users: [], orgId: null };

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function makeUser(email, metadata) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true, // no confirmation mail; the trigger still fires
    user_metadata: metadata,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  created.users.push(data.user.id);
  return data.user;
}

async function cleanup() {
  console.log("\n── Cleanup ──");
  for (const id of created.users) {
    const { error } = await admin.auth.admin.deleteUser(id);
    console.log(`  ${error ? "⚠️ " : "🗑 "} user ${id.slice(0, 8)}${error ? ` — ${error.message}` : ""}`);
  }
  if (created.orgId) {
    const { error } = await admin.from("organizations").delete().eq("id", created.orgId);
    console.log(`  ${error ? "⚠️ " : "🗑 "} org ${created.orgId.slice(0, 8)}${error ? ` — ${error.message}` : ""}`);
  }
}

if (process.argv.includes("--cleanup")) {
  const { data } = await admin
    .from("organizations")
    .select("id, name")
    .like("name", "qa-org-%");
  for (const o of data ?? []) {
    const { data: profs } = await admin.from("profiles").select("id").eq("organization_id", o.id);
    for (const p of profs ?? []) await admin.auth.admin.deleteUser(p.id);
    await admin.from("organizations").delete().eq("id", o.id);
    console.log(`🗑  removed ${o.name}`);
  }
  console.log("Done.");
  process.exit(0);
}

try {
  // ── 1. A center applies ────────────────────────────────────────────────
  console.log("\n── 1. Center application (handle_new_user, center branch) ──");
  const adminEmail = `${TAG}-admin@example.com`;
  const centerAdmin = await makeUser(adminEmail, {
    account_kind: "center",
    org_name: TAG,
    full_name: "QA Center Admin",
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", centerAdmin.id)
    .single();
  check("center_admin profile provisioned", profile?.role === "center_admin", `got ${profile?.role}`);
  created.orgId = profile?.organization_id ?? null;

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, kind, status, billing_enforced")
    .eq("id", created.orgId)
    .single();
  check("org kind = center", org?.kind === "center", `got ${org?.kind}`);
  check("org status = pending", org?.status === "pending", `got ${org?.status}`);
  check("billing_enforced = false (centers unmetered)", org?.billing_enforced === false);

  // ── 2. Pending center is walled off ────────────────────────────────────
  console.log("\n── 2. Pending center cannot self-approve ──");
  const adminClient = await clientFor(adminEmail, PASSWORD);
  const { error: selfApprove } = await adminClient
    .from("organizations")
    .update({ status: "active" })
    .eq("id", created.orgId);
  const { data: afterTry } = await admin
    .from("organizations")
    .select("status")
    .eq("id", created.orgId)
    .single();
  check(
    "center_admin cannot set status (column grants)",
    afterTry?.status === "pending",
    selfApprove ? `blocked with: ${selfApprove.message.slice(0, 40)}` : "UPDATE SILENTLY APPLIED",
  );

  // ── 3. Super admin approves ────────────────────────────────────────────
  console.log("\n── 3. Approval ──");
  await admin
    .from("organizations")
    .update({ status: "active", approved_at: new Date().toISOString() })
    .eq("id", created.orgId);
  const { data: approved } = await admin
    .from("organizations")
    .select("status")
    .eq("id", created.orgId)
    .single();
  check("org is active", approved?.status === "active");

  // ── 4. Teacher, created by the center admin ────────────────────────────
  console.log("\n── 4. Teacher + group (RLS: teachers own their groups) ──");
  const teacherEmail = `${TAG}-teacher@example.com`;
  const teacher = await makeUser(teacherEmail, { pre_provisioned: true, full_name: "QA Teacher" });
  await admin.from("profiles").insert({
    id: teacher.id,
    organization_id: created.orgId,
    role: "teacher",
    full_name: "QA Teacher",
  });

  const teacherClient = await clientFor(teacherEmail, PASSWORD);
  const { data: group, error: groupError } = await teacherClient
    .from("groups")
    .insert({ organization_id: created.orgId, name: `${TAG}-group`, teacher_id: teacher.id })
    .select("id")
    .single();
  check("teacher creates their own group", Boolean(group), groupError?.message?.slice(0, 60));

  // A teacher must not be able to create a group owned by someone else.
  const { error: hijack } = await teacherClient
    .from("groups")
    .insert({ organization_id: created.orgId, name: `${TAG}-hijack`, teacher_id: centerAdmin.id });
  check("teacher cannot create a group owned by another user", Boolean(hijack));

  // ── 5. Students ────────────────────────────────────────────────────────
  console.log("\n── 5. Students (created outright, no invite) ──");
  const studentIds = [];
  for (const n of ["a", "b"]) {
    const s = await makeUser(`${TAG}-student-${n}@example.com`, {
      pre_provisioned: true,
      full_name: `QA Student ${n.toUpperCase()}`,
    });
    await admin.from("profiles").insert({
      id: s.id,
      organization_id: created.orgId,
      role: "student",
      full_name: `QA Student ${n.toUpperCase()}`,
      username: `${TAG}-${n}`,
    });
    await admin.from("group_members").insert({
      group_id: group.id,
      student_id: s.id,
      organization_id: created.orgId,
      added_by: teacher.id,
    });
    studentIds.push(s.id);
  }
  check("two students created and enrolled", studentIds.length === 2);

  // ── 6. RLS boundaries that matter ──────────────────────────────────────
  console.log("\n── 6. RLS boundaries ──");
  const studentClient = await clientFor(`${TAG}-student-a@example.com`, PASSWORD);

  const { data: myGroups } = await studentClient.from("groups").select("id");
  check("student sees their own group", (myGroups ?? []).some((g) => g.id === group.id));

  const { data: classmates } = await studentClient.from("group_members").select("student_id");
  check(
    "student CANNOT see classmates",
    (classmates ?? []).length <= 1,
    `saw ${(classmates ?? []).length} rows`,
  );

  const { data: teacherRoster } = await teacherClient.from("group_members").select("student_id");
  check("teacher sees the whole roster", (teacherRoster ?? []).length === 2, `saw ${(teacherRoster ?? []).length}`);

  // The big one: no cross-tenant leakage.
  const { data: otherOrgs } = await teacherClient.from("organizations").select("id");
  check(
    "teacher sees ONLY their own organization",
    (otherOrgs ?? []).length === 1 && otherOrgs[0].id === created.orgId,
    `saw ${(otherOrgs ?? []).length} orgs`,
  );

  const { data: foreignProfiles } = await teacherClient.from("profiles").select("organization_id");
  const leaked = (foreignProfiles ?? []).filter((p) => p.organization_id !== created.orgId);
  check("teacher sees no profiles from other tenants", leaked.length === 0, `${leaked.length} leaked`);

  console.log(`\n${fail === 0 ? "✅" : "❌"}  ${pass} passed, ${fail} failed`);
} catch (error) {
  console.error("\n💥", error.message);
  fail++;
} finally {
  if (process.argv.includes("--keep")) {
    console.log(`\n⚠️  --keep: leaving data behind. Remove later with:`);
    console.log(`    node scripts/qa-org-flow.mjs --cleanup`);
  } else {
    await cleanup();
  }
  process.exit(fail === 0 ? 0 : 1);
}
