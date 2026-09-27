import type { Metadata } from "next";

import { SiteFrame } from "@/app/_landing/_components/site-frame";

/**
 * The blog's frame: the public site's full-width frame (header, main, footer).
 *
 * NOT UNDER `(marketing)`, whose layout pins `<main>` to 860px — right for a
 * page of prose, too narrow for a front page with a lead story and a grid. The
 * article page narrows itself to its own reading measure instead. See
 * `SiteFrame` for why its main says `lang="en"`.
 */

/**
 * Permission for search engines to show a LARGE image and a full snippet.
 *
 * Without `max-image-preview:large`, Google Discover — the feed on Android
 * phones, and a real source of article traffic — shows a post with a thumbnail
 * at most, and it gets far fewer clicks than a full-width card. Articles are
 * the pages Discover picks up, so the whole blog opts in. No page under it sets
 * `robots`, so nothing overrides this.
 */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
