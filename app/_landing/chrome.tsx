import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";

// Shared landing chrome: the brand tokens, the floating island nav, and the
// dark site footer — used by the marketing front door (app/page.tsx) and the
// public demo page (app/demo/page.tsx). The font CSS variables these token
// strings reference are provided by each page's own next/font `.lp-root`
// wrapper, so every consumer must render inside one.

export const SANS = "var(--font-hanken), system-ui, sans-serif";
export const SERIF = "var(--font-newsreader), Georgia, serif";
export const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace";
export const INDIGO = "#3B43B5";
export const INK = "#1A1C33";
export const MUTED = "#565a72";

export const SHELL: React.CSSProperties = {
  maxWidth: 1480,
  margin: "0 auto",
  padding: "0 clamp(20px,5vw,64px)",
};

export const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  background: INDIGO,
  color: "#fff",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 16,
  padding: "15px 24px",
  borderRadius: 11,
  textDecoration: "none",
  boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)",
};

export const BTN_GHOST: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "#fff",
  border: "1px solid #DAD8C9",
  color: INK,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 16,
  padding: "15px 24px",
  borderRadius: 11,
  textDecoration: "none",
};

export function Logo({ light = false }: { light?: boolean }) {
  return <BrandLogo tone={light ? "light" : "dark"} size={32} fontSize={24} />;
}

// ---- nav -------------------------------------------------------------------

// Anchor links are absolute (`/#demo`) so the same nav works from /demo.
const NAV_LINKS = [
  { label: "Demo", href: "/#demo" },
  { label: "Results", href: "/#results" },
  { label: "Skills", href: "/#skills" },
  { label: "Pricing", href: "/#pricing" },
];

export function SiteNav({ home }: { home: string | null }) {
  return (
    // Sticky outer rail — transparent, just provides the top/side gap so the
    // island floats off the page edges.
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: "16px clamp(14px,4vw,40px) 0",
        pointerEvents: "none",
        background: "#fff",
      }}
    >
      <nav
        className="lp-nav-island"
        style={{
          pointerEvents: "auto",
          maxWidth: 1440,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "11px 14px 11px 22px",
          borderRadius: 18,
          background: "#fff",
          border: "1px solid #E5E2D2",
          // Solid, lifted "island" — a crisp top highlight, a tight contact
          // shadow, and a broad ambient one so it reads as a real floating object.
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(26,28,51,.06), 0 14px 34px -14px rgba(26,28,51,.28), 0 4px 12px -6px rgba(26,28,51,.12)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <div
          className="lp-nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 15,
            color: "#4b4e63",
          }}
        >
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} style={{ color: "inherit", textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {home ? (
            <Link href={home} style={{ ...BTN_PRIMARY, padding: "10px 20px", fontSize: 15 }}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="lp-nav-cta-secondary"
                style={{
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 15,
                  color: INK,
                  textDecoration: "none",
                  padding: "0 6px",
                }}
              >
                Sign in
              </Link>
              <Link href="/sign-in" style={{ ...BTN_PRIMARY, padding: "10px 20px", fontSize: 15 }}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

// ---- footer ----------------------------------------------------------------

const FOOTER_COLS: { head: string; links: { label: string; href: string }[] }[] = [
  {
    head: "Product",
    links: [
      { label: "Live demo", href: "/demo" },
      { label: "Real reports", href: "/#results" },
      { label: "The skills", href: "/#skills" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    head: "Practice",
    links: [
      { label: "Writing studio", href: "/write" },
      { label: "Reading practice", href: "/read" },
      { label: "Listening practice", href: "/listen" },
      { label: "Level diagnostic", href: "/diagnostic" },
      { label: "Your activity", href: "/activities" },
    ],
  },
  {
    head: "Learn & compare",
    links: [
      { label: "IELTS practice online", href: "/ielts-practice" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#aeb2f0",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ background: "#15162E", color: "#c7c9e6" }}>
      <div style={{ ...SHELL, paddingTop: "clamp(48px,7vw,72px)", paddingBottom: 28 }}>
        <div
          className="lp-cols-4"
          style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 36 }}
        >
          {/* brand */}
          <div>
            <Logo light />
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#9698c0",
                margin: "16px 0 0",
                maxWidth: 280,
              }}
            >
              A calibrated, conservative AI coach for IELTS Writing, Reading &amp; Listening. Know
              your real band — then close the gap.
            </p>
            <a
              href="mailto:bahridnurullav@gmail.com"
              className="lp-foot-link"
              style={{
                display: "inline-block",
                fontFamily: SANS,
                fontWeight: 500,
                fontSize: 14,
                color: "#aeb2f0",
                textDecoration: "none",
                marginTop: 16,
              }}
            >
              bahridnurullav@gmail.com
            </a>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <SocialIcon label="Instagram">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </SocialIcon>
              <SocialIcon label="YouTube">
                <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.7 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.3 12 31 31 0 0 0 22 8.2Z" />
                <path d="m10 15 5-3-5-3z" />
              </SocialIcon>
              <SocialIcon label="Telegram">
                <path d="M21.5 4.5 2.5 11.8l5.4 1.7 1.6 5.3 2.8-3.2 4.7 3.4z" />
                <path d="m7.9 13.5 8.6-6.3" />
              </SocialIcon>
              <SocialIcon label="LinkedIn">
                <path d="M16 8a6 6 0 0 1 6 6v6h-4v-6a2 2 0 0 0-4 0v6h-4v-10h4v1.5" />
                <rect x="2" y="9" width="4" height="11" />
                <circle cx="4" cy="4" r="2" />
              </SocialIcon>
            </div>
          </div>
          {/* link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.head}>
              <div
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#8b919d",
                }}
              >
                {col.head}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="lp-foot-link"
                    style={{
                      fontFamily: SANS,
                      fontWeight: 500,
                      fontSize: 14.5,
                      color: "#b7b9da",
                      textDecoration: "none",
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "40px 0 24px" }} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, color: "#8b919d" }}>
              © 2026 EngProgress. All rights reserved.
            </span>
            <Link href="/privacy" className="lp-foot-link" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#9698c0", textDecoration: "none" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" className="lp-foot-link" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#9698c0", textDecoration: "none" }}>
              Terms of Service
            </Link>
            <Link href="/contact" className="lp-foot-link" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#9698c0", textDecoration: "none" }}>
              Contact
            </Link>
          </div>
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "#8b919d",
              maxWidth: 620,
              margin: 0,
              textAlign: "right",
            }}
          >
            Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge
            Assessment English. All practice content is original and AI-generated.
          </p>
        </div>
      </div>
    </footer>
  );
}
