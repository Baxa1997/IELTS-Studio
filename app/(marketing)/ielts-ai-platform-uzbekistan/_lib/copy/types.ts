import type { PlatformFacts } from "../facts";

/**
 * The platform page in one language. `en` is the source the other two are
 * checked against (platform-page.test.ts): every section must have the same
 * blocks in the same order, so a table added in English cannot ship without
 * its Uzbek and Russian rows.
 *
 * Text may carry the blog's inline markup — `**bold**` and `[label](href)` —
 * except the FAQ, which is also the FAQPage JSON-LD and must be plain text.
 */
export type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "h3"; text: string }
  | { kind: "table"; head: string[]; rows: string[][] };

export interface PlatformPageCopy {
  meta: {
    /**
     * The WHOLE `<title>` — used as `absolute`, so the root layout's
     * " | EngProgress" is NOT added. ⚠️ The title already starts with the brand
     * (the brief's wording), and the suffix would repeat it and push it past
     * the 60 characters a search result shows. Pinned at ≤ 60 by the test.
     */
    title: string;
    /** ≤ 155 characters (pinned). */
    description: string;
    /** The share card's alt text. */
    ogAlt: string;
  };
  title: string;
  lead: string;
  sections: { title: string; blocks: Block[] }[];
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string };
}

/**
 * A language's copy is a FUNCTION of the facts, not a constant: every price,
 * limit and contact detail on the page is read from PLAN_TIERS and
 * lib/contact.ts at render time, the way /ielts-practice-pricing does it, so
 * the day a plan changes this page changes with it.
 */
export type PlatformCopyFn = (f: PlatformFacts) => PlatformPageCopy;

export const p = (text: string): Block => ({ kind: "p", text });
export const ul = (...items: string[]): Block => ({ kind: "ul", items });
export const h3 = (text: string): Block => ({ kind: "h3", text });
export const table = (head: string[], rows: string[][]): Block => ({ kind: "table", head, rows });
