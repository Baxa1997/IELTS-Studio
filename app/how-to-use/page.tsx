import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Sora } from "next/font/google";

import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import {
  BODY,
  BRAND,
  BRAND_TINT,
  cardStyle,
  DISPLAY,
  eyebrow,
  FAINT,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  STRONG,
  WHITE,
} from "@/app/_landing/design";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

/**
 * "How to use EngProgress" — the documentation front page from the design canvas.
 *
 * Top-level rather than inside `(marketing)` on purpose: that group's layout
 * applies `chrome.tsx`, which is still the old indigo header, and this page wears
 * the new one. `app/grade` sits outside the group for the same reason.
 *
 * ⚠️ The links here point at real destinations where one exists and at `#`
 * anchors where the article has not been written yet. The canvas draws them all
 * as links; a link that goes nowhere is worse than one that is visibly pending,
 * so the unwritten ones are marked rather than silently dead. See PENDING below.
 */

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const DESCRIPTION =
  "How to use EngProgress: place your level, run AI-graded IELTS and CEFR practice, read your band report, and set up groups and students for an education centre.";

export const metadata: Metadata = {
  title: "How to use EngProgress — IELTS & CEFR practice guide",
  description: DESCRIPTION,
  alternates: { canonical: "/how-to-use" },
  openGraph: {
    type: "article",
    url: "/how-to-use",
    title: "How to use EngProgress",
    description: DESCRIPTION,
  },
};

/** A destination that does not exist yet. Rendered as text, not as a dead link. */
const PENDING = null;

const SIDEBAR: { group: string; items: { label: string; href: string | null; soon?: boolean }[] }[] =
  [
    {
      group: "Getting started",
      items: [
        { label: "Overview", href: "/how-to-use" },
        { label: "Create your account", href: "/sign-up" },
        { label: "Placement test", href: "/start" },
        { label: "Reading your report", href: PENDING },
      ],
    },
    {
      group: "Practice",
      items: [
        { label: "Writing tasks", href: "/ielts-writing-practice" },
        { label: "Reading & Listening", href: "/ielts-reading-practice" },
        { label: "Speaking sessions", href: "/ielts-speaking-practice" },
        { label: "Full mock exam", href: PENDING },
      ],
    },
    {
      group: "For centers",
      items: [
        { label: "Invite students", href: "/for-education-centers" },
        { label: "Groups & teachers", href: "/for-education-centers" },
        { label: "Analytics", href: PENDING, soon: true },
      ],
    },
  ];

const SECTIONS = [
  {
    icon: "◷",
    title: "Getting started",
    links: [
      { label: "Create your account", href: "/sign-up" },
      { label: "Take the placement test", href: "/start" },
      { label: "Read your band report", href: PENDING },
      { label: "Set a target band", href: PENDING },
    ],
  },
  {
    icon: "✎",
    title: "AI practice",
    links: [
      { label: "Writing Task 1 & 2", href: "/ielts-writing-practice" },
      { label: "Reading & Listening sets", href: "/ielts-reading-practice" },
      { label: "Speaking with the examiner", href: "/ielts-speaking-practice" },
      { label: "Timed mock exam", href: PENDING },
    ],
  },
  {
    icon: "▤",
    title: "CEFR & bands",
    links: [
      { label: "How scoring works", href: PENDING },
      { label: "Band ↔ CEFR mapping", href: "/cefr-multilevel-practice" },
      { label: "Progress over time", href: PENDING },
    ],
  },
  {
    icon: "⌂",
    title: "Education centers",
    links: [
      { label: "Register your center", href: "/sign-up" },
      { label: "Invite students & teachers", href: "/for-education-centers" },
      { label: "Groups and assignments", href: "/for-education-centers" },
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Place your level",
    body: "A 12-minute adaptive test returns your CEFR level and an indicative IELTS band.",
  },
  {
    n: "02",
    title: "Practise on demand",
    body: "Fresh tasks are generated at your level and marked against the official criteria.",
  },
  {
    n: "03",
    title: "Close the gap",
    body: "Each report names what is missing for the next half band, with the work to fix it.",
  },
];

export default function HowToUse() {
  const site = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to use EngProgress",
    description: DESCRIPTION,
    url: `${site}/how-to-use`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: site },
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <div
      className={`${sora.variable} ${manrope.variable}`}
      style={{ background: WHITE, fontFamily: SANS, color: INK, minHeight: "100%" }}
    >
      <style>{DESIGN_CSS}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />

      <main
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          flexWrap: "wrap",
          gap: 56,
        }}
      >
        <aside style={{ flex: "0 1 250px", minWidth: 220, padding: "52px 0 80px" }}>
          {SIDEBAR.map((g, gi) => (
            <div key={g.group} style={{ marginTop: gi === 0 ? 0 : 34 }}>
              <div style={eyebrow()}>{g.group}</div>
              <div
                style={{
                  borderLeft: `1px solid ${LINE}`,
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {g.items.map((it) => {
                  const current = it.label === "Overview";
                  const base: React.CSSProperties = {
                    padding: "9px 18px",
                    fontSize: 15,
                    textDecoration: "none",
                  };
                  if (current) {
                    return (
                      <span
                        key={it.label}
                        aria-current="page"
                        style={{
                          ...base,
                          fontWeight: 700,
                          color: BRAND,
                          borderLeft: `2px solid ${BRAND}`,
                          marginLeft: -1,
                        }}
                      >
                        {it.label}
                      </span>
                    );
                  }
                  if (!it.href) {
                    return (
                      <span
                        key={it.label}
                        style={{
                          ...base,
                          color: FAINT,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {it.label}
                        <span
                          style={{
                            background: "#f4f5f7",
                            color: MUTED,
                            borderRadius: RADIUS.pill,
                            padding: "3px 9px",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {it.soon ? "SOON" : "WRITING"}
                        </span>
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={it.label}
                      href={it.href}
                      className="lp-doclink"
                      style={{ ...base, color: BODY }}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <div style={{ flex: "1 1 460px", minWidth: 0, padding: "52px 0 96px" }}>
          <div style={eyebrow(true)}>Documentation</div>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: "clamp(34px,5vw,52px)",
              letterSpacing: "-0.035em",
              margin: "16px 0 0",
            }}
          >
            How to use EngProgress
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.6,
              color: BODY,
              maxWidth: 660,
              margin: "20px 0 0",
              textWrap: "pretty",
            }}
          >
            Everything needed to place a learner, run AI-graded practice and track CEFR progress —
            from the first essay to a full mock exam and center-wide reporting.
          </p>

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Sections</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 22,
              marginTop: 20,
            }}
          >
            {SECTIONS.map((s) => (
              <div key={s.title} className="lp-card" style={cardStyle()}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: RADIUS.icon,
                      background: BRAND_TINT,
                      color: BRAND,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {s.icon}
                  </span>
                  <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, margin: 0 }}>
                    {s.title}
                  </h2>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    marginTop: 20,
                    fontSize: 16,
                    color: STRONG,
                  }}
                >
                  {s.links.map((l) =>
                    l.href ? (
                      <Link
                        key={l.label}
                        href={l.href}
                        className="lp-doclink"
                        style={{ color: STRONG, display: "flex", gap: 10, textDecoration: "none" }}
                      >
                        <span aria-hidden style={{ color: BRAND }}>
                          →
                        </span>
                        {l.label}
                      </Link>
                    ) : (
                      <span
                        key={l.label}
                        style={{ color: FAINT, display: "flex", gap: 10 }}
                        title="This guide is still being written"
                      >
                        <span aria-hidden style={{ color: FAINT }}>
                          →
                        </span>
                        {l.label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Three steps to your first score</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 22,
              marginTop: 20,
            }}
          >
            {STEPS.map((s) => (
              <div key={s.n} style={cardStyle(26)}>
                <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: BRAND }}>
                  {s.n}
                </div>
                <h3
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 600,
                    fontSize: 19,
                    margin: "10px 0 8px",
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <CentersBand />
      <SiteFooter />
    </div>
  );
}
