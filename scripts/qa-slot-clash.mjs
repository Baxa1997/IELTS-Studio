// Prove the timetable actually REFUSES a double-booking, against the real
// database, through the real save path's query shape.
//
// The unit tests prove the rule. They cannot prove that the save calls it, that
// the query feeding it returns what it expects, or that RLS lets a teacher see
// the colliding booking in the first place — and a clash check that cannot SEE
// the other booking silently approves everything, which is the failure mode
// that matters and the one that looks perfect in a test suite.
//
//   node scripts/qa-slot-clash.mjs

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i)] = t.slice(i + 1).trim();
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TAG = `qa-clash-${Date.now()}`;
const PASSWORD = "QaClash!2026x";
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
  if (error) throw new Error(`createUser: ${error.message}`);
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
  if (error) throw new Error(`placeInOrg: ${error.message}`);
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { organization_id: orgId, role },
  });
}

/** The exact read `refuseOnClash` performs, as the signed-in teacher. */
async function visibleSlots(client) {
  const { data } = await client
    .from("lesson_slots")
    .select("id, group_id, series_id, weekday, starts_at, ends_at, room_id");
  return data ?? [];
}

async function main() {
  console.log(`\nTimetable clash blocking, against real data — ${TAG}\n`);

  const { data: org } = await admin
    .from("organizations")
    .insert({ name: `${TAG} Centre`, kind: "center", status: "active", billing_enforced: false })
    .select("id")
    .single();
  made.orgIds.push(org.id);

  const teacher = await makeUser(`${TAG}-t@example.com`, "QA Teacher");
  await placeInOrg(teacher.id, org.id, "teacher", "QA Teacher");

  const { data: branch } = await admin
    .from("branches")
    .insert({ organization_id: org.id, name: `${TAG} Main` })
    .select("id")
    .single();
  const { data: room } = await admin
    .from("rooms")
    .insert({ organization_id: org.id, branch_id: branch.id, name: "Room 12" })
    .select("id")
    .single();

  // TWO groups, same teacher, same room — the shape a clash needs.
  const groups = [];
  for (const name of ["Morning A2", "Evening B2"]) {
    const { data: g, error } = await admin
      .from("groups")
      .insert({
        organization_id: org.id,
        branch_id: branch.id,
        name: `${TAG} ${name}`,
        teacher_id: teacher.id,
      })
      .select("id, name")
      .single();
    if (error) throw new Error(`group ${name}: ${error.message}`);
    groups.push(g);
  }

  // Monday 15:30–17:00 for the first group.
  const { error: slotError } = await admin.from("lesson_slots").insert({
    organization_id: org.id,
    group_id: groups[0].id,
    room_id: room.id,
    series_id: crypto.randomUUID(),
    weekday: 1,
    starts_at: "15:30",
    ends_at: "17:00",
  });
  if (slotError) throw new Error(`slot: ${slotError.message}`);

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: `${TAG}-t@example.com`,
    password: PASSWORD,
  });
  if (signInError) throw new Error(`sign-in: ${signInError.message}`);

  // THE ONE THAT MATTERS. If RLS hides the other group's booking, the checker
  // sees an empty timetable and waves everything through — and every unit test
  // still passes.
  const slots = await visibleSlots(client);
  check(
    "a teacher can SEE the colliding booking (without this the check is blind)",
    slots.length === 1 && slots[0].group_id === groups[0].id,
    `saw ${slots.length} slots`,
  );

  const { data: visibleGroups } = await client.from("groups").select("id, name, teacher_id");
  check(
    "…and the group and teacher behind it, so the message can name them",
    (visibleGroups ?? []).length === 2,
    `saw ${(visibleGroups ?? []).length} groups`,
  );

  const { data: visibleRooms } = await client.from("rooms").select("id, name");
  check(
    "…and the room, so it can say which one",
    (visibleRooms ?? []).some((r) => r.id === room.id),
    "room not visible to the teacher",
  );

  // Replay the SAVE'S OWN RULE over exactly what the teacher can see, in the
  // shape refuseOnClash builds. This is the part a unit test cannot reach: the
  // rule is right, but is it being fed the real rows?
  const { findClashes, explainClashes } = await import("../lib/console/slot-clash.ts");

  const groupById = new Map((visibleGroups ?? []).map((g) => [g.id, g]));
  const roomName = new Map((visibleRooms ?? []).map((r) => [r.id, r.name]));
  const existing = slots.map((r) => {
    const g = groupById.get(r.group_id);
    return {
      groupId: r.group_id,
      groupName: g?.name,
      seriesId: r.series_id,
      weekday: Number(r.weekday),
      startsAt: String(r.starts_at).slice(0, 5),
      endsAt: String(r.ends_at).slice(0, 5),
      roomId: r.room_id,
      roomName: r.room_id ? roomName.get(r.room_id) : null,
      teacherId: g?.teacher_id ?? null,
    };
  });

  const proposed = (over = {}) => ({
    groupId: groups[1].id,
    groupName: groups[1].name,
    seriesId: crypto.randomUUID(),
    weekday: 1,
    startsAt: "15:30",
    endsAt: "17:00",
    roomId: room.id,
    roomName: "Room 12",
    teacherId: teacher.id,
    teacherName: "QA Teacher",
    ...over,
  });

  const blocked = findClashes(proposed(), existing);
  check(
    "the same room AND teacher at the same hour is refused",
    blocked.length === 2 && explainClashes(blocked).includes("Room 12"),
    explainClashes(blocked) || "nothing was refused",
  );

  check(
    "an hour later is allowed",
    findClashes(proposed({ startsAt: "17:00", endsAt: "18:30" }), existing).length === 0,
    "back-to-back teaching was wrongly refused",
  );

  check(
    "a different day is allowed",
    findClashes(proposed({ weekday: 3 }), existing).length === 0,
    "a Wednesday booking collided with a Monday one",
  );

  check(
    "a different room with a free teacher is allowed",
    findClashes(proposed({ roomId: null, teacherId: null }), existing).length === 0,
    "an unbooked room and no teacher still collided",
  );

  console.log(`\n${pass} passed, ${fail} failed\n`);
}

async function cleanup() {
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
