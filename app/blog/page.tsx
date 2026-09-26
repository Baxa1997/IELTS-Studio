import type { Metadata } from "next";

import { LeadStory, StoryCard } from "@/app/_landing/_components/blog-stories";
import { DISPLAY_LG, FAINT, INK, LEDE, RULE, eyebrow } from "@/app/_landing/_lib/design";
import { leadPost, otherPosts, POSTS } from "@/lib/blog";
import { translator } from "@/lib/i18n";
import { HTML_LANG, SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl, PREVIEW_IMAGE, SITE_NAME } from "@/lib/seo";

/**
 * /blog — the front page: the lead story wide across the top, then every other
 * post, newest first, in a grid that turns into a list of rows on a phone.
 *
 * Rendered in ENGLISH from the dictionary, not from the visitor's cookie: the
 * articles are English, and reading the cookie would make this page dynamic
 * for the sake of a few labels. See the note on `lang` in `layout.tsx`.
 */

const t = translator(SOURCE_LOCALE);
const LANG = HTML_LANG[SOURCE_LOCALE];

export const metadata: Metadata = {
  title: t("blog.metaTitle"),
  description: t("blog.metaDesc"),
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: t("blog.metaTitle"),
    description: t("blog.metaDesc"),
    images: [{ url: PREVIEW_IMAGE, width: 1200, height: 630, alt: t("blog.indexTitle") }],
  },
  twitter: {
    card: "summary_large_image",
    title: t("blog.metaTitle"),
    description: t("blog.metaDesc"),
    images: [PREVIEW_IMAGE],
  },
};

export default function BlogIndexPage() {
  const lead = leadPost();
  const rest = otherPosts();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t("blog.indexTitle"),
    description: t("blog.metaDesc"),
    url: absoluteUrl("/blog"),
    inLanguage: "en",
    publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: absoluteUrl(`/blog/${p.slug}`),
      datePublished: p.published,
      dateModified: p.updated ?? p.published,
    })),
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(32px,5vw,60px) clamp(16px,4vw,28px) 72px",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header style={{ marginBottom: "clamp(28px,4vw,44px)" }}>
        <div style={eyebrow(true)}>{t("blog.name")}</div>
        <h1 style={{ ...DISPLAY_LG, margin: "14px 0 0" }}>{t("blog.indexTitle")}</h1>
        <p style={{ ...LEDE, maxWidth: 680, margin: "14px 0 0" }}>{t("blog.indexLead")}</p>
      </header>

      <LeadStory post={lead} t={t} lang={LANG} layout="wide" level={2} priority />

      {rest.length > 0 ? (
        <section style={{ marginTop: "clamp(40px,6vw,64px)" }}>
          {/* A heavy rule over a bold section name — the newspaper convention
              for "a new section starts here", and quieter than a card. */}
          <h2
            style={{
              fontFamily: DISPLAY_LG.fontFamily,
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: INK,
              margin: "0 0 24px",
              paddingTop: 14,
              borderTop: `3px solid ${INK}`,
            }}
          >
            {t("blog.latest")}
          </h2>
          <div className="bl-grid">
            {rest.map((p) => (
              <StoryCard key={p.slug} post={p} t={t} lang={LANG} />
            ))}
          </div>
        </section>
      ) : null}

      <p
        style={{
          fontSize: 13,
          color: FAINT,
          lineHeight: 1.55,
          margin: "48px 0 0",
          paddingTop: 18,
          borderTop: `1px solid ${RULE}`,
        }}
      >
        {t("lp.disclaimer")}
      </p>
    </div>
  );
}
