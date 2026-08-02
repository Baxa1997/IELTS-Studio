import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DM_Sans, Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";

import {
  BTN_GHOST,
  INDIGO,
  INK,
  MONO,
  SANS,
  SERIF,
  SHELL,
  SiteFooter,
  SiteNav,
} from "@/app/_landing/chrome";
import { DEMO_TABS } from "@/app/_landing/demo-content";
import { ReportShowcase } from "@/app/_landing/demo-screens";
import { DemoTabs } from "@/app/_landing/demo-tabs";
import { HeroProcessDemo } from "@/app/_landing/hero-process-demo";
import { BandCountUp } from "@/components/landing/band-countup";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { getSession, roleHome } from "@/lib/auth";
import { PLAN_ORDER, planTier, type OrgPlan } from "@/lib/billing/plans";
import { getSiteUrl, LANDING_DESCRIPTION, PREVIEW_IMAGE, SEO_KEYWORDS, SITE_NAME } from "@/lib/seo";

// Marketing fonts — scoped to this page via CSS variables, so the rest of the
// app keeps Geist. Newsreader (serif display) + Hanken Grotesk (UI sans) +
// JetBrains Mono (the small calibrated/telemetry labels in the hero banner).
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

export const metadata: Metadata = {
  title: "IELTS Practice with AI Band Feedback — Writing, Reading, Listening & CEFR",
  description: LANDING_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  alternates: {
    canonical: "/",
  },
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
  // Marketing front door for anonymous visitors. A signed-in visitor is sent
  // straight to their role home — landing on this page after logging in (e.g. if
  // an OAuth round-trip resolves here) read as "sign-in didn't go anywhere".
  const session = await getSession();
  if (session) redirect(roleHome(session.role));
  const home: string | null = null;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: getSiteUrl(),
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: LANDING_DESCRIPTION,
    keywords: SEO_KEYWORDS.join(", "),
    offers: {
      "@type": "Offer",
      category: "IELTS practice platform",
    },
    educationalUse: ["IELTS practice", "CEFR practice", "IELTS band improvement"],
  };

  return (
    <div
      className={`${hanken.variable} ${newsreader.variable} ${jetbrains.variable} ${dmsans.variable} lp-root`}
      style={{
        background: "#fff",
        fontFamily: SANS,
        color: INK,
        minHeight: "100%",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Reveal sections as they scroll into view (no-JS keeps them visible). */}
      <noscript>
        <style>{".reveal,.reveal-stagger>*{opacity:1;transform:none;filter:none}"}</style>
      </noscript>
      <ScrollReveal />
      <SiteNav home={home} />
      <Hero />
      <DemoSection />
      <ResultsSection />
      <Skills />
      <Pricing />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

// ---- shared bits -----------------------------------------------------------

/** Full-width section band. The top border + distinct background give the page a
 *  clear, solid rhythm so each section reads as its own surface. */
function Band({
  id,
  bg = "transparent",
  pad = "clamp(48px,8vw,72px)",
  children,
}: {
  id?: string;
  bg?: string;
  pad?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ background: bg, borderTop: "1px solid #ECEAF2" }}>
      <div
        className="reveal reveal-stagger"
        style={{ ...SHELL, paddingTop: pad, paddingBottom: pad }}
      >
        {children}
      </div>
    </section>
  );
}

function SectionHead({
  title,
  sub,
  maxSub = 660,
  light = false,
}: {
  title: string;
  sub: string;
  maxSub?: number;
  light?: boolean;
}) {
  return (
    <>
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(30px,4.5vw,42px)",
          lineHeight: 1.1,
          color: light ? "#fff" : INK,
          letterSpacing: "-.015em",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: 18,
          lineHeight: 1.6,
          color: light ? "rgba(255,255,255,.82)" : "#6b6e84",
          margin: "14px 0 0",
          maxWidth: maxSub,
        }}
      >
        {sub}
      </p>
    </>
  );
}

function Check({
  color = INDIGO,
  size = 16,
  sw = 2.4,
}: {
  color?: string;
  size?: number;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ---- hero ------------------------------------------------------------------

function Hero() {
  return (
    <div style={{ position: "relative", background: "#fff", overflow: "hidden" }}>
      {/* scoped animations + responsive rules for the banner */}
      <style>{HERO_STYLES}</style>

      {/* dot grid + soft indigo glow — purely decorative, so they must never
          intercept clicks meant for the hero CTAs beneath them */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(59,67,181,.045) 1px,transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 90,
          width: 760,
          height: 380,
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse,rgba(59,67,181,.09),transparent 64%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1480,
          margin: "0 auto",
          padding: "26px clamp(20px,5vw,64px) 48px",
        }}
      >
        {/* Two-column banner: left pitch · right Band-9 examiner result */}
        <div
          className="lp-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.02fr .58fr",
            gap: "clamp(32px,4.5vw,48px)",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          {/* LEFT — the pitch */}
          <div className="lp-hero-left hb-rise hb-d1">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                fontFamily: MONO,
                fontSize: 11.5,
                letterSpacing: ".1em",
                color: "#4b4e63",
                background: "#fff",
                border: "1px solid #E4E2F0",
                borderRadius: 999,
                padding: "7px 16px",
                boxShadow: "0 2px 10px rgba(0,0,0,.06)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#1F8A5B",
                  animation: "hb-pulse 1.8s infinite",
                }}
              />
              NEW · AGENTIC IELTS PLATFORM
            </span>

            <h1
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: "clamp(40px,5.2vw,66px)",
                lineHeight: 1.04,
                letterSpacing: "-.03em",
                color: INK,
                margin: "22px 0 0",
                textWrap: "balance",
              }}
            >
              The World&rsquo;s Smartest
              <br />
              <span style={{ color: INDIGO }}>Agentic IELTS Platform</span>
            </h1>

            <p
              style={{
                fontFamily: SANS,
                fontSize: "clamp(16px,1.4vw,19px)",
                lineHeight: 1.6,
                color: "#57564d",
                margin: "20px 0 0",
                maxWidth: 520,
              }}
            >
              AI agents generate fresh Writing &amp; Reading practice on demand &mdash; and the most
              powerful trained models follow your exact level and context, so every task meets you
              right where you are.
            </p>

            <div style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
              {/* Primary CTA → the free, no-login essay grader (the marketing funnel). */}
              <Link
                href="/grade"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: INDIGO,
                  color: "#fff",
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "15px 26px",
                  borderRadius: 999,
                  textDecoration: "none",
                  boxShadow: "0 12px 26px rgba(59,67,181,.26)",
                }}
              >
                Start Free Assessment <span aria-hidden>&rarr;</span>
              </Link>
              <Link
                href="#demo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#fff",
                  color: INK,
                  border: "1.5px solid #E4E0D0",
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "15px 24px",
                  borderRadius: 999,
                  textDecoration: "none",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: INDIGO,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                  }}
                >
                  &#9654;
                </span>
                See how it works
              </Link>
            </div>

            <div style={{ fontFamily: SANS, fontSize: 13.5, color: "#8a897c", marginTop: 16 }}>
              On-demand practice &middot; Always at your level &middot; CEFR A1&ndash;C2 + IELTS
              bands
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 22 }}>
              {[
                { label: "Writing", soon: false },
                { label: "Reading", soon: false },
                { label: "Listening", soon: false },
                { label: "Speaking", soon: true },
              ].map((c) => (
                <span
                  key={c.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 13,
                    color: c.soon ? "#9a998c" : "#4b4e63",
                    background: "#fff",
                    border: "1px solid #E7E3D5",
                    borderRadius: 999,
                    padding: "7px 14px",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: c.soon ? "#C9C7B8" : INDIGO,
                      flex: "none",
                    }}
                  />
                  {c.label}
                  {c.soon ? (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 9.5,
                        letterSpacing: ".08em",
                        color: "#b3b1a2",
                        textTransform: "uppercase",
                      }}
                    >
                      soon
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — the solid Band-9 examiner result card */}
          <div className="lp-hero-rightcol hb-rise hb-d3" style={{ position: "relative" }}>
            {/* one intentional floating accent, anchored to the card's top edge */}
            <div
              className="lp-fbadge fb-j-5"
              style={{ position: "absolute", top: -16, right: -10, zIndex: 5 }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#147a4f",
                  background: "#fff",
                  border: "1px solid #cfe7da",
                  borderRadius: 999,
                  padding: "8px 14px",
                  boxShadow: "0 16px 30px -14px rgba(20,40,30,.45)",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 7, height: 7, borderRadius: "50%", background: "#1F8A5B" }}
                />{" "}
                Band 9 achievable
              </span>
            </div>

            {/* the result card */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                background: "linear-gradient(180deg,#FFFFFF 0%,#FCFBFF 100%)",
                border: "1px solid #E9E6F3",
                borderRadius: 28,
                boxShadow:
                  "0 40px 80px -34px rgba(26,28,51,.34), 0 12px 30px -18px rgba(26,28,51,.16)",
                padding: "24px clamp(22px,3vw,34px) 22px",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(130% 80% at 50% -14%, rgba(59,67,181,.13), transparent 58%)",
                  pointerEvents: "none",
                }}
              />

              {/* header */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "linear-gradient(150deg,#4B52CE,#2E3488)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                      boxShadow: "0 6px 14px -6px rgba(59,67,181,.7)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <path
                        d="M8 0 C8 4.4 4.4 8 0 8 C4.4 8 8 11.6 8 16 C8 11.6 11.6 8 16 8 C11.6 8 8 4.4 8 0 Z"
                        fill="#fff"
                      />
                    </svg>
                  </span>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}>
                      Examiner Result
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: SANS,
                        fontSize: 12,
                        color: "#1F8A5B",
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#1F8A5B",
                          animation: "hb-pulse 1.8s infinite",
                        }}
                      />
                      Verified &middot; calibrated
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: INDIGO,
                    background: "#ECEDFB",
                    border: "1px solid #DADCF4",
                    borderRadius: 8,
                    padding: "5px 10px",
                  }}
                >
                  AI
                </span>
              </div>

              {/* the band — a realistic mortarboard + a Cambridge-style 9 */}
              <div style={{ position: "relative", textAlign: "center", padding: "14px 0 2px" }}>
                <div
                  style={{
                    width: 98,
                    margin: "0 auto",
                    animation: "hb-cap-float 4.2s ease-in-out infinite",
                  }}
                >
                  <svg
                    aria-hidden
                    width="118"
                    height="96"
                    viewBox="0 0 128 104"
                    fill="none"
                    style={{
                      display: "block",
                      margin: "0 auto",
                      filter: "drop-shadow(0 12px 18px rgba(20,20,48,.24))",
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="cap-board"
                        x1="20"
                        y1="28"
                        x2="112"
                        y2="74"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3A4090" />
                        <stop offset="1" stopColor="#14173A" />
                      </linearGradient>
                      <linearGradient
                        id="cap-crown"
                        x1="44"
                        y1="48"
                        x2="86"
                        y2="80"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#262C5C" />
                        <stop offset="1" stopColor="#0E1130" />
                      </linearGradient>
                      <linearGradient
                        id="cap-tassel"
                        x1="110"
                        y1="50"
                        x2="120"
                        y2="90"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#F2CB60" />
                        <stop offset="1" stopColor="#C68F2A" />
                      </linearGradient>
                    </defs>
                    {/* soft ground shadow */}
                    <ellipse cx="62" cy="96" rx="30" ry="5" fill="rgba(20,20,48,.10)" />
                    {/* crown (cap on the head), behind the board */}
                    <path
                      d="M40 48 L40 64 Q40 78 64 78 Q88 78 88 64 L88 48 Z"
                      fill="url(#cap-crown)"
                    />
                    {/* the mortarboard */}
                    <polygon points="64,26 120,50 64,72 8,50" fill="url(#cap-board)" />
                    {/* facets for dimension */}
                    <polygon points="64,26 8,50 64,50" fill="rgba(255,255,255,.15)" />
                    <polygon points="64,26 120,50 64,50" fill="rgba(255,255,255,.06)" />
                    {/* centre button */}
                    <circle cx="64" cy="50" r="4" fill="url(#cap-tassel)" />
                    <circle cx="64" cy="50" r="1.7" fill="#9A6E1E" />
                    {/* tassel — cord, knot, fringe */}
                    <path
                      d="M64 50 Q104 49 117 53 L117 66"
                      stroke="url(#cap-tassel)"
                      strokeWidth="2.6"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle cx="117" cy="67" r="3.4" fill="url(#cap-tassel)" />
                    <path
                      d="M113 68 L112 87 M116 70 L115 89 M118 69 L120 88 M120 67 L122 85"
                      stroke="url(#cap-tassel)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    letterSpacing: ".3em",
                    color: "#9e9b90",
                    textTransform: "uppercase",
                    marginTop: 10,
                  }}
                >
                  Overall Band
                </div>
                <BandCountUp />
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 14.5,
                    lineHeight: 1.5,
                    color: "#57564d",
                    margin: "10px auto 0",
                    maxWidth: 320,
                  }}
                >
                  The band a Cambridge-trained examiner would award &mdash; and the path to reach
                  it.
                </div>
              </div>

              {/* per-skill result chips */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                {["Writing 9", "Reading 9", "CEFR C2"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: SANS,
                      fontWeight: 600,
                      fontSize: 13,
                      color: INDIGO,
                      background: "#ECEDFB",
                      border: "1px solid #DADCF4",
                      borderRadius: 999,
                      padding: "6px 13px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* anchored university row — the actual marks, scaled small to fit */}
              <div
                style={{
                  position: "relative",
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid #EFEDE3",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: ".22em",
                    color: "#a8a596",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Recognised for admission at
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    columnGap: 18,
                    rowGap: 10,
                    marginTop: 12,
                  }}
                >
                  {/* Rendered at 40px tall, so these ship at 80px (2x) in WebP.
                      They used to be full-size PNGs — 568 kB for four logos, half
                      the weight of this entire page, to draw 40 pixels of height.
                      `width`/`height` are the intrinsic 2x dimensions: they give
                      the browser the aspect ratio up front so the strip does not
                      jump as each logo arrives. */}
                  {[
                    { src: "/logos/mit.webp", alt: "MIT", w: 122 },
                    { src: "/logos/harvard.webp", alt: "Harvard", w: 161 },
                    { src: "/logos/stanford.webp", alt: "Stanford", w: 164 },
                    { src: "/logos/columbia.webp", alt: "Columbia", w: 194 },
                  ].map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={u.alt}
                      src={u.src}
                      alt={u.alt}
                      width={u.w}
                      height={80}
                      // NOT loading="lazy": these sit in the hero's trust strip,
                      // and with lazy set the browser never requested them at all
                      // on this page — they rendered as four empty 40px gaps.
                      // At ~6 kB each there is nothing to defer anyway.
                      decoding="async"
                      style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* animated product demo: grading + practice generation */}
        <HeroProcessDemo />

        <p
          style={{
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 12.5,
            color: "#8a897c",
            margin: "22px 0 0",
          }}
        >
          Calibrated and conservative by design · not affiliated with or endorsed by IELTS®
        </p>
      </div>
    </div>
  );
}

const HERO_STYLES = `
@keyframes hb-blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes hb-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes hb-glow{0%,100%{text-shadow:0 0 0 rgba(59,67,181,0)}50%{text-shadow:0 0 40px rgba(59,67,181,.22)}}
@keyframes hb-dots{0%{opacity:.3}25%{opacity:1}100%{opacity:.3}}
@keyframes hb-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.hb-rise{animation:hb-rise .68s cubic-bezier(.22,.68,.18,1) both}
.hb-d1{animation-delay:.06s}
.hb-d2{animation-delay:.16s}
.hb-d3{animation-delay:.26s}
.hb-d4{animation-delay:.38s}
.hb-d5{animation-delay:.50s}
.hb-d6{animation-delay:.60s}
@keyframes fb-jump{0%,100%{transform:translateY(0)}45%,55%{transform:translateY(-13px)}}
.fb-j-1{animation:fb-jump 1.9s ease-in-out 0s infinite}
.fb-j-2{animation:fb-jump 2.2s ease-in-out .35s infinite}
.fb-j-3{animation:fb-jump 2.5s ease-in-out .7s infinite}
.fb-j-4{animation:fb-jump 2.0s ease-in-out 1.05s infinite}
.fb-j-5{animation:fb-jump 2.3s ease-in-out .2s infinite}
.fb-j-6{animation:fb-jump 1.8s ease-in-out .55s infinite}
@keyframes hb-bar{from{width:0}to{width:100%}}
.hb-bar-fill{animation:hb-bar 1.25s cubic-bezier(.4,.7,.2,1) .42s both}
.lp-fbadge{z-index:3}
@keyframes hb-cap-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@media (max-width:900px){
  .lp-hero-grid{grid-template-columns:1fr!important;gap:34px!important}
  .lp-hero-rightcol{max-width:440px;margin:8px auto 0}
}
@media (max-width:680px){
  .lp-fbadge{display:none}
  .lp-score-scene{height:200px!important}
}
@media (min-width:681px) and (max-width:960px){
  .lp-fbadge-mid{display:none}
  .lp-score-scene{height:280px!important}
}
@media (max-width:760px){
  .lp-hero-bars{flex-wrap:wrap}
  .lp-hero-bars>div{flex:1 1 42%}
  .lp-hero-cardhead{flex-direction:column;align-items:flex-start;gap:9px}
  .lp-hero-cardfoot{flex-direction:column;align-items:flex-start;gap:10px}
}
@media (prefers-reduced-motion:reduce){
  .lp-root [style*="animation"]{animation:none!important}
  .hb-rise,.hb-bar-fill{animation:none!important}
  .hb-bar-fill{width:100%!important}
  .fb-j-1,.fb-j-2,.fb-j-3,.fb-j-4,.fb-j-5,.fb-j-6{animation:none!important;transform:none}
}
`;


// ---- live demo: the real product UI ----------------------------------------

function DemoSection() {
  return (
    <Band id="demo" bg="#fff">
      <SectionHead
        title="The real product, not mockups"
        sub="These are the actual EngProgress screens — the feedback, the tests, the coach — rendered live, not pictures of them. Click through the screens."
      />
      <div style={{ marginTop: 44 }}>
        <DemoTabs tabs={DEMO_TABS} />
      </div>
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/demo" style={{ ...BTN_GHOST, fontSize: 15, padding: "12px 20px" }}>
          Open the full demo →
        </Link>
      </div>
    </Band>
  );
}

// ---- proof: real reports from the grader ------------------------------------

function ResultsSection() {
  return (
    <Band id="results" bg="#FBFAF3">
      <SectionHead
        title="Real reports from the grader"
        sub="The actual report layout the examiner engine produces. Conservative by design: between two bands it rounds down and names exactly what the higher band needs, so the band you practice with is one you can trust on exam day."
      />
      <ReportShowcase />
    </Band>
  );
}

// ---- skills ----------------------------------------------------------------

function Skills() {
  return (
    <Band id="skills" bg="#fff">
      <SectionHead
        title="Deep on the skills that decide Band 8"
        sub="We go deepest on Writing and Reading — where most scores are won or lost — with full Listening tests live and Speaking on the way."
      />
      <div
        className="lp-cols-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 42 }}
      >
        <SkillCard
          title="Writing"
          icon={
            <>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </>
          }
          points={[
            "Per-criterion bands with quoted evidence (TR · CC · LR · GRA)",
            "The revision loop: rewrite, resubmit, re-grade the same essay",
            "Band 8 sample comparison and a current → target tracker",
          ]}
        />
        <SkillCard
          title="Reading"
          icon={
            <>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </>
          }
          points={[
            "Original passages and every real question type, auto-graded",
            "For each wrong answer: why the trap worked + the proving sentence",
            "Question-type analytics and a timed full-section exam mode",
          ]}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 18,
          background: "#fff",
          border: "1px solid #E0E1F4",
          borderRadius: 14,
          padding: "16px 22px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#F4F4FB",
              border: "1px solid #E0E1F4",
              color: "#7a7c92",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M19 10a7 7 0 0 1-14 0" />
              <path d="M12 19v3" />
            </svg>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#F4F4FB",
              border: "1px solid #E0E1F4",
              color: "#7a7c92",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              <path d="M3 14a9 9 0 0 1 18 0" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z" />
            </svg>
          </div>
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 15,
            lineHeight: 1.5,
            color: "#3a3d52",
            flex: 1,
            minWidth: 240,
          }}
        >
          <b style={{ color: INK }}>Listening is live</b> — full four-section practice tests with
          auto-marking, at every level. <b style={{ color: INK }}>Speaking is in development</b> —
          AI mock interviews, included free for members when it launches.
        </div>
      </div>
    </Band>
  );
}

function SkillCard({
  title,
  icon,
  points,
}: {
  title: string;
  icon: React.ReactNode;
  points: string[];
}) {
  return (
    <div
      className="lp-hover"
      style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 18, padding: 30 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "#EBECFA",
            color: INDIGO,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {icon}
          </svg>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: INK }}>{title}</div>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 11,
            color: INDIGO,
            background: "#EBECFA",
            padding: "3px 9px",
            borderRadius: 6,
          }}
        >
          Live
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 20 }}>
        {points.map((p) => (
          <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ marginTop: 2 }}>
              <Check size={18} sw={2.4} />
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.5,
                color: "#3a3d52",
              }}
            >
              {p}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- faq --------------------------------------------------------------------

function Faq() {
  const qs = [
    {
      q: "Is this affiliated with IELTS?",
      a: "No. We're an independent practice tool — not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English. We ground our scoring in the public band descriptors anyone can read.",
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
      a: "Listening is live — full four-section practice tests with auto-marking at every level. Speaking is in development and will be included free for members when it launches.",
    },
  ];
  return (
    <Band id="faq" bg="#fff">
      <SectionHead
        title="Questions, answered straight"
        sub="The same honesty we put into your band — applied to how this works."
        maxSub={560}
      />
      <div
        style={{
          marginTop: 34,
          maxWidth: 860,
          background: "#fff",
          border: "1px solid #E7E4D6",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        {qs.map((item, i) => (
          <div
            key={item.q}
            style={{ padding: "22px 26px", borderTop: i === 0 ? "none" : "1px solid #EEEBDD" }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>
              {item.q}
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.65,
                color: "#6b6e84",
                margin: "8px 0 0",
              }}
            >
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </Band>
  );
}

// ---- pricing (B2C: framed by real grading/generation limits) ---------------

const PLAN_CTA: Record<OrgPlan, { label: string; href: string }> = {
  trial: { label: "Start free", href: "/sign-up" },
  starter: { label: "Choose plan", href: "/sign-up" },
  pro: { label: "Choose plan", href: "/sign-up" },
  enterprise: { label: "Choose plan", href: "/sign-up" },
};

function planFeatures(id: OrgPlan): string[] {
  const t = planTier(id);
  const grad =
    t.gradeLimit == null
      ? "Unlimited essay gradings"
      : `${t.gradeLimit.toLocaleString()} essay gradings / mo`;
  const gen =
    t.generateLimit == null
      ? "Unlimited practice sets"
      : `${t.generateLimit.toLocaleString()} practice sets / mo`;
  const third =
    id === "trial"
      ? "Writing + Reading practice"
      : id === "starter"
        ? "Full revision loop + progress tracking"
        : id === "pro"
          ? "Priority grading queue"
          : "Priority support";
  return [grad, gen, third];
}

function Pricing() {
  return (
    <Band id="pricing" bg="#fff">
      <SectionHead
        title="Simple, local-friendly pricing"
        sub="Start free with the public grader — no card. Pay in UZS via Payme or Click, or by card."
      />
      <div
        className="lp-cols-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginTop: 42,
          alignItems: "start",
        }}
      >
        {PLAN_ORDER.map((id) => {
          const t = planTier(id);
          const popular = id === "starter";
          const cta = PLAN_CTA[id];
          const priceLabel = t.price == null ? "Custom" : t.price === 0 ? "Free" : `$${t.price}`;
          return (
            <div
              key={id}
              className="lp-hover"
              style={{
                background: "#fff",
                border: popular ? `2px solid ${INDIGO}` : "1px solid #E7E4D6",
                borderRadius: 18,
                padding: 26,
                boxShadow: popular ? "0 28px 56px -36px rgba(59,67,181,.6)" : "none",
                position: "relative",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>
                  {t.name}
                </div>
                {popular ? (
                  <span
                    style={{
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: 11,
                      color: INDIGO,
                      background: "#EBECFA",
                      padding: "3px 10px",
                      borderRadius: 999,
                    }}
                  >
                    Popular
                  </span>
                ) : null}
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, color: INK }}>
                  {priceLabel}
                </span>
                {t.price != null && t.price > 0 ? (
                  <span
                    style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: "#8a897c" }}
                  >
                    {t.months === 1 ? "/mo" : ` / ${t.months} months`}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#9a998c",
                  marginTop: 2,
                  minHeight: 18,
                }}
              >
                {t.priceUzs != null
                  ? `≈ ${t.priceUzs.toLocaleString()} UZS${t.months === 1 ? "/mo" : ` / ${t.months} months`}`
                  : " "}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                {planFeatures(id).map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      gap: 9,
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 14,
                      color: "#3a3d52",
                    }}
                  >
                    <Check />
                    {f}
                  </div>
                ))}
              </div>
              {cta.href.startsWith("mailto:") ? (
                <a href={cta.href} style={priceCtaStyle(popular)}>
                  {cta.label}
                </a>
              ) : (
                <Link href={cta.href} style={priceCtaStyle(popular)}>
                  {cta.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Band>
  );
}

function priceCtaStyle(popular: boolean): React.CSSProperties {
  return {
    display: "block",
    marginTop: 24,
    textAlign: "center",
    background: popular ? INDIGO : "#fff",
    border: popular ? "none" : "1px solid #DAD8C9",
    color: popular ? "#fff" : INK,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 15,
    padding: 12,
    borderRadius: 11,
    textDecoration: "none",
  };
}

// ---- final CTA + footer ----------------------------------------------------

function FinalCta() {
  return (
    <Band bg="transparent">
      <div
        style={{
          background: INDIGO,
          color: "#fff",
          borderRadius: 20,
          padding: "clamp(36px,6vw,56px)",
          textAlign: "center",
          boxShadow: "0 40px 80px -50px rgba(59,67,181,.8)",
        }}
      >
        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(28px,4vw,40px)",
            lineHeight: 1.1,
            letterSpacing: "-.015em",
            margin: 0,
            textWrap: "balance",
          }}
        >
          Find out your real band in 60 seconds
        </h2>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.6,
            color: "rgba(255,255,255,.82)",
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
            href="/write"
            style={{ ...BTN_GHOST, background: "#fff", border: "none", color: INDIGO }}
          >
            Grade an essay free
          </Link>
          <Link
            href="/sign-in"
            style={{
              ...BTN_GHOST,
              background: "transparent",
              border: "1px solid rgba(255,255,255,.4)",
              color: "#fff",
            }}
          >
            Build your plan
          </Link>
        </div>
      </div>
    </Band>
  );
}

