import { DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/fonts";
import { INK, PAPER, PAPER_RULE, SANS } from "@/app/_landing/design";

/**
 * Privacy and Terms.
 *
 * Redesigned to the reference the owner supplied (VirtuOps) — PATTERN ONLY: a
 * cool paper ground rather than white, a hairline ruled down each side of the
 * page, a large tight display title over a muted "last updated" line, bold
 * numbered section headings, and a narrow measure of generously-led body text.
 *
 * It also finally puts these two pages on the same brand as everything else.
 * They were the last screens still wearing the OLD look — a cream gradient and
 * a Newsreader serif from a palette the rest of the site left behind — so a
 * reader who clicked "Privacy" in the burgundy footer landed somewhere that
 * looked like a different company.
 */

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${landingSora.variable} ${landingManrope.variable}`}
      style={{ minHeight: "100dvh", background: PAPER, fontFamily: SANS, color: INK }}
    >
      <style>{DESIGN_CSS}</style>
      <SiteHeader />

      {/* the two vertical rules framing the page */}
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          borderLeft: `1px solid ${PAPER_RULE}`,
          borderRight: `1px solid ${PAPER_RULE}`,
        }}
      >
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(48px,7vw,88px) 28px 110px" }}>
          {children}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
