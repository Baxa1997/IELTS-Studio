// Create (or update) THE platform super admin. Super admins are above all orgs:
// the role lives in app_metadata (not user-editable, not in the profiles table),
// so the handle_new_user trigger skips provisioning and they get no org/profile.
//
// Because they have no profile row, their LOGIN also lives in app_metadata —
// public.email_for_login reads it there. Pass one to sign in by name instead of
// by email.
//
// Usage:
//   node scripts/create-super-admin.mjs <email> <password> [login]
//
// Re-running with an existing email updates that account's password and login
// instead of failing, so it doubles as the password-rotation tool.
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

const [emailArg, password, loginArg] = process.argv.slice(2);
if (!emailArg || !password) {
  console.error("Usage: node scripts/create-super-admin.mjs <email> <password> [login]");
  process.exit(1);
}
const email = emailArg.toLowerCase();
const login = loginArg ? loginArg.toLowerCase() : undefined;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const appMetadata = { role: "super_admin", ...(login ? { username: login } : {}) };

const { data: created, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: appMetadata,
});

let action = "created";
if (error) {
  // Already there → rotate the password and (re)set the login rather than
  // making the operator go hunting in the dashboard.
  const existing = await findUserByEmail(admin, email);
  if (!existing) {
    console.error("Create super admin failed:", error.message);
    process.exit(1);
  }
  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    app_metadata: appMetadata,
  });
  if (updateError) {
    console.error("Update super admin failed:", updateError.message);
    process.exit(1);
  }
  action = "updated";
}

// handle_new_user gives every new auth user a personal workspace. Its skip
// branch reads app_metadata.role, which Supabase writes AFTER the insert — so
// the trigger never sees it and a super admin ends up with an org and a student
// profile they must not have. Strip it back off. (Idempotent: a rerun finds
// nothing.) See lib/provision.ts for the same fix on the app side.
const userId = created?.user?.id ?? (await findUserByEmail(admin, email))?.id;
if (userId) {
  const { data: stray } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();
  if (stray) {
    await admin
      .from("organizations")
      .delete()
      .eq("id", stray.organization_id)
      .eq("kind", "personal");
    console.log("   Removed the auto-provisioned personal workspace.");
  }
}

console.log(`✅ Super admin ${action}`);
console.log(`   Email : ${email}`);
if (login) console.log(`   Login : ${login}`);
console.log("   Sign in at /sign-in, then you'll land on /admin.");
if (login) {
  console.log("   (Login-name sign-in needs migration 20260807190000_platform_login.sql.)");
}

/** Page through users to find one by email — the admin API has no direct
 *  get-by-email, and listUsers is capped per page. */
async function findUserByEmail(client, wanted) {
  for (let page = 1; page <= 20; page++) {
    const { data, error: listError } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (listError || !data?.users?.length) return null;
    const hit = data.users.find((u) => u.email?.toLowerCase() === wanted);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}
