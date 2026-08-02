import Link from "next/link";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { BrandLogo } from "@/components/brand/logo";

// SEO / marketing pages (ielts-practice, cambridge-ielts-practice, /vs/*) wear
// the same Option A brand as the legal pages, scoped via CSS variables so the
// rest of the app keeps Geist.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-newsreader", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const LINE = "#E7E3D5";
const INDIGO = "#3B43B5";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hanken.variable} ${newsreader.variable}`}
      style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)", fontFamily: SANS, color: "#1A2138" }}
    >
      <header style={{ height: 60, background: "#fff", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} aria-label="EngProgress home">
          <BrandLogo tone="dark" fontSize={19} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/ielts-practice" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>IELTS practice</Link>
          <Link href="/pricing" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>Pricing</Link>
          <Link
            href="/sign-up"
            style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: INDIGO, borderRadius: 10, padding: "8px 14px", textDecoration: "none" }}
          >
            Start free
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "44px 20px 64px" }}>{children}</main>

      <footer style={{ borderTop: `1px solid ${LINE}`, background: "#fff" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 14, alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: "#9A9EAE" }}>© 2026 EngProgress. All rights reserved.</span>
            <Link href="/privacy" style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7190", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7190", textDecoration: "none" }}>Terms</Link>
            <Link href="/contact" style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7190", textDecoration: "none" }}>Contact</Link>
          </span>
          <span style={{ fontSize: 12, lineHeight: 1.5, color: "#A7ABBA", maxWidth: 460 }}>
            Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English.
            All practice content is original and AI-generated.
          </span>
        </div>
      </footer>
    </div>
  );
}
