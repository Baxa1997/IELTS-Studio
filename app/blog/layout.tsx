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
