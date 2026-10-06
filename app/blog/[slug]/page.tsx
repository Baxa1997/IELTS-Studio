import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CATEGORY_LABEL,
  findPost,
  relatedPosts,
  SKILL_TOPIC,
  wordCount,
  type BlogPost,
} from "@/lib/blog";
import { loadPost, loadPosts } from "@/lib/blog/store";
import { freePracticePage } from "@/lib/free-practice/links";
import { isFreeSkill } from "@/lib/free-practice/rotation";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

import { ArticleView } from "../_components/article-view";
import { blogAlternates } from "../_lib/metadata";

/**
 * /blog/[slug] — one article. The layout is `ArticleView`, shared with the
 * editor's draft preview; this page adds what only a published article has —
 * its metadata and its structured data.
 *
 * ⚠️ `dynamicParams` IS TRUE NOW, AND THAT IS DELIBERATE. While posts were code,
 * every slug was known at build time and anything else was a 404 by
 * configuration. Posts are rows now (lib/blog/store), published from /admin
 * without a deploy, so a slug the build never saw must still render: the
 * posts known at build time are pre-rendered, a new one renders on its first
 * request, and a slug with no published post is `notFound()` — still a real
 * 404, just decided by the database instead of the build.
 *
 * Static and cached under the `blog` tag; a save in /admin refreshes it.
 */
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await loadPosts()).map((p) => ({ slug: p.slug }));
}

const t = translator(SOURCE_LOCALE);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  /* NO `images` HERE, ON PURPOSE. `opengraph-image.tsx` beside this page draws
     a card with the headline, and file-based metadata overrides this object
     anyway — an image listed here would be dead config that looks live. X
     falls back to og:image when there is no twitter:image. */
  return {
    title: post.title,
    description: post.standfirst,
    ...(post.keywords?.length ? { keywords: post.keywords } : {}),
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
  const posts = await loadPosts();
  const post = findPost(posts, (await params).slug);
  if (!post) notFound();

  const url = absoluteUrl(`/blog/${post.slug}`);
  const structuredData = articleGraph(post, url);

  return (
    <div style={{ padding: "clamp(28px,4.5vw,56px) clamp(16px,4vw,28px) 72px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ArticleView post={post} url={url} related={relatedPosts(posts, post)} />
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
 * The practice is `relatedLink` on the page, not a claim inside the article:
 * schema.org gives a WebPage that property and a BlogPosting none like it.
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
  // The free practice the article links to (see FreePracticeNote) — named in
  // the data too, so an answer engine quoting the article can send the reader
  // to the practice rather than only to the text.
  const practice = post.skill && isFreeSkill(post.skill) ? absoluteUrl(freePracticePage(post.skill)) : null;
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
        ...(post.keywords?.length ? { keywords: post.keywords.join(", ") } : {}),
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url, ...(practice ? { relatedLink: [practice] } : {}) },
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
