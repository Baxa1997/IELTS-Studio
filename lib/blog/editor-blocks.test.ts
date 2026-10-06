/**
 * The blocks and fields the rich editor added on 2026-10-06 — H3, pictures,
 * YouTube, keywords — and the guards around them. Each rule is broken on
 * purpose here and must catch it.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { seededPosts } from "@/test/blog-seed";

import type { Block, BlogPost } from ".";
import { sanitizeBlocks, sanitizeKeywords } from "./sanitize";
import { blocksToSource, sourceToBlocks } from "./source";
import { isBlogImageSrc, publishProblems } from "./validate";
import { youtubeId } from "./video";

const POSTS = seededPosts();
const base = (): BlogPost => structuredClone(POSTS.find((p) => p.faq?.length && p.cta) ?? POSTS[0]);
const problems = (p: BlogPost) => publishProblems(p, POSTS.filter((x) => x.slug !== p.slug).map((x) => x.slug));
const withBlock = (b: Block): BlogPost => {
  const p = base();
  p.body.push(b);
  return p;
};
const BUCKET = "https://abcd1234.supabase.co/storage/v1/object/public/blog/2026-10/1a2b3c4d-chart.png";

describe("pictures", () => {
  it("come from /public or the blog bucket, nowhere else — next/image throws on any other host", () => {
    expect(isBlogImageSrc("/blog/x.jpg")).toBe(true);
    expect(isBlogImageSrc(BUCKET)).toBe(true);
    expect(isBlogImageSrc("https://example.com/x.jpg")).toBe(false);
    expect(isBlogImageSrc("//evil.com/x.jpg")).toBe(false);
    expect(isBlogImageSrc(BUCKET.replace("/public/blog/", "/public/marketing/"))).toBe(false);
    expect(problems(withBlock({ type: "image", src: "https://example.com/x.jpg", alt: "A chart" })).join("\n")).toMatch(/uploaded in the editor/);
    expect(problems(withBlock({ type: "image", src: BUCKET, alt: "A chart" }))).toEqual([]);
  });

  it("allow exactly the bucket path next.config lets next/image load", () => {
    /* The two must move together: rename the bucket in one and the cover
       either breaks the page or is refused on publish. */
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toMatch(/pathname: "\/storage\/v1\/object\/public\/blog\/\*\*"/);
    expect(config).toMatch(/hostname: "\*\.supabase\.co"/);
  });

  it("need alt text to publish", () => {
    expect(problems(withBlock({ type: "image", src: "/blog/x.jpg", alt: " " })).join("\n")).toMatch(/needs alt text/);
  });
});

describe("videos", () => {
  it("are stored as a YouTube id, whatever link was pasted", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://m.youtube.com/shorts/dQw4w9WgXcQ",
      "dQw4w9WgXcQ",
    ]) {
      expect(youtubeId(url), url).toBe("dQw4w9WgXcQ");
    }
  });

  it("refuse anything that is not YouTube, so no other host is ever embedded", () => {
    expect(youtubeId("https://vimeo.com/123456789")).toBeUndefined();
    expect(youtubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeUndefined();
    expect(problems(withBlock({ type: "video", id: "javascript:x" })).join("\n")).toMatch(/Not a YouTube video id/);
    expect(problems(withBlock({ type: "video", id: "dQw4w9WgXcQ", title: "Watch this" }))).toEqual([]);
  });
});

describe("sub-headings", () => {
  it("get anchors, and may not repeat one an h2 already has", () => {
    const p = base();
    const h2 = p.body.find((b) => b.type === "h2");
    if (!h2 || h2.type !== "h2") throw new Error("no h2 in the seed");
    p.body.push({ type: "h3", text: h2.text });
    expect(problems(p).join("\n")).toMatch(/share an anchor/);
  });
});

describe("keywords", () => {
  it("are stored lower-case, trimmed and once each", () => {
    expect(sanitizeKeywords(["  IELTS Writing ", "ielts writing", "task 2", 7, ""])).toEqual(["ielts writing", "task 2"]);
    expect(sanitizeKeywords("a, b ,a")).toEqual(["a", "b"]);
  });

  it("are a handful of searches, not a tag cloud", () => {
    const p = { ...base(), keywords: Array.from({ length: 11 }, (_, i) => `search ${i}`) };
    expect(problems(p).join("\n")).toMatch(/11 keywords/);
    expect(problems({ ...base(), keywords: ["ielts reading", "true false not given"] })).toEqual([]);
  });
});

describe("the text format", () => {
  it("round-trips the new blocks, so an imported draft and a saved post agree", () => {
    const body: Block[] = [
      { type: "h3", text: "A sub-heading" },
      { type: "p", text: "Text." },
      { type: "image", src: "/blog/a.jpg", alt: "A chart of results", caption: "Figure 1" },
      { type: "image", src: BUCKET, alt: "No caption" },
      { type: "video", id: "dQw4w9WgXcQ", title: "How it works" },
      { type: "video", id: "dQw4w9WgXcQ" },
    ];
    expect(sourceToBlocks(blocksToSource(body))).toEqual(body);
  });

  it("keeps a picture line that follows a paragraph as its own block", () => {
    expect(sourceToBlocks("Some text\n![Alt](/blog/a.jpg)")).toEqual([
      { type: "p", text: "Some text" },
      { type: "image", src: "/blog/a.jpg", alt: "Alt" },
    ]);
  });
});

describe("the body the editor sends", () => {
  it("is rebuilt from strings — an unknown type or an extra field never reaches the database", () => {
    const sent = [
      { type: "p", text: "  Hello   world ", onclick: "x" },
      { type: "script", text: "alert(1)" },
      { type: "image", src: "/blog/a.jpg", alt: 3, caption: 'Say "hi"' },
      { type: "list", items: ["a", 2, ""], ordered: "yes" },
      null,
      "p",
      { type: "p", text: "" },
    ];
    expect(sanitizeBlocks(sent)).toEqual([
      { type: "p", text: "Hello world" },
      { type: "image", src: "/blog/a.jpg", alt: "", caption: "Say ”hi”" },
      { type: "list", items: ["a"] },
    ]);
  });

  it("is an empty body when it is not a list at all", () => {
    expect(sanitizeBlocks({ type: "p", text: "x" })).toEqual([]);
    expect(sanitizeBlocks(undefined)).toEqual([]);
  });

  it("passes every seeded post through unchanged", () => {
    for (const p of POSTS) expect(sanitizeBlocks(p.body), p.slug).toEqual(p.body);
  });
});
