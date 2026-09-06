import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/fonts";
import { INK, SANS, WHITE } from "@/app/_landing/design";

/** Shared burgundy marketing shell for SEO landing pages. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${landingSora.variable} ${landingManrope.variable}`}
      style={{ minHeight: "100dvh", background: WHITE, fontFamily: SANS, color: INK }}
    >
      <SiteHeader />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(48px,7vw,88px) 28px 96px" }}>
        {children}
      </main>
      <style>{DESIGN_CSS}</style>
      <CentersBand />
      <SiteFooter />
    </div>
  );
}
