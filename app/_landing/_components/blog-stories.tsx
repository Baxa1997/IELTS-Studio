import Image from "next/image";
import Link from "next/link";

import type { Translate } from "@/lib/i18n";
import { CATEGORY_LABEL, formatPostDate, readingMinutes, type BlogPost } from "@/lib/blog";

import { BLOG_COVER, BODY, BRAND, COVER_DOT, DISPLAY, MUTED, SANS } from "../_lib/design";

/**
 * The pieces a list of blog posts is built from, shared by the landing
 * section and the /blog pages so a story looks the same wherever it appears.
 *
 * Server components throughout, with no locale of their own: the caller passes
 * `t` and the `<html lang>` value to format dates in. The landing section
 * passes its page's locale; /blog passes English.
 *
 * ⚠️ THE HEADLINE AND SUMMARY CARRY `lang="en"`, THE META LINE DOES NOT. On `/`
 * the page is Uzbek and the articles are not: without the attribute a screen
 * reader reads an English headline with Uzbek pronunciation rules. The date and
 * "5 min read" ARE in the page's language, so they inherit it.
 */

type StoryProps = {
  post: BlogPost;
  t: Translate;
  /** An `HTML_LANG` value — the language the date is written in. */
  lang: string;
  /** `h2` on the blog front page's lead, `h3` everywhere else. */
  level?: 2 | 3;
};

/* ── the cover ──────────────────────────────────────────────────────────── */

/**
 * The picture above a story: the post's photo when it has one, otherwise a
 * generated cover — the category's colour, a dot grid, a ring, and the post's
 * kicker set large.
 *
 * The generated one is DECORATIVE (`aria-hidden`): its only words are the
 * kicker, and the headline beside it says the same thing better.
 */
export function BlogCover({
  post,
  radius = 16,
  sizes,
  priority = false,
}: {
  post: BlogPost;
  radius?: number;
  /** Passed to `next/image` for a photo; ignored by the generated cover. */
  sizes: string;
  priority?: boolean;
}) {
  if (post.image) {
    return (
      <div className="bl-cover" style={{ borderRadius: radius }}>
        <div className="bl-cover-art">
          <Image
            src={post.image.src}
            alt={post.image.alt}
            fill
            sizes={sizes}
            priority={priority}
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
    );
  }

  const { a, b } = BLOG_COVER[post.category];
  const ring = RINGS[seed(post.slug) % RINGS.length];
  return (
    <div className="bl-cover" aria-hidden style={{ borderRadius: radius }}>
      <div
        className="bl-cover-art"
        style={{
          backgroundImage: `radial-gradient(${COVER_DOT} 1.1px, transparent 1.6px), linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
          backgroundSize: "16px 16px, 100% 100%",
        }}
      >
        <span className="bl-ring" style={ring} />
        <span className="bl-kicker">{post.cover.kicker}</span>
      </div>
    </div>
  );
}

/* Where the ring sits, picked by the slug so every post keeps the same cover
   from build to build while neighbouring cards still look different. */
const RINGS: React.CSSProperties[] = [
  { top: "-24cqi", right: "-14cqi" },
  { top: "-30cqi", right: "10cqi" },
  { top: "-10cqi", right: "-26cqi" },
];

function seed(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/* ── the line under a headline ─────────────────────────────────────────── */

export function StoryMeta({ post, t, lang }: Omit<StoryProps, "level">) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px 10px",
        fontFamily: SANS,
        fontSize: 13,
        color: MUTED,
      }}
    >
      <span style={{ color: BRAND, fontWeight: 700 }}>{t(CATEGORY_LABEL[post.category])}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.published}>{formatPostDate(post.published, lang)}</time>
      <span aria-hidden>·</span>
      <span>{t("blog.minRead", { n: readingMinutes(post) })}</span>
    </div>
  );
}

function Headline({
  post,
  level,
  size,
}: {
  post: BlogPost;
  level: 2 | 3;
  size: string | number;
}) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <H
      lang="en"
      style={{
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        margin: 0,
        textWrap: "balance",
      }}
    >
      <Link href={`/blog/${post.slug}`} className="bl-hl">
        {post.title}
      </Link>
    </H>
  );
}

function Dek({ post, size = 16 }: { post: BlogPost; size?: number }) {
  return (
    <p
      lang="en"
      className="bl-dek"
      style={{ fontFamily: SANS, fontSize: size, lineHeight: 1.6, color: BODY, margin: 0 }}
    >
      {post.standfirst}
    </p>
  );
}

/* ── the three layouts ─────────────────────────────────────────────────── */

/**
 * The lead story. `stacked` puts the cover above the text (the landing
 * section's left column); `wide` puts it beside the text (the blog front page),
 * collapsing to stacked below 900px.
 */
export function LeadStory({
  post,
  t,
  lang,
  level = 3,
  layout,
  priority = false,
}: StoryProps & { layout: "stacked" | "wide"; priority?: boolean }) {
  const wide = layout === "wide";
  return (
    <article
      className={wide ? "bl-story bl-lead" : "bl-story"}
      style={wide ? undefined : { display: "flex", flexDirection: "column", gap: 18 }}
    >
      <BlogCover
        post={post}
        radius={20}
        priority={priority}
        sizes={wide ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 900px) 100vw, 55vw"}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <StoryMeta post={post} t={t} lang={lang} />
        <Headline post={post} level={level} size={wide ? "clamp(26px,3.2vw,38px)" : "clamp(23px,2.4vw,29px)"} />
        <Dek post={post} size={wide ? 17.5 : 16.5} />
      </div>
    </article>
  );
}

/** A compact row — thumbnail beside headline. The landing section's right column. */
export function StoryRow({ post, t, lang, level = 3 }: StoryProps) {
  return (
    <article className="bl-story bl-row">
      <BlogCover post={post} radius={12} sizes="(max-width: 900px) 40vw, 18vw" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <Headline post={post} level={level} size={17} />
        <StoryMeta post={post} t={t} lang={lang} />
      </div>
    </article>
  );
}

/** A grid card — cover above headline, turning into a row on a phone. */
export function StoryCard({ post, t, lang, level = 3 }: StoryProps) {
  return (
    <article className="bl-story bl-card">
      <BlogCover post={post} radius={14} sizes="(max-width: 560px) 38vw, (max-width: 1200px) 50vw, 380px" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <StoryMeta post={post} t={t} lang={lang} />
        <Headline post={post} level={level} size="clamp(17px,1.6vw,20px)" />
        <Dek post={post} size={15.5} />
      </div>
    </article>
  );
}
