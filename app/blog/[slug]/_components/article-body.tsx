import Link from "next/link";

import { BRAND, BRAND_TINT, BRAND_TINT_LINE, DISPLAY, INK, LINE, MUTED, WELL } from "@/app/_landing/_lib/design";
import { parseInline } from "@/lib/blog/inline";
import type { Block } from "@/lib/blog";

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
      return (
        <h2>
          <Inline text={b.text} />
        </h2>
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
