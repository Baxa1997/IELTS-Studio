import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Where platform-level notifications go — currently "a center has applied".
 *
 * Prefers PLATFORM_ADMIN_EMAIL, and otherwise finds the super admin's own
 * address so this works with no configuration at all. The lookup is a paged scan
 * of auth users, so it is cached for the life of the server process: new
 * applications are rare and the answer effectively never changes.
 */
let cached: { email: string | null; at: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function platformAdminEmail(): Promise<string | null> {
  const configured = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  if (configured) return configured;

  if (cached && Date.now() - cached.at < TTL) return cached.email;

  const admin = createAdminClient();
  let found: string | null = null;
  for (let page = 1; page <= 20 && !found; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const hit = data.users.find(
      (u) => (u.app_metadata as { role?: string } | null)?.role === "super_admin",
    );
    if (hit?.email) found = hit.email;
    if (data.users.length < 200) break;
  }

  cached = { email: found, at: Date.now() };
  return found;
}
