import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

/**
 * Supabase client for use in Client Components / the browser.
 * Uses the anon key — all access is gated by Row Level Security.
 */
export function createClient() {
  return createBrowserClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey);
}
