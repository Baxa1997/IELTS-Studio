import Link from "next/link";

import { BlogCover, StoryCard } from "@/app/_landing/_components/blog-stories";
import {
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  FAINT,
  FIELD,
  HERO_A,
  HERO_B,
  HERO_MID,
  INK,
  LINE,
  MUTED,
  PANEL,
  RADIUS,
  RULE,
  SANS,
  WHITE,
  eyebrow,
} from "@/app/_landing/_lib/design";
import { CATEGORY_LABEL, formatPostDate, readingMinutes, type BlogPost } from "@/lib/blog";
import { FREE_PAGE_TITLE, freePracticePage } from "@/lib/free-practice/links";
import { isFreeSkill } from "@/lib/free-practice/rotation";
import { translator } from "@/lib/i18n";
import { HTML_LANG, SOURCE_LOCALE } from "@/lib/i18n/locales";

import { ArticleBody, KeyPoints, Questions } from "./article-body";

/**
 * One article as a reader sees it: headline, standfirst, byline, cover, the
 * body at a 720px measure (about 70 characters a line at 18px), and three
 * stories to read next.
 *
 * Its own component, not the body of `/blog/[slug]`, because the editor's
 * draft preview (`/blog/preview/[id]`) must show a post EXACTLY as it will
 * publish — a second copy of this layout would be a preview of something else.
 */

const t = translator(SOURCE_LOCALE);
const LANG = HTML_LANG[SOURCE_LOCALE];

export function ArticleView({ post, url, related }: { post: BlogPost; url: string; related: BlogPost[] }) {
  return (
    <>
      <article>
        <header className="bl-col">
          <nav
            aria-label={t("blog.name")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Link href="/blog" className="bl-crumb">
              {t("blog.name")}
            </Link>
            <span aria-hidden style={{ color: FAINT }}>
              /
            </span>
            <span style={{ color: BRAND }}>{t(CATEGORY_LABEL[post.category])}</span>
          </nav>

          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: "clamp(30px,4.4vw,46px)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: INK,
              margin: "16px 0 0",
              textWrap: "balance",
            }}
          >
            {post.title}
          </h1>

          {/* The standfirst: the bold opening that tells a skimmer whether to
              keep going. Heavier and larger than the body on purpose. */}
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: "clamp(18.5px,1.9vw,21px)",
              lineHeight: 1.5,
              color: INK,
              margin: "18px 0 0",
              textWrap: "pretty",
            }}
          >
            {post.standfirst}
          </p>

          <Byline post={post} url={url} />
        </header>

        <figure style={{ maxWidth: 960, margin: "clamp(24px,3.5vw,36px) auto 0" }}>
          <BlogCover post={post} radius={20} priority sizes="(max-width: 1000px) 100vw, 960px" />
          {post.image?.credit ? (
            <figcaption style={{ marginTop: 8, fontSize: 13, color: MUTED }}>
              {t("blog.photo", { credit: post.image.credit })}
            </figcaption>
          ) : null}
        </figure>

        <div className="bl-col" style={{ marginTop: "clamp(28px,4vw,40px)" }}>
          <KeyPoints points={post.summary} title={t("blog.inShort")} />
          <ArticleBody blocks={post.body} />
          {post.faq?.length ? <Questions faq={post.faq} title={t("blog.faqTitle")} /> : null}
          <FreePracticeNote post={post} />
          {post.cta ? <PracticeCta cta={post.cta} /> : null}
          <p
            style={{
              fontSize: 13,
              color: FAINT,
              lineHeight: 1.55,
              margin: "36px 0 0",
              paddingTop: 18,
              borderTop: `1px solid ${RULE}`,
            }}
          >
            {t("lp.disclaimer")}
          </p>
        </div>
      </article>

      {related.length > 0 ? (
        <section style={{ maxWidth: 1200, margin: "clamp(48px,7vw,80px) auto 0" }}>
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
            {t("blog.related")}
          </h2>
          <div className="bl-grid">
            {related.map((p) => (
              <StoryCard key={p.slug} post={p} t={t} lang={LANG} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * Author, date and reading time on the left; sharing on the right.
 *
 * TELEGRAM, AND ONLY TELEGRAM. It is where this audience passes links around —
 * the bot, the centres' groups and the parents all live there — and its share
 * URL is a plain link, so the button needs no script and the page stays static.
 */
function Byline({ post, url }: { post: BlogPost; url: string }) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        marginTop: 24,
        padding: "14px 0",
        borderTop: `1px solid ${LINE}`,
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, color: INK }}>{t("blog.by", { author: post.author })}</div>
        <div style={{ color: MUTED }}>
          <time dateTime={post.published}>{formatPostDate(post.published, LANG)}</time>
          {post.updated ? (
            <>
              {" · "}
              <time dateTime={post.updated}>{t("blog.updated", { date: formatPostDate(post.updated, LANG) })}</time>
            </>
          ) : null}
          {" · "}
          {t("blog.minRead", { n: readingMinutes(post) })}
        </div>
      </div>
      <a
        href={share}
        target="_blank"
        rel="noopener noreferrer"
        className="bl-share"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 14,
          color: INK,
          textDecoration: "none",
          border: `1px solid ${FIELD}`,
          borderRadius: RADIUS.pill,
          padding: "9px 16px",
          whiteSpace: "nowrap",
        }}
      >
        <span aria-hidden>↗</span>
        {t("blog.shareTelegram")}
      </a>
    </div>
  );
}

/**
 * The free practice for the article's skill — the page where a reader can try,
 * today and without an account, what the article just taught.
 *
 * DERIVED FROM `post.skill`, like "From the blog" on the skill pages, so the
 * two halves of the link always exist together: an article about Reading
 * points at the free Reading practice, and that page lists the article. A
 * skill with no free practice (Speaking) shows nothing.
 */
function FreePracticeNote({ post }: { post: BlogPost }) {
  if (!post.skill || !isFreeSkill(post.skill)) return null;
  return (
    <aside
      style={{
        marginTop: 36,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        padding: "18px 20px",
        borderRadius: 16,
        background: BRAND_TINT,
        border: `1px solid ${BRAND_TINT_LINE}`,
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 300px" }}>
        <div style={eyebrow(true)}>{t("blog.practiceEyebrow")}</div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 19,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            color: INK,
            margin: "8px 0 0",
          }}
        >
          {t(FREE_PAGE_TITLE[post.skill])}
        </div>
        <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.55, color: MUTED, margin: "6px 0 0" }}>
          {t("blog.practiceBody")}
        </p>
      </div>
      <Link
        href={freePracticePage(post.skill)}
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 15,
          color: BRAND,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {t("free.seeToday")} →
      </Link>
    </aside>
  );
}

/** Where to practise what the article taught — the landing page's final-CTA
 *  panel, at article width. White on the hero stops, which the palette test
 *  holds to AA in both themes. */
function PracticeCta({ cta }: { cta: NonNullable<BlogPost["cta"]> }) {
  return (
    <aside
      style={{
        marginTop: 40,
        backgroundImage: `linear-gradient(155deg,${HERO_B} 0%,${HERO_MID} 52%,${HERO_A} 100%)`,
        color: WHITE,
        borderRadius: 20,
        padding: "clamp(24px,4vw,34px)",
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: "clamp(20px,2.4vw,24px)",
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
        }}
      >
        {cta.title}
      </div>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 16,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.84)",
          margin: "10px 0 0",
        }}
      >
        {cta.text}
      </p>
      <Link
        href={cta.href}
        style={{
          display: "inline-block",
          marginTop: 20,
          background: PANEL,
          color: BRAND,
          borderRadius: RADIUS.pill,
          padding: "13px 24px",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        {cta.label} →
      </Link>
    </aside>
  );
}
