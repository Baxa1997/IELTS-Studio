/**
 * The row ↔ post mapping, and the migration that moved the posts in.
 *
 * The mapping is what the site reads and what the editor writes, so a field it
 * drops is a field that silently vanishes from every article on the next save.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BLOG_MIGRATION, seededPosts } from "@/test/blog-seed";

import { BLOG_CATEGORIES, BLOG_SKILLS } from "./types";
import { postToRow, rowToPost } from "./store";

const POSTS = seededPosts();
const sql = readFileSync(join(process.cwd(), BLOG_MIGRATION), "utf8");

describe("a post written back and read again", () => {
  it.each(POSTS.map((p) => [p.slug, p] as const))("is %s, unchanged", (_slug, p) => {
    expect(rowToPost(postToRow(p))).toEqual(p);
  });

  it("keeps optional fields absent rather than null — the pages test them with ?.", () => {
    const bare = rowToPost({ ...postToRow(POSTS[0]), skill: null, faq: [], cta: null, image: null, featured: false, updated: null });
    for (const k of ["skill", "faq", "cta", "image", "featured", "updated"]) expect(bare).not.toHaveProperty(k);
  });
});

describe("what the site reads", () => {
  /* ⚠️ The site reads with the SERVICE ROLE, which RLS does not filter — so
     this one `.eq` is all that keeps a half-written draft off /blog, the
     sitemap and the feeds. */
  it("is published posts only", () => {
    const store = readFileSync(join(process.cwd(), "lib/blog/store.ts"), "utf8");
    const loader = store.slice(store.indexOf("const loadPublished"), store.indexOf("export const loadPosts"));
    expect(loader).toMatch(/\.eq\("status", "published"\)/);
  });
});

describe("the migration", () => {
  /* The table's CHECKs and the app's lists must agree, or the editor offers a
     choice the database refuses (or the other way round). */
  it("accepts exactly the categories and practice areas the app knows", () => {
    const check = (col: string) => {
      const m = new RegExp(`${col}\\s+text(?: not null)?\\s+check \\(${col} in \\(([^)]*)\\)\\)`).exec(sql);
      return (m?.[1] ?? "").split(",").map((s) => s.trim().replace(/'/g, ""));
    };
    expect(check("category")).toEqual([...BLOG_CATEGORIES]);
    expect(check("skill")).toEqual([...BLOG_SKILLS]);
  });

  it("publishes nothing but what is marked published", () => {
    expect(sql).toMatch(/for select to anon, authenticated\s+using \(status = 'published'\)/);
    expect(sql).toMatch(/revoke all on public\.blog_posts from anon, authenticated;/);
  });

  it("never overwrites a post that has been edited since", () => {
    expect(sql).toMatch(/on conflict \(slug\) do nothing;/);
  });
});
