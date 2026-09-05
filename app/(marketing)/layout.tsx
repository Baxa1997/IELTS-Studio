import Link from "next/link";
import { Hanken_Grotesk, Manrope, Newsreader, Sora } from "next/font/google";

import { DESIGN_CSS } from "@/app/_landing/design-chrome";
import { SiteFooter } from "@/app/_landing/site-footer";
import { BrandLogo } from "@/components/brand/logo";

// SEO / marketing pages (ielts-practice and the four skill pages) wear
// the same Option A brand as the legal pages, scoped via CSS variables so the
// rest of the app keeps Geist.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });
// The shared footer is set in the canvas's type. These pages still wear the old
// Option A brand above it, but a footer falling back to system-ui under every
// one of them would look broken rather than transitional.
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const LINE = "#E7E3D5";
const INDIGO = "#3B43B5";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hanken.variable} ${newsreader.variable} ${sora.variable} ${manrope.variable}`}
      style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)", fontFamily: SANS, color: "#1A2138" }}
    >
      <header style={{ height: 60, background: "#fff", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} aria-label="EngProgress home">
          <BrandLogo tone="dark" fontSize={19} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/ielts-practice" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>IELTS practice</Link>
          <Link href="/for-education-centers" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>For centres</Link>
          <Link href="/#pricing" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>Pricing</Link>
          <Link
            href="/sign-in"
            style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: INDIGO, borderRadius: 10, padding: "8px 14px", textDecoration: "none" }}
          >
            Start free
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "44px 20px 64px" }}>{children}</main>

      <style>{DESIGN_CSS}</style>
      <SiteFooter />
    </div>
  );
}
