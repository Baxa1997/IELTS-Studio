import type { MessageKey } from "@/lib/i18n";

import { plainText } from "./inline";
import { BLOG_CATEGORIES, type Block, type BlogCategory, type BlogPost, type BlogSkill } from "./types";

export type { Block, BlogCategory, BlogPost, BlogSkill, PostStatus, StoredPost } from "./types";
export { BLOG_SKILLS } from "./types";

/*
 * Pure helpers over a list of posts. The list itself comes from the database —
 * `loadPosts()` in `./store`, server-only — and arrives newest first, posts of
 * the same day in their `position` order. Nothing here reads it, so everything
 * here runs in a test, in a client component, or at build time alike.
 */

export const CATEGORIES: readonly BlogCategory[] = BLOG_CATEGORIES;

export const CATEGORY_LABEL: Record<BlogCategory, MessageKey> = {
  ielts: "blog.catIelts",
  multilevel: "blog.catMultilevel",
  english: "blog.catEnglish",
  stories: "blog.catStories",
  engprogress: "blog.catEngprogress",
};

/** Newest first. `Array.prototype.sort` is stable, so same-day posts keep the
 *  order they came in — the database's `position` order. */
export function newestFirst<T extends BlogPost>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.published.localeCompare(a.published));
}

export function findPost(posts: readonly BlogPost[], slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

/** The lead story: the featured post, or the newest when none is. Undefined
 *  only when there are no posts at all. */
export function leadPost(posts: readonly BlogPost[]): BlogPost | undefined {
  return posts.find((p) => p.featured) ?? posts[0];
}

/** Everything but the lead, newest first. */
export function otherPosts(posts: readonly BlogPost[]): BlogPost[] {
  const lead = leadPost(posts);
  return posts.filter((p) => p !== lead);
}

/**
 * What to read next: same category first, then the newest of the rest. Never
 * the post itself, never a duplicate.
 */
export function relatedPosts(posts: readonly BlogPost[], post: BlogPost, count = 3): BlogPost[] {
  const others = posts.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, count);
}

/** What a post is `about` in its structured data — the names searchers and
 *  answer engines use for the topic. English on purpose: it is metadata about
 *  an English article. */
export const SKILL_TOPIC: Record<BlogSkill, string> = {
  writing: "IELTS Writing",
  reading: "IELTS Reading",
  listening: "IELTS Listening",
  speaking: "IELTS Speaking",
  cefr: "CEFR Multilevel exam (Uzbekistan)",
};

/** Posts about one practice area, newest first — the "From the blog" list on
 *  that area's marketing page. */
export function postsForSkill(posts: readonly BlogPost[], skill: BlogSkill): BlogPost[] {
  return posts.filter((p) => p.skill === skill);
}

/**
 * The anchor for a section heading: `Minute 1: find every question` →
 * `minute-1-find-every-question`.
 *
 * ⚠️ THESE ARE PUBLIC ADDRESSES. Google shows them as "Jump to" links and answer
 * engines cite them, so rewording a heading moves its anchor — fine for a
 * typo, worth a second thought on a post that is already being linked to.
 */
export function headingId(text: string): string {
  return plainText(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function blockText(b: Block): string {
  switch (b.type) {
    case "p":
    case "h2":
    case "h3":
      return b.text;
    case "list":
      return b.items.join(" ");
    case "quote":
      return b.text;
    case "tip":
      return `${b.title} ${b.text}`;
    case "example":
      return [b.title ?? "", ...b.rows.map((r) => `${r.label} ${r.text}`)].join(" ");
    case "image":
      return b.caption ?? "";
    case "video":
      return "";
  }
}

/** Words in the body as a reader sees them — the JSON-LD `wordCount`. */
export function wordCount(post: BlogPost): number {
  const text = [
    post.standfirst,
    ...post.summary,
    ...post.body.map(blockText),
    ...(post.faq ?? []).flatMap((f) => [f.q, f.a]),
  ]
    .map(plainText)
    .join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Minutes to read, at 220 words a minute and never less than one.
 *
 * Derived rather than written on each post: a hand-typed "5 min read" is the
 * first thing to go stale when the article is edited.
 */
export function readingMinutes(post: BlogPost): number {
  return Math.max(1, Math.round(wordCount(post) / 220));
}

/**
 * `2026-09-26` → "26 September 2026" (or its equivalent in `htmlLang`).
 *
 * ⚠️ FORMATTED IN UTC. A bare date parses as midnight UTC, so formatting it in
 * the server's local zone would print the day before anywhere west of
 * Greenwich — and the build machine's zone is not ours to choose.
 */
export function formatPostDate(iso: string, htmlLang: string): string {
  return new Intl.DateTimeFormat(htmlLang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
