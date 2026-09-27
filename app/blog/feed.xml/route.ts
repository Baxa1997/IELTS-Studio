import { CATEGORY_LABEL, POSTS } from "@/lib/blog";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl } from "@/lib/seo";

import { FEED_PATH } from "../_lib/metadata";

/**
 * GET /blog/feed.xml — RSS 2.0.
 *
 * WHY A FEED IN 2026. Feed readers are the smaller half of it. The larger half
 * is everything that polls feeds to find new pages: aggregators, newsletter
 * tools, Telegram channel bots, and crawlers that treat a feed as a cheaper
 * sitemap. A post that appears in a feed gets found in hours instead of on the
 * next crawl.
 *
 * Dated by the posts, not by the build: a redeploy that changes no article
 * must not tell every reader something is new.
 */
export const dynamic = "force-static";

const t = translator(SOURCE_LOCALE);

/** The five characters XML will not take as text. Not exported: a route file
 *  may export only its handlers and route config, and Next's build type-check
 *  fails on anything else. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 dates, which RSS requires: `Sat, 26 Sep 2026 00:00:00 GMT`. */
const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString();

export function GET(): Response {
  const blog = absoluteUrl("/blog");
  const newest = POSTS.map((p) => p.updated ?? p.published).sort().at(-1);

  const items = POSTS.map((p) => {
    const url = absoluteUrl(`/blog/${p.slug}`);
    return [
      "<item>",
      `<title>${xmlEscape(p.title)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      `<pubDate>${rfc822(p.published)}</pubDate>`,
      `<category>${xmlEscape(t(CATEGORY_LABEL[p.category]))}</category>`,
      `<description>${xmlEscape(p.standfirst)}</description>`,
      "</item>",
    ].join("");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${xmlEscape(t("blog.indexTitle"))}</title>`,
    `<link>${blog}</link>`,
    `<description>${xmlEscape(t("blog.metaDesc"))}</description>`,
    "<language>en</language>",
    newest ? `<lastBuildDate>${rfc822(newest)}</lastBuildDate>` : "",
    `<atom:link href="${absoluteUrl(FEED_PATH)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
