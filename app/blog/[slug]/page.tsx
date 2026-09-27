import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCover, StoryCard } from "@/app/_landing/_components/blog-stories";
import {
  BRAND,
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
} from "@/app/_landing/_lib/design";
import {
  CATEGORY_LABEL,
  formatPostDate,
  getPost,
  POSTS,
  readingMinutes,
  relatedPosts,
  SKILL_TOPIC,
  wordCount,
  type BlogPost,
} from "@/lib/blog";
import { translator } from "@/lib/i18n";
import { HTML_LANG, SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

import { blogAlternates } from "../_lib/metadata";
import { ArticleBody, KeyPoints, Questions } from "./_components/article-body";

/**
 * /blog/[slug] — one article, laid out for reading: headline, standfirst,
 * byline, cover, then the body at a 720px measure (about 70 characters a line
 * at 18px), and three stories to read next.
 *
 * ⚠️ `dynamicParams = false` IS LOAD-BEARING, for the same reason as on
 * `app/[locale]/page.tsx`: every post is known at build time, so an unknown slug
 * must be a real 404 — not a render attempt, and not a page a crawler can be
 * sent to. It also makes every article static.
 */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return POSTS.map((p) => ({ slug: p.slug }));
}

const t = translator(SOURCE_LOCALE);
const LANG = HTML_LANG[SOURCE_LOCALE];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  /* NO `images` HERE, ON PURPOSE. `opengraph-image.tsx` beside this page draws
     a card with the headline, and file-based metadata overrides this object
     anyway — an image listed here would be dead config that looks live. X
     falls back to og:image when there is no twitter:image. */
  return {
    title: post.title,
    description: post.standfirst,
    alternates: blogAlternates(path),
    openGraph: {
      type: "article",
      url: path,
      title: post.title,
      description: post.standfirst,
      locale: "en",
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      section: t(CATEGORY_LABEL[post.category]),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.standfirst,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const url = absoluteUrl(`/blog/${post.slug}`);
  const structuredData = articleGraph(post, url);

  return (
    <div style={{ padding: "clamp(28px,4.5vw,56px) clamp(16px,4vw,28px) 72px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
          <BlogCover
            post={post}
            radius={20}
            priority
            sizes="(max-width: 1000px) 100vw, 960px"
          />
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
          {relatedPosts(post).map((p) => (
            <StoryCard key={p.slug} post={p} t={t} lang={LANG} />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * The page's structured data, as one graph: the article, the breadcrumb trail
 * above it, and — when the post has them — its questions.
 *
 * ⚠️ `@id`S ARE HOW THE PIECES JOIN UP. The author and publisher point at
 * `/#organization`, the node the landing page already publishes, and the post
 * points at the blog's `/blog#blog`. That is what lets a search engine or an
 * answer engine treat EngProgress, its blog and this article as one entity
 * rather than three strings that happen to match.
 *
 * FAQPage no longer earns a rich result in Google for a site like ours (it is
 * reserved for government and health sites since 2023). It is here for the
 * engines that DO read it — Bing, which feeds ChatGPT search and Copilot, and
 * the answer engines that parse Q&A — and it mirrors the visible questions
 * exactly.
 */
function articleGraph(post: BlogPost, url: string) {
  const site = absoluteUrl("/").replace(/\/$/, "");
  const org = { "@type": "Organization", "@id": `${site}/#organization`, name: SITE_NAME, url: site };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.standfirst,
        abstract: post.summary.join(" "),
        datePublished: post.published,
        dateModified: post.updated ?? post.published,
        inLanguage: "en",
        articleSection: t(CATEGORY_LABEL[post.category]),
        ...(post.skill ? { about: { "@type": "Thing", name: SKILL_TOPIC[post.skill] } } : {}),
        wordCount: wordCount(post),
        url,
        mainEntityOfPage: url,
        image: `${url}/opengraph-image`,
        author: org,
        publisher: org,
        isPartOf: { "@type": "Blog", "@id": `${site}/blog#blog`, name: t("blog.indexTitle"), url: `${site}/blog` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("blog.home"), item: `${site}/` },
          { "@type": "ListItem", position: 2, name: t("blog.name"), item: `${site}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
      ...(post.faq?.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: post.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };
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
              <time dateTime={post.updated}>
                {t("blog.updated", { date: formatPostDate(post.updated, LANG) })}
              </time>
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
