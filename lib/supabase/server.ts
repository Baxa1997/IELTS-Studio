import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads the user's session from cookies and respects Row Level Security.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore — the middleware refreshes the session.
        }
      },
    },
  });
}
