import Link from "next/link";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { BrandLogo } from "@/components/brand/logo";

// Legal pages (privacy / terms) wear the same Option A brand as the public pages,
// scoped via CSS variables so the rest of the app keeps Geist.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

const SANS = "var(--font-hanken), system-ui, sans-serif";
const LINE = "#E7E3D5";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/privacy" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>Terms</Link>
          <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>Home</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "44px 20px 64px" }}>{children}</main>

      <footer style={{ borderTop: `1px solid ${LINE}`, background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12.5, color: "#9A9EAE" }}>© 2026 EngProgress. All rights reserved.</span>
          <span style={{ fontSize: 12, lineHeight: 1.5, color: "#A7ABBA", maxWidth: 460 }}>
            Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English.
          </span>
        </div>
      </footer>
    </div>
  );
}
