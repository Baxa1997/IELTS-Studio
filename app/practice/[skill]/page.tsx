import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StoryCard } from "@/app/_landing/_components/blog-stories";
import { MorePracticeBanner } from "@/app/_landing/_components/practice-cards";
import { BODY, DISPLAY, FAINT, GREEN, INK, LEDE, LINE, RULE, SANS, eyebrow } from "@/app/_landing/_lib/design";
import { postsForSkill } from "@/lib/blog";
import { loadPosts } from "@/lib/blog/store";
import { practiceList } from "@/lib/free-practice/assignment";
import { practiceFaq } from "@/lib/free-practice/faq";
import { FREE_PAGE_DESCRIPTION, FREE_PAGE_TITLE, freePracticePage, signInFor } from "@/lib/free-practice/links";
import { FREE_SKILLS, isFreeSkill, type FreeSkill } from "@/lib/free-practice/rotation";
import { translator, type MessageKey } from "@/lib/i18n";
import { HTML_LANG, SOURCE_LOCALE } from "@/lib/i18n/locales";

import { FreePracticeGrid } from "./_components/free-practice-grid";
import { PracticeFaq } from "./_components/practice-faq";
import { practiceName } from "./_lib/labels";
import { practiceGraph } from "./_lib/structured-data";

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
 * English chrome, like the blog: the practice itself is English, and a page
 * that switched language halfway down would read as a mistake.
 *
 * FOUND, NOT ONLY LISTED (2026-10-04): each page carries its own description,
 * a share card (./opengraph-image.tsx), structured data for the page, its
 * practices and its questions (./_lib/structured-data), a visible FAQ that the
 * data mirrors, and the blog's articles on the same skill — the other half of
 * the link every such article makes back to here.
 */
export const dynamicParams = false;

export function generateStaticParams(): { skill: FreeSkill }[] {
  return FREE_SKILLS.map((skill) => ({ skill }));
}

const t = translator(SOURCE_LOCALE);

const TITLE = FREE_PAGE_TITLE;
const LANG = HTML_LANG[SOURCE_LOCALE];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skill: string }>;
}): Promise<Metadata> {
  const { skill } = await params;
  if (!isFreeSkill(skill)) return {};
  const title = t(TITLE[skill]);
  const description = t(FREE_PAGE_DESCRIPTION[skill]);
  const path = freePracticePage(skill);
  /* No `images`: ./opengraph-image.tsx draws this page's card, and file-based
     metadata wins over anything listed here. */
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description, locale: "en" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FreePracticePage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  if (!isFreeSkill(skill)) notFound();

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
        <p style={{ ...LEDE, maxWidth: 680, margin: "14px 0 0" }}>{t("free.pageLead")}</p>
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

      <OtherSkills current={skill} />

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
              <StoryCard key={p.slug} post={p} t={t} lang={LANG} />
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
function OtherSkills({ current }: { current: FreeSkill }) {
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
