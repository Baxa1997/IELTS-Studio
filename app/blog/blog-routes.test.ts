/**
 * The blog is reachable — by a signed-out reader, by a crawler, and at a URL
 * that is either an article or a 404.
 *
 * Kept beside the route rather than in `lib/blog/blog.test.ts` because it reads
 * the sitemap, and lib/ may not import from app/.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { SKILL_TOPIC, type BlogSkill } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";
import { seededPosts } from "@/test/blog-seed";

/* Tests have no database: the store hands back the posts the blog migration
   seeds — the same list production started from. */
vi.mock("@/lib/blog/store", async () => {
  const { seededPosts } = await import("@/test/blog-seed");
  const posts = seededPosts();
  return { loadPosts: async () => posts, loadPost: async (slug: string) => posts.find((p) => p.slug === slug) };
});

const POSTS = seededPosts();

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("reaching the blog", () => {
  it("is public — otherwise every reader and crawler is sent to /sign-in", () => {
    const mw = read("lib/supabase/middleware.ts");
    const start = mw.indexOf("const PUBLIC_PATHS = [");
    const list = mw.slice(start, mw.indexOf("];", start));
    expect(list).toMatch(/"\/blog"/);
  });

  it("lists the front page and every article in the sitemap", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(absoluteUrl("/blog"));
    for (const p of POSTS) expect(urls).toContain(absoluteUrl(`/blog/${p.slug}`));
  });

  it("pre-renders the known articles, renders a new one on demand, and 404s the rest", () => {
    /* Posts are published from /admin without a deploy, so a slug the build
       never saw must still render — `dynamicParams = false` would 404 every
       post written after the last deploy. An unknown slug is still a 404, by
       notFound() on a missing row. */
    const page = read("app/blog/[slug]/page.tsx");
    expect(page).toMatch(/export const dynamicParams = true/);
    expect(page).toMatch(/generateStaticParams/);
    expect(page).toMatch(/if \(!post\) notFound\(\);/);
  });

  it("never lets the draft preview be indexed or reached without super_admin", () => {
    const preview = read("app/blog/preview/[id]/page.tsx");
    expect(preview).toMatch(/await requireSuperAdmin\(\)/);
    expect(preview).toMatch(/index: false/);
  });
});

describe("the skill pages link to the blog", () => {
  /* Every skill's marketing page carries the block, including skills with no
     article yet — it renders nothing until one is published, and then the link
     is there without anyone remembering to add it. */
  const PAGE: Record<BlogSkill, string> = {
    writing: "app/(marketing)/ielts-writing-practice/page.tsx",
    reading: "app/(marketing)/ielts-reading-practice/page.tsx",
    listening: "app/(marketing)/ielts-listening-practice/page.tsx",
    speaking: "app/(marketing)/ielts-speaking-practice/page.tsx",
    cefr: "app/(marketing)/cefr-multilevel-practice/page.tsx",
  };

  it.each(Object.keys(SKILL_TOPIC) as BlogSkill[])("%s", (skill) => {
    expect(read(PAGE[skill])).toContain(`<FromTheBlog skill="${skill}" />`);
  });
});
