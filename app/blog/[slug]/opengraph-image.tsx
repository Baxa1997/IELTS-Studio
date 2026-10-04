import { ImageResponse } from "next/og";

import { CATEGORY_LABEL } from "@/lib/blog";
import { loadPost } from "@/lib/blog/store";
import { en } from "@/lib/i18n/messages/en";
import { absoluteUrl } from "@/lib/seo";

import { OG_COVER, OG_INK } from "@/app/_landing/_lib/og-palette";

/**
 * The card a shared article link unfurls into — on Telegram above all, where
 * this audience passes links around, and on WhatsApp, X and LinkedIn.
 *
 * WHY A CARD WITH THE HEADLINE. The generic site preview says "EngProgress"
 * under every article, so a shared link looked like an advert for the product
 * rather than a thing worth reading. A card that carries the headline is the
 * difference between a tap and a scroll-past.
 *
 * Next serves this as og:image for `/blog/[slug]` and it overrides anything
 * `generateMetadata` says (file-based metadata wins). Static: no request-time
 * API is touched, so each card is drawn once and cached — under the post
 * list's `blog` tag, so an edited headline redraws its card.
 *
 * ⚠️ SATORI, NOT A BROWSER. Every element with more than one child needs
 * `display: flex` or the render throws, and only a subset of CSS exists — no
 * `var()`, no grid. Keep additions to flex, borders, gradients and text.
 */

export const alt = "An article on the EngProgress blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Long headlines step down so every one fits in three lines. */
function titleSize(title: string): number {
  if (title.length > 80) return 54;
  if (title.length > 55) return 62;
  return 74;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = await loadPost((await params).slug);
  // A plain 404 rather than notFound(): this is a route handler, not a page,
  // and a Response is the one return it is certain to honour.
  if (!post) return new Response("Not found", { status: 404 });
  const { a, b } = OG_COVER[post.category];
  const host = absoluteUrl("/blog").replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          backgroundImage: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
          color: OG_INK.text,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -170,
            right: -130,
            width: 560,
            height: 560,
            borderRadius: 9999,
            border: `2px solid ${OG_INK.ring}`,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                backgroundColor: OG_INK.mark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              E
            </div>
            <div style={{ display: "flex", marginLeft: 16, fontSize: 34, fontWeight: 700 }}>
              EngProgress
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 9999,
              border: `2px solid ${OG_INK.line}`,
            }}
          >
            {en[CATEGORY_LABEL[post.category]]}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 1020,
            fontSize: titleSize(post.title),
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -1,
          }}
        >
          {post.title}
        </div>

        <div style={{ display: "flex", fontSize: 26, color: OG_INK.soft }}>{host}</div>
      </div>
    ),
    { ...size },
  );
}
