import type { Metadata } from "next";

import { BODY, DISPLAY, INK, LINE, PANEL } from "@/app/_landing/_lib/design";
import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import { PREVIEW_IMAGE, previewImage } from "@/lib/seo";

import { Cta, Faq, Inline, LI, P, PageTitle, Related, Sec, UL } from "../../_components/marketing";
import { platformPageCopy, type Block } from "../_lib/copy";

/**
 * The platform page — the answer to "the best AI platform for IELTS in
 * Uzbekistan?" — in one language, rendered by `/ielts-ai-platform-uzbekistan`
 * and by `/uz/…` and `/ru/…`, the way the CEFR page is.
 *
 * WHY IT EXISTS (2026-11-23). Learners ask ChatGPT and Gemini that question in
 * Uzbek and Russian, and the site had no page that answered it in either: what
 * EngProgress covers, what it costs, how fast and on what it grades, what a
 * centre gets. Written from a Seenova brief; the parts of the brief the site
 * cannot back (test counts, partner centres, an address…) are left out — see
 * the note in ../_lib/facts.ts before adding any.
 *
 * ⚠️ IT DOES NOT SAY "THE BEST". It names what to look for and shows how
 * EngProgress meets each point, and it states what is not built. A page that
 * crowns itself is the first thing an answer engine discounts, and nothing on
 * it may claim a measured accuracy (lib/seo-claims.test.ts).
 */

export const PLATFORM_PAGE_PATH = "/ielts-ai-platform-uzbekistan" as const;

export function platformPageMetadata(locale: Locale): Metadata {
  const c = platformPageCopy(locale);
  const url = localePath(PLATFORM_PAGE_PATH, locale);
  return {
    // `absolute`: the title already carries the brand — see `meta.title` in ../_lib/copy/types.ts.
    title: { absolute: c.meta.title },
    description: c.meta.description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localePath(PLATFORM_PAGE_PATH, l)])),
        "x-default": localePath(PLATFORM_PAGE_PATH, SOURCE_LOCALE),
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      locale: HTML_LANG[locale],
      title: c.meta.title,
      description: c.meta.description,
      images: [previewImage(c.meta.ogAlt)],
    },
    twitter: { card: "summary_large_image", title: c.meta.title, description: c.meta.description, images: [PREVIEW_IMAGE] },
  };
}

export function PlatformArticle({ locale }: { locale: Locale }) {
  const c = platformPageCopy(locale);
  return (
    <article>
      <PageTitle title={c.title} lead={c.lead} path={PLATFORM_PAGE_PATH} locale={locale} />
      {c.sections.map((s) => (
        <Sec key={s.title} title={s.title}>
          {s.blocks.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </Sec>
      ))}
      <Faq items={c.faq} locale={locale} />
      <Cta title={c.cta.title} sub={c.cta.sub} locale={locale} />
      <Related current={PLATFORM_PAGE_PATH} locale={locale} />
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "p":
      return (
        <P>
          <Inline text={block.text} />
        </P>
      );
    case "ul":
      return (
        <UL>
          {block.items.map((t) => (
            <LI key={t}>
              <Inline text={t} />
            </LI>
          ))}
        </UL>
      );
    case "h3":
      return <h3 style={{ margin: "22px 0 8px", fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: INK }}>{block.text}</h3>;
    case "table":
      return <Table head={block.head} rows={block.rows} />;
  }
}

/** Prices and grading as a real table — text a crawler and an answer engine
 *  can read, never an image. Scrolls inside itself on a narrow screen, like
 *  the pricing page's plan table. */
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  const cell: React.CSSProperties = {
    padding: "11px 13px",
    fontSize: 14.5,
    lineHeight: 1.55,
    color: BODY,
    verticalAlign: "top",
    textAlign: "left",
    borderTop: `1px solid ${LINE}`,
  };
  return (
    <div style={{ overflowX: "auto", margin: "14px 0 12px", border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: head.length > 3 ? 680 : 520 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" style={{ ...cell, borderTop: "none", fontWeight: 800, color: INK }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) =>
                i === 0 ? (
                  <th key={i} scope="row" style={{ ...cell, fontWeight: 700, color: INK }}>
                    {v}
                  </th>
                ) : (
                  <td key={i} style={cell}>
                    {v}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
