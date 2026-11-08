import type { Metadata } from "next";
import Link from "next/link";

import { StoryCard } from "@/app/_landing/_components/blog-stories";
import { MorePracticeBanner } from "@/app/_landing/_components/practice-cards";
import { PageUpdated } from "@/app/_landing/_components/page-updated";
import { BODY, DISPLAY, FAINT, GREEN, INK, LEDE, LINE, RULE, SANS, eyebrow } from "@/app/_landing/_lib/design";
import { postsForSkill } from "@/lib/blog";
import { loadPosts } from "@/lib/blog/store";
import { practiceList } from "@/lib/free-practice/assignment";
import { practiceFaq } from "@/lib/free-practice/faq";
import {
  FREE_PAGE_DESCRIPTION,
  FREE_PAGE_SEO_TITLE,
  FREE_PAGE_TITLE,
  freePracticePage,
  signInFor,
} from "@/lib/free-practice/links";
import { practiceName } from "@/lib/free-practice/labels";
import { FREE_SKILLS, type FreeSkill } from "@/lib/free-practice/rotation";
import { translator, type MessageKey, type Translate } from "@/lib/i18n";
import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import { previewImage } from "@/lib/seo";

import { practiceFacts, practiceSummary } from "../_lib/facts";
import { LOCALISED_PRACTICE } from "../_lib/locales";
import { practiceGraph } from "../_lib/structured-data";

import { FreePracticeGrid } from "./free-practice-grid";
import { HowItWorks } from "./how-it-works";
import { PracticeFacts } from "./practice-facts";
import { PracticeFaq } from "./practice-faq";

/**
 * /practice/[skill] — the free practice page for one skill: twenty practices
 * picked for this visitor, in the blog's card style, today's new one leading. Any card opens its practice on our free runner (never the
 * dashboard); one practice a day is free, and once it is used the runner says
 * so and recommends signing in (owner, 2026-09-27).
 *
 * WHICH practice sits on each card is this visitor's own (see
 * lib/free-practice/rotation), so the page reads a cookie — which is what makes
 * it render per request; no `dynamic` export is needed or wanted beside
 * `generateStaticParams`. `dynamicParams = false` keeps any
 * other segment, Speaking included, a real 404: Speaking has no free practice,
 * and its card on the landing page goes straight to sign-in.
 *
 * IN ONE LANGUAGE. Rendered by `/practice/<skill>` (English) and, for the skills
 * in LOCALISED_PRACTICE, by `/uz/…` and `/ru/…` (app/[locale]/practice). It was
 * English chrome on every locale until 2026-11-08, on the grounds that the
 * practice itself is English; the owner moved that for CEFR, whose candidates
 * search in Uzbek and Russian. The practices on the cards — their titles and
 * the runner they open — stay English: they are the exam.
 *
 * FOUND, NOT ONLY LISTED (2026-10-04): each page carries its own description,
 * a share card (./opengraph-image.tsx), structured data for the page, its
 * practices and its questions (./_lib/structured-data), a visible FAQ that the
 * data mirrors, and the blog's articles on the same skill — the other half of
 * the link every such article makes back to here.
 */
const TITLE = FREE_PAGE_TITLE;
/** The blog's cards keep the blog's language: the articles are English. */
const POSTS_LANG = HTML_LANG[SOURCE_LOCALE];

export function practiceMetadata(skill: FreeSkill, locale: Locale): Metadata {
  const t = translator(locale);
  // The search headline, not the heading — see FREE_PAGE_SEO_TITLE.
  const title = t(FREE_PAGE_SEO_TITLE[skill]);
  const description = t(FREE_PAGE_DESCRIPTION[skill]);
  const path = freePracticePage(skill);
  const url = localePath(path, locale);
  const localised = LOCALISED_PRACTICE.includes(skill);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      // Only a page that exists in all three languages names the other two —
      // an hreflang pointing at a 404 is worse than none.
      ...(localised
        ? {
            languages: {
              ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localePath(path, l)])),
              "x-default": localePath(path, SOURCE_LOCALE),
            },
          }
        : {}),
    },
    /* The English route draws its own card (../opengraph-image.tsx), and
       file-based metadata wins over anything listed here — so `images` only
       for the localised route, which has no card file of its own. */
    openGraph: {
      type: "website",
      url,
      title,
      description,
      locale: HTML_LANG[locale],
      ...(locale === SOURCE_LOCALE ? {} : { images: [previewImage(title)] }),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function FreePracticeView({ skill, locale }: { skill: FreeSkill; locale: Locale }) {
  const t = translator(locale);
  const [{ items, done }, posts] = await Promise.all([practiceList(skill), loadPosts()]);
  const reading = postsForSkill(posts, skill).slice(0, 3);
  const faq = practiceFaq(skill, t);
  const structuredData = practiceGraph({
    skill,
    title: t(TITLE[skill]),
    description: t(FREE_PAGE_DESCRIPTION[skill]),
    items,
    faq,
    posts: reading,
    name: (item) => practiceName(skill, item, t),
    home: t("blog.home"),
    locale,
  });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(32px,5vw,60px) clamp(16px,4vw,28px) 72px",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header style={{ marginBottom: "clamp(28px,4vw,44px)" }}>
        <div style={eyebrow(true)}>{t("free.pageEyebrow")}</div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontWeight: 500,
            fontSize: "clamp(27px,3.3vw,40px)",
            lineHeight: 1.14,
            letterSpacing: "-0.03em",
            margin: "14px 0 0",
          }}
        >
          {t(TITLE[skill])}
        </h1>
        <PageUpdated path={freePracticePage(skill)} locale={locale} style={{ marginTop: 10 }} />
        {/* Answer-first: what a practice is, how long, how it is marked — the
            paragraph a search snippet or an answer engine quotes. */}
        <p style={{ ...LEDE, maxWidth: 760, margin: "14px 0 0" }}>{practiceSummary(skill, t)}</p>
        <p style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.6, color: BODY, maxWidth: 680, margin: "12px 0 0" }}>
          {t("free.pageLead")}
        </p>
        <PracticeFacts facts={practiceFacts(skill, t)} label={t("free.factsLabel")} />
      </header>

      <MorePracticeBanner skill={skill} t={t} />

      {items.length ? (
        <>
          {/* Today's status: the one free practice is ready, or it is used —
              the second line is the recommendation to sign in, again. */}
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "0 0 18px",
              fontFamily: SANS,
              fontSize: 14.5,
              fontWeight: 600,
              color: done ? BODY : GREEN,
            }}
          >
            <span
              aria-hidden
              style={{ width: 8, height: 8, borderRadius: 999, background: done ? FAINT : GREEN, flex: "none" }}
            />
            {done ? t("free.usedToday") : t("free.availableToday")}
          </p>

          <FreePracticeGrid skill={skill} items={items} t={t} />
        </>
      ) : (
        // A pool with nothing in it yet — CEFR until its library is seeded.
        <p style={{ ...LEDE, margin: "8px 0 0" }}>{t("free.emptyPool")}</p>
      )}

      <HowItWorks t={t} />

      <OtherSkills current={skill} t={t} />

      {reading.length ? (
        <section style={{ marginTop: "clamp(40px,6vw,64px)" }}>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: INK,
              margin: "0 0 24px",
              paddingTop: 14,
              borderTop: `3px solid ${INK}`,
            }}
          >
            {t("free.fromBlog")}
          </h2>
          <div className="bl-grid">
            {reading.map((p) => (
              <StoryCard key={p.slug} post={p} t={t} lang={POSTS_LANG} />
            ))}
          </div>
        </section>
      ) : null}

      <PracticeFaq faq={faq} title={t("free.faqTitle")} />

      <p
        style={{
          fontSize: 13,
          color: FAINT,
          lineHeight: 1.55,
          margin: "40px 0 0",
          paddingTop: 18,
          borderTop: `1px solid ${RULE}`,
        }}
      >
        {t("lp.disclaimer")}
      </p>
    </div>
  );
}

/** The other free skills, and Speaking behind sign-in. */
function OtherSkills({ current, t }: { current: FreeSkill; t: Translate }) {
  const NAME: Record<FreeSkill | "speaking", MessageKey> = {
    writing: "nav.writing",
    reading: "nav.reading",
    listening: "nav.listening",
    cefr: "free.skillCefr",
    speaking: "nav.speaking",
  };
  const links = [
    ...FREE_SKILLS.filter((s) => s !== current).map((s) => ({ href: freePracticePage(s), label: t(NAME[s]) })),
    { href: signInFor("speaking"), label: `${t(NAME.speaking)} · ${t("free.signIn")}` },
  ];
  return (
    <nav
      aria-label={t("free.otherSkills")}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 40 }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: FAINT, marginRight: 4 }}>
        {t("free.otherSkills")}
      </span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="lp-ghost"
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            color: INK,
            textDecoration: "none",
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            padding: "8px 16px",
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
