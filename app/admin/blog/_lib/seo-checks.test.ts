import { describe, expect, it } from "vitest";

import type { BlogPost } from "@/lib/blog";
import { seededPosts } from "@/test/blog-seed";

import { seoChecks } from "./seo-checks";

const base = (): BlogPost => structuredClone(seededPosts()[0]);
const check = (p: BlogPost, label: RegExp) => seoChecks(p).find((c) => label.test(c.label));

describe("the SEO panel", () => {
  it("treats the first keyword as the main one and looks for it where it matters", () => {
    const p = { ...base(), keywords: ["zebra crossing"] };
    expect(check(p, /in the title/)?.ok).toBe(false);
    p.title = `How a zebra crossing works`;
    expect(check(p, /in the title/)?.ok).toBe(true);
  });

  it("asks for keywords before it can check placement", () => {
    const p = { ...base(), keywords: [] };
    expect(check(p, /No keywords/)?.ok).toBe(false);
    expect(seoChecks(p).some((c) => /Main keyword/.test(c.label))).toBe(false);
  });

  it("is case-blind, because searches are", () => {
    const p = { ...base(), keywords: ["ielts"], title: "IELTS Reading in thirty minutes or less, done right" };
    expect(check(p, /in the title/)?.ok).toBe(true);
  });
});
