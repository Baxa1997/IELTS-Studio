import Link from "next/link";

import {
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  DISPLAY,
  INK,
  LINE,
  MUTED,
  STRONG,
  WELL,
  eyebrow,
} from "@/app/_landing/_lib/design";
import { headingId, type Block, type BlogPost } from "@/lib/blog";
import { parseInline } from "@/lib/blog/inline";
import { youtubeEmbed } from "@/lib/blog/video";

/**
 * A post's body, block by block. Typography lives in `.bl-prose` (blog-css.ts)
 * so the paragraph measure and the phone breakpoint are set in one place; the
 * boxed blocks carry their own frames here.
 */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="bl-prose">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case "p":
      return (
        <p>
          <Inline text={b.text} />
        </p>
      );
    case "h2":
      // An id on every section heading: Google's "Jump to" links and the
      // anchors answer engines cite. `blog.test.ts` keeps them unique per post.
      return (
        <h2 id={headingId(b.text)}>
          <Inline text={b.text} />
        </h2>
      );
    case "h3":
      return (
        <h3 id={headingId(b.text)}>
          <Inline text={b.text} />
        </h3>
      );
    case "image":
      return (
        <figure className="bl-media">
          {/* A plain <img>, not next/image: an article picture has no known
              size, and `fill` would need a sized frame that crops it. Lazy, so
              a long article does not fetch every picture up front. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
          {b.caption ? <figcaption>{b.caption}</figcaption> : null}
        </figure>
      );
    case "video":
      return (
        <figure className="bl-media">
          <div className="bl-video">
            <iframe
              src={youtubeEmbed(b.id)}
              title={b.title || "Video"}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          {b.title ? <figcaption>{b.title}</figcaption> : null}
        </figure>
      );
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return (
        <L>
          {b.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </L>
      );
    }
    case "quote":
      return (
        <figure style={{ margin: "34px 0", paddingLeft: 22, borderLeft: `3px solid ${BRAND}` }}>
          <blockquote
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(20px,2.2vw,24px)",
              lineHeight: 1.4,
              letterSpacing: "-0.015em",
              color: INK,
            }}
          >
            <Inline text={b.text} />
          </blockquote>
          {b.cite ? (
            <figcaption style={{ marginTop: 10, fontSize: 14, color: MUTED }}>{b.cite}</figcaption>
          ) : null}
        </figure>
      );
    case "tip":
      return (
        <aside
          style={{
            margin: "30px 0",
            background: BRAND_TINT,
            border: `1px solid ${BRAND_TINT_LINE}`,
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: BRAND,
            }}
          >
            <Inline text={b.title} />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.65 }}>
            <Inline text={b.text} />
          </p>
        </aside>
      );
    case "example":
      return (
        <figure
          style={{
            margin: "30px 0",
            background: WELL,
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          {b.title ? (
            <figcaption
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 16.5,
                lineHeight: 1.4,
                color: INK,
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <Inline text={b.title} />
            </figcaption>
          ) : null}
          <dl className="bl-ex">
            {b.rows.map((r, i) => (
              <div key={i} style={{ display: "contents" }}>
                <dt>{r.label}</dt>
                <dd>
                  <Inline text={r.text} />
                </dd>
              </div>
            ))}
          </dl>
        </figure>
      );
  }
}

/**
 * "In short" — the post's summary points, in a box between the cover and the
 * body. A reader who stops here has the article; an answer engine that lifts
 * one line gets a sentence that stands on its own (see `summary` in
 * lib/blog/types.ts).
 */
export function KeyPoints({ points, title }: { points: string[]; title: string }) {
  return (
    <aside
      aria-label={title}
      style={{
        margin: "0 0 36px",
        border: `1px solid ${LINE}`,
        borderTop: `3px solid ${BRAND}`,
        borderRadius: 16,
        padding: "18px 22px 20px",
        background: WELL,
      }}
    >
      <div style={{ ...eyebrow(true), color: BRAND }}>{title}</div>
      <ul
        style={{
          margin: "12px 0 0",
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {points.map((pt) => (
          <li
            key={pt}
            style={{ display: "flex", gap: 12, fontSize: 16.5, lineHeight: 1.55, color: STRONG }}
          >
            <span aria-hidden style={{ color: BRAND, fontWeight: 700 }}>
              →
            </span>
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * "Questions readers ask" — each question a heading, each answer a paragraph,
 * so the page shows exactly what the FAQPage data says. Structured data that
 * does not match visible text is what search engines are told to ignore.
 */
export function Questions({ faq, title }: { faq: NonNullable<BlogPost["faq"]>; title: string }) {
  return (
    <section className="bl-prose" aria-labelledby="questions">
      <h2 id="questions">{title}</h2>
      {faq.map((f) => (
        <div key={f.q} style={{ padding: "16px 0", borderTop: `1px solid ${LINE}` }}>
          <h3
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 18.5,
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              color: INK,
              margin: 0,
            }}
          >
            {f.q}
          </h3>
          <p style={{ margin: "8px 0 0" }}>{f.a}</p>
        </div>
      ))}
    </section>
  );
}

/** `**bold**`, `*italic*` and `[label](href)` — see `lib/blog/inline.ts`. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((s, i) => {
        switch (s.kind) {
          case "text":
            return s.text;
          case "strong":
            return <strong key={i}>{s.text}</strong>;
          case "em":
            return <em key={i}>{s.text}</em>;
          case "link":
            // A path of ours goes through next/link; anything else opens in a
            // new tab and gets no referrer or window handle back to this page.
            return s.href.startsWith("/") ? (
              <Link key={i} href={s.href}>
                {s.text}
              </Link>
            ) : (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">
                {s.text}
              </a>
            );
        }
      })}
    </>
  );
}
