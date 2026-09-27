import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "./design-chrome";
import { BLOG_CSS } from "../_lib/blog-css";
import { INK, PANEL, SANS } from "../_lib/design";
import { landingManrope, landingSora } from "../_lib/fonts";

/**
 * The public site's frame at full width — header island, the page, the
 * centres band and the footer — for the pages that need more than
 * `(marketing)`'s 860px column: the blog and the free daily practice.
 *
 * ⚠️ `lang="en"` ON MAIN IS DELIBERATE. `<html lang>` is the default locale
 * (Uzbek) on every static page, but everything these pages put in main is
 * English — the articles and practices by design, and the chrome because they
 * render it from the English dictionary. Without it a screen reader reads the
 * whole page with Uzbek pronunciation. The header and footer sit outside and
 * keep following the visitor's language, as on every other marketing page.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
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
