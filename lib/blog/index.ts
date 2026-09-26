import type { MessageKey } from "@/lib/i18n";

import { plainText } from "./inline";
import { oneSkillRetake } from "./posts/one-skill-retake";
import { planTask2InFiveMinutes } from "./posts/plan-task-2-in-five-minutes";
import { speakingPart2OneMinutePlan } from "./posts/speaking-part-2-one-minute-plan";
import { trueFalseNotGiven } from "./posts/true-false-not-given";
import { whatsNewAtEngProgress } from "./posts/whats-new-at-engprogress";
import { whyEnglishSpellingIsStrange } from "./posts/why-english-spelling-is-strange";
import { wordsWithSurprisingPasts } from "./posts/words-with-surprising-pasts";
import type { Block, BlogCategory, BlogPost } from "./types";

export type { Block, BlogCategory, BlogPost } from "./types";

/**
 * Every published post. To publish one: add a file under `posts/`, import it
 * here, deploy. `blog.test.ts` checks the rest — unique slug, valid date, links
 * that resolve, no grading-accuracy claim.
 *
 * Listed in the order they should appear when dates tie; `POSTS` below sorts
 * newest first and keeps this order within a day.
 */
const ALL: BlogPost[] = [
  trueFalseNotGiven,
  whatsNewAtEngProgress,
  speakingPart2OneMinutePlan,
  wordsWithSurprisingPasts,
  planTask2InFiveMinutes,
  whyEnglishSpellingIsStrange,
  oneSkillRetake,
];

/** Newest first. `Array.prototype.sort` is stable, so same-day posts keep
 *  the order of `ALL`. */
export const POSTS: readonly BlogPost[] = [...ALL].sort((a, b) =>
  b.published.localeCompare(a.published),
);

export const CATEGORIES: readonly BlogCategory[] = ["ielts", "english", "stories", "engprogress"];

export const CATEGORY_LABEL: Record<BlogCategory, MessageKey> = {
  ielts: "blog.catIelts",
  english: "blog.catEnglish",
  stories: "blog.catStories",
  engprogress: "blog.catEngprogress",
};

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** The lead story: the featured post, or the newest when none is. */
export function leadPost(): BlogPost {
  return POSTS.find((p) => p.featured) ?? POSTS[0];
}

/** Everything but the lead, newest first. */
export function otherPosts(): BlogPost[] {
  const lead = leadPost();
  return POSTS.filter((p) => p !== lead);
}

/**
 * What to read next: same category first, then the newest of the rest. Never
 * the post itself, never a duplicate.
 */
export function relatedPosts(post: BlogPost, count = 3): BlogPost[] {
  const others = POSTS.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, count);
}

function blockText(b: Block): string {
  switch (b.type) {
    case "p":
    case "h2":
      return b.text;
    case "list":
      return b.items.join(" ");
    case "quote":
      return b.text;
    case "tip":
      return `${b.title} ${b.text}`;
    case "example":
      return [b.title ?? "", ...b.rows.map((r) => `${r.label} ${r.text}`)].join(" ");
  }
}

/** Words in the body as a reader sees them — the JSON-LD `wordCount`. */
export function wordCount(post: BlogPost): number {
  const text = [post.standfirst, ...post.body.map(blockText)].map(plainText).join(" ");
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
