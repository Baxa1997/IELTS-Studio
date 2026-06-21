// Create THE platform super admin. Super admins are above all orgs: the role
// lives in app_metadata (not user-editable, not in the profiles table), so the
// handle_new_user trigger skips provisioning and they get no org/profile.
//
// Usage:
//   node scripts/create-super-admin.mjs <email> <password>
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

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/create-super-admin.mjs <email> <password>");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error } = await admin.auth.admin.createUser({
  email: email.toLowerCase(),
  password,
  email_confirm: true,
  app_metadata: { role: "super_admin" },
});
if (error || !created?.user) {
  console.error("Create super admin failed:", error?.message);
  process.exit(1);
}

console.log("✅ Super admin created");
console.log(`   Email : ${email.toLowerCase()}`);
console.log("   Sign in at /sign-in, then you'll land on /admin.");
