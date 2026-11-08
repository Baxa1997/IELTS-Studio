import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/_components/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/_lib/fonts";
import {
  INK,
  PANEL,
  SANS,
  WHITE,
} from "@/app/_landing/_lib/design";

import { MARKETING_MAIN } from "./_components/marketing";

/** Shared burgundy marketing shell for SEO landing pages. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${landingSora.variable} ${landingManrope.variable}`}
      style={{ minHeight: "100dvh", background: PANEL, fontFamily: SANS, color: INK }}
    >
      <SiteHeader />
      <main style={MARKETING_MAIN}>{children}</main>
      <style>{DESIGN_CSS}</style>
      <CentersBand />
      <SiteFooter />
    </div>
  );
}
