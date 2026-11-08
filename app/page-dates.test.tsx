/**
 * ONE DATE PER PAGE, SAID THREE TIMES: the "Updated …" line a reader sees, the
 * `dateModified` an answer engine reads, and the `lastmod` the sitemap gives
 * the crawler. They are the freshness signal ChatGPT, Gemini and Google weigh,
 * and a page that states three different days for one change reads as a page
 * whose dates mean nothing — the same lesson the sitemap learned in c3456f3.
 *
 * All three come from `updated` on PUBLIC_ROUTES (lib/seo.ts). This RENDERS
 * each dated page — the real page module, as Next would — and reads the three
 * back out of the output, so a page that typed its own date, a primitive that
 * formatted another day, or a structured-data node that forgot the field all
 * turn this red. And every page of the marketing group must carry a date, so
 * a new one cannot ship without.
 */

import { join } from "node:path";

import { prerender } from "react-dom/static";
import { describe, expect, it, vi } from "vitest";

import { formatPostDate } from "@/lib/blog";
import { HTML_LANG, SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl, pageUpdated, PUBLIC_ROUTES, type DatedPath } from "@/lib/seo";
import { sourceFiles } from "@/test/source-files";

import sitemap from "./sitemap";

vi.mock("@/lib/blog/store", async () => {
  const { seededPosts } = await import("@/test/blog-seed");
  const posts = seededPosts();
  return { loadPosts: async () => posts, loadPost: async (slug: string) => posts.find((p) => p.slug === slug) };
});
// The practice list reads the visitor's cookie and the database; the page's
// date has nothing to do with which practices are on it.
vi.mock("@/lib/free-practice/assignment", () => ({ practiceList: async () => ({ items: [], done: false }) }));
// /grade's checker is a client island under a provider that needs Next's app
// router, which a bare render has not mounted. The page's date sits outside it.
vi.mock("@/shared/components/i18n/locale-provider", async (original) => ({
  ...(await original<object>()),
  LocaleProvider: () => null,
}));

/**
 * Pages of the marketing group that do not state a date YET.
 *
 * /cefr-multilevel-practice is being rebuilt as a localised page (en + /uz +
 * /ru) on another branch; it gets its date with that rebuild. When it lands:
 * give its PUBLIC_ROUTES entry an `updated`, pass `path` (and `locale`) to its
 * PageTitle, and delete it from this list — the test below insists on the
 * last step, and the render test then covers the page like every other.
 */
const NOT_YET_DATED = new Set<string>();

const DATED = PUBLIC_ROUTES.flatMap((r) => ("updated" in r ? [r.path] : [])) satisfies DatedPath[];

/** The page module behind a public path, called the way Next calls it. */
async function renderPage(path: DatedPath): Promise<string> {
  const practice = path.match(/^\/practice\/([a-z]+)$/);
  const topic = path.match(/^\/ielts-writing-task-2-questions\/([a-z-]+)$/);
  let element: React.ReactNode;
  if (practice) {
    const { default: Page } = await import("./practice/[skill]/page");
    element = await Page({ params: Promise.resolve({ skill: practice[1] }) });
  } else if (topic) {
    const { default: Page } = await import("./(marketing)/ielts-writing-task-2-questions/[topic]/page");
    element = await Page({ params: Promise.resolve({ topic: topic[1] }) });
  } else {
    const file = pageFiles().find((f) => routeOf(f) === path);
    if (!file) throw new Error(`no page.tsx serves ${path}`);
    const { default: Page } = await import(/* @vite-ignore */ join(process.cwd(), file));
    element = await Page({});
  }
  const { prelude } = await prerender(element);
  return new Response(prelude).text();
}

/** Every page.tsx in app/, outside the localised [locale] copies. */
function pageFiles(): string[] {
  return sourceFiles("app").filter((f) => f.endsWith("/page.tsx") && !f.includes("[locale]"));
}

/** `app/(marketing)/contact/page.tsx` → `/contact`: route groups are not URL segments. */
function routeOf(file: string): string {
  const segments = file.split("/").slice(1, -1).filter((s) => !/^\(.*\)$/.test(s));
  return `/${segments.join("/")}`;
}

/** Every node in every JSON-LD block of `html`, @graph and arrays flattened. */
function jsonLdNodes(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      out.push(v as Record<string, unknown>);
      Object.values(v).forEach(walk);
    }
  };
  // Matched from the attribute on: a pattern opening with the tag itself reads
  // as an executable script to shared/components/i18n/lang-script.test.ts.
  for (const m of html.matchAll(/ type="application\/ld\+json">([\s\S]*?)<\/script>/g)) walk(JSON.parse(m[1]));
  return out;
}

const entries = await sitemap();
const lastmod = (path: string) => entries.find((e) => e.url === absoluteUrl(path))?.lastModified;
const LANG = HTML_LANG[SOURCE_LOCALE];

describe("a public page's one date", () => {
  it("is recorded for the pages that matter", () => {
    // Without this, a PUBLIC_ROUTES that lost every date would pass the loop below.
    expect(DATED).toEqual(expect.arrayContaining(["/grade", "/ielts-practice", "/practice/writing", "/practice/cefr"]));
    for (const path of DATED) expect(new Date(`${pageUpdated(path)}T00:00:00Z`).toISOString()).toContain(pageUpdated(path));
  });

  it.each(DATED)("%s shows, sends and sitemaps the same day", async (path) => {
    const day = pageUpdated(path);
    const html = await renderPage(path);

    const shown = [...html.matchAll(/<time dateTime="([^"]+)">Updated ([^<]+)<\/time>/gi)];
    expect(shown, "one 'Updated …' line").toHaveLength(1);
    expect(shown[0][1], "the line's datetime").toBe(day);
    expect(shown[0][2], "the line's words").toBe(formatPostDate(day, LANG));

    const modified = jsonLdNodes(html).flatMap((n) => (typeof n.dateModified === "string" ? [n.dateModified] : []));
    expect(modified.length, "a dateModified in the page's JSON-LD").toBeGreaterThan(0);
    expect(new Set(modified), "every dateModified on the page").toEqual(new Set([day]));

    expect(lastmod(path), "the sitemap's lastmod").toEqual(new Date(`${day}T00:00:00Z`));
  });

  it("is stated by every page of the marketing group", () => {
    const pages = pageFiles().filter((f) => f.startsWith("app/(marketing)/")).map(routeOf);
    expect(pages.length).toBeGreaterThan(5);
    // A dynamic route (`/…/[topic]`) is dated when every path it serves is: it
    // has no URL of its own, only the ones its generateStaticParams makes.
    const serves = (route: string) => new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
    const dated = (p: string) =>
      /\[/.test(p) ? (DATED as string[]).some((d) => serves(p).test(d)) : (DATED as string[]).includes(p);
    const undated = pages.filter((p) => !dated(p) && !NOT_YET_DATED.has(p));
    expect(undated, "add `updated` in PUBLIC_ROUTES and pass `path` to PageTitle").toEqual([]);
    for (const p of NOT_YET_DATED) expect(DATED as string[], `${p} is dated now — delete it from NOT_YET_DATED`).not.toContain(p);
  });

  it("cannot be asked of a page that records none", () => {
    // A compile-time guard, run by `tsc --noEmit`: if DatedPath ever widened to
    // `string`, any path would type-check and a page could ask for a date that
    // does not exist — then render a throw instead of a compile error.
    const ask = () => {
      // @ts-expect-error — /demo records no date
      pageUpdated("/demo");
    };
    expect(ask).toThrow(/No date recorded/);
  });
});
