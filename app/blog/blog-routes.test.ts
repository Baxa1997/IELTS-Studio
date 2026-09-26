/**
 * The blog is reachable — by a signed-out reader, by a crawler, and at a URL
 * that is either an article or a 404.
 *
 * Kept beside the route rather than in `lib/blog/blog.test.ts` because it reads
 * the sitemap, and lib/ may not import from app/.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { POSTS } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("reaching the blog", () => {
  it("is public — otherwise every reader and crawler is sent to /sign-in", () => {
    const mw = read("lib/supabase/middleware.ts");
    const start = mw.indexOf("const PUBLIC_PATHS = [");
    const list = mw.slice(start, mw.indexOf("];", start));
    expect(list).toMatch(/"\/blog"/);
  });

  it("lists the front page and every article in the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(absoluteUrl("/blog"));
    for (const p of POSTS) expect(urls).toContain(absoluteUrl(`/blog/${p.slug}`));
  });

  it("renders every article statically and 404s the rest", () => {
    const page = read("app/blog/[slug]/page.tsx");
    expect(page).toMatch(/export const dynamicParams = false/);
    expect(page).toMatch(/generateStaticParams/);
  });
});
