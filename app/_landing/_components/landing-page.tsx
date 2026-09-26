import type { Metadata } from "next";

import { LocaleProvider } from "@/shared/components/i18n/locale-provider";
import { translator } from "@/lib/i18n";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { MessageKey, Translate } from "@/lib/i18n";
import Link from "next/link";

import { Band9Card } from "@/app/_landing/_components/band9-card";
import { LeadStory, StoryRow } from "@/app/_landing/_components/blog-stories";
import { BLOG_CSS } from "@/app/_landing/_lib/blog-css";
import { DEMO_TABS } from "@/app/_landing/_lib/demo-content";
import { DeferredReportShowcase } from "@/app/_landing/_components/deferred-report-showcase";
import { DemoTabs } from "@/app/_landing/_components/demo-tabs";
import { HeroProcessDemo } from "@/app/_landing/_components/hero-process-demo";
import { LiveStat, LiveStatsStyles } from "@/app/_landing/_components/live-stat";
import { landingManrope, landingSora } from "@/app/_landing/_lib/fonts";
import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/_components/design-chrome";
import {
  BODY,
  BRAND,
  BRAND_FILL,
  BRAND_PANEL,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  DISPLAY_LG,
  DISPLAY_XL,
  FAINT,
  HERO_A,
  HERO_B,
  HERO_MID,
  INK,
  LEDE,
  LINE,
  MUTED,
  PANEL,
  RADIUS,
  RULE,
  SANS,
  SHELL,
  STRONG,
  WELL,
  WHITE,
  cardStyle,
  eyebrow,
  ghostButton,
  solidButton,
} from "@/app/_landing/_lib/design";
import { PLAN_ORDER, planTier, type OrgPlan } from "@/lib/billing/plans";
import { leadPost, otherPosts } from "@/lib/blog";
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
 * The canvas is the source of truth for the look; `app/_landing/_lib/design.ts` holds
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
// Only weights used by the above-the-fold marketing canvas are loaded here. The
// deferred product demo falls back to a system monospace/display stack for its
// telemetry labels instead of making those fonts part of the first render.
/* Keys, not labels: a module constant is evaluated at import, before any
   locale exists. The render translates them. */
const STATS: {
  labelKey: MessageKey;
  value: number;
  suffix?: string;
  noteKey: MessageKey;
  delta?: string;
  brand?: boolean;
  icon: "users" | "centers" | "tasks" | "checks";
}[] = [
  {
    labelKey: "lp.statNew",
    value: 1100,
    suffix: "+",
    // delta: "12.4%",
    noteKey: "lp.statNewNote",
    icon: "users",
  },
  {
    labelKey: "lp.statCenters",
    value: 2,
    noteKey: "lp.statCentersNote",
    icon: "centers",
  },
  {
    labelKey: "lp.statUsers",
    value: 3000,
    suffix: "+",
    noteKey: "lp.statUsersNote",
    icon: "checks",
  },
  {
    labelKey: "lp.statTasks",
    value: 6500,
    suffix: "+",
    noteKey: "lp.statTasksNote",
    brand: true,
    icon: "tasks",
  },
];

/**
 * The landing page's metadata, per locale.
 *
 * ⚠️ THE DEFAULT LOCALE KEEPS THE BARE URL — and the default is now Uzbek, so
 * `/` answers in Uzbek and English moved to `/en`. `/` is the page Google has
 * indexed, the one every backlink points at and the one `sitemap.ts` lists;
 * putting the default under a prefix would throw that away for a tidier tree.
 * The other two sit under a prefix, which is the pattern Google documents for
 * "default locale unprefixed".
 *
 * `alternates.languages` is what tells a crawler the three are the same page in
 * different languages — without it each one competes with the others as
 * near-duplicate content.
 *
 * ⚠️ `x-default` POINTS AT ENGLISH, NOT AT `/`. It is the page for a visitor
 * whose language matches none of the three, and that visitor is not Uzbek — a
 * Turkish or German searcher should land on English, not on the local-market
 * page. It is the one place where the default locale and the fallback locale
 * deliberately part company; `SOURCE_LOCALE` is the same distinction in the
 * dictionary layer.
 */
export function landingMetadata(locale: Locale): Metadata {
  const path = locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
  /* The title and description are what a searcher actually reads in the
     results, so they are translated too — a Russian page listed with an English
     snippet is the version nobody clicks. */
  const t = translator(locale);
  return {
    title: t("lp.metaTitle"),
    description: t("lp.metaDesc"),
    keywords: SEO_KEYWORDS,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(
          LOCALES.map((l) => [HTML_LANG[l], l === DEFAULT_LOCALE ? "/" : `/${l}`]),
        ),
        "x-default": SOURCE_LOCALE === DEFAULT_LOCALE ? "/" : `/${SOURCE_LOCALE}`,
      },
    },
    openGraph: {
      type: "website",
      url: path,
      locale: HTML_LANG[locale],
      title: t("lp.metaTitleShort"),
      description: t("lp.metaDesc"),
      images: [
        {
          url: PREVIEW_IMAGE,
          width: 1200,
          height: 630,
          alt: t("lp.metaAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("lp.metaTitleShort"),
      description: t("lp.metaDesc"),
      images: [PREVIEW_IMAGE],
    },
  };
}

/**
 * The landing page itself, rendered by three routes: `/`, `/en` and `/ru`.
 *
 * ⚠️ IT TAKES ITS LOCALE FROM THE URL, NOT FROM THE COOKIE, and that is the
 * whole reason this file moved out of `app/page.tsx`. A cookie is invisible to
 * a crawler: Googlebot sends no `ep-locale`, so a cookie-only site has exactly
 * one indexable version however many languages it renders. A path segment is
 * something a crawler can follow, an `hreflang` can point at, and a user can
 * link to.
 *
 * The provider is re-declared here with `initial` so the client chrome inside
 * (the language picker, the theme toggle) starts in the page's language rather
 * than the visitor's cookie — on `/en` the page IS English, whatever the cookie
 * says. The root layout's provider stays for every other public route.
 */
export function LandingPage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const site = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organization`,
        name: SITE_NAME,
        url: site,
        description: t("lp.metaDesc"),
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
        description: t("lp.metaDesc"),
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
            // ⚠️ Not `/pricing`: that route is signed-in only and 307s every
            // crawler to /sign-in (see app/sitemap.ts). The public prices are
            // the landing page's own section.
            url: `${site}/#pricing`,
          };
        }),
      },
    ],
  };

  return (
    /* ⚠️ `pin`, NOT `initial`: the page's OWN locale, and the cookie does not
       get a vote here. On /en the page is English whatever `ep-locale` says, so
       the client chrome inside — the picker, the theme toggle — has to stay
       there too, not just start there. With `initial` the chrome read the
       cookie straight after hydration and a visitor who had once chosen English
       got an Uzbek page wearing an English header. Nested inside the root
       layout's provider, which keeps serving every other public route. */
    <LocaleProvider pin={locale}>
      {/* ⚠️ `<html lang>` IS SET BY THE ROOT LAYOUT TO THE *DEFAULT* LOCALE —
          it is a static layout and cannot read the cookie — so the statically
          generated /en and /ru would ship claiming to be Uzbek: wrong for a
          screen reader, which picks its voice from this attribute, and for the
          browser's own offer to translate the page. The provider
          corrects it after hydration; this corrects it before first paint, the
          same trick and for the same reason as the theme's no-flash script.

          The real fix is a `[locale]` segment at the ROOT so the layout owns the
          attribute, which means moving every public route under it. That is a
          bigger change than this page and is not sneaking in with it. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[locale])}`,
        }}
      />
      <div
        className={`${landingSora.variable} ${landingManrope.variable}`}
        style={{ background: PANEL, fontFamily: SANS, color: INK, minHeight: "100%" }}
      >
        <style>{DESIGN_CSS}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SiteHeader />
        <main>
          <Hero t={t} />
          <Stats t={t} />
          <HeroProcessDemo />
          <DemoSection t={t} />
          <BlogSection t={t} locale={locale} />
          <ResultsSection t={t} />
          <Platform t={t} />
          <Pricing t={t} />
          <Faq t={t} />
          <FinalCta t={t} />
        </main>
        <CentersBand />
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}

/* ── hero ──────────────────────────────────────────────────────────────────── */

function Hero({ t }: { t: Translate }) {
  return (
    <section
      style={{
        ...SHELL,
        // The island header is sticky and occupies its own space, so the hero no
        // longer has to clear a bar — it just needs room to breathe under it.
        padding: "clamp(44px,6vw,76px) 28px 48px",
        display: "grid",
        // Still wrapped in `min()`: at 460px flat, a single column is 460px wide
        // inside a 319px phone and the page scrolls sideways. responsive.test.ts
        // fails the build if this loses its cap.
        gridTemplateColumns: "repeat(auto-fit,minmax(min(460px,100%),1fr))",
        gap: 72,
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
            style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND_FILL }}
          />
          {t("lp.eyebrow")}
        </div>

        {/* `nowrap` on the coloured run is the whole trick. "IELTS & CEFR" is one
            phrase and one colour, and letting it break put "& CEFR" alone at the
            head of a line — the burgundy split across the fold, which read as a
            mistake rather than as emphasis. Held together, the colour lands on a
            single unbroken phrase wherever the line happens to break. */}
        <h1 style={{ ...DISPLAY_XL, margin: "22px 0 0", maxWidth: 620 }}>
          {/* Three pieces so the brand words can stay on one line and keep their
              colour, while the sentence around them is free to reorder — Uzbek
              and Russian both put the qualifier before the noun, and a single
              translated sentence could not hold the coloured span in place. */}
          {t("lp.heroA")}{" "}
          <span style={{ color: BRAND, whiteSpace: "nowrap" }}>{t("lp.heroB")}</span>{" "}
          {t("lp.heroC")}
        </h1>

        <p style={{ ...LEDE, maxWidth: 600, margin: "24px 0 0" }}>{t("lp.heroLead")}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34 }}>
          <Link
            href="/grade"
            className="lp-solid"
            style={{ ...solidButton(), display: "inline-block" }}
          >
            {t("lp.ctaStart")}
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
            {t("lp.ctaHow")}
          </Link>
        </div>

        <div style={{ ...eyebrow(), marginTop: 26 }}>{t("lp.noCard")}</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          {SKILL_CHIPS.map((key) => (
            <span
              key={key}
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
              {t(key)}
            </span>
          ))}
        </div>
      </div>

      <Band9Card t={t} />
    </section>
  );
}

function Stats({ t }: { t: Translate }) {
  return (
    <section style={{ ...SHELL, padding: "24px 28px 40px" }}>
      <LiveStatsStyles />
      <div
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: RADIUS.card,
          background: PANEL,
          boxShadow: "0 12px 40px rgba(18,19,23,0.04)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(200px,100%),1fr))",
        }}
      >
        {STATS.map((c, i) => (
          <LiveStat
            key={c.labelKey}
            label={t(c.labelKey)}
            value={c.value}
            suffix={c.suffix}
            note={t(c.noteKey)}
            icon={c.icon}
            brand={c.brand}
            delta={c.delta}
            isLast={i === STATS.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

/** The four skill chips under the hero. Same keys the sidebar and the skill
 *  cards use — a learner should not meet three different words for "Reading". */
const SKILL_CHIPS: MessageKey[] = ["nav.writing", "nav.reading", "nav.listening", "nav.speaking"];

/* ── platform ──────────────────────────────────────────────────────────────── */

/* KEYS, NOT COPY. The skill NAME reuses the nav key the rest of the app already
   translates — one word, one translation, rather than a second "Writing" that
   can drift from the sidebar's. The bodies are marketing copy and get their
   own. What stays English either way is the exam vocabulary inside them (Task 1,
   TR/CC/LR/GRA, Part 2): those are the names on the real paper. */
const SKILLS: { nameKey: MessageKey; icon: string; bodyKey: MessageKey; href: string }[] = [
  {
    nameKey: "nav.writing",
    icon: "✎",
    bodyKey: "lp.skillWritingBody",
    href: "/ielts-writing-practice",
  },
  {
    nameKey: "nav.reading",
    icon: "▤",
    bodyKey: "lp.skillReadingBody",
    href: "/ielts-reading-practice",
  },
  {
    nameKey: "nav.listening",
    icon: "◷",
    bodyKey: "lp.skillListeningBody",
    href: "/ielts-listening-practice",
  },
  {
    nameKey: "nav.speaking",
    icon: "✦",
    bodyKey: "lp.skillSpeakingBody",
    href: "/ielts-speaking-practice",
  },
];

const COACHES: { nameKey: MessageKey; bodyKey: MessageKey }[] = [
  { nameKey: "lp.coachWriting", bodyKey: "lp.coachWritingBody" },
  { nameKey: "lp.coachReading", bodyKey: "lp.coachReadingBody" },
  { nameKey: "lp.coachSpeaking", bodyKey: "lp.coachSpeakingBody" },
  { nameKey: "lp.coachStudy", bodyKey: "lp.coachStudyBody" },
];

function Platform({ t }: { t: Translate }) {
  return (
    <section
      id="platform"
      className="lp-below-fold"
      style={{ ...SHELL, padding: "40px 28px 20px" }}
    >
      <div style={eyebrow(true)}>{t("lp.platform")}</div>
      <h2 style={{ ...DISPLAY_LG, margin: "16px 0 0", maxWidth: 860 }}>{t("lp.platformLead")}</h2>
      <p style={{ ...LEDE, maxWidth: 680, margin: "18px 0 0" }}>{t("lp.platformNote")}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))",
          gap: 22,
          marginTop: 28,
        }}
      >
        {SKILLS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="lp-card"
            style={{ ...cardStyle(), color: INK }}
          >
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
                {t(s.nameKey)}
              </h3>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "18px 0 0" }}>
              {t(s.bodyKey)}
            </p>
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
            {t("lp.cefrTitle")}
          </h3>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: BODY,
              margin: "10px 0 0",
              maxWidth: 640,
            }}
          >
            {t("lp.cefrNote")}
          </p>
        </div>
        <Link
          href="/cefr-multilevel-practice"
          className="lp-ghost"
          style={{ ...ghostButton(), display: "inline-block" }}
        >
          {t("lp.cefrCta")}
        </Link>
      </div>

      <Coaching t={t} />
    </section>
  );
}

function Coaching({ t }: { t: Translate }) {
  return (
    <div style={{ ...cardStyle(30), marginTop: 22 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 660 }}>
          <div style={{ ...eyebrow(true), color: BRAND }}>{t("lp.coachEyebrow")}</div>
          <h3
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 27,
              letterSpacing: "-0.02em",
              margin: "12px 0 0",
              textWrap: "pretty",
            }}
          >
            {t("lp.coachTitle")}
          </h3>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, color: BODY, margin: "10px 0 0" }}>
            {t("lp.coachNote")}
          </p>
        </div>
        <Link
          href="/how-to-use"
          className="lp-ghost"
          style={{ ...ghostButton(), display: "inline-block" }}
        >
          {t("lp.coachCta")}
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(230px,100%),1fr))",
          gap: 18,
          marginTop: 26,
        }}
      >
        {COACHES.map((c) => (
          <div
            key={c.nameKey}
            style={{
              background: WELL,
              border: `1px solid ${LINE}`,
              borderRadius: 16,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16.5, color: INK }}>
              {t(c.nameKey)}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: "8px 0 0" }}>
              {t(c.bodyKey)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLAN_CTA: Record<OrgPlan, MessageKey> = {
  trial: "price.ctaTrial",
  starter: "price.ctaStarter",
  pro: "price.ctaPro",
  enterprise: "price.ctaEnterprise",
};

/**
 * The feature lists, per plan, as keys.
 *
 * ⚠️ THE COPY STILL LIVES IN `lib/billing/plans.ts` AND THIS MUST MATCH IT. That
 * module is the single definition the quota code, the checkout and the billing
 * screens all read, and it is not the place for four languages — but a price
 * card whose features are the only English left on a translated page is exactly
 * the half-done switch this pass exists to fix. So the English there stays
 * canonical and this maps it, one key per line, IN THE SAME ORDER. Add a
 * feature there and it renders in English here until a key joins it, which is
 * the visible-failure side of the trade.
 */
const PLAN_FEATURES: Record<OrgPlan, MessageKey[]> = {
  trial: ["price.trial1", "price.trial2", "price.trial3"],
  starter: [
    "price.starter1",
    "price.starter2",
    "price.starter3",
    "price.starter4",
    "price.starter5",
  ],
  pro: ["price.pro1", "price.pro2", "price.pro3", "price.pro4", "price.pro5"],
  enterprise: ["price.ent1", "price.ent2", "price.ent3"],
};

/** The plan NAMES stay in English — `Standard`, `Pro` and `Enterprise` are what
 *  the invoice, the Stripe dashboard and the support conversation call them, and
 *  a plan whose name changes with the interface language is a plan nobody can
 *  ask about. `Free` is the exception: it is a common word rather than a billed
 *  product, and it appears where a price should be. */
const PLAN_NAME: Partial<Record<OrgPlan, MessageKey>> = { trial: "price.freeName" };

function Pricing({ t }: { t: Translate }) {
  return (
    <section id="pricing" className="lp-below-fold" style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <div style={eyebrow(true)}>{t("lp.pricing")}</div>
      <h2 style={{ ...DISPLAY_LG, margin: "16px 0 0" }}>{t("lp.pricingLead")}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(250px,100%),1fr))",
          gap: 22,
          marginTop: 28,
        }}
      >
        {PLAN_ORDER.map((id) => {
          /* `tier`, not `t` — this used to shadow the translate function for the
             whole card body, which is why nothing inside it could be
             translated without renaming first. */
          const tier = planTier(id);
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
                  {PLAN_NAME[id] ? t(PLAN_NAME[id]) : tier.name}
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
                    {t("price.popular")}
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
                {tier.price === null
                  ? "—"
                  : tier.price === 0
                    ? t("price.freePrice")
                    : `$${tier.price}`}
                {tier.price ? (
                  <span style={{ fontSize: 15, fontWeight: 600, color: MUTED, fontFamily: SANS }}>
                    {tier.months && tier.months > 1
                      ? t("price.perMonths", { n: tier.months })
                      : t("price.perMonth")}
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
                {PLAN_FEATURES[id].map((f) => (
                  <li key={f} style={{ display: "flex", gap: 10, fontSize: 15, color: STRONG }}>
                    <span aria-hidden style={{ color: BRAND, fontWeight: 700 }}>
                      →
                    </span>
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-in"
                className={popular ? "lp-solid" : "lp-ghost"}
                style={{
                  ...(popular ? solidButton() : ghostButton()),
                  marginTop: 22,
                  textAlign: "center",
                  display: "block",
                  padding: "15px 24px",
                }}
              >
                {t(PLAN_CTA[id])}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── faq ───────────────────────────────────────────────────────────────────── */

/* Keys, not copy — and the JSON-LD below reads the same list, so the FAQ a
   crawler sees on /en is English too rather than Uzbek structured data under a
   translated page. */
const FAQ: { qKey: MessageKey; aKey: MessageKey }[] = [
  { qKey: "lp.faq1q", aKey: "lp.faq1a" },
  { qKey: "lp.faq2q", aKey: "lp.faq2a" },
  { qKey: "lp.faq3q", aKey: "lp.faq3a" },
  { qKey: "lp.faq4q", aKey: "lp.faq4a" },
  { qKey: "lp.faq5q", aKey: "lp.faq5a" },
];

function Faq({ t }: { t: Translate }) {
  return (
    <section className="lp-below-fold" style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <div style={eyebrow(true)}>{t("lp.faqEyebrow")}</div>
      <h2 style={{ ...DISPLAY_LG, margin: "16px 0 28px" }}>{t("lp.faqTitle")}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
          gap: 22,
        }}
      >
        {FAQ.map((f) => (
          <div key={f.qKey} style={cardStyle()}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, margin: 0 }}>
              {t(f.qKey)}
            </h3>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "12px 0 0" }}>
              {t(f.aKey)}
            </p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: FAINT, lineHeight: 1.55, margin: "28px 0 0" }}>
        {t("lp.disclaimer")}
      </p>
    </section>
  );
}

/** Section head in the canvas's idiom: eyebrow, display heading, one lede line. */
function Head({ eyebrow: label, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <>
      <div style={eyebrow(true)}>{label}</div>
      <h2 style={{ ...DISPLAY_LG, margin: "16px 0 0", maxWidth: 900 }}>{title}</h2>
      <p style={{ ...LEDE, maxWidth: 700, margin: "18px 0 0" }}>{sub}</p>
    </>
  );
}

function DemoSection({ t }: { t: Translate }) {
  return (
    <section id="demo" className="lp-below-fold" style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <Head eyebrow={t("lp.demoEyebrow")} title={t("lp.demoTitle")} sub={t("lp.demoSub")} />
      <div style={{ marginTop: 36 }}>
        <DemoTabs tabs={DEMO_TABS} />
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link
          href="/demo"
          className="lp-ghost"
          style={{ ...ghostButton(), display: "inline-block", fontSize: 15, padding: "13px 24px" }}
        >
          {t("lp.openDemo")}
        </Link>
      </div>
    </section>
  );
}

/**
 * The newest writing from /blog: the lead story on the left, the next three as
 * rows on the right, stacking on a phone.
 *
 * The CHROME follows the page's locale and the STORIES stay English — they are
 * English articles, and reading them is the point. `blog-stories.tsx` marks the
 * English parts with `lang="en"` so a screen reader on `/` switches voice for
 * them. Static like the rest of the page: the posts are code, so a new post
 * reaches this section with the deploy that publishes it.
 */
function BlogSection({ t, locale }: { t: Translate; locale: Locale }) {
  const lang = HTML_LANG[locale];
  return (
    <section id="blog" className="lp-below-fold" style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <style>{BLOG_CSS}</style>
      <Head eyebrow={t("blog.eyebrow")} title={t("blog.title")} sub={t("blog.sub")} />
      <div className="bl-top" style={{ marginTop: 36 }}>
        <LeadStory post={leadPost()} t={t} lang={lang} layout="stacked" />
        <div className="bl-rows">
          {otherPosts()
            .slice(0, 3)
            .map((p) => (
              <StoryRow key={p.slug} post={p} t={t} lang={lang} />
            ))}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <Link
          href="/blog"
          className="lp-ghost"
          style={{ ...ghostButton(), display: "inline-block", fontSize: 15, padding: "13px 24px" }}
        >
          {t("blog.allStories")} →
        </Link>
      </div>
    </section>
  );
}

function ResultsSection({ t }: { t: Translate }) {
  return (
    <section
      className="lp-below-fold"
      id="results"
      style={{ borderTop: `1px solid ${RULE}`, background: WELL, marginTop: 56 }}
    >
      <div style={{ ...SHELL, padding: "64px 28px" }}>
        <Head eyebrow={t("lp.proofEyebrow")} title={t("lp.proofTitle")} sub={t("lp.proofSub")} />
        <div style={{ marginTop: 36 }}>
          <DeferredReportShowcase />
        </div>
      </div>
    </section>
  );
}

function FinalCta({ t }: { t: Translate }) {
  return (
    <section className="lp-below-fold" style={{ ...SHELL, padding: "64px 28px 24px" }}>
      <div
        style={{
          background: BRAND_PANEL,
          backgroundImage: `linear-gradient(155deg,${HERO_B} 0%,${HERO_MID} 52%,${HERO_A} 100%)`,
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
          {t("lp.finalTitle")}
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
          {t("lp.finalNote")}
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
              background: PANEL,
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
            {t("lp.gradeFree")}
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
            {t("lp.buildPlan")}
          </Link>
        </div>
      </div>
    </section>
  );
}
