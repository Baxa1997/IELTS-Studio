// Exercise the Phase 4 write paths AS REAL USERS, which is the only way to
// learn anything about grants and policies.
//
// WHY THIS EXISTS, AND WHY check-center-restructure.mjs IS NOT ENOUGH. That
// script uses the service-role key, which bypasses both RLS and column grants.
// A table can exist, be probed green, and still refuse every write from a real
// person. It has happened twice on this branch already:
//
//   - profiles.member_status existed but had no column grant (20260807180000
//     revokes UPDATE and re-grants column by column), so pausing a student
//     failed with "permission denied".
//   - profiles had no UPDATE policy for teachers at all, so a teacher's writes
//     were SILENTLY DROPPED — PostgREST reported success and changed nothing.
//
// Both were invisible to the schema probe and to the typechecker. So: sign in,
// try the write, and read it back.
//
//   node scripts/qa-phase4-rls.mjs           # run, then clean up
//   node scripts/qa-phase4-rls.mjs --keep    # leave the data behind

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

const TAG = `qa-p4-${Date.now()}`;
const PASSWORD = "QaPhase4!2026x";
const keep = process.argv.includes("--keep");
const made = { users: [], orgId: null, library: [], autoMessages: [] };

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

async function clientFor(email) {
  const c = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return c;
}

async function makeUser(email, userMetadata, appMetadata) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: userMetadata,
    ...(appMetadata ? { app_metadata: appMetadata } : {}),
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
  await admin.auth.admin.updateUserById(userId, { app_metadata: { organization_id: orgId, role } });
}

async function main() {
  console.log(`\nPhase 4 write paths, as real users — ${TAG}\n`);

  /* ── a centre with an owner, a teacher, and a student ────────────────── */

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: `${TAG} Centre`, kind: "center", status: "active", billing_enforced: false })
    .select("id")
    .single();
  if (orgError) throw new Error(`org: ${orgError.message}`);
  made.orgId = org.id;

  const ownerUser = await makeUser(`${TAG}-owner@example.com`, { full_name: "QA Owner" });
  await placeInOrg(ownerUser.id, org.id, "center_admin", "QA Owner");
  const teacherUser = await makeUser(`${TAG}-teacher@example.com`, { full_name: "QA Teacher" });
  await placeInOrg(teacherUser.id, org.id, "teacher", "QA Teacher");
  const studentUser = await makeUser(`${TAG}-student@example.com`, { full_name: "QA Student" });
  await placeInOrg(studentUser.id, org.id, "student", "QA Student");

  // A SECOND centre, because "does the policy work" and "does it keep other
  // tenants out" are different questions and only the second one is scary.
  const { data: otherOrg } = await admin
    .from("organizations")
    .insert({ name: `${TAG} Other`, kind: "center", status: "active", billing_enforced: false })
    .select("id")
    .single();
  const outsider = await makeUser(`${TAG}-outsider@example.com`, { full_name: "QA Outsider" });
  await placeInOrg(outsider.id, otherOrg.id, "center_admin", "QA Outsider");
  made.orgId2 = otherOrg.id;

  const owner = await clientFor(`${TAG}-owner@example.com`);
  const teacher = await clientFor(`${TAG}-teacher@example.com`);
  const student = await clientFor(`${TAG}-student@example.com`);
  const stranger = await clientFor(`${TAG}-outsider@example.com`);

  /* ── 20260816180000 — automatic messages ─────────────────────────────── */
  console.log("auto_messages (§12)");

  {
    const { data, error } = await owner
      .from("auto_messages")
      .upsert(
        { organization_id: org.id, key: "gone_quiet", enabled: true, template: "{student}, hello" },
        { onConflict: "organization_id,key" },
      )
      .select("key, enabled, template, updated_by");
    check("owner can switch a message on and set wording", !error && data?.length === 1, error?.message);
    check(
      "the trigger stamps who changed it (client cannot claim to be someone else)",
      data?.[0]?.updated_by === ownerUser.id,
      `got ${data?.[0]?.updated_by}`,
    );
    made.autoMessages.push([org.id, "gone_quiet"]);
  }

  {
    // A teacher reads which messages their students get — they have to be able
    // to answer "were they told?" — but the wording is the centre speaking.
    const { data, error } = await teacher.from("auto_messages").select("key, enabled");
    check("teacher can READ the settings", !error && (data?.length ?? 0) > 0, error?.message);

    const { data: written, error: writeErr } = await teacher
      .from("auto_messages")
      .upsert(
        { organization_id: org.id, key: "absent_today", enabled: true },
        { onConflict: "organization_id,key" },
      )
      .select("key");
    check(
      "teacher CANNOT change them",
      Boolean(writeErr) || (written?.length ?? 0) === 0,
      "a teacher rewrote a centre-wide message",
    );
  }

  {
    const { data, error } = await student.from("auto_messages").select("key");
    check(
      "a student sees none of it",
      Boolean(error) || (data?.length ?? 0) === 0,
      `student read ${data?.length} rows`,
    );
  }

  {
    const { data } = await stranger.from("auto_messages").select("key, organization_id");
    check(
      "another centre sees none of this centre's settings",
      (data ?? []).every((r) => r.organization_id !== org.id),
      "TENANT LEAK",
    );
  }

  {
    // The dedupe ledger is the system's own record. A client that could write it
    // could silence somebody else's nudge.
    const { data, error } = await owner
      .from("auto_message_sends")
      .insert({
        organization_id: org.id,
        key: "gone_quiet",
        recipient_id: studentUser.id,
        subject_key: "2026-08-16",
      })
      .select("id");
    check(
      "nobody can forge a send record",
      Boolean(error) || (data?.length ?? 0) === 0,
      "a client wrote to auto_message_sends",
    );
  }

  {
    // Prove the unique index actually refuses the second claim — this is the
    // whole anti-double-send mechanism, and it is worth nothing if untested.
    const row = {
      organization_id: org.id,
      key: "gone_quiet",
      recipient_id: studentUser.id,
      subject_key: "2026-08-16",
    };
    const first = await admin.from("auto_message_sends").upsert(row, {
      onConflict: "organization_id,key,recipient_id,subject_key",
      ignoreDuplicates: true,
    }).select("id");
    const second = await admin.from("auto_message_sends").upsert(row, {
      onConflict: "organization_id,key,recipient_id,subject_key",
      ignoreDuplicates: true,
    }).select("id");
    check("first claim wins", (first.data?.length ?? 0) === 1, first.error?.message);
    check(
      "second claim returns nothing, so the nudge is not sent twice",
      (second.data?.length ?? 0) === 0,
      `second claim returned ${second.data?.length} rows`,
    );
  }

  /* ── 20260816190000 — practice library ───────────────────────────────── */
  console.log("\npractice_library (§9)");

  const { data: prompt, error: promptError } = await admin
    .from("writing_prompts")
    .insert({
      organization_id: org.id,
      task_type: "task2",
      prompt_text: `${TAG} Some people believe cities should ban cars. Discuss.`,
      topic_family: "environment",
    })
    .select("id")
    .single();
  if (promptError) throw new Error(`prompt: ${promptError.message}`);

  {
    const { data, error } = await teacher
      .from("practice_library")
      .upsert(
        {
          organization_id: org.id,
          kind: "writing_prompt",
          ref_id: prompt.id,
          title: `${TAG} Task 2 — cities`,
          skill: "writing",
          task_type: "discussion",
          level: "Band 5-6",
        },
        { onConflict: "organization_id,kind,ref_id" },
      )
      .select("id, saved_by");
    check("teacher can stock the shelf", !error && data?.length === 1, error?.message);
    check("saved_by is stamped by the trigger", data?.[0]?.saved_by === teacherUser.id, `got ${data?.[0]?.saved_by}`);
    if (data?.[0]) made.library.push(data[0].id);
  }

  {
    // Saving the same prompt twice must be ONE entry, or "used 4 times" splits
    // in half and the library's only useful statistic goes wrong.
    await teacher
      .from("practice_library")
      .upsert(
        {
          organization_id: org.id,
          kind: "writing_prompt",
          ref_id: prompt.id,
          title: `${TAG} Task 2 — cities (again)`,
          skill: "writing",
        },
        { onConflict: "organization_id,kind,ref_id" },
      )
      .select("id");
    const { data } = await teacher
      .from("practice_library")
      .select("id")
      .eq("ref_id", prompt.id);
    check("saving the same prompt twice keeps one entry", data?.length === 1, `${data?.length} entries`);
  }

  {
    const { data, error } = await owner.from("practice_library").select("id, title");
    check("the shelf is shared — the owner sees the teacher's save", !error && (data?.length ?? 0) > 0, error?.message);
  }

  {
    const { data } = await student.from("practice_library").select("id");
    check(
      "a student cannot browse the shelf",
      (data?.length ?? 0) === 0,
      `student read ${data?.length} rows`,
    );
  }

  {
    const { data } = await stranger.from("practice_library").select("id, organization_id");
    check(
      "another centre cannot read this shelf",
      (data ?? []).every((r) => r.organization_id !== org.id),
      "TENANT LEAK",
    );
  }

  {
    // R5: archived, never deleted. And `.select()` after the update, because an
    // RLS-filtered write reports success and changes nothing.
    const { data, error } = await teacher
      .from("practice_library")
      .update({ archived_at: new Date().toISOString() })
      .eq("ref_id", prompt.id)
      .select("id, archived_at");
    check("teacher can archive", !error && data?.length === 1 && data[0].archived_at, error?.message);

    const { data: back } = await teacher
      .from("practice_library")
      .update({ archived_at: null })
      .eq("ref_id", prompt.id)
      .select("id");
    check("and restore", (back?.length ?? 0) === 1);
  }

  {
    const { data, error } = await stranger
      .from("practice_library")
      .update({ title: "hijacked" })
      .eq("ref_id", prompt.id)
      .select("id");
    check(
      "another centre cannot edit this shelf",
      Boolean(error) || (data?.length ?? 0) === 0,
      "TENANT WRITE LEAK",
    );
  }

  /* ── 20260816170000 — placement + assigning from the library ─────────── */
  console.log("\nplacement + library assignment (§6, §9)");

  // A branch is MANDATORY on a group (the filiallar rule — there is deliberately
  // no "no branch" state), so the fixture has to build the whole chain.
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .insert({ organization_id: org.id, name: `${TAG} Main` })
    .select("id")
    .single();
  if (branchError) throw new Error(`branch: ${branchError.message}`);

  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({
      organization_id: org.id,
      branch_id: branch.id,
      name: `${TAG} Evening`,
      teacher_id: teacherUser.id,
    })
    .select("id")
    .single();
  if (groupError) throw new Error(`group: ${groupError.message}`);
  await admin.from("group_members").insert({
    organization_id: org.id,
    group_id: group.id,
    student_id: studentUser.id,
  });

  const { data: shelfItem } = await admin
    .from("practice_library")
    .select("id")
    .eq("ref_id", prompt.id)
    .single();

  {
    const { data, error } = await teacher
      .from("assignments")
      .insert({
        organization_id: org.id,
        group_id: group.id,
        kind: "writing",
        title: `${TAG} placement`,
        prompt_id: prompt.id,
        is_placement: true,
        library_id: shelfItem.id,
        created_by: teacherUser.id,
      })
      .select("id, is_placement, library_id");
    check(
      "teacher can set a placement assigned from the library",
      !error && data?.[0]?.is_placement === true && data?.[0]?.library_id === shelfItem.id,
      error?.message,
    );
  }

  {
    // The columns the estimate service WRITES. This migration is the one that
    // does not degrade safely — if these are not writable, no band is recorded
    // at all.
    const { data, error } = await admin
      .from("skill_estimates")
      .upsert(
        {
          student_id: studentUser.id,
          organization_id: org.id,
          skill: "writing",
          current_band: 6,
          baseline_band: 5,
          baseline_source: "placement",
          baseline_at: new Date().toISOString(),
          sample_count: 3,
          target_set_by: teacherUser.id,
        },
        { onConflict: "student_id,skill" },
      )
      .select("baseline_source, baseline_at, target_set_by");
    check(
      "the estimate service can write baseline provenance",
      !error && data?.[0]?.baseline_source === "placement" && data?.[0]?.target_set_by === teacherUser.id,
      error?.message,
    );
  }

  {
    const { data } = await student
      .from("skill_estimates")
      .select("skill, baseline_source, current_band");
    check(
      "the student can still read their own estimate",
      (data?.length ?? 0) === 1 && data[0].baseline_source === "placement",
      `read ${data?.length} rows`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed\n`);
}

async function cleanup() {
  if (keep) {
    console.log("--keep: leaving the data in place.\n");
    return;
  }
  for (const id of made.users) {
    try {
      await admin.auth.admin.deleteUser(id);
    } catch {
      /* already gone */
    }
  }
  for (const id of [made.orgId, made.orgId2].filter(Boolean)) {
    // PostgREST builders are thenables, not promises — no .catch on them.
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
