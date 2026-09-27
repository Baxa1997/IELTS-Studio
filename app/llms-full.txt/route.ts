import { POSTS } from "@/lib/blog";
import { postToMarkdown } from "@/lib/blog/markdown";
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
 * Static, built once per deploy.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const body = [
    `# ${SITE_NAME} blog — full text`,
    "",
    `> Every article on ${absoluteUrl("/blog")}, in full. Written in English for people preparing for IELTS ` +
      "and the Uzbekistan CEFR Multilevel exam. EngProgress is not affiliated with or endorsed by IELTS®, " +
      "the British Council, IDP or Cambridge Assessment English.",
    "",
    ...POSTS.flatMap((p) => ["---", "", postToMarkdown(p, absoluteUrl)]),
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
