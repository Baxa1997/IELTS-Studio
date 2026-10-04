/**
 * The free-practice pages are FOUND, not only listed — the SEO / answer-engine
 * layer added 2026-10-04 ("for blogging for SEO and GEO, add the practices").
 *
 * What fails silently here is drift: a FAQ the page shows but its data does
 * not carry (or the reverse), a skill added to the free practice that never
 * reaches the sitemap, llms.txt or its share card, an answer quoting a time
 * the practice does not take, and an article whose practice link goes
 * nowhere. Each is pinned below.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { postToMarkdown } from "@/lib/blog/markdown";
import { practiceFaq } from "@/lib/free-practice/faq";
import { FREE_PAGE_DESCRIPTION, FREE_PAGE_TITLE, freePracticePage, freeRunner } from "@/lib/free-practice/links";
import type { PoolItem } from "@/lib/free-practice/pools";
import { MINUTES } from "@/lib/free-practice/pools";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { en } from "@/lib/i18n/messages/en";
import { absoluteUrl } from "@/lib/seo";
import { seededPosts } from "@/test/blog-seed";

import { practiceGraph } from "./_lib/structured-data";

vi.mock("@/lib/blog/store", async () => {
  const { seededPosts } = await import("@/test/blog-seed");
  const posts = seededPosts();
  return { loadPosts: async () => posts, loadPost: async (slug: string) => posts.find((p) => p.slug === slug) };
});

const t = translator(SOURCE_LOCALE);
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const item = (key: string): PoolItem => ({
  key,
  source: key,
  format: "full",
  testNo: 3,
  part: null,
  paper: "reading",
  title: "Cities and heat",
  topic: null,
  kind: "5 parts",
  level: null,
  minutes: 60,
  questions: 35,
});

describe("a practice page's structured data", () => {
  const faq = practiceFaq("cefr", t);
  const posts = seededPosts().filter((p) => p.skill === "cefr");
  const graph = practiceGraph({
    skill: "cefr",
    title: t(FREE_PAGE_TITLE.cefr),
    description: t(FREE_PAGE_DESCRIPTION.cefr),
    items: [item("a"), item("b")],
    faq,
    posts,
    name: () => "Test 3 · Full CEFR reading",
    home: "Home",
  });
  const node = (type: string) => graph["@graph"].find((n) => n["@type"] === type) as Record<string, unknown>;

  it("publishes every visible question, word for word, and no other", () => {
    const data = node("FAQPage").mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(data.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(faq.map((f) => [f.q, f.a]));
  });

  it("lists the page's practices as free learning resources, each at its own runner", () => {
    const list = node("ItemList").itemListElement as { item: Record<string, unknown> }[];
    expect(list.map((l) => l.item.url)).toEqual([absoluteUrl(freeRunner("cefr", "a")), absoluteUrl(freeRunner("cefr", "b"))]);
    expect(list.every((l) => l.item["@type"] === "LearningResource" && l.item.isAccessibleForFree === true)).toBe(true);
    expect(list[0].item.timeRequired).toBe("PT60M");
  });

  it("joins the site's organisation and links the skill's articles", () => {
    const page = node("CollectionPage");
    expect((page.publisher as { "@id": string })["@id"]).toBe(`${absoluteUrl("/").replace(/\/$/, "")}/#organization`);
    expect(page.relatedLink).toEqual(posts.map((p) => absoluteUrl(`/blog/${p.slug}`)));
    expect(posts.length).toBeGreaterThan(0); // the Multilevel explainer
  });

  it("is rendered from the same FAQ list the page shows", () => {
    const page = read("app/practice/[skill]/page.tsx");
    expect(page).toContain("const faq = practiceFaq(skill, t);");
    expect(page).toMatch(/practiceGraph\(\{[\s\S]*?\bfaq,[\s\S]*?\}\)/);
    expect(page).toContain('<PracticeFaq faq={faq} title={t("free.faqTitle")} />');
    expect(page).toContain('<script type="application/ld+json"');
  });
});

describe("the FAQ's answers are true of the practice as built", () => {
  it("quotes the times the pools actually give", () => {
    const time = (skill: (typeof FREE_SKILLS)[number]) => practiceFaq(skill, t)[2].a;
    expect(time("reading")).toContain(`${MINUTES.readingTest} minutes`);
    expect(time("listening")).toContain(`${MINUTES.listeningTest} minutes`);
    expect(time("cefr")).toContain(`${MINUTES.cefrReading} minutes`);
  });

  it("make no measured-accuracy claim about the grader", async () => {
    const { ACCURACY_CLAIM } = await import("@/lib/blog/validate");
    for (const s of FREE_SKILLS) for (const f of practiceFaq(s, t)) expect(f.a).not.toMatch(ACCURACY_CLAIM);
  });
});

describe("every free skill reaches every place a crawler or answer engine reads", () => {
  it("the sitemap, as a page that changes daily", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    for (const s of FREE_SKILLS) expect(urls).toContain(absoluteUrl(freePracticePage(s)));
  });

  it("llms.txt, under Free practice, with what the page is", async () => {
    const { GET } = await import("@/app/llms.txt/route");
    const body = await (await GET()).text();
    const section = body.slice(body.indexOf("## Free practice"), body.indexOf("## Blog"));
    for (const s of FREE_SKILLS) {
      expect(section).toContain(`(${absoluteUrl(freePracticePage(s))}): ${en[FREE_PAGE_DESCRIPTION[s]]}`);
    }
  });

  it("llms-full.txt, with each page's questions answered in full", async () => {
    const { GET } = await import("@/app/llms-full.txt/route");
    const body = await (await GET()).text();
    for (const s of FREE_SKILLS) {
      expect(body).toContain(`## ${en[FREE_PAGE_TITLE[s]]}`);
      for (const f of practiceFaq(s, t)) expect(body).toContain(f.a);
    }
  });

  it("its own share card, drawn for every free skill", () => {
    expect(read("app/practice/[skill]/opengraph-image.tsx")).toContain("FREE_SKILLS.map((skill) => ({ skill }))");
  });
});

describe("an article and its skill's practice link both ways", () => {
  it("the article's Markdown names the free practice", () => {
    for (const p of seededPosts().filter((x) => x.skill && (FREE_SKILLS as readonly string[]).includes(x.skill))) {
      expect(postToMarkdown(p, absoluteUrl)).toContain(`(${absoluteUrl(freePracticePage(p.skill as "reading"))})`);
    }
  });

  it("the article page shows it, and the practice page lists the articles", () => {
    expect(read("app/blog/_components/article-view.tsx")).toContain("<FreePracticeNote post={post} />");
    expect(read("app/practice/[skill]/page.tsx")).toContain("postsForSkill(posts, skill)");
  });
});
