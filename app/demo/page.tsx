import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";

import {
  BTN_GHOST,
  BTN_PRIMARY,
  INDIGO,
  INK,
  SANS,
  SERIF,
  SHELL,
  SiteFooter,
  SiteNav,
} from "@/app/_landing/chrome";
import { DEMO_TABS } from "@/app/_landing/demo-content";
import { ReportShowcase } from "@/app/_landing/demo-screens";
import { DemoTabs } from "@/app/_landing/demo-tabs";
import { PREVIEW_IMAGE } from "@/lib/seo";

// Same scoped marketing fonts as the landing page (the duplication is the
// existing convention — each public page owns its font wrapper).
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});
// The listening demo screen recreates the in-app runner, which uses DM Sans.
const dmsans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dmsans",
  display: "swap",
});

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
      className={`${hanken.variable} ${newsreader.variable} ${jetbrains.variable} ${dmsans.variable} lp-root`}
      style={{ background: "#fff", fontFamily: SANS, color: INK, minHeight: "100%" }}
    >
      <SiteNav home={null} />

      {/* intro */}
      <header style={{ ...SHELL, paddingTop: "clamp(40px,6vw,64px)", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: SERIF,
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
          <Link href="/sign-up" style={BTN_PRIMARY}>
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
            fontFamily: SERIF,
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
        <ReportShowcase />
      </section>

      {/* cta */}
      <section style={{ ...SHELL, paddingTop: "clamp(56px,8vw,80px)", paddingBottom: "clamp(56px,8vw,80px)" }}>
        <div
          style={{
            background: INDIGO,
            color: "#fff",
            borderRadius: 20,
            padding: "clamp(32px,5vw,48px)",
            textAlign: "center",
            boxShadow: "0 40px 80px -50px rgba(59,67,181,.8)",
          }}
        >
          <h2
            style={{
              fontFamily: SERIF,
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
              href="/sign-up"
              style={{ ...BTN_GHOST, background: "#fff", border: "none", color: INDIGO }}
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

      <SiteFooter />
    </div>
  );
}
