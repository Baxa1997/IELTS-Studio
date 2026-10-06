import "server-only";

import { newestFirst, type StoredPost } from "@/lib/blog";
import { isMissingColumn, LEGACY_STORED_COLUMNS, rowToStored, STORED_COLUMNS } from "@/lib/blog/store";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The editor's reads — drafts included, uncached, service role. Only ever
 * called from pages that have already run `requireSuperAdmin()`.
 */

export async function listStoredPosts(): Promise<{ posts: StoredPost[]; error: string | null }> {
  const read = (columns: string) =>
    createAdminClient()
      .from("blog_posts")
      .select(columns)
      .order("published", { ascending: false })
      .order("position", { ascending: true })
      .order("slug", { ascending: true });
  // See LEGACY_POST_COLUMNS: the keywords migration may not be applied yet.
  let { data, error } = await read(STORED_COLUMNS);
  if (isMissingColumn(error)) ({ data, error } = await read(LEGACY_STORED_COLUMNS));
  if (error) return { posts: [], error: error.message };
  return { posts: newestFirst(((data ?? []) as unknown as Record<string, unknown>[]).map(rowToStored)), error: null };
}

export { loadStoredPost as getStoredPost } from "@/lib/blog/store";
