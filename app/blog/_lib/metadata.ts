import type { Metadata } from "next";

import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";

export const FEED_PATH = "/blog/feed.xml";

/**
 * A blog page's `alternates`: its canonical URL, plus the RSS feed.
 *
 * ⚠️ ONE HELPER, NOT A LAYOUT FIELD. Next merges metadata shallowly: a page that
 * sets `alternates` (every blog page does, for its canonical) REPLACES the
 * layout's `alternates` whole, so a feed link declared once in the layout would
 * vanish from every page that has a canonical — which is all of them.
 */
export function blogAlternates(path: string): Metadata["alternates"] {
  return {
    canonical: path,
    types: {
      "application/rss+xml": [{ url: FEED_PATH, title: translator(SOURCE_LOCALE)("blog.rss") }],
    },
  };
}
