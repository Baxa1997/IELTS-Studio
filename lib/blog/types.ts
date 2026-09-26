/**
 * The shape of a blog post.
 *
 * POSTS ARE CODE, NOT ROWS — the same call as the curated reading and writing
 * libraries (`lib/reading/curated`, `lib/prompts/curated`). A post is reviewed
 * in a diff, ships with a deploy, and renders as a static page that costs the
 * database nothing. Publishing without a deploy would need a table, an editor
 * in `/admin` and a sanitiser; the body is already structured blocks rather than
 * HTML so it could move into a JSON column without the renderer changing.
 *
 * ⚠️ EVERY ARTICLE IS IN ENGLISH — the owner's rule (2026-09-26), and every
 * string of it: title, standfirst, body, cover, call to action. The blog is
 * reading practice for people learning English, so a translated article
 * defeats it, however helpful translating for an Uzbek-default site looks.
 * Only the chrome around the articles is localised (`blog.*` keys).
 * `blog.test.ts` fails on Cyrillic, on Uzbek letters, and on any paragraph that
 * does not read as English.
 */

export type BlogCategory = "ielts" | "english" | "stories" | "engprogress";

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
  | { type: "example"; title?: string; rows: { label: string; text: string }[] };

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
   *  one post may set it; without one, the newest leads. */
  featured?: boolean;
  body: Block[];
  /** The panel after the last paragraph — where to practise what was read. */
  cta?: { title: string; text: string; href: string; label: string };
}
