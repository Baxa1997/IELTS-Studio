import { Fragment } from "react";
import type { Metadata } from "next";

import { parseInline } from "@/lib/blog/inline";
import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import { PREVIEW_IMAGE, previewImage } from "@/lib/seo";

import { A, B, Cta, Faq, FromTheBlog, LI, P, PageTitle, Related, Sec, UL } from "../../_components/marketing";
import { cefrPageCopy } from "../_lib/copy";

/**
 * The CEFR / Multilevel page, in one language — rendered by
 * `/cefr-multilevel-practice` and by `/uz/…` and `/ru/…`, the way the score
 * calculators and the learner guide are, so the three cannot drift apart.
 *
 * WHY THIS PAGE, OF ALL THE MARKETING PAGES, HAS A /uz AND A /ru. It is the
 * one written for Uzbekistan's own exam, and the people sitting it ask Google,
 * ChatGPT and Gemini in Uzbek and Russian ("multilevel imtihoniga tayyorgarlik",
 * "подготовка к multilevel"). A search for online Multilevel practice in
 * November 2026 found Telegram channels and ministry news and no practice site
 * at all — an answer engine asked in Uzbek had nothing in Uzbek to cite.
 */

export const CEFR_PAGE_PATH = "/cefr-multilevel-practice" as const;

export function cefrPracticeMetadata(locale: Locale): Metadata {
  const c = cefrPageCopy(locale);
  const url = localePath(CEFR_PAGE_PATH, locale);
  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: {
      canonical: url,
      // Each language names the other two, and an unmatched visitor gets the
      // source (English) page — the same declaration the calculators make.
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localePath(CEFR_PAGE_PATH, l)])),
        "x-default": localePath(CEFR_PAGE_PATH, SOURCE_LOCALE),
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

export function CefrPracticeArticle({ locale }: { locale: Locale }) {
  const c = cefrPageCopy(locale);
  return (
    <article>
      {/* `path` + `locale`: the dated WebPage node for THIS language's URL and
          the "Updated" line, both from the one day PUBLIC_ROUTES records. The
          FAQ adds its FAQPage block from the same list the visitor sees. */}
      <PageTitle title={c.title} lead={c.lead} path={CEFR_PAGE_PATH} locale={locale} />

      {c.sections.map((s) => (
        <Sec key={s.title} title={s.title}>
          {s.paragraphs?.map((p) => (
            <P key={p}>
              <Inline text={p} />
            </P>
          ))}
          {s.bullets ? (
            <UL>
              {s.bullets.map((b) => (
                <LI key={b}>
                  <Inline text={b} />
                </LI>
              ))}
            </UL>
          ) : null}
        </Sec>
      ))}

      <FromTheBlog skill="cefr" locale={locale} />
      <Faq items={c.faq} locale={locale} />
      <Cta title={c.cta.title} sub={c.cta.sub} locale={locale} />
      <Related current={CEFR_PAGE_PATH} locale={locale} />
    </article>
  );
}

/** The copy's `**bold**` and `[label](href)`, drawn with the marketing
 *  primitives so a translated paragraph looks exactly like the English one. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((s, i) =>
        s.kind === "strong" ? (
          <B key={i}>{s.text}</B>
        ) : s.kind === "link" ? (
          <A key={i} href={s.href}>
            {s.text}
          </A>
        ) : s.kind === "em" ? (
          <em key={i}>{s.text}</em>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}
