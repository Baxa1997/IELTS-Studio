/**
 * The dates the sitemap states — the one field in it a crawler acts on.
 *
 * ⚠️ A `lastmod` THAT IS ALWAYS "NOW" IS ONE THE ENGINES STOP BELIEVING. Every
 * page used to carry the moment the sitemap was regenerated, hourly, so Bing
 * and Google were told the whole site changed every hour. They discount a
 * sitemap like that, and the articles' true dates went down with it.
 */

import { describe, expect, it, vi } from "vitest";

import { absoluteUrl } from "@/lib/seo";

import sitemap from "./sitemap";

vi.mock("@/lib/blog/store", () => ({
  loadPosts: async () => [
    { slug: "older", published: "2026-09-01" },
    { slug: "edited", published: "2026-08-01", updated: "2026-10-10" },
    { slug: "newest", published: "2026-10-12" },
  ],
}));

const entries = await sitemap();
const at = (path: string) => entries.find((e) => e.url === absoluteUrl(path));

describe("sitemap dates", () => {
  it("dates each article by its own last change", () => {
    expect(at("/blog/older")?.lastModified).toEqual(new Date("2026-09-01T00:00:00Z"));
    expect(at("/blog/edited")?.lastModified).toEqual(new Date("2026-10-10T00:00:00Z"));
  });

  it("dates the blog's front page by the newest change to any article", () => {
    expect(at("/blog")?.lastModified).toEqual(new Date("2026-10-12T00:00:00Z"));
  });

  it("gives no date to a page whose last change nobody records", () => {
    const blog = absoluteUrl("/blog");
    const dated = entries.filter((e) => e.url !== blog && !e.url.startsWith(`${blog}/`) && e.lastModified !== undefined);
    expect(dated.map((e) => e.url)).toEqual([]);
  });
});
