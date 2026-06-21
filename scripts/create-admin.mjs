// Bootstrap a center: creates an organization + a center_admin user + profile.
// There is no UI for this on purpose (admins/orgs are provisioned, not self-served).
//
// Usage:
//   node scripts/create-admin.mjs <email> <password> "<Org Name>" ["Full Name"]
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const env = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i)] = t.slice(i + 1);
    }
  } catch {
    // fall back to process.env below
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const [email, password, orgName, fullName] = process.argv.slice(2);
if (!email || !password || !orgName) {
  console.error(
    'Usage: node scripts/create-admin.mjs <email> <password> "<Org Name>" ["Full Name"]',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1) organization
const { data: org, error: orgError } = await admin
  .from("organizations")
  .insert({ name: orgName })
  .select("id")
  .single();
if (orgError) {
  console.error("Create organization failed:", orgError.message);
  process.exit(1);
}

// 2) auth user (role/org live in app_metadata, not user-editable)
const { data: created, error: userError } = await admin.auth.admin.createUser({
  email: email.toLowerCase(),
  password,
  email_confirm: true,
  app_metadata: { organization_id: org.id, role: "center_admin" },
  user_metadata: { full_name: fullName ?? null },
});
if (userError || !created?.user) {
  console.error("Create user failed:", userError?.message);
  await admin.from("organizations").delete().eq("id", org.id);
  process.exit(1);
}

// 3) profile
const { error: profileError } = await admin.from("profiles").insert({
  id: created.user.id,
  organization_id: org.id,
  role: "center_admin",
  full_name: fullName ?? null,
});
if (profileError) {
  console.error("Create profile failed:", profileError.message);
  await admin.auth.admin.deleteUser(created.user.id);
  await admin.from("organizations").delete().eq("id", org.id);
  process.exit(1);
}

console.log("✅ Center admin created");
console.log(`   Organization : ${orgName} (${org.id})`);
console.log(`   Admin email  : ${email.toLowerCase()}`);
console.log("   Sign in at /sign-in, then invite students from the console.");
