/**
 * The blog's invariants — the things a new post can get wrong without anything
 * else noticing.
 *
 * Posts are code (see ./types.ts), so there is no editor to validate them; this
 * file is the editor. Each rule here is one a post author will break sooner or
 * later: a slug copied from another post, a date typed in the wrong order, a
 * link to a page that was renamed, or inline markup the renderer cannot read
 * and would print as literal asterisks.
 *
 * Whether the pages are reachable — public, in the sitemap, static — is
 * `app/blog/blog-routes.test.ts`: lib/ may not import from app/.
 */

import { describe, expect, it } from "vitest";

import { en } from "@/lib/i18n/messages/en";
import { PUBLIC_ROUTES } from "@/lib/seo";

import {
  CATEGORIES,
  CATEGORY_LABEL,
  formatPostDate,
  getPost,
  leadPost,
  otherPosts,
  POSTS,
  readingMinutes,
  relatedPosts,
  type Block,
  type BlogPost,
} from ".";
import { parseInline, plainText } from "./inline";

/** Every string in a post that goes through `parseInline`. */
function inlineStrings(post: BlogPost): string[] {
  const of = (b: Block): string[] => {
    switch (b.type) {
      case "p":
      case "h2":
        return [b.text];
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
function allText(post: BlogPost): string[] {
  return [
    post.title,
    post.standfirst,
    post.author,
    post.cover.kicker,
    ...(post.image ? [post.image.alt, post.image.credit ?? ""] : []),
    ...inlineStrings(post),
    ...post.body.flatMap((b) => (b.type === "example" ? b.rows.map((r) => r.label) : [])),
    ...post.body.flatMap((b) => (b.type === "quote" && b.cite ? [b.cite] : [])),
    ...(post.cta ? [post.cta.title, post.cta.text, post.cta.label] : []),
  ].map(plainText);
}

/**
 * English function words — the small words that make up a third or more of
 * any English prose and almost none of Uzbek or Russian. Not a language
 * detector; a tripwire, calibrated on the published posts.
 */
const FUNCTION_WORDS = new Set(
  (
    "the a an and or but of to in on at for with from by is are was were be been it that this " +
    "these those you your not as if what how why when do does can will one have has there they " +
    "we our their its than then so no more into about each every which who"
  ).split(" "),
);

/** Share of `text`'s words that are English function words, and how many words it has. */
function englishShare(text: string): { share: number; words: number } {
  const words = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const hits = words.filter((w) => FUNCTION_WORDS.has(w)).length;
  return { share: words.length ? hits / words.length : 0, words: words.length };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (s: string) =>
  ISO_DATE.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

describe("the posts", () => {
  it("exist", () => {
    expect(POSTS.length).toBeGreaterThan(0);
  });

  describe("are written in English — every one, every string", () => {
    /* THE OWNER'S RULE (2026-09-26): every article is in English. The blog is
       reading practice for people learning English, so a translated article
       defeats it — and on an Uzbek-default site, translating "for the audience"
       is exactly the helpful-looking change somebody will make. Only the chrome
       around the articles is localised (`blog.*` keys). */

    it("uses no Cyrillic and no Uzbek letters", () => {
      // ʻ (U+02BB) and ʼ (U+02BC) are how Uzbek Latin writes oʻ, gʻ and the
      // tutuq belgisi; English never needs them. Other Latin letters stay
      // allowed — Čapek and sælig are English text quoting other languages.
      for (const p of POSTS) {
        for (const s of allText(p)) {
          expect(s, `${p.slug}: Cyrillic in "${s}"`).not.toMatch(/[Ѐ-ӿ]/);
          expect(s, `${p.slug}: Uzbek letter in "${s}"`).not.toMatch(/[ʻʼ]/);
        }
      }
    });

    it("reads as English paragraph by paragraph", () => {
      /* Per paragraph, so ONE translated paragraph in an English post is still
         caught. Only paragraphs of 20+ words: short note-style lines ("Free
         entry widens access — students, families") legitimately have no
         function words at all. The lowest published paragraph scores 0.19;
         Uzbek scores 0. */
      for (const p of POSTS) {
        for (const s of allText(p)) {
          const { share, words } = englishShare(s);
          if (words < 20) continue;
          expect(share, `${p.slug}: not English? "${s.slice(0, 80)}…"`).toBeGreaterThanOrEqual(0.12);
        }
      }
    });

    it("reads as English as a whole", () => {
      for (const p of POSTS) {
        const { share } = englishShare(allText(p).join(" "));
        expect(share, `${p.slug}: ${share.toFixed(2)}`).toBeGreaterThanOrEqual(0.25);
      }
    });
  });

  it("have unique, URL-safe slugs", () => {
    const slugs = POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("have real dates, and an update never precedes publication", () => {
    for (const p of POSTS) {
      expect(isRealDate(p.published), `${p.slug}: published ${p.published}`).toBe(true);
      if (p.updated) {
        expect(isRealDate(p.updated), `${p.slug}: updated ${p.updated}`).toBe(true);
        expect(p.updated >= p.published, `${p.slug}: updated before published`).toBe(true);
      }
    }
  });

  it("are sorted newest first", () => {
    for (let i = 1; i < POSTS.length; i++) {
      expect(POSTS[i - 1].published >= POSTS[i].published).toBe(true);
    }
  });

  it("feature at most one lead story", () => {
    expect(POSTS.filter((p) => p.featured).length).toBeLessThanOrEqual(1);
  });

  it("keep the standfirst short enough to be the meta description", () => {
    // Search results cut a description at roughly this length, and the
    // standfirst is also the summary on every card.
    for (const p of POSTS) expect(p.standfirst.length, p.slug).toBeLessThanOrEqual(200);
  });

  it("belong to a category that has a label", () => {
    for (const p of POSTS) expect(CATEGORIES).toContain(p.category);
    for (const c of CATEGORIES) expect(en[CATEGORY_LABEL[c]]).toBeTruthy();
  });

  it("use only inline markup the renderer understands", () => {
    /* ⚠️ THE FAILURE THIS EXISTS FOR IS SILENT. Nested markup — bold inside
       italic — is not supported, and it does not throw: the parser matches the
       wrong pair of asterisks and the page prints the leftovers. After parsing,
       no marker may survive in a text span. */
    for (const p of POSTS) {
      for (const s of inlineStrings(p)) {
        for (const span of parseInline(s)) {
          if (span.kind !== "text") continue;
          expect(span.text, `${p.slug}: stray markup in "${s}"`).not.toMatch(/\*|\]\(/);
        }
      }
    }
  });

  it("link only to pages that exist", () => {
    // Every public page, every article, and the blog front page. A hash is
    // allowed on any of them; the page part must still resolve.
    const known = new Set<string>([
      ...PUBLIC_ROUTES.map((r) => r.path),
      ...POSTS.map((p) => `/blog/${p.slug}`),
    ]);
    for (const p of POSTS) {
      const hrefs = [
        ...inlineStrings(p).flatMap((s) =>
          parseInline(s).flatMap((sp) => (sp.kind === "link" ? [sp.href] : [])),
        ),
        ...(p.cta ? [p.cta.href] : []),
      ];
      for (const href of hrefs) {
        if (href.startsWith("/")) {
          expect(known.has(href.split("#")[0]), `${p.slug} links to ${href}`).toBe(true);
        } else {
          expect(href, `${p.slug}: external links must be https`).toMatch(/^https:\/\//);
        }
      }
    }
  });
});

describe("the front page and related stories", () => {
  it("lead with the featured post, and never repeat it below", () => {
    const featured = POSTS.find((p) => p.featured);
    if (featured) expect(leadPost()).toBe(featured);
    expect(otherPosts()).not.toContain(leadPost());
    expect(otherPosts().length).toBe(POSTS.length - 1);
  });

  it("never suggest the post you are reading, or the same post twice", () => {
    for (const p of POSTS) {
      const r = relatedPosts(p);
      expect(r).not.toContain(p);
      expect(new Set(r).size).toBe(r.length);
    }
  });

  it("suggest the same category first", () => {
    for (const p of POSTS) {
      const r = relatedPosts(p, POSTS.length);
      const firstOther = r.findIndex((x) => x.category !== p.category);
      if (firstOther === -1) continue;
      expect(r.slice(firstOther).every((x) => x.category !== p.category)).toBe(true);
    }
  });

  it("finds posts by slug and nothing else", () => {
    expect(getPost(POSTS[0].slug)).toBe(POSTS[0]);
    expect(getPost("no-such-post")).toBeUndefined();
  });
});

describe("derived values", () => {
  const post = (words: number): BlogPost => ({
    slug: "x",
    category: "ielts",
    title: "x",
    standfirst: "",
    published: "2026-01-01",
    author: "x",
    cover: { kicker: "x" },
    body: [{ type: "p", text: Array(words).fill("word").join(" ") }],
  });

  it("reads at 220 words a minute, never under a minute", () => {
    expect(readingMinutes(post(440))).toBe(2);
    expect(readingMinutes(post(10))).toBe(1);
  });

  it("counts the words a reader sees, not the markup", () => {
    expect(plainText("a **bold** and *soft* [link](/grade)")).toBe("a bold and soft link");
  });

  it("dates a post in UTC, whatever zone the build runs in", () => {
    /* A bare date is midnight UTC; formatted in a zone west of Greenwich it
       prints the day before. Tashkent is EAST, so on the owner's machine the
       bug cannot show — the zone is forced west here or this test guards
       nothing where it is usually run. */
    const tz = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      expect(formatPostDate("2026-09-26", "en-GB")).toBe("26 September 2026");
      expect(formatPostDate("2026-01-01", "en-GB")).toBe("1 January 2026");
    } finally {
      if (tz === undefined) delete process.env.TZ;
      else process.env.TZ = tz;
    }
  });
});

describe("parseInline", () => {
  it("reads bold, italic and links", () => {
    expect(parseInline("a **b** *c* [d](/e)")).toEqual([
      { kind: "text", text: "a " },
      { kind: "strong", text: "b" },
      { kind: "text", text: " " },
      { kind: "em", text: "c" },
      { kind: "text", text: " " },
      { kind: "link", text: "d", href: "/e" },
    ]);
  });

  it("leaves an unmatched or spaced asterisk as text", () => {
    expect(parseInline("5 * 4 = 20")).toEqual([{ kind: "text", text: "5 * 4 = 20" }]);
  });

  it("returns nothing for nothing", () => {
    expect(parseInline("")).toEqual([]);
  });
});
