import { wordCount, type BlogPost } from "@/lib/blog";
import { plainText } from "@/lib/blog/inline";

/**
 * The SEO panel's checklist — advice, not rules.
 *
 * ⚠️ DELIBERATELY SEPARATE FROM `publishProblems`. That list REFUSES a post
 * (a dead link, a missing alt, a translated paragraph): things that are wrong.
 * This one SUGGESTS (a long title, a keyword missing from the opening): things
 * a good writer may choose. Moving a check from here to there blocks
 * publishing over a judgement call, so do it only for a real defect.
 */
export interface SeoCheck {
  ok: boolean;
  label: string;
  /** What to do about it, when it fails. */
  hint?: string;
}

const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

export function seoChecks(post: BlogPost): SeoCheck[] {
  const keywords = post.keywords ?? [];
  const main = keywords[0];
  const first = post.body.find((b) => b.type === "p");
  const opening = first && first.type === "p" ? plainText(first.text) : "";
  const headings = post.body.flatMap((b) => (b.type === "h2" || b.type === "h3" ? [plainText(b.text)] : []));
  const words = wordCount(post);
  const images = post.body.filter((b) => b.type === "image");
  const links = post.body
    .flatMap((b) => (b.type === "p" || b.type === "list" || b.type === "tip" ? JSON.stringify(b) : []))
    .join(" ")
    .match(/\]\(\//g);

  const checks: SeoCheck[] = [
    {
      ok: post.title.length >= 30 && post.title.length <= 65,
      label: `Title is ${post.title.length} characters`,
      hint: "Search results show about 60 characters — aim for 30 to 65.",
    },
    {
      ok: post.standfirst.length >= 70 && post.standfirst.length <= 200,
      label: `Standfirst is ${post.standfirst.length} characters`,
      hint: "It is the search description: 70 to 200 characters, saying what the reader gets.",
    },
    {
      ok: keywords.length > 0,
      label: keywords.length ? `${keywords.length} keyword${keywords.length === 1 ? "" : "s"}` : "No keywords yet",
      hint: "Add the searches this post answers — the first one is treated as the main keyword.",
    },
  ];
  if (main) {
    checks.push(
      { ok: has(post.title, main), label: `Main keyword in the title`, hint: `Work “${main}” into the title.` },
      { ok: has(post.standfirst, main), label: `Main keyword in the standfirst`, hint: `Use “${main}” in the standfirst.` },
      { ok: has(opening, main), label: `Main keyword in the first paragraph`, hint: `Say “${main}” early in the opening paragraph.` },
      { ok: headings.some((h) => has(h, main)), label: `Main keyword in a heading`, hint: `Use “${main}” in at least one heading.` },
    );
  }
  checks.push(
    { ok: words >= 600, label: `${words} words`, hint: "Articles that rank usually run 600 words or more." },
    { ok: headings.length >= 2, label: `${headings.length} heading${headings.length === 1 ? "" : "s"}`, hint: "Break the article into at least two sections with headings." },
    { ok: (links?.length ?? 0) >= 1, label: `${links?.length ?? 0} link${links?.length === 1 ? "" : "s"} to our own pages`, hint: "Link to a practice page or another post — it helps readers and crawlers." },
    { ok: Boolean(post.image) || images.length > 0, label: post.image || images.length ? "Has a picture" : "No picture", hint: "A cover or a picture in the article makes the post stand out in search and when shared." },
    { ok: post.summary.length >= 2, label: `"In short" has ${post.summary.length} point${post.summary.length === 1 ? "" : "s"}`, hint: "Two to five stand-alone sentences — answer engines quote them." },
    { ok: (post.faq?.length ?? 0) >= 2, label: `${post.faq?.length ?? 0} reader question${post.faq?.length === 1 ? "" : "s"}`, hint: "Add two or more questions people actually search for." },
  );
  return checks;
}
