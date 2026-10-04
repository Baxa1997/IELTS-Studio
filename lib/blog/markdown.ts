import { CATEGORY_LABEL, formatPostDate, type Block, type BlogPost } from ".";
import { FREE_PAGE_TITLE, freePracticePage } from "@/lib/free-practice/links";
import { isFreeSkill } from "@/lib/free-practice/rotation";
import { en } from "@/lib/i18n/messages/en";

/**
 * A post as Markdown — what `/llms-full.txt` serves to answer engines.
 *
 * The inline syntax posts are written in (`**bold**`, `*italic*`,
 * `[label](/path)`) is already Markdown, so the text passes through as
 * written; the only rewrite is making our own links absolute, because a
 * relative path means nothing once the text has left the site.
 */
export function postToMarkdown(post: BlogPost, absolute: (path: string) => string): string {
  const url = absolute(`/blog/${post.slug}`);
  const link = (s: string) => s.replace(/\]\((\/[^)\s]*)\)/g, (_, path: string) => `](${absolute(path)})`);
  const out: string[] = [
    `# ${post.title}`,
    "",
    `${en[CATEGORY_LABEL[post.category]]} · ${formatPostDate(post.published, "en-GB")} · ${post.author} · ${url}`,
    "",
    `> ${post.standfirst}`,
    "",
    "## In short",
    "",
    ...post.summary.map((s) => `- ${s}`),
    "",
    ...post.body.flatMap((b) => [...block(b, link), ""]),
  ];
  if (post.faq?.length) {
    out.push("## Questions readers ask", "");
    for (const f of post.faq) out.push(`### ${f.q}`, "", f.a, "");
  }
  if (post.cta) out.push(`${post.cta.text} [${post.cta.label}](${absolute(post.cta.href)})`, "");
  // The article's free practice, as the page links it (FreePracticeNote).
  if (post.skill && isFreeSkill(post.skill)) {
    out.push(`Practise it free: [${en[FREE_PAGE_TITLE[post.skill]]}](${absolute(freePracticePage(post.skill))})`, "");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function block(b: Block, link: (s: string) => string): string[] {
  switch (b.type) {
    case "p":
      return [link(b.text)];
    case "h2":
      return [`## ${b.text}`];
    case "list":
      return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : "-"} ${link(it)}`);
    case "quote":
      return [`> ${link(b.text)}${b.cite ? ` — ${b.cite}` : ""}`];
    case "tip":
      return [`**${b.title}.** ${link(b.text)}`];
    case "example":
      return [
        ...(b.title ? [`*${b.title}*`, ""] : []),
        ...b.rows.map((r) => `- **${r.label}:** ${link(r.text)}`),
      ];
  }
}
