import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";

import { Band9Card } from "@/app/_landing/band9-card";
import { DEMO_TABS } from "@/app/_landing/demo-content";
import { ReportShowcase } from "@/app/_landing/demo-screens";
import { DemoTabs } from "@/app/_landing/demo-tabs";
import { HeroProcessDemo } from "@/app/_landing/hero-process-demo";
import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import {
  BODY,
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  cardStyle,
  DISPLAY,
  eyebrow,
  ghostButton,
  INK,
  LINE,
  MUTED,
  RADIUS,
  RULE,
  SANS,
  SHELL,
  solidButton,
  STRONG,
  WELL,
  WHITE,
} from "@/app/_landing/design";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { getSession, roleHome } from "@/lib/auth";
import { PLAN_ORDER, planTier, type OrgPlan } from "@/lib/billing/plans";
import {
  getSiteUrl,
  LANDING_DESCRIPTION,
  PLATFORM_FEATURES,
  PREVIEW_IMAGE,
  SEO_KEYWORDS,
  SITE_NAME,
} from "@/lib/seo";

/**
 * The marketing front door, rebuilt to the `EngProgress Platform` design canvas.
 *
 * The canvas is the source of truth for the look; `app/_landing/design.ts` holds
 * its tokens. Two deliberate departures from it, both asked for or forced:
 *
 *  1. THE BAND-9 CARD IS OURS. The canvas draws a simpler version; the owner
 *     asked to keep the one we built — the climbing number, the drawn
 *     mortarboard, the university strip — and change only its colour. See
 *     `band9-card.tsx`.
 *  2. THE STATS STRIP IS OFF. The canvas fills it with 7,480 / 240 / 86,400 /
 *     1.24M. Those are design placeholders: production currently holds 153
 *     organisations and 160 profiles, so shipping them would put four false
 *     claims about the business on a public page. The canvas models the strip as
 *     a toggle (`showStats`), so this honours the design by using it. Turn it on
 *     when there are real figures to put in it.
 *
 * Sections beyond the canvas — Platform, Pricing, FAQ — exist because the
 * canvas's own header links to them, and because dropping them would lose the
 * structured-data and long-form copy the SEO work added. They are written in the
 * canvas's visual language rather than invented.
 */

// Marketing type, scoped to this page via CSS variables so the app keeps Geist.
//
// The weight lists cover the restored demo sections as well as the canvas: those
// components ask SERIF for 500–800 and SANS for 400–800, and a weight that is not
// loaded gets synthesised by the browser, which on Sora looks like a smeared
// bold. JetBrains Mono is here for the same reason — the process demo and the
// report mockups set their telemetry labels in it.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * The four headline figures under the banner.
 *
 * ⚠️ THESE ARE THE DESIGN CANVAS'S NUMBERS, NOT MEASURED ONES. Production
 * currently holds 153 organisations and 160 profiles. They are published at the
 * owner's explicit instruction after that was raised, and they are marketing
 * claims the owner owns — which is exactly why they live in one obvious block
 * here rather than being scattered through the JSX. Edit them here.
 */
const STATS: { label: string; value: string; note: string; delta?: string; brand?: boolean }[] = [
  {
    label: "New learners this month",
    value: "7,480",
    delta: "12.4%",
    note: "vs. 6,655 last month",
  },
  { label: "Education centers", value: "240", note: "Schools and IELTS centers onboard" },
  { label: "Total users", value: "86,400", note: "Learners, teachers and admins" },
  {
    label: "Tasks practised",
    value: "1.24M",
    note: "Graded essays, readings and mocks",
    brand: true,
  },
];

export const metadata: Metadata = {
  title: "IELTS Practice with AI Band Feedback — Writing, Reading, Listening, Speaking & CEFR",
  description: LANDING_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "IELTS Practice with AI Band Feedback — EngProgress",
    description: LANDING_DESCRIPTION,
    images: [
      {
        url: PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        alt: "EngProgress IELTS practice dashboard and AI feedback",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IELTS Practice with AI Band Feedback — EngProgress",
    description: LANDING_DESCRIPTION,
    images: [PREVIEW_IMAGE],
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  // A signed-in visitor goes to their role home; landing back here after an
  // OAuth round-trip reads as "sign-in didn't go anywhere".
  const session = await getSession();
  if (session) redirect(roleHome(session.role));

  // An @graph, not a lone WebApplication node. `featureList` is what an answer
  // engine actually extracts — prose gets summarised to its first clause, which
  // is how this product came to be described as Writing-only. Sourced from
  // PLATFORM_FEATURES and PLAN_ORDER so neither can drift from what renders.
  const site = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organization`,
        name: SITE_NAME,
        url: site,
        description: LANDING_DESCRIPTION,
        slogan: "The band you see in practice is the band you get on exam day.",
        areaServed: "Worldwide",
        knowsAbout: [
          "IELTS Writing",
          "IELTS Reading",
          "IELTS Listening",
          "IELTS Speaking",
          "CEFR",
          "Uzbekistan Multilevel (DTM) exam",
          "English language assessment",
        ],
      },
      {
        "@type": ["WebApplication", "EducationalApplication"],
        "@id": `${site}/#application`,
        name: SITE_NAME,
        url: site,
        publisher: { "@id": `${site}/#organization` },
        applicationCategory: "EducationalApplication",
        applicationSubCategory: "Test preparation",
        operatingSystem: "Web",
        description: LANDING_DESCRIPTION,
        keywords: SEO_KEYWORDS.join(", "),
        featureList: PLATFORM_FEATURES,
        educationalUse: [
          "IELTS practice",
          "IELTS Writing practice",
          "IELTS Reading practice",
          "IELTS Listening practice",
          "IELTS Speaking practice",
          "CEFR practice",
          "Multilevel (DTM) practice",
          "IELTS band improvement",
        ],
        audience: [
          { "@type": "EducationalAudience", educationalRole: "student" },
          { "@type": "EducationalAudience", educationalRole: "teacher" },
          { "@type": "Audience", audienceType: "Language schools and IELTS preparation centres" },
        ],
        offers: PLAN_ORDER.map((id) => {
          const t = planTier(id);
          return {
            "@type": "Offer",
            name: t.name,
            price: t.price === null ? undefined : String(t.price),
            priceCurrency: "USD",
            category: "IELTS practice platform",
            url: `${site}/pricing`,
          };
        }),
      },
    ],
  };

  return (
    <div
      className={`${sora.variable} ${manrope.variable} ${jetbrains.variable}`}
      style={{ background: WHITE, fontFamily: SANS, color: INK, minHeight: "100%" }}
    >
      <style>{DESIGN_CSS}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Reveal sections as they scroll in; no-JS keeps them visible. */}
      <noscript>
        <style>{".reveal,.reveal-stagger>*{opacity:1;transform:none;filter:none}"}</style>
      </noscript>
      <ScrollReveal />
      <SiteHeader />
      <main>
        <Hero />
        <Stats />
        <HeroProcessDemo />
        <DemoSection />
        <ResultsSection />
        <Platform />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <CentersBand />
      <SiteFooter />
    </div>
  );
}

/* ── hero ──────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      style={{
        ...SHELL,
        padding: "76px 28px 40px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
        gap: 64,
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            border: `1px solid ${BRAND_TINT_LINE}`,
            background: BRAND_TINT,
            color: BRAND,
            borderRadius: RADIUS.pill,
            padding: "9px 18px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND }}
          />
          AI · IELTS &amp; CEFR
        </div>

        <h1
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(36px,5.2vw,60px)",
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            margin: "26px 0 0",
            textWrap: "pretty",
          }}
        >
          The professional AI platform for <span style={{ color: BRAND }}>IELTS &amp; CEFR</span>{" "}
          practice
        </h1>

        <p
          style={{
            fontSize: 19,
            lineHeight: 1.6,
            color: BODY,
            maxWidth: 560,
            margin: "24px 0 0",
            textWrap: "pretty",
          }}
        >
          Built for learners and education centers. AI generates exam-standard Writing, Reading,
          Listening and Speaking tasks at your exact level, then scores them against official IELTS
          bands and CEFR descriptors.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34 }}>
          {/* /grade, not /start: /start redirects straight to /sign-in, and the
              free assessment this promises is the no-login grader. */}
          <Link href="/grade" className="lp-solid" style={{ ...solidButton(), display: "inline-block" }}>
            Start free assessment
          </Link>
          <Link
            href="/how-to-use"
            className="lp-ghost"
            style={{ ...ghostButton(), display: "inline-flex", alignItems: "center", gap: 10 }}
          >
            <span
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: BRAND_TINT,
                color: BRAND,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
              }}
            >
              ▶
            </span>
            See how it works
          </Link>
        </div>

        <div style={{ ...eyebrow(), marginTop: 26 }}>
          No card required · CEFR A1–C2 · IELTS bands 4.0–9.0
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          {["Writing", "Reading", "Listening", "Speaking"].map((s) => (
            <span
              key={s}
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: RADIUS.pill,
                padding: "9px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: STRONG,
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <Band9Card />
    </section>
  );
}

/* ── stats ─────────────────────────────────────────────────────────────────── */

/** The canvas's four-cell strip. Values come from STATS at the top of this file. */
function Stats() {
  return (
    <section style={{ ...SHELL, padding: "24px 28px 40px" }}>
      <div
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: RADIUS.card,
          background: WHITE,
          boxShadow: "0 12px 40px rgba(18,19,23,0.04)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        }}
      >
        {STATS.map((c, i) => (
          <div
            key={c.label}
            style={{
              padding: "34px 32px",
              borderRight: i < STATS.length - 1 ? `1px solid ${RULE}` : undefined,
            }}
          >
            <div style={eyebrow()}>{c.label}</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 44,
                  letterSpacing: "-0.03em",
                  color: c.brand ? BRAND : INK,
                }}
              >
                {c.value}
              </div>
              {c.delta ? (
                <span
                  style={{
                    background: "#eaf6f0",
                    color: "#1c7a4f",
                    borderRadius: RADIUS.pill,
                    padding: "5px 11px",
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  ▲ {c.delta}
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>{c.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── platform ──────────────────────────────────────────────────────────────── */

const SKILLS = [
  {
    name: "Writing",
    icon: "✎",
    body: "Task 1 and Task 2, graded per criterion (TR, CC, LR, GRA) with quoted evidence — and a revision loop that re-grades the same essay across drafts.",
    href: "/ielts-writing-practice",
  },
  {
    name: "Reading",
    icon: "▤",
    body: "Original passages and every real question type, auto-graded, each answer explained — including why the trap worked on you.",
    href: "/ielts-reading-practice",
  },
  {
    name: "Listening",
    icon: "◷",
    body: "Full four-part tests with original multi-voice audio, Cambridge-style question groups, transcripts and per-answer explanations.",
    href: "/ielts-listening-practice",
  },
  {
    name: "Speaking",
    icon: "✦",
    body: "A three-part live mock with an AI examiner, Part-2 cue-card practice, and a tutor that reacts and teaches while you talk.",
    href: "/ielts-speaking-practice",
  },
];

function Platform() {
  return (
    <section id="platform" style={{ ...SHELL, padding: "40px 28px 20px" }}>
      <div style={eyebrow(true)}>The platform</div>
      <h2
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "16px 0 0",
          maxWidth: 720,
          textWrap: "pretty",
        }}
      >
        All four skills, plus CEFR — generated fresh, marked against the real criteria
      </h2>
      <p style={{ fontSize: 19, lineHeight: 1.6, color: BODY, maxWidth: 660, margin: "18px 0 0" }}>
        Nothing here is a past paper. Every task is original, produced to the exam spec at your
        level, so there is no way to memorise the content in advance.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 22,
          marginTop: 28,
        }}
      >
        {SKILLS.map((s) => (
          <Link key={s.name} href={s.href} className="lp-card" style={{ ...cardStyle(), color: INK }}>
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
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, margin: 0 }}>
                {s.name}
              </h3>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "18px 0 0" }}>{s.body}</p>
          </Link>
        ))}
      </div>
      <div
        style={{
          ...cardStyle(26),
          marginTop: 22,
          background: WELL,
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, margin: 0 }}>
            CEFR / Multilevel for the Uzbekistan DTM exam
          </h3>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "10px 0 0", maxWidth: 640 }}>
            Reading (5 parts, 35 questions) and Writing (3 tasks), generated on demand and marked
            against the CEFR descriptors.
          </p>
        </div>
        <Link href="/cefr-multilevel-practice" className="lp-ghost" style={{ ...ghostButton(), display: "inline-block" }}>
          See CEFR practice
        </Link>
      </div>
    </section>
  );
}

/* ── pricing ───────────────────────────────────────────────────────────────── */

const PLAN_CTA: Record<OrgPlan, { label: string; href: string }> = {
  trial: { label: "Start free", href: "/sign-up" },
  starter: { label: "Choose Standard", href: "/sign-up" },
  pro: { label: "Choose Pro", href: "/sign-up" },
  enterprise: { label: "Choose Enterprise", href: "/sign-up" },
};

function Pricing() {
  return (
    <section id="pricing" style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <div style={eyebrow(true)}>Pricing</div>
      <h2
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "16px 0 0",
          textWrap: "pretty",
        }}
      >
        Start free. Upgrade when you are practising every day.
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 22,
          marginTop: 28,
        }}
      >
        {PLAN_ORDER.map((id) => {
          const t = planTier(id);
          const popular = id === "pro";
          return (
            <div
              key={id}
              style={{
                ...cardStyle(),
                borderColor: popular ? BRAND : LINE,
                boxShadow: popular ? "0 24px 60px rgba(125,1,50,0.10)" : undefined,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, margin: 0 }}>
                  {t.name}
                </h3>
                {popular ? (
                  <span
                    style={{
                      background: BRAND_TINT,
                      color: BRAND,
                      borderRadius: RADIUS.pill,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    POPULAR
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 40,
                  letterSpacing: "-0.03em",
                  margin: "14px 0 0",
                }}
              >
                {t.price === null ? "—" : t.price === 0 ? "Free" : `$${t.price}`}
                {t.price ? (
                  <span style={{ fontSize: 15, fontWeight: 600, color: MUTED, fontFamily: SANS }}>
                    {t.months && t.months > 1 ? ` / ${t.months} months` : " / month"}
                  </span>
                ) : null}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "20px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                }}
              >
                {t.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 10, fontSize: 15, color: STRONG }}>
                    <span aria-hidden style={{ color: BRAND, fontWeight: 700 }}>
                      →
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={PLAN_CTA[id].href}
                className={popular ? "lp-solid" : "lp-ghost"}
                style={{
                  ...(popular ? solidButton() : ghostButton()),
                  marginTop: 22,
                  textAlign: "center",
                  display: "block",
                  padding: "15px 24px",
                }}
              >
                {PLAN_CTA[id].label}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── faq ───────────────────────────────────────────────────────────────────── */

const FAQ = [
  {
    q: "Is this affiliated with IELTS?",
    a: "No. We're an independent practice tool — not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. We ground our scoring in the public band descriptors.",
  },
  {
    q: "Do you use real past papers?",
    a: "Never. Every passage and question is original and AI-generated to the exam spec, so you're never practising on leaked material — and we stay firmly on the right side of copyright.",
  },
  {
    q: "How accurate is the grading?",
    a: "It's calibrated to within about half a band of human raters and deliberately conservative. When you sit between two bands we round down and tell you exactly what's missing for the higher one.",
  },
  {
    q: "Will it inflate my score to keep me happy?",
    a: "No — that's the whole point. A false 7.0 is the one thing that breaks trust on exam day, so we'd rather show you the work that's left than hand you a number you won't repeat.",
  },
  {
    q: "What about Speaking and Listening?",
    a: "Both are live. Listening gives you full four-section tests with original multi-voice audio, auto-marking, transcripts and trap explanations. Speaking gives you a full three-part mock with an AI examiner.",
  },
];

function Faq() {
  return (
    <section style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <div style={eyebrow(true)}>Questions</div>
      <h2
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "16px 0 28px",
        }}
      >
        The things worth asking first
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 22,
        }}
      >
        {FAQ.map((f) => (
          <div key={f.q} style={cardStyle()}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, margin: 0 }}>{f.q}</h3>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "12px 0 0" }}>{f.a}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "#9aa0ac", lineHeight: 1.55, margin: "28px 0 0" }}>
        Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment
        English.
      </p>
    </section>
  );
}

/* ── restored sections ─────────────────────────────────────────────────────── */
/*
 * These four came back after the canvas rebuild at the owner's request, redressed
 * in the canvas's colours rather than reinstated as they were. The components
 * they lean on — DemoTabs, ReportShowcase, HeroProcessDemo — were recoloured in
 * place: indigo to burgundy, the old brand's cream/parchment neutrals to the
 * canvas's cool greys, Newsreader/Hanken to Sora/Manrope. Their BEHAVIOUR is
 * untouched; they are live renders of the real product screens, which is the
 * whole reason the section claims "not mockups".
 */

/** Section head in the canvas's idiom: eyebrow, display heading, one lede line. */
function Head({ eyebrow: label, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <>
      <div style={eyebrow(true)}>{label}</div>
      <h2
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "16px 0 0",
          maxWidth: 760,
          textWrap: "pretty",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 19,
          lineHeight: 1.6,
          color: BODY,
          maxWidth: 680,
          margin: "18px 0 0",
          textWrap: "pretty",
        }}
      >
        {sub}
      </p>
    </>
  );
}

function DemoSection() {
  return (
    <section id="demo" style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <Head
        eyebrow="See it working"
        title="The real product, not mockups"
        sub="These are the actual EngProgress screens — the feedback, the tests, the coach — rendered live, not pictures of them. Click through them."
      />
      <div style={{ marginTop: 36 }}>
        <DemoTabs tabs={DEMO_TABS} />
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link
          href="/demo"
          className="lp-ghost"
          style={{ ...ghostButton(), display: "inline-block", fontSize: 15, padding: "13px 24px" }}
        >
          Open the full demo →
        </Link>
      </div>
    </section>
  );
}

function ResultsSection() {
  return (
    <section
      id="results"
      style={{ borderTop: `1px solid ${RULE}`, background: WELL, marginTop: 56 }}
    >
      <div style={{ ...SHELL, padding: "64px 28px" }}>
        <Head
          eyebrow="Proof"
          title="Real reports from the grader"
          sub="The report layout the examiner engine actually produces. Conservative by design: between two bands it rounds down and names exactly what the higher band needs, so the band you practise with is one you can trust on exam day."
        />
        <div style={{ marginTop: 36 }}>
          <ReportShowcase />
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section style={{ ...SHELL, padding: "64px 28px 24px" }}>
      <div
        style={{
          background: "#43001d",
          backgroundImage: `linear-gradient(155deg,${BRAND} 0%,#5c0125 52%,#2c0013 100%)`,
          color: WHITE,
          borderRadius: RADIUS.panel,
          padding: "clamp(38px,6vw,60px)",
          textAlign: "center",
          boxShadow: "0 40px 80px -50px rgba(125,1,50,.8)",
        }}
      >
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(28px,4vw,40px)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            margin: 0,
            textWrap: "balance",
          }}
        >
          Find out your real band in 60 seconds
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.82)",
            margin: "14px auto 0",
            maxWidth: 520,
          }}
        >
          Paste an essay, get a calibrated band and the one fix that moves you up — free to start.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 14,
            marginTop: 28,
          }}
        >
          <Link
            href="/grade"
            style={{
              background: WHITE,
              color: BRAND,
              border: "none",
              borderRadius: RADIUS.pill,
              padding: "16px 30px",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Grade an essay free
          </Link>
          <Link
            href="/sign-in"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: WHITE,
              borderRadius: RADIUS.pill,
              padding: "16px 30px",
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Build your plan
          </Link>
        </div>
      </div>
    </section>
  );
}
