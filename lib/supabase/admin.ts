import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv } from "@/lib/env";

/**
 * Privileged Supabase client using the service role key.
 *
 * ⚠️  This BYPASSES Row Level Security and can read/write across every tenant.
 * Use it only in trusted server code for deliberate cross-tenant operations
 * (migrations helpers, admin tasks, background jobs). For anything acting on
 * behalf of a signed-in user, use the RLS-respecting client in `./server`.
 */
export function createAdminClient() {
  return createSupabaseClient(clientEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
