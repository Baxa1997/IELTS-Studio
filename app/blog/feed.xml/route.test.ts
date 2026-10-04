/**
 * /blog/feed.xml — executed, because it is generated: the test reads what a
 * feed reader will read.
 */

import { describe, expect, it, vi } from "vitest";

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
const res = await GET();
const xml = await res.text();

describe("/blog/feed.xml", () => {
  it("is RSS, served as RSS", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toMatch(/<rss version="2\.0"/);
    expect(res.headers.get("content-type")).toMatch(/application\/rss\+xml/);
  });

  it("carries every post exactly once", () => {
    expect(xml.match(/<item>/g)?.length).toBe(POSTS.length);
    for (const p of POSTS) expect(xml).toContain(`<link>${absoluteUrl(`/blog/${p.slug}`)}</link>`);
  });

  it("escapes what XML cannot hold as text", () => {
    // A bare & (or <) in a title makes the whole feed unparseable, and readers
    // drop an invalid feed silently. The what's-new headline carries an
    // apostrophe, so the escaping is exercised by real content.
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
    expect(xml).toContain("what&apos;s new at EngProgress");
  });

  it("is dated by the posts, not by the build", () => {
    const newest = POSTS.map((p) => p.updated ?? p.published).sort().at(-1)!;
    expect(xml).toContain(`<lastBuildDate>${new Date(`${newest}T00:00:00Z`).toUTCString()}</lastBuildDate>`);
  });
});
