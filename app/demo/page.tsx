import type { Metadata } from "next";
import Link from "next/link";

import { DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/fonts";
import { DEMO_TABS } from "@/app/_landing/demo-content";
import { DeferredReportShowcase } from "@/app/_landing/deferred-report-showcase";
import { DemoTabs } from "@/app/_landing/demo-tabs";
import {
  BRAND,
  DISPLAY,
  ghostButton,
  INK,
  SANS,
  SHELL,
  solidButton,
} from "@/app/_landing/design";
import { PREVIEW_IMAGE } from "@/lib/seo";

const BTN_PRIMARY: React.CSSProperties = { ...solidButton(), textDecoration: "none", display: "inline-flex" };
const BTN_GHOST: React.CSSProperties = { ...ghostButton(), textDecoration: "none", display: "inline-flex" };

const TITLE = "EngProgress Demo — See the IELTS Practice Platform in Action";
const DESCRIPTION =
  "See EngProgress in action: examiner-style writing feedback, fresh Cambridge-style reading and listening tests, the study coach, and honest band tracking — the real product screens.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/demo" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/demo",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: PREVIEW_IMAGE, width: 1200, height: 630, alt: "EngProgress product demo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [PREVIEW_IMAGE],
  },
};

export default function DemoPage() {
  return (
    <div
      className={`${landingSora.variable} ${landingManrope.variable} lp-root`}
      style={{ background: "#fff", fontFamily: SANS, color: INK, minHeight: "100%" }}
    >
      <SiteHeader />

      {/* intro */}
      <header style={{ ...SHELL, paddingTop: "clamp(40px,6vw,64px)", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: "clamp(34px,5vw,52px)",
            lineHeight: 1.08,
            letterSpacing: "-.015em",
            margin: "0 auto",
            maxWidth: 760,
            textWrap: "balance",
          }}
        >
          See EngProgress in action
        </h1>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 18,
            lineHeight: 1.6,
            color: "#6b6e84",
            margin: "16px auto 0",
            maxWidth: 620,
          }}
        >
          {"These are the real product screens — the feedback, the tests, the coach — rendered live, not pictures of them. Click through, then try it yourself free."}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 14,
            marginTop: 26,
          }}
        >
          <Link href="/sign-in" style={BTN_PRIMARY}>
            Start free
          </Link>
          <Link href="/grade" style={BTN_GHOST}>
            Grade an essay free
          </Link>
        </div>
      </header>

      {/* tabbed screens */}
      <section style={{ ...SHELL, paddingTop: "clamp(40px,6vw,56px)" }}>
        <DemoTabs tabs={DEMO_TABS} hashSync />
      </section>

      {/* real grader reports */}
      <section style={{ ...SHELL, paddingTop: "clamp(56px,8vw,88px)", paddingBottom: 8 }}>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: "clamp(28px,4vw,38px)",
            lineHeight: 1.12,
            letterSpacing: "-.015em",
            margin: 0,
            textAlign: "center",
          }}
        >
          Real reports from the grader
        </h2>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.6,
            color: "#6b6e84",
            margin: "12px auto 0",
            maxWidth: 640,
            textAlign: "center",
          }}
        >
          The real report layout the examiner engine produces — conservative by design. Between two
          bands it rounds down and names exactly what the higher band needs.
        </p>
        <DeferredReportShowcase />
      </section>

      {/* cta */}
      <section style={{ ...SHELL, paddingTop: "clamp(56px,8vw,80px)", paddingBottom: "clamp(56px,8vw,80px)" }}>
        <div
          style={{
            background: BRAND,
            color: "#fff",
            borderRadius: 20,
            padding: "clamp(32px,5vw,48px)",
            textAlign: "center",
            boxShadow: "0 40px 80px -50px rgba(59,67,181,.8)",
          }}
        >
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: "clamp(26px,3.5vw,36px)",
              lineHeight: 1.1,
              letterSpacing: "-.015em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            Now try it on your own writing
          </h2>
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 17,
              lineHeight: 1.6,
              color: "rgba(255,255,255,.82)",
              margin: "12px auto 0",
              maxWidth: 520,
            }}
          >
            Free plan, no card — 5 AI-graded practices every month.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 14,
              marginTop: 26,
            }}
          >
            <Link
              href="/sign-in"
              style={{ ...BTN_GHOST, background: "#fff", border: "none", color: BRAND }}
            >
              Create a free account
            </Link>
            <Link
              href="/grade"
              style={{
                ...BTN_GHOST,
                background: "transparent",
                border: "1px solid rgba(255,255,255,.4)",
                color: "#fff",
              }}
            >
              Grade an essay first
            </Link>
          </div>
        </div>
      </section>

      <style>{DESIGN_CSS}</style>
      <SiteFooter />
    </div>
  );
}
