/**
 * /llms-full.txt — executed, like /llms.txt: the test reads what an answer
 * engine will read.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { GET as llms } from "@/app/llms.txt/route";
import { absoluteUrl } from "@/lib/seo";
import { seededPosts } from "@/test/blog-seed";

import { GET } from "./route";

/* Tests have no database: the store hands back the posts the blog migration
   seeds — the same list production started from. */
vi.mock("@/lib/blog/store", async () => {
  const { seededPosts } = await import("@/test/blog-seed");
  const posts = seededPosts();
  return { loadPosts: async () => posts, loadPost: async (slug: string) => posts.find((p) => p.slug === slug) };
});

const POSTS = seededPosts();
const body = await (await GET()).text();

describe("/llms-full.txt", () => {
  it("carries every article in full, each with its own URL to cite", () => {
    for (const p of POSTS) {
      expect(body).toContain(`# ${p.title}`);
      expect(body).toContain(absoluteUrl(`/blog/${p.slug}`));
      for (const pt of p.summary) expect(body).toContain(pt);
    }
  });

  it("states it is not the official exam", () => {
    expect(body).toMatch(/not affiliated with or endorsed by IELTS®/);
  });

  it("is linked from /llms.txt, where answer engines look first", async () => {
    expect(await (await llms()).text()).toContain(absoluteUrl("/llms-full.txt"));
  });

  it("is reachable signed out — otherwise every crawler reads a redirect", () => {
    const mw = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");
    const start = mw.indexOf("const PUBLIC_PATHS = [");
    expect(mw.slice(start, mw.indexOf("];", start))).toMatch(/"\/llms-full\.txt"/);
  });
});
