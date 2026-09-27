import type { Metadata } from "next";

import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/_components/design-chrome";
import { BLOG_CSS } from "@/app/_landing/_lib/blog-css";
import { INK, PANEL, SANS } from "@/app/_landing/_lib/design";
import { landingManrope, landingSora } from "@/app/_landing/_lib/fonts";

/**
 * The blog's frame: the marketing header and footer around a full-width main.
 *
 * NOT UNDER `(marketing)`, whose layout pins `<main>` to 860px — right for a
 * page of prose, too narrow for a front page with a lead story and a grid. The
 * article page narrows itself to its own reading measure instead.
 *
 * ⚠️ `lang="en"` ON MAIN IS DELIBERATE. `<html lang>` is the default locale
 * (Uzbek) on every static page, but everything inside this main is English —
 * the articles by design, and the chrome because /blog renders it from the
 * English dictionary. Without it a screen reader reads the whole blog with
 * Uzbek pronunciation. The header and footer sit outside and keep following
 * the visitor's language, as they do on every other marketing page.
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
  return (
    <div
      className={`${landingSora.variable} ${landingManrope.variable}`}
      style={{ minHeight: "100dvh", background: PANEL, fontFamily: SANS, color: INK }}
    >
      <style>{DESIGN_CSS}</style>
      <style>{BLOG_CSS}</style>
      <SiteHeader />
      <main lang="en">{children}</main>
      <CentersBand />
      <SiteFooter />
    </div>
  );
}
