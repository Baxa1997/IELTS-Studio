import { readFileSync } from "node:fs";
import { join } from "node:path";

import { newestFirst, type BlogPost } from "@/lib/blog";

/**
 * The posts the blog migration seeds, read straight out of the migration file
 * — the same JSON the database was given.
 *
 * Tests run without a database, so this is the list they render, export and
 * validate. Reading the SQL rather than keeping a second copy means a test can
 * never pass against posts the database does not have.
 */
export const BLOG_MIGRATION = "supabase/migrations/20261004120000_blog_posts.sql";

export function seededPosts(): BlogPost[] {
  const sql = readFileSync(join(process.cwd(), BLOG_MIGRATION), "utf8");
  const start = sql.indexOf("$posts$[");
  const end = sql.indexOf("]$posts$");
  if (start < 0 || end < 0) throw new Error(`${BLOG_MIGRATION}: no $posts$ block`);
  const posts = JSON.parse(sql.slice(start + "$posts$".length, end + 1)) as BlogPost[];
  return newestFirst(posts);
}
