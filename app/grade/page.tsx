import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";
import { getSession, roleHome } from "@/lib/auth";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

import { PublicGrader } from "./grader";

// ---- Brand tokens (mirrors the internal writing studio / essay-feedback look) --
const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const LINE = "#E7E3D5";
const SOFT = "#FBFAF4";
const SOFT_LINE = "#EFECE0";

// ---- SEO -------------------------------------------------------------------

const PAGE_TITLE = "Free IELTS Writing Checker — Instant AI Band Score & Fixes";
const PAGE_DESCRIPTION =
  "Check your IELTS Writing Task 2 essay online, free. Paste your text or upload a photo/PDF and " +
  "get an instant, examiner-calibrated band for all four criteria plus your top 3 fixes. " +
  "Conservative grading you can trust on exam day. No sign-up needed.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "IELTS writing checker",
    "IELTS essay checker",
    "IELTS writing task 2 checker",
    "IELTS band score checker",
    "free IELTS writing correction",
    "AI IELTS grader",
    "IELTS writing practice",
    "check IELTS essay from photo",
  ],
  alternates: { canonical: "/grade" },
  openGraph: {
    type: "website",
    url: "/grade",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

// The FAQ renders on the page AND feeds the FAQPage JSON-LD from one array, so the
// structured data always matches the visible content (a Google requirement).
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How accurate is the AI band score?",
    a:
      "The grader is calibrated against expert-marked essays and grounded in the official public " +
      "IELTS band descriptors. It scores each criterion separately, with evidence, and is tuned to " +
      "stay within half a band of a human examiner. When your essay sits between two bands, it " +
      "rounds down — so the band you see here is one you can defend on exam day.",
  },
  {
    q: "Is this IELTS writing checker really free?",
    a:
      "Yes. You can grade an essay here without creating an account. A free account unlocks the " +
      "full report — the evidence behind every score, what is capping each criterion, sentence-level " +
      "fixes, and the revision loop where you rewrite and re-grade the same essay.",
  },
  {
    q: "Can I upload a photo or PDF of my essay?",
    a:
      "Yes — upload a photo of your handwritten essay or a PDF and we transcribe it exactly as " +
      "written (no corrections), so the grader sees your real writing. Review the text, then grade.",
  },
  {
    q: "What does the checker grade?",
    a:
      "IELTS Writing Task 2 essays, on the same four criteria as the real exam: Task Response, " +
      "Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy. You get a band per " +
      "criterion, an overall band, and your top 3 fixes.",
  },
  {
    q: "Which IELTS writing checker gives the closest band to a real examiner?",
    a:
      "The only honest test is whether your practice band matches your exam-day band. EngProgress is " +
      "built for exactly that: grading is grounded in the official public band descriptors, calibrated " +
      "against expert-marked essays, and kept deliberately conservative so it never flatters you. " +
      "Whichever checker you use, prefer one that shows evidence for every score and errs low — an " +
      "inflated band is the most expensive kind of wrong.",
  },
  {
    q: "Why is my band here lower than on other AI checkers?",
    a:
      "Because we refuse to inflate. Most free tools flatter you with a band you will not get in the " +
      "exam. Our grader is deliberately conservative: between two bands it rounds down and tells you " +
      "exactly what is missing for the higher one. A real 6.5 you can trust beats a false 7.0.",
  },
  {
    q: "Is EngProgress affiliated with IELTS?",
    a:
      "No. EngProgress is not affiliated with or endorsed by IELTS®, the British Council, IDP, or " +
      "Cambridge Assessment English. All practice questions are original and written for practice.",
  },
];

function jsonLd() {
  const site = getSiteUrl();
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "EngProgress IELTS Writing Checker",
      url: absoluteUrl("/grade"),
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: PAGE_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: "EngProgress", url: site },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "EngProgress", item: site },
        { "@type": "ListItem", position: 2, name: "Free IELTS Writing Checker", item: absoluteUrl("/grade") },
      ],
    },
  ];
}

// ---- Page --------------------------------------------------------------------

export default async function PublicGradePage() {
  // Optional: signed-in visitors get a shortcut to the full app, but no redirect —
  // the page is intentionally reachable by anyone.
  const session = await getSession();

  const navBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 38,
    padding: "0 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)", fontFamily: SANS, color: INK }}>
      <script
        type="application/ld+json"
        // Structured data for rich results — WebApplication + FAQPage + breadcrumbs.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />

      {/* ---- Header (same bar as the internal feedback page) ---- */}
      <header style={{ height: 60, background: "#fff", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} aria-label="EngProgress home">
          <BrandLogo tone="dark" fontSize={19} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {session ? (
            <Link href={roleHome(session.role)} style={{ ...navBtn, border: "1px solid #E2DED0", background: SOFT, color: "#41496A" }}>
              Open your dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" style={{ ...navBtn, color: "#41496A" }}>
                Sign in
              </Link>
              <Link href="/sign-up" style={{ ...navBtn, background: INDIGO, color: "#fff", boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)" }}>
                Create free account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 24px 56px" }}>
        {/* ---- Hero — short ---- */}
        <section style={{ textAlign: "center", marginBottom: 26 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, letterSpacing: ".12em", color: INDIGO, textTransform: "uppercase" }}>
            Free IELTS Writing checker
          </p>
          <h1 style={{ margin: "10px 0 0", fontFamily: SERIF, fontSize: "clamp(30px, 4.6vw, 42px)", lineHeight: 1.12, fontWeight: 600, letterSpacing: "-.015em", color: INK }}>
            Paste your essay. Get a real band.
          </h1>
          <p style={{ margin: "12px auto 0", fontSize: 16, lineHeight: 1.6, color: MUTED, maxWidth: 600 }}>
            Grade your own writing — text, photo, or PDF — or write to a sample question first.
            Scored on the four examiner criteria, conservatively: your 6.5 here is a real 6.5 on exam day.
          </p>
        </section>

        {/* ---- The grader ---- */}
        <PublicGrader />

        {/* ---- FAQ (collapsed — matches the FAQPage JSON-LD) ---- */}
        <section style={{ marginTop: 56 }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 25, fontWeight: 600, letterSpacing: "-.01em", color: INK }}>
            Frequently asked questions
          </h2>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
            {FAQS.map((f) => (
              <details key={f.q} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 13, padding: "15px 18px" }}>
                <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 700, color: INK, listStyle: "none" }}>{f.q}</summary>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.65, color: MUTED }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---- Footer ---- */}
        <footer style={{ marginTop: 44, borderTop: `1px solid ${SOFT_LINE}`, paddingTop: 18, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "baseline", justifyContent: "space-between" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "#A7ABBA", maxWidth: 620 }}>
            Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge
            Assessment English. All questions are original and written for practice.
          </p>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <Link href="/" style={footLink}>Home</Link>
            <Link href="/#pricing" style={footLink}>Pricing</Link>
            <Link href="/privacy" style={footLink}>Privacy</Link>
            <Link href="/terms" style={footLink}>Terms</Link>
            <Link href="/sign-up" style={footLink}>Sign up</Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}

const footLink: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#767C90",
  textDecoration: "none",
};
