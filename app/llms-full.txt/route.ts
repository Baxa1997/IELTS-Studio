import { postToMarkdown } from "@/lib/blog/markdown";
import { loadPosts } from "@/lib/blog/store";
import { practiceFaq } from "@/lib/free-practice/faq";
import { FREE_PAGE_DESCRIPTION, FREE_PAGE_TITLE, freePracticePage } from "@/lib/free-practice/links";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

/**
 * GET /llms-full.txt — every blog article, in full, as Markdown.
 *
 * `/llms.txt` is the index an answer engine reads first; this is the companion
 * file the llmstxt.org convention names for the complete text. An assistant
 * asked "how do I tell False from Not Given?" can quote an article from here
 * without rendering our pages, and every article carries its own URL so the
 * answer can cite it.
 *
 * Derived, like llms.txt: publishing a post adds it here with no second edit.
 * Static, from the cached post list; a save in /admin refreshes it.
 *
 * After the articles, the free practice: each skill's page with its
 * description and the questions it answers — the same text the page shows and
 * its FAQPage data carries (lib/free-practice/faq).
 */
export const dynamic = "force-static";

const t = translator(SOURCE_LOCALE);
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const posts = await loadPosts();
  const body = [
    `# ${SITE_NAME} blog — full text`,
    "",
    `> Every article on ${absoluteUrl("/blog")}, in full. Written in English for people preparing for IELTS ` +
      "and the Uzbekistan CEFR Multilevel exam. EngProgress is not affiliated with or endorsed by IELTS®, " +
      "the British Council, IDP or Cambridge Assessment English.",
    "",
    ...posts.flatMap((p) => ["---", "", postToMarkdown(p, absoluteUrl)]),
    "---",
    "",
    "# Free practice",
    "",
    ...FREE_SKILLS.flatMap((s) => [
      `## ${t(FREE_PAGE_TITLE[s])}`,
      "",
      `${t(FREE_PAGE_DESCRIPTION[s])} ${absoluteUrl(freePracticePage(s))}`,
      "",
      ...practiceFaq(s, t).flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    ]),
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
