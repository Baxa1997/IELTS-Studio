// @vitest-environment jsdom
/**
 * The Task 2 question pages, rendered — the text a crawler reads, checked
 * against the library itself rather than against the module that feeds them.
 *
 *  - Each question on a page is the library's prompt_text, byte for byte, and
 *    the topic's prompts are all there and nothing else is. A shipped prompt is
 *    never reworded (lib/prompts/starter-set.ts); a page that tidied one up
 *    would publish a second wording of it.
 *  - A topic under the bar has no page and its URL is a 404, not a thin page.
 *  - Every page is in the sitemap and llms.txt, and every question is in
 *    llms-full.txt, which are what search and answer engines read first.
 *  - "Practise this question free" goes somewhere a signed-out visitor can
 *    actually practise THAT question — see PRACTISE_HREF for why that is the
 *    checker and not the free runner.
 *
 * Kept beside the route because it reads app/sitemap.ts and the llms routes,
 * and lib/ may not import from app/. lib/prompts/question-bank.test.ts holds
 * the bank's own rules.
 */

import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { GET as llmsFull } from "@/app/llms-full.txt/route";
import { GET as llms } from "@/app/llms.txt/route";
import { MIN_QUESTIONS_PER_TOPIC, PRACTISE_HREF, QUESTION_BANK_PATH, topicPath } from "@/lib/prompts/question-bank";
import { STARTER_PROMPTS } from "@/lib/prompts/starter-set";
import { absoluteUrl, PUBLIC_ROUTES } from "@/lib/seo";

import HubPage, { metadata as hubMetadata } from "./page";
import TopicPage, { dynamicParams, generateMetadata, generateStaticParams } from "./[topic]/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...rest }, children),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
/* Tests have no database: the store hands back the posts the blog migration
   seeds — the same list production started from. */
vi.mock("@/lib/blog/store", async () => {
  const { seededPosts } = await import("@/test/blog-seed");
  const posts = seededPosts();
  return { loadPosts: async () => posts, loadPost: async (slug: string) => posts.find((p) => p.slug === slug) };
});

/** The library's Task 2 prompts per topic, straight off the set. */
const library = new Map<string, string[]>();
for (const p of STARTER_PROMPTS.filter((x) => x.task_type === "task2")) {
  library.set(p.topic_family, [...(library.get(p.topic_family) ?? []), p.prompt_text]);
}

const TOPICS = generateStaticParams().map((p) => p.topic);
const params = (topic: string) => ({ params: Promise.resolve({ topic }) });
const dom = (html: string) => new DOMParser().parseFromString(html, "text/html");

async function renderTopic(topic: string) {
  return dom(renderToStaticMarkup(await TopicPage(params(topic))));
}

/** Every node of the page's JSON-LD graph. */
function graph(doc: Document): Record<string, unknown>[] {
  return [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
    const data = JSON.parse(s.textContent ?? "{}");
    return (data["@graph"] ?? [data]) as Record<string, unknown>[];
  });
}

describe("a topic page", () => {
  it("exists for some topics — so the checks below are checking something", () => {
    expect(TOPICS.length).toBeGreaterThan(0);
  });

  it.each(TOPICS)("%s prints each of its library prompts byte for byte, and nothing else", async (topic) => {
    const doc = await renderTopic(topic);
    const shown = [...doc.querySelectorAll('li[id^="q-"] > p')].map((p) => p.textContent);
    expect(shown.length).toBe(library.get(topic)?.length);
    expect([...shown].sort()).toEqual([...(library.get(topic) ?? [])].sort());
  });

  it.each(TOPICS)("%s names each question in its structured data by the same exact text", async (topic) => {
    const doc = await renderTopic(topic);
    const list = graph(doc).find((n) => n["@type"] === "ItemList") as { itemListElement: { item: { name: string } }[] };
    const shown = [...doc.querySelectorAll('li[id^="q-"] > p')].map((p) => p.textContent);
    expect(list.itemListElement.map((e) => e.item.name)).toEqual(shown);
  });

  it.each(TOPICS)("%s sends every practise link to a page a signed-out visitor can open", async (topic) => {
    const doc = await renderTopic(topic);
    const links = [...doc.querySelectorAll('li[id^="q-"] a')].map((a) => a.getAttribute("href"));
    expect(links.length).toBe(library.get(topic)?.length);
    const publicPaths = PUBLIC_ROUTES.map((r) => r.path as string);
    for (const href of links) {
      expect(href).toBe(PRACTISE_HREF);
      expect(publicPaths).toContain(href);
      // The free runner only opens the visitor's own daily list (see PRACTISE_HREF).
      expect(href).not.toMatch(/^\/write\/free/);
    }
  });

  it.each(TOPICS)("%s names the shared publisher, and no Organization of its own", async (topic) => {
    const nodes = graph(await renderTopic(topic));
    const orgs = nodes.filter((n) => n["@type"] === "Organization");
    expect(orgs).toHaveLength(1);
    expect(orgs[0]["@id"]).toBe(`${absoluteUrl("/").replace(/\/$/, "")}/#organization`);
    expect(nodes.some((n) => n["@type"] === "BreadcrumbList")).toBe(true);
  });
});

describe("a topic under the bar", () => {
  const thin = [...library].filter(([, list]) => list.length < MIN_QUESTIONS_PER_TOPIC).map(([topic]) => topic);

  it("exists in today's library — otherwise this block proves nothing", () => {
    expect(thin.length).toBeGreaterThan(0);
  });

  it("gets no page, and its URL is a 404 rather than an empty page", async () => {
    expect(dynamicParams).toBe(false);
    for (const topic of thin) {
      expect(TOPICS, topic).not.toContain(topic);
      await expect(TopicPage(params(topic))).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });
});

describe("the hub", () => {
  it("links to every topic page", () => {
    const doc = dom(renderToStaticMarkup(createElement(HubPage)));
    const hrefs = new Set([...doc.querySelectorAll("a")].map((a) => a.getAttribute("href")));
    for (const topic of TOPICS) expect(hrefs, topic).toContain(topicPath(topic));
  });
});

describe("the titles", () => {
  /* The root layout's template, read from the layout itself: the length that
     matters is the one a search result shows, suffix included. */
  const template = /template:\s*"([^"]+)"/.exec(readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8"))![1];
  const full = (title: unknown) => template.replace("%s", String(title));

  it("fit in a search result with the site name on", async () => {
    expect(full(hubMetadata.title).length).toBeLessThanOrEqual(60);
    for (const topic of TOPICS) {
      const { title } = await generateMetadata(params(topic));
      expect(full(title).length, full(title)).toBeLessThanOrEqual(60);
    }
  });
});

describe("what search and answer engines read", () => {
  const pages = [QUESTION_BANK_PATH, ...TOPICS.map(topicPath)];

  it("lists the hub and every topic page in the sitemap", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const p of pages) expect(urls, p).toContain(absoluteUrl(p));
  });

  it("lists the hub and every topic page in llms.txt", async () => {
    const body = await (await llms()).text();
    for (const p of pages) expect(body, p).toContain(`(${absoluteUrl(p)})`);
  });

  it("carries every question, verbatim, in llms-full.txt", async () => {
    const body = await (await llmsFull()).text();
    for (const topic of TOPICS) {
      expect(body).toContain(absoluteUrl(topicPath(topic)));
      for (const text of library.get(topic) ?? []) expect(body, text).toContain(text);
    }
  });
});
