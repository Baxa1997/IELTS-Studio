/**
 * The CEFR / Multilevel page in one language. `en` is the source the other two
 * are typed against, so a section added in English does not compile until
 * Uzbek and Russian have it too.
 *
 * Paragraph and list text may carry the blog's inline markup — `**bold**` and
 * `[label](href)` (lib/blog/inline.ts) — so a translation can move the bold
 * phrase to where its own word order puts it, which a fixed `<B>` split could
 * not. FAQ answers stay plain: they are also the FAQPage JSON-LD, which must be
 * plain text.
 */
export interface CefrPageCopy {
  meta: {
    /** The `<title>`, before the " | EngProgress" the root layout adds. Put the
     *  words this language's searchers type ("multilevel", "DTM") first. */
    title: string;
    description: string;
    /** The share card's alt text. */
    ogAlt: string;
  };
  title: string;
  lead: string;
  sections: { title: string; paragraphs?: string[]; bullets?: string[] }[];
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string };
}
