import { sanitizeBlocks, sanitizeKeywords } from "./sanitize";
import { faqToSource, sourceToBlocks, sourceToFaq, sourceToSummary, summaryToSource } from "./source";
import type { Block, BlogCategory, BlogPost, BlogSkill } from "./types";

/**
 * A post as the /admin/blog editor holds it: every field a string (or the one
 * checkbox), the questions and summary as text in the format of `./source`,
 * and the body as BLOCKS — the JSON the rich editor produces and the database
 * stores. (It was text in the `./source` format until 2026-10-06; a string
 * body is still accepted, so a pasted draft or an old open tab still saves.)
 *
 * ⚠️ THE SERVER PARSES, NOT THE BROWSER. The editor sends this form; the save
 * action turns it into a post with `formToPost` and validates THAT. A post
 * built in the browser would be whatever the browser said it was — a server
 * action is an endpoint anybody can POST to.
 */
export interface PostForm {
  slug: string;
  category: string;
  /** "" for no practice area. */
  skill: string;
  title: string;
  standfirst: string;
  author: string;
  published: string;
  updated: string;
  coverKicker: string;
  imageSrc: string;
  imageAlt: string;
  imageCredit: string;
  featured: boolean;
  summary: string;
  faq: string;
  body: Block[];
  keywords: string[];
  ctaTitle: string;
  ctaText: string;
  ctaHref: string;
  ctaLabel: string;
}

export const DEFAULT_AUTHOR = "EngProgress team";

export function emptyForm(today: string): PostForm {
  return {
    slug: "",
    category: "ielts",
    skill: "",
    title: "",
    standfirst: "",
    author: DEFAULT_AUTHOR,
    published: today,
    updated: "",
    coverKicker: "",
    imageSrc: "",
    imageAlt: "",
    imageCredit: "",
    featured: false,
    summary: "",
    faq: "",
    body: [],
    keywords: [],
    ctaTitle: "",
    ctaText: "",
    ctaHref: "",
    ctaLabel: "",
  };
}

export function postToForm(p: BlogPost): PostForm {
  return {
    slug: p.slug,
    category: p.category,
    skill: p.skill ?? "",
    title: p.title,
    standfirst: p.standfirst,
    author: p.author,
    published: p.published,
    updated: p.updated ?? "",
    coverKicker: p.cover.kicker,
    imageSrc: p.image?.src ?? "",
    imageAlt: p.image?.alt ?? "",
    imageCredit: p.image?.credit ?? "",
    featured: Boolean(p.featured),
    summary: summaryToSource(p.summary),
    faq: faqToSource(p.faq ?? []),
    body: structuredClone(p.body),
    keywords: [...(p.keywords ?? [])],
    ctaTitle: p.cta?.title ?? "",
    ctaText: p.cta?.text ?? "",
    ctaHref: p.cta?.href ?? "",
    ctaLabel: p.cta?.label ?? "",
  };
}

/** Any value as a trimmed string — the form arrives from a browser. */
const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function formToPost(raw: Partial<Record<keyof PostForm, unknown>>): BlogPost {
  const faq = sourceToFaq(s(raw.faq));
  const updated = s(raw.updated);
  const skill = s(raw.skill);
  const image = { src: s(raw.imageSrc), alt: s(raw.imageAlt), credit: s(raw.imageCredit) };
  const cta = { title: s(raw.ctaTitle), text: s(raw.ctaText), href: s(raw.ctaHref), label: s(raw.ctaLabel) };
  const keywords = sanitizeKeywords(raw.keywords);
  return {
    // Lower-cased so a stray capital never becomes a second URL for a post.
    slug: s(raw.slug).toLowerCase(),
    category: s(raw.category) as BlogCategory,
    title: s(raw.title),
    standfirst: s(raw.standfirst),
    published: s(raw.published),
    ...(updated ? { updated } : {}),
    author: s(raw.author),
    cover: { kicker: s(raw.coverKicker) },
    ...(image.src ? { image: { src: image.src, alt: image.alt, ...(image.credit ? { credit: image.credit } : {}) } } : {}),
    ...(raw.featured === true ? { featured: true } : {}),
    ...(skill ? { skill: skill as BlogSkill } : {}),
    summary: sourceToSummary(s(raw.summary)),
    ...(faq.length ? { faq } : {}),
    body: typeof raw.body === "string" ? sourceToBlocks(raw.body) : sanitizeBlocks(raw.body),
    ...(keywords.length ? { keywords } : {}),
    // Any one of the four turns the panel on; `publishProblems` then insists
    // on all four, rather than the panel silently vanishing half-filled.
    ...(cta.title || cta.text || cta.href || cta.label ? { cta } : {}),
  };
}
