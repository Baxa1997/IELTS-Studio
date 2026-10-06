import { PUBLIC_ROUTES } from "@/lib/seo";

import { headingId } from ".";
import { isYoutubeId } from "./video";
import { parseInline, plainText } from "./inline";
import { BLOG_CATEGORIES, BLOG_SKILLS, type Block, type BlogPost } from "./types";

/**
 * What a post must get right before it goes out — and the reason, in words, for
 * every one it gets wrong.
 *
 * ⚠️ THIS WAS A TEST FILE UNTIL POSTS MOVED TO THE DATABASE. While posts were
 * code, `blog.test.ts` was the editor: a slug copied from another post, a date
 * typed backwards, a link to a renamed page, a translated paragraph — each
 * turned CI red before it shipped. A post written in /admin never passes
 * through CI, so the same rules run here, on every publish, and the editor
 * shows what failed. Weakening a rule here weakens it for every future post;
 * the tests in `blog.test.ts` pin each one.
 *
 * Two levels:
 *  - `draftProblems` — the minimum a row needs to be stored at all (the
 *    database would refuse it otherwise, less helpfully);
 *  - `publishProblems` — everything a reader, a crawler or an answer engine
 *    will meet. A published post must pass all of it.
 */

/** Slugs a post may not take: each is a real route under /blog, and a static
 *  segment wins over `[slug]`, so a post with one of these would never show. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set(["preview", "feed"]);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MARKUP = /\*|\]\(/;

/**
 * Where a post's pictures may live: a file in /public, or an upload in the
 * `blog` storage bucket (migration 20261006130000), which the editor's Media
 * tab writes to.
 *
 * ⚠️ NO OTHER HOST. The cover goes through next/image, which THROWS on a host
 * next.config.ts does not list — an https photo from anywhere else would take
 * the whole article page down, not just leave a broken picture. next.config
 * lists exactly this bucket's path; the two must move together.
 */
export const BLOG_BUCKET = "blog";
const BUCKET_URL = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/blog\/[A-Za-z0-9._\/-]+$/;
export const isBlogImageSrc = (src: string): boolean => /^\/[^/]/.test(src) || BUCKET_URL.test(src);

/** Keywords: a handful of real searches, not a tag cloud. */
export const MAX_KEYWORDS = 10;

export const isRealDate = (s: string | undefined): boolean =>
  !!s && ISO_DATE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

/**
 * A measured-accuracy claim about the grader. It may not appear in public copy
 * while the anchors are unverified — see `lib/seo-claims.test.ts`, which polices
 * the rest of the site with the same pattern. A blog post is exactly where a
 * new one would come back.
 */
export const ACCURACY_CLAIM = /±\s*0\.5|within (about )?half a band|calibrated against expert/i;

/**
 * English function words — the small words that make up a third or more of
 * any English prose and almost none of Uzbek or Russian. Not a language
 * detector; a tripwire, calibrated on the first published posts.
 */
const FUNCTION_WORDS = new Set(
  (
    "the a an and or but of to in on at for with from by is are was were be been it that this " +
    "these those you your not as if what how why when do does can will one have has there they " +
    "we our their its than then so no more into about each every which who"
  ).split(" "),
);

/** Share of `text`'s words that are English function words, and how many words it has. */
export function englishShare(text: string): { share: number; words: number } {
  const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const hits = words.filter((w) => FUNCTION_WORDS.has(w)).length;
  return { share: words.length ? hits / words.length : 0, words: words.length };
}

/** Every string in a post that goes through `parseInline`. */
export function inlineStrings(post: BlogPost): string[] {
  const of = (b: Block): string[] => {
    switch (b.type) {
      case "p":
      case "h2":
      case "h3":
        return [b.text];
      case "image":
      case "video":
        return [];
      case "list":
        return b.items;
      case "quote":
        return [b.text];
      case "tip":
        return [b.title, b.text];
      case "example":
        return [...(b.title ? [b.title] : []), ...b.rows.map((r) => r.text)];
    }
  };
  return post.body.flatMap(of);
}

/** Every string of a post a reader can see, markup removed. */
export function allText(post: BlogPost): string[] {
  return [
    post.title,
    post.standfirst,
    post.author,
    post.cover.kicker,
    ...(post.image ? [post.image.alt, post.image.credit ?? ""] : []),
    ...inlineStrings(post),
    ...post.body.flatMap((b) => (b.type === "example" ? b.rows.map((r) => r.label) : [])),
    ...post.body.flatMap((b) => (b.type === "quote" && b.cite ? [b.cite] : [])),
    ...post.body.flatMap((b) => (b.type === "image" ? [b.alt, b.caption ?? ""] : b.type === "video" ? [b.title ?? ""] : [])),
    ...(post.keywords ?? []),
    ...(post.cta ? [post.cta.title, post.cta.text, post.cta.label] : []),
    ...post.summary,
    ...(post.faq ?? []).flatMap((f) => [f.q, f.a]),
  ].map(plainText);
}

/** Every page a post may link to: the public pages, plus every article. */
export function knownPaths(slugs: Iterable<string>): Set<string> {
  return new Set<string>([...PUBLIC_ROUTES.map((r) => r.path), ...[...slugs].map((s) => `/blog/${s}`)]);
}

export function draftProblems(post: BlogPost): string[] {
  const out: string[] = [];
  if (!SLUG.test(post.slug)) out.push("The slug must be lowercase words joined by hyphens, like `plan-task-2`.");
  if (RESERVED_SLUGS.has(post.slug)) out.push(`"${post.slug}" is a page of its own under /blog — choose another slug.`);
  if (!(BLOG_CATEGORIES as readonly string[]).includes(post.category)) out.push("Choose a category.");
  if (post.skill && !(BLOG_SKILLS as readonly string[]).includes(post.skill)) out.push("Unknown practice area.");
  if (!post.title.trim()) out.push("The title is empty.");
  if (!isRealDate(post.published)) out.push("The publication date must be a real date, YYYY-MM-DD.");
  if (post.updated) {
    if (!isRealDate(post.updated)) out.push("The update date must be a real date, YYYY-MM-DD.");
    else if (post.updated < post.published) out.push("The update date is before the publication date.");
  }
  return out;
}

/**
 * Everything wrong with `post` as a published article. `others` is the slugs
 * of every OTHER post, published or not — links may point at them.
 */
export function publishProblems(post: BlogPost, others: Iterable<string>): string[] {
  const out = draftProblems(post);
  const known = knownPaths([...others, post.slug]);

  if (!post.standfirst.trim()) out.push("The standfirst is empty.");
  // Search results cut a description at about this length, and the standfirst
  // is also the summary on every card.
  if (post.standfirst.length > 200) out.push(`The standfirst is ${post.standfirst.length} characters — keep it to 200.`);
  if (!post.author.trim()) out.push("The author is empty.");
  if (!post.cover.kicker.trim()) out.push("The cover word is empty.");
  if (post.body.length === 0) out.push("The article has no body.");
  for (const b of post.body) {
    if (b.type === "image") {
      if (!isBlogImageSrc(b.src)) out.push(`A picture must be uploaded in the editor or be a file in /public: ${b.src.slice(0, 80)}`);
      // The words a screen reader says and Google Images indexes — never optional.
      if (!b.alt.trim()) out.push("Every picture in the article needs alt text.");
    }
    if (b.type === "video" && !isYoutubeId(b.id)) out.push(`Not a YouTube video id: "${b.id.slice(0, 40)}"`);
    if (b.type === "h3" && !b.text.trim()) out.push("A sub-heading is empty.");
    if (b.type === "tip" && !b.title.trim()) out.push("A tip needs a title — `:::tip Exam tip`.");
    if (b.type === "example" && b.rows.some((r) => !r.label.trim())) out.push("Every line of an example needs a label — `Label: text`.");
    if (b.type === "list" && b.items.some((it) => !it.trim())) out.push("A list has an empty item.");
  }

  /* THE OWNER'S RULE (2026-09-26): every article is in English. The blog is
     reading practice for people learning English, so a translated article
     defeats it — and on an Uzbek-default site, translating "for the audience"
     is exactly the helpful-looking change somebody will make. */
  const text = allText(post);
  for (const s of text) {
    // ʻ (U+02BB) and ʼ (U+02BC) are how Uzbek Latin writes oʻ, gʻ and the
    // tutuq belgisi; English never needs them. Other Latin letters stay
    // allowed — Čapek and sælig are English text quoting other languages.
    if (/[Ѐ-ӿ]/.test(s)) out.push(`Articles are in English — Cyrillic in "${s.slice(0, 60)}".`);
    if (/[ʻʼ]/.test(s)) out.push(`Articles are in English — an Uzbek letter in "${s.slice(0, 60)}".`);
    /* Per paragraph, so ONE translated paragraph in an English post is still
       caught. Only 20+ words: short note-style lines ("Free entry widens
       access — students, families") legitimately have no function words. The
       lowest published paragraph scored 0.19; Uzbek scores 0. */
    const { share, words } = englishShare(s);
    if (words >= 20 && share < 0.12) out.push(`Does not read as English: "${s.slice(0, 60)}…"`);
  }
  if (englishShare(text.join(" ")).share < 0.25) out.push("The article as a whole does not read as English.");

  /* ⚠️ THE FAILURE THIS EXISTS FOR IS SILENT. Nested markup — bold inside
     italic — is not supported, and it does not throw: the parser matches the
     wrong pair of asterisks and the page prints the leftovers. */
  for (const s of inlineStrings(post)) {
    for (const span of parseInline(s)) {
      if (span.kind === "text" && MARKUP.test(span.text)) out.push(`Markup the page cannot render in "${s.slice(0, 60)}".`);
    }
  }

  const hrefs = [
    ...inlineStrings(post).flatMap((s) => parseInline(s).flatMap((sp) => (sp.kind === "link" ? [sp.href] : []))),
    ...(post.cta ? [post.cta.href] : []),
  ];
  for (const href of hrefs) {
    if (href.startsWith("/")) {
      // A hash is allowed on any page; the page part must still resolve.
      if (!known.has(href.split("#")[0])) out.push(`The link ${href} goes to no page on the site.`);
    } else if (!/^https:\/\//.test(href)) {
      out.push(`External links must be https: ${href}`);
    }
  }

  /* An answer engine lifts ONE point and quotes it alone. A point that opens
     by leaning on the one before — "This is why…", "It also…" — becomes a
     sentence about nothing once it is lifted. */
  if (post.summary.length < 2 || post.summary.length > 5) out.push("\"In short\" needs two to five points.");
  for (const pt of post.summary) {
    if (!/^[A-Z].*[.!?]$/.test(pt)) out.push(`An "In short" point must be one whole sentence: "${pt.slice(0, 60)}"`);
    if (pt.length > 220) out.push(`An "In short" point is over 220 characters: "${pt.slice(0, 60)}…"`);
    if (MARKUP.test(pt)) out.push(`"In short" points are plain text, no markup: "${pt.slice(0, 60)}"`);
    if (/^(This|That|These|Those|It|They|He|She|Also|And|But|So)\b/.test(pt)) {
      out.push(`"${pt.slice(0, 60)}" leans on the point before it — give it its own subject.`);
    }
  }

  const faq = post.faq ?? [];
  if (new Set(faq.map((f) => f.q)).size !== faq.length) out.push("A question is asked twice.");
  for (const f of faq) {
    if (!/\?$/.test(f.q)) out.push(`A question must end with "?": "${f.q.slice(0, 60)}"`);
    // FAQPage data carries the answer as-is; markup would print literally.
    if (MARKUP.test(f.a)) out.push(`Answers are plain text, no markup: "${f.q.slice(0, 60)}"`);
    if (f.a.length > 450) out.push(`Keep the answer to "${f.q.slice(0, 60)}" under 450 characters.`);
    if (!f.a.trim()) out.push(`"${f.q.slice(0, 60)}" has no answer.`);
  }

  // "questions" is the anchor of the FAQ section the page adds itself.
  const ids = [
    ...post.body.flatMap((b) => (b.type === "h2" || b.type === "h3" ? [headingId(b.text)] : [])),
    ...(faq.length ? ["questions"] : []),
  ];
  for (const id of ids) if (!SLUG.test(id)) out.push(`A heading has no usable anchor: "${id}"`);
  if (new Set(ids).size !== ids.length) out.push("Two headings share an anchor — reword one.");

  for (const s of text) {
    if (ACCURACY_CLAIM.test(s)) out.push(`No measured-accuracy claim about the grader: "${s.slice(0, 60)}"`);
  }

  if (post.image) {
    // See `isBlogImageSrc`: any other host would take the article page down.
    if (!isBlogImageSrc(post.image.src)) out.push("The cover photo must be uploaded in the editor or be a file in /public, like /blog/cover.jpg.");
    if (!post.image.alt.trim()) out.push("The photo needs alt text.");
  }
  const keywords = post.keywords ?? [];
  if (keywords.length > MAX_KEYWORDS) out.push(`${keywords.length} keywords — keep it to ${MAX_KEYWORDS} real searches.`);
  for (const k of keywords) {
    if (k !== k.trim().toLowerCase() || !k) out.push(`Keywords are lower-case and trimmed: "${k}"`);
    if (k.length > 60) out.push(`A keyword is a search, not a sentence: "${k.slice(0, 60)}…"`);
  }
  if (new Set(keywords).size !== keywords.length) out.push("A keyword is listed twice.");

  if (post.cta && ![post.cta.title, post.cta.text, post.cta.href, post.cta.label].every((s) => s.trim())) {
    out.push("The closing panel needs a title, text, link and button label — or none of them.");
  }

  return [...new Set(out)];
}
