import type { Metadata } from "next";
import { Check, FileUp, ListChecks, PenLine, Plus } from "lucide-react";

import {
  BODY,
  BRAND,
  BRAND_FILL,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  DISPLAY_LG,
  DISPLAY_XL,
  FAINT,
  INK,
  LEDE,
  LINE,
  PANEL,
  RADIUS,
  RULE,
  SANS,
  SHELL,
  STRONG,
  WELL,
  cardStyle,
  eyebrow,
} from "@/app/_landing/_lib/design";
import { LocaleProvider } from "@/shared/components/i18n/locale-provider";
import { translator, type MessageKey } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl, getSiteUrl, organization, PREVIEW_IMAGE, previewImage, SITE_NAME } from "@/lib/seo";

import { PublicGrader } from "./_components/grader";
import { FREE_LIMIT, GRADE_FACTS_CHECKED, IELTS_WRITING_DESCRIPTORS_URL } from "./_lib/facts";
import { GRADE_CSS } from "./_lib/grade-css";

/**
 * /grade — the free writing checker: IELTS Task 1, Task 2 and CEFR Multilevel
 * writing, graded with no account.
 *
 * ENGLISH ON EVERY LOCALE, like the blog and the free practice (see
 * app/practice/[skill]/page.tsx): the questions and every word the grader
 * writes back are English, and a page whose chrome switched language halfway
 * down would read as a mistake. The copy is keyed all the same — swapping
 * `SOURCE_LOCALE` for the visitor's locale is the whole change the day that
 * decision moves. The header island and the footer, outside `<main>`, follow
 * the visitor's language as on every marketing page.
 *
 * ⚠️ STATIC, ON PURPOSE. It used to call `getSession()` to show "Open your
 * dashboard", which made every visit render per request. The site header now
 * reads the session in the browser (SiteNav), so nothing here depends on the
 * request and the page is served from cache — it is the front door's "Start
 * free assessment" target, so it is the second page most visitors load.
 */

const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("grade.metaTitle"),
  description: t("grade.metaDesc"),
  keywords: [
    "IELTS writing checker",
    "IELTS essay checker",
    "IELTS writing task 1 checker",
    "IELTS writing task 2 checker",
    "IELTS letter checker",
    "IELTS band score checker",
    "CEFR writing checker",
    "Multilevel writing checker",
    "free IELTS writing correction",
    "AI IELTS grader",
    "check IELTS essay from photo",
  ],
  alternates: { canonical: "/grade" },
  openGraph: {
    type: "website",
    url: "/grade",
    title: t("grade.metaTitle"),
    description: t("grade.metaDesc"),
    images: [previewImage(t("grade.appName"))],
  },
  twitter: {
    card: "summary_large_image",
    title: t("grade.metaTitle"),
    description: t("grade.metaDesc"),
    images: [PREVIEW_IMAGE],
  },
};

// The FAQ renders on the page AND feeds the FAQPage JSON-LD from one list, so the
// structured data always matches the visible content (a Google requirement).
const FAQ: { q: MessageKey; a: MessageKey }[] = [
  { q: "grade.faq1q", a: "grade.faq1a" },
  { q: "grade.faq2q", a: "grade.faq2a" },
  { q: "grade.faq3q", a: "grade.faq3a" },
  { q: "grade.faq4q", a: "grade.faq4a" },
  { q: "grade.faq5q", a: "grade.faq5a" },
  { q: "grade.faq6q", a: "grade.faq6a" },
  { q: "grade.faq7q", a: "grade.faq7a" },
  { q: "grade.faq8q", a: "grade.faq8a" },
];

const POINTS: MessageKey[] = ["grade.pointFree", "grade.pointUpload", "grade.pointStrict"];

/**
 * The page's answer to "what is this?", as plain facts right under the checker.
 *
 * ⚠️ THIS IS WHAT AN ANSWER ENGINE QUOTES. ChatGPT sent visitors here (19 of
 * its 22 referrals, 2026-09-21 → 10-11) and stopped; after the 2026-10-14
 * redesign the only prose above the checker was a pill and three bullets,
 * and every explanation sat in collapsed FAQ items at the bottom.
 * The GEO study (Aggarwal et al., KDD 2024) reports that statistics and cited
 * sources lift a page's share of a generated answer — so these are facts, one
 * of them linked to its source, and none of them claims an accuracy nobody has
 * measured.
 *
 * Below the checker, not above it: the owner took the hero copy out so the
 * checker sits above the fold, and that stays the owner's call.
 */
const FACTS: { k: MessageKey; v: MessageKey; link?: { href: string; label: MessageKey } }[] = [
  { k: "grade.factGradesK", v: "grade.factGradesV" },
  { k: "grade.factScoreK", v: "grade.factScoreV" },
  {
    k: "grade.factBasisK",
    v: "grade.factBasisV",
    link: { href: IELTS_WRITING_DESCRIPTORS_URL, label: "grade.factBasisLink" },
  },
  { k: "grade.factCostK", v: "grade.factCostV" },
  { k: "grade.factTimeK", v: "grade.factTimeV" },
];

/** "21 October 2026" — the page is English on every locale, so is the date. */
const CHECKED_ON = new Date(`${GRADE_FACTS_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const STEPS: { title: MessageKey; body: MessageKey; icon: React.ReactNode }[] = [
  { title: "grade.step1T", body: "grade.step1B", icon: <ListChecks size={18} strokeWidth={2} /> },
  { title: "grade.step2T", body: "grade.step2B", icon: <FileUp size={18} strokeWidth={2} /> },
  { title: "grade.step3T", body: "grade.step3B", icon: <PenLine size={18} strokeWidth={2} /> },
];

function jsonLd() {
  const site = getSiteUrl();
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t("grade.appName"),
      url: absoluteUrl("/grade"),
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: t("grade.metaDesc"),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      // The same date and source the "at a glance" section shows.
      dateModified: GRADE_FACTS_CHECKED,
      isBasedOn: IELTS_WRITING_DESCRIPTORS_URL,
      publisher: organization(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: t(f.q),
        acceptedAnswer: { "@type": "Answer", text: t(f.a) },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: site },
        { "@type": "ListItem", position: 2, name: t("grade.appName"), item: absoluteUrl("/grade") },
      ],
    },
  ];
}

export default function PublicGradePage() {
  return (
    <>
      <style>{GRADE_CSS}</style>
      <script
        type="application/ld+json"
        // Structured data for rich results — WebApplication + FAQPage + breadcrumbs.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />

      {/* ---- Hero ---- */}
      <section
        style={{
          ...SHELL,
          maxWidth: 1180,
          padding: "clamp(30px,5vw,56px) 28px clamp(22px,3.5vw,34px)",
          textAlign: "center",
        }}
      >
        {/* ⚠️ THE PAGE'S <h1>, dressed as the pill it always was. The display
            title below was taken out, and a page with no <h1> gives search
            engines and screen readers no main heading, on the page meant to
            rank for "free writing checker". If that title comes back, it takes
            the <h1> again and this goes back to being a <div>: two would be a
            page with two subjects. */}
        <h1
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            margin: 0,
            border: `1px solid ${BRAND_TINT_LINE}`,
            background: BRAND_TINT,
            color: BRAND,
            borderRadius: RADIUS.pill,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND_FILL }}
          />
          {t("grade.eyebrow")}
        </h1>
        {/* <h1 style={{ ...DISPLAY_XL, margin: "20px auto 0", maxWidth: 780 }}>
          {t("grade.titleA")} <span style={{ color: BRAND }}>{t("grade.titleB")}</span>
        </h1> */}
        {/* <p style={{ ...LEDE, margin: "18px auto 0", maxWidth: 640 }}>{t("grade.lead")}</p> */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "22px 0 0",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 22px",
          }}
        >
          {POINTS.map((p) => (
            <li
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14.5,
                fontWeight: 600,
                color: STRONG,
              }}
            >
              <span aria-hidden style={{ display: "inline-flex", color: BRAND }}>
                <Check size={16} strokeWidth={2.6} />
              </span>
              {t(p)}
            </li>
          ))}
        </ul>
      </section>

      {/* ---- The checker, on its own ground so the white card reads as the
              object on the page ---- */}
      <section
        id="checker"
        style={{
          background: WELL,
          borderTop: `1px solid ${RULE}`,
          borderBottom: `1px solid ${RULE}`,
        }}
      >
        <div
          style={{
            ...SHELL,
            maxWidth: 1180,
            padding: "clamp(22px,3vw,34px) 28px clamp(30px,4vw,48px)",
          }}
        >
          {/* The grader is a client component and reads its copy from `useT()`;
              pinned so it renders the same English as the page around it,
              whatever language the visitor's cookie says. */}
          <LocaleProvider pin={SOURCE_LOCALE}>
            <PublicGrader />
          </LocaleProvider>
        </div>
      </section>

      {/* ---- At a glance (see FACTS) ---- */}
      <section style={{ ...SHELL, maxWidth: 1180, padding: "clamp(40px,5vw,64px) 28px 0" }}>
        <div style={eyebrow(true)}>{t("grade.factsEyebrow")}</div>
        <h2 style={{ ...DISPLAY_LG, margin: "14px 0 0" }}>{t("grade.factsTitle")}</h2>
        <dl style={{ ...cardStyle(0), margin: "26px 0 0", overflow: "hidden" }}>
          {FACTS.map((f) => (
            <div key={f.k} className="gr-fact" style={{ padding: "18px 24px" }}>
              <dt style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: INK }}>{t(f.k)}</dt>
              <dd style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: BODY }}>
                {t(f.v, { n: FREE_LIMIT })}
                {f.link && (
                  <>
                    {" "}
                    <a
                      href={f.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: BRAND, fontWeight: 600, textDecoration: "underline" }}
                    >
                      {t(f.link.label)}
                    </a>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: FAINT }}>
          <time dateTime={GRADE_FACTS_CHECKED}>{t("grade.factsChecked", { date: CHECKED_ON })}</time>
        </p>
      </section>

      {/* ---- How it works ---- */}
      <section style={{ ...SHELL, maxWidth: 1180, padding: "clamp(40px,5vw,64px) 28px 0" }}>
        <div style={eyebrow(true)}>{t("grade.howEyebrow")}</div>
        <h2 style={{ ...DISPLAY_LG, margin: "14px 0 0" }}>{t("grade.howTitle")}</h2>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "26px 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
            gap: 18,
          }}
        >
          {STEPS.map((s, i) => (
            <li key={s.title} style={cardStyle(24)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  aria-hidden
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: RADIUS.icon,
                    background: BRAND_TINT,
                    color: BRAND,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {s.icon}
                </span>
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 600,
                    fontSize: 13,
                    color: FAINT,
                    letterSpacing: "0.08em",
                  }}
                >
                  0{i + 1}
                </span>
              </div>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 19,
                  letterSpacing: "-0.01em",
                  color: INK,
                  margin: "16px 0 0",
                }}
              >
                {t(s.title)}
              </h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: BODY, margin: "8px 0 0" }}>
                {t(s.body)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- FAQ (collapsed — the same list as the FAQPage JSON-LD) ---- */}
      <section
        style={{
          ...SHELL,
          maxWidth: 900,
          padding: "clamp(44px,5.5vw,72px) 28px clamp(40px,5vw,64px)",
        }}
      >
        <h2 style={{ ...DISPLAY_LG, margin: 0, textAlign: "center" }}>{t("grade.faqTitle")}</h2>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="gr-faq"
              style={{
                background: PANEL,
                border: `1px solid ${LINE}`,
                borderRadius: 16,
                padding: "16px 20px",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  fontFamily: SANS,
                  fontSize: 16,
                  fontWeight: 700,
                  color: INK,
                }}
              >
                {t(f.q)}
                <span
                  aria-hidden
                  className="gr-faq-plus"
                  style={{ display: "inline-flex", color: BRAND, flex: "none" }}
                >
                  <Plus size={18} strokeWidth={2.2} />
                </span>
              </summary>
              <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.65, color: BODY }}>
                {t(f.a)}
              </p>
            </details>
          ))}
        </div>
        <p
          style={{
            margin: "30px 0 0",
            fontSize: 12.5,
            lineHeight: 1.6,
            color: FAINT,
            textAlign: "center",
          }}
        >
          {t("lp.disclaimer")} {t("grade.original")}
        </p>
      </section>
    </>
  );
}
