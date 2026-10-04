import "server-only";

import { newestFirst, type StoredPost } from "@/lib/blog";
import { rowToStored, STORED_COLUMNS } from "@/lib/blog/store";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The editor's reads — drafts included, uncached, service role. Only ever
 * called from pages that have already run `requireSuperAdmin()`.
 */

export async function listStoredPosts(): Promise<{ posts: StoredPost[]; error: string | null }> {
  const { data, error } = await createAdminClient()
    .from("blog_posts")
    .select(STORED_COLUMNS)
    .order("published", { ascending: false })
    .order("position", { ascending: true })
    .order("slug", { ascending: true });
  if (error) return { posts: [], error: error.message };
  return { posts: newestFirst((data ?? []).map(rowToStored)), error: null };
}

export async function getStoredPost(id: string): Promise<StoredPost | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient().from("blog_posts").select(STORED_COLUMNS).eq("id", id).maybeSingle();
  return data ? rowToStored(data) : null;
}
