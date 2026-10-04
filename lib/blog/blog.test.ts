/**
 * The blog's invariants — the things a post can get wrong without anything
 * else noticing.
 *
 * Posts live in the database now (see ./types.ts), so the rules that used to be
 * this file run on publish instead — `publishProblems` in ./validate. This file
 * pins those rules: every seeded post passes them, and each rule is broken on
 * purpose below and must catch it. A rule that stops catching its own bug is
 * how a translated paragraph or a dead link would reach the site unnoticed.
 *
 * Whether the pages are reachable — public, in the sitemap — is
 * `app/blog/blog-routes.test.ts`: lib/ may not import from app/.
 */

import { describe, expect, it } from "vitest";

import { en } from "@/lib/i18n/messages/en";
import { seededPosts } from "@/test/blog-seed";

import {
  CATEGORIES,
  CATEGORY_LABEL,
  findPost,
  formatPostDate,
  headingId,
  leadPost,
  otherPosts,
  postsForSkill,
  readingMinutes,
  relatedPosts,
  SKILL_TOPIC,
  type BlogPost,
  type BlogSkill,
} from ".";
import { parseInline, plainText } from "./inline";
import { postToMarkdown } from "./markdown";
import { blocksToSource, faqToSource, sourceToBlocks, sourceToFaq, sourceToSummary, summaryToSource } from "./source";
import { draftProblems, publishProblems, RESERVED_SLUGS } from "./validate";

const POSTS = seededPosts();
const slugsBut = (p: BlogPost) => POSTS.filter((x) => x.slug !== p.slug).map((x) => x.slug);
const problems = (p: BlogPost) => publishProblems(p, slugsBut(p));

/** A seeded post to break, deep-copied so one test's damage stays in it. */
const base = (): BlogPost => structuredClone(POSTS.find((p) => p.faq?.length && p.cta) ?? POSTS[0]);
/** The post with one paragraph swapped for `text`. */
const withParagraph = (text: string): BlogPost => {
  const p = base();
  const i = p.body.findIndex((b) => b.type === "p");
  p.body[i] = { type: "p", text };
  return p;
};

describe("the seeded posts", () => {
  it("exist", () => {
    expect(POSTS.length).toBeGreaterThan(0);
  });

  it.each(POSTS.map((p) => [p.slug, p] as const))("%s passes every publishing check", (_slug, p) => {
    expect(problems(p)).toEqual([]);
  });

  it("have unique slugs, and at most one lead story", () => {
    expect(new Set(POSTS.map((p) => p.slug)).size).toBe(POSTS.length);
    expect(POSTS.filter((p) => p.featured).length).toBeLessThanOrEqual(1);
  });

  it("belong to categories that have a label", () => {
    for (const c of CATEGORIES) expect(en[CATEGORY_LABEL[c]]).toBeTruthy();
  });
});

describe("publishing refuses a post that breaks a rule", () => {
  /* Each case is one rule's own bug. If a rule is loosened until its bug gets
     through, the case fails with the rule's name on it. */

  it("a translated paragraph — the owner's every-article-in-English rule", () => {
    const uzbek =
      "Bu maqolada imtihonga qanday tayyorlanish haqida gapiramiz va har bir bosqichni batafsil " +
      "tushuntiramiz chunki talabalar ko'pincha vaqtni noto'g'ri taqsimlaydi hamda savollarni oxirigacha o'qimaydi";
    expect(problems(withParagraph(uzbek)).join("\n")).toMatch(/not read as English/i);
  });

  it("Cyrillic anywhere", () => {
    const p = base();
    p.title = "Как сдать IELTS";
    expect(problems(p).join("\n")).toMatch(/Cyrillic/);
  });

  it("an Uzbek letter anywhere", () => {
    const p = base();
    p.standfirst = "Oʻzbekiston uchun.";
    expect(problems(p).join("\n")).toMatch(/Uzbek letter/);
  });

  it("a slug that is not URL-safe, or is a page of its own", () => {
    expect(draftProblems({ ...base(), slug: "Plan Task 2" }).join("\n")).toMatch(/slug/);
    for (const s of RESERVED_SLUGS) expect(draftProblems({ ...base(), slug: s }).join("\n")).toMatch(/page of its own/);
  });

  it("an impossible date, or an update before publication", () => {
    expect(draftProblems({ ...base(), published: "2026-02-30" }).join("\n")).toMatch(/real date/);
    expect(draftProblems({ ...base(), published: "2026-09-26", updated: "2026-09-01" }).join("\n")).toMatch(
      /before the publication date/,
    );
  });

  it("a standfirst too long to be the meta description", () => {
    expect(problems({ ...base(), standfirst: "Word ".repeat(50) }).join("\n")).toMatch(/keep it to 200/);
  });

  it("nested markup the renderer would print literally", () => {
    expect(problems(withParagraph("The answer is *often **wrong** here* in the exam, so read it twice.")).join("\n")).toMatch(
      /cannot render/,
    );
  });

  it("a link to no page, or an insecure one", () => {
    expect(problems(withParagraph("Read [this guide](/no-such-page) before the exam day.")).join("\n")).toMatch(
      /goes to no page/,
    );
    expect(problems(withParagraph("Read [this guide](http://example.com) before the exam.")).join("\n")).toMatch(
      /must be https/,
    );
  });

  it("but not a link to another post or a hash on a real page", () => {
    const other = slugsBut(base())[0];
    expect(problems(withParagraph(`Read [this](/blog/${other}) and [that](/grade#top) first.`))).toEqual([]);
  });

  it("a summary point that leans on the one before it", () => {
    const p = base();
    p.summary = [...p.summary.slice(0, 1), "This is why the second point fails on its own."];
    expect(problems(p).join("\n")).toMatch(/leans on the point before it/);
  });

  it("a summary of one point", () => {
    expect(problems({ ...base(), summary: ["Only one point is here."] }).join("\n")).toMatch(/two to five/);
  });

  it("a question that is not a question, or an answer with markup", () => {
    const p = base();
    p.faq = [{ q: "Is this a question", a: "It has **bold** in it." }];
    const out = problems(p).join("\n");
    expect(out).toMatch(/must end with "\?"/);
    expect(out).toMatch(/plain text/);
  });

  it("two headings with the same anchor", () => {
    const p = base();
    p.body.push({ type: "h2", text: "Same heading" }, { type: "h2", text: "Same  heading!" });
    expect(problems(p).join("\n")).toMatch(/share an anchor/);
  });

  it("a measured-accuracy claim about the grader", () => {
    expect(problems(withParagraph("Our grader is within half a band of a real examiner, every time.")).join("\n")).toMatch(
      /accuracy claim/,
    );
  });

  it("a photo from another site — next/image would take the page down", () => {
    const p = { ...base(), image: { src: "https://example.com/x.jpg", alt: "A photo" } };
    expect(problems(p).join("\n")).toMatch(/file in \/public/);
    expect(problems({ ...base(), image: { src: "/blog/x.jpg", alt: "A photo" } })).toEqual([]);
  });

  it("a tip without a title, an example line without a label", () => {
    const p = base();
    p.body.push({ type: "tip", title: "", text: "Read the question twice." });
    p.body.push({ type: "example", rows: [{ label: "", text: "No label here" }] });
    const out = problems(p).join("\n");
    expect(out).toMatch(/tip needs a title/);
    expect(out).toMatch(/needs a label/);
  });
});

describe("the editor's text", () => {
  /* ⚠️ Opening a post and saving it unchanged must store the same blocks — or
     every save of an old article quietly rewrites it. */
  it.each(POSTS.map((p) => [p.slug, p] as const))("round-trips %s exactly", (_slug, p) => {
    expect(sourceToBlocks(blocksToSource(p.body))).toEqual(p.body);
    expect(sourceToSummary(summaryToSource(p.summary))).toEqual(p.summary);
    expect(sourceToFaq(faqToSource(p.faq ?? []))).toEqual(p.faq ?? []);
  });

  it("reads every block type a writer types", () => {
    const src = [
      "A paragraph that runs",
      "over two lines.",
      "",
      "## A heading",
      "",
      "- one",
      "- two",
      "",
      "1. first",
      "2. second",
      "",
      "> Words worth quoting.",
      "> — Someone",
      "",
      ":::tip Exam tip",
      "Read it twice.",
      ":::",
      "",
      ":::example Notes",
      "Where: Samarkand",
      "When, who: a school trip",
      ":::",
    ].join("\n");
    expect(sourceToBlocks(src)).toEqual([
      { type: "p", text: "A paragraph that runs over two lines." },
      { type: "h2", text: "A heading" },
      { type: "list", items: ["one", "two"] },
      { type: "list", items: ["first", "second"], ordered: true },
      { type: "quote", text: "Words worth quoting.", cite: "Someone" },
      { type: "tip", title: "Exam tip", text: "Read it twice." },
      { type: "example", title: "Notes", rows: [{ label: "Where", text: "Samarkand" }, { label: "When, who", text: "a school trip" }] },
    ]);
  });

  it("reads questions whose answers run over several lines", () => {
    expect(sourceToFaq("Q: Why?\nA: Because it\nruns on.\n\nQ: And?\nA: Done.")).toEqual([
      { q: "Why?", a: "Because it runs on." },
      { q: "And?", a: "Done." },
    ]);
  });
});

describe("written to be found — by searchers and by answer engines", () => {
  it("makes anchors from the words, not the markup", () => {
    expect(headingId("Minute 1: find **every** question")).toBe("minute-1-find-every-question");
    expect(headingId("Čapek's *R.U.R.*")).toBe("capek-s-r-u-r");
  });

  it("lists each post under its skill and nowhere else", () => {
    for (const skill of Object.keys(SKILL_TOPIC) as BlogSkill[]) {
      expect(postsForSkill(POSTS, skill).every((p) => p.skill === skill)).toBe(true);
    }
    const tagged = POSTS.filter((p) => p.skill);
    const listed = (Object.keys(SKILL_TOPIC) as BlogSkill[]).flatMap((s) => postsForSkill(POSTS, s));
    expect(listed.length).toBe(tagged.length);
  });

  it("exports as Markdown with absolute links only", () => {
    // Relative links mean nothing once the text is inside an answer engine.
    const abs = (path: string) => `https://example.test${path}`;
    for (const p of POSTS) {
      const md = postToMarkdown(p, abs);
      expect(md).toContain(`# ${p.title}`);
      expect(md).toContain(abs(`/blog/${p.slug}`));
      for (const pt of p.summary) expect(md).toContain(pt);
      for (const f of p.faq ?? []) expect(md).toContain(f.a);
      expect(md, `${p.slug}: a relative link survived`).not.toMatch(/\]\(\//);
    }
  });
});

describe("the front page and related stories", () => {
  it("lead with the featured post, and never repeat it below", () => {
    const featured = POSTS.find((p) => p.featured);
    if (featured) expect(leadPost(POSTS)).toBe(featured);
    expect(otherPosts(POSTS)).not.toContain(leadPost(POSTS));
    expect(otherPosts(POSTS).length).toBe(POSTS.length - 1);
  });

  it("have no lead and nothing below when there are no posts", () => {
    expect(leadPost([])).toBeUndefined();
    expect(otherPosts([])).toEqual([]);
  });

  it("never suggest the post you are reading, or the same post twice", () => {
    for (const p of POSTS) {
      const r = relatedPosts(POSTS, p);
      expect(r).not.toContain(p);
      expect(new Set(r).size).toBe(r.length);
    }
  });

  it("suggest the same category first", () => {
    for (const p of POSTS) {
      const r = relatedPosts(POSTS, p, POSTS.length);
      const firstOther = r.findIndex((x) => x.category !== p.category);
      if (firstOther === -1) continue;
      expect(r.slice(firstOther).every((x) => x.category !== p.category)).toBe(true);
    }
  });

  it("finds posts by slug and nothing else", () => {
    expect(findPost(POSTS, POSTS[0].slug)).toBe(POSTS[0]);
    expect(findPost(POSTS, "no-such-post")).toBeUndefined();
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
    summary: [],
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
