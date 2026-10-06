/**
 * The shape of a blog post.
 *
 * POSTS ARE ROWS — `public.blog_posts`, written in /admin/blog by the platform
 * super_admin and read by the site through `./store` (migration
 * 20261004120000). They were code until 2026-10-04, reviewed in a diff and
 * shipped with a deploy; the owner moved them so a post can go out without
 * one. The body was already structured blocks rather than HTML for exactly
 * that move, so it went into a jsonb column and the renderer did not change.
 *
 * WHAT USED TO BE THE REVIEW IS NOW `./validate`. A post can no longer be
 * caught by a test before it ships, so the same rules run when it is
 * published: `publishProblems` refuses a post that breaks one, with the reason.
 *
 * ⚠️ EVERY ARTICLE IS IN ENGLISH — the owner's rule (2026-09-26), and every
 * string of it: title, standfirst, body, cover, call to action. The blog is
 * reading practice for people learning English, so a translated article
 * defeats it, however helpful translating for an Uzbek-default site looks.
 * Only the chrome around the articles is localised (`blog.*` keys).
 * `publishProblems` refuses Cyrillic, Uzbek letters, and any paragraph that
 * does not read as English.
 */

export const BLOG_CATEGORIES = ["ielts", "multilevel", "english", "stories", "engprogress"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** The practice area a post is about — it links the post from that area's
 *  marketing page ("From the blog") and names it in the structured data. */
export const BLOG_SKILLS = ["writing", "reading", "listening", "speaking", "cefr"] as const;
export type BlogSkill = (typeof BLOG_SKILLS)[number];

/**
 * One block of an article body.
 *
 * Text fields accept a small inline syntax — `**bold**`, `*italic*` and
 * `[label](/path)` — parsed by `parseInline` in `./inline`. Nothing else: no
 * nesting, no HTML. A post that needs more than that needs a new block type,
 * not a richer string.
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "quote"; text: string; cite?: string }
  /** A boxed aside — "Exam tip", "Try this". */
  | { type: "tip"; title: string; text: string }
  /** Labelled lines, e.g. a Part 2 note map or a weak/stronger sentence pair. */
  | { type: "example"; title?: string; rows: { label: string; text: string }[] }
  /** A sub-heading inside an h2 section. Gets an anchor like an h2. */
  | { type: "h3"; text: string }
  /**
   * A picture in the article. `src` is a file in /public or an upload in the
   * `blog` storage bucket — see `isBlogImageSrc` in ./validate. `alt` is
   * required to publish: it is what a screen reader says and what Google
   * Images indexes. `caption` is plain text.
   */
  | { type: "image"; src: string; alt: string; caption?: string }
  /**
   * A YouTube video, stored as its 11-character id rather than a URL, so the
   * renderer decides the embed address (the privacy-enhanced domain) and a
   * pasted link can never smuggle in some other host.
   */
  | { type: "video"; id: string; title?: string };

/** Every block type, for the editor and the sanitiser — derived lists track this. */
export const BLOCK_TYPES = ["p", "h2", "h3", "list", "quote", "tip", "example", "image", "video"] as const satisfies readonly Block["type"][];

export interface BlogPost {
  /** The URL segment: `/blog/<slug>`. Never change one after it ships — it is
   *  the address people have shared. */
  slug: string;
  category: BlogCategory;
  title: string;
  /**
   * The standfirst — the bold opening line under the headline. It is also the
   * card summary and the meta description, so keep it under ~200 characters.
   */
  standfirst: string;
  /** `YYYY-MM-DD`. */
  published: string;
  /** `YYYY-MM-DD`, when the text changed after publishing. */
  updated?: string;
  author: string;
  /**
   * The generated cover: a word or two set large on the category's colour.
   * `image` replaces it with a photo from `/public` when a post has one.
   */
  cover: { kicker: string };
  image?: { src: string; alt: string; credit?: string };
  /** The lead story on the landing section and the blog front page. At most
   *  one post may set it (a unique index holds it); without one, the newest
   *  leads. */
  featured?: boolean;
  skill?: BlogSkill;
  /**
   * "In short": two to five complete sentences, each true on its own, shown in
   * a box above the body.
   *
   * ⚠️ WRITTEN FOR ANSWER ENGINES AS MUCH AS FOR SKIMMERS. ChatGPT, Perplexity
   * and Google's AI answers lift self-contained factual sentences; a point that
   * leans on the one before it ("This is why…") cannot be quoted alone. So
   * every point must stand by itself, with its own subject.
   */
  summary: string[];
  /**
   * The questions a searcher would actually type, answered in two or three
   * plain sentences — shown as "Questions readers ask" and published as
   * FAQPage data. Answers are plain text: no inline markup.
   */
  faq?: { q: string; a: string }[];
  body: Block[];
  /** The panel after the last paragraph — where to practise what was read. */
  cta?: { title: string; text: string; href: string; label: string };
  /**
   * The searches this post is written for, lower-case — `meta keywords`, the
   * BlogPosting `keywords`, and what the editor's SEO checks look for in the
   * title, standfirst and first paragraph. Google ignores the meta tag itself;
   * the value is in writing the post AROUND them, which the checks enforce.
   */
  keywords?: string[];
}

export type PostStatus = "draft" | "published";

/** A post as the editor sees it: the article, plus what only the database
 *  knows about it. */
export interface StoredPost extends BlogPost {
  id: string;
  status: PostStatus;
  /** Order among posts published the same day: lower first. */
  position: number;
  /** When the row last changed — not the article's `updated` date. */
  savedAt: string;
}
