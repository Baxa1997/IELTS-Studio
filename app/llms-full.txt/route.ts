import { postToMarkdown } from "@/lib/blog/markdown";
import { loadPosts } from "@/lib/blog/store";
import { practiceFaq } from "@/lib/free-practice/faq";
import { FREE_PAGE_DESCRIPTION, FREE_PAGE_TITLE, freePracticePage } from "@/lib/free-practice/links";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import {
  BANK_DESCRIPTION,
  BANK_TOPICS,
  CATEGORY_GUIDE,
  categoryLabel,
  PRACTISE_HREF,
  QUESTION_BANK_PATH,
  topicPath,
} from "@/lib/prompts/question-bank";
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
 *
 * Then the Task 2 question bank, every question in full under its topic and
 * type, from the same module the pages render (lib/prompts/question-bank) — so
 * an assistant asked for "Task 2 questions about crime" can quote them here
 * and cite the topic page. Verbatim: the library's text, never a paraphrase.
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
    "---",
    "",
    "# IELTS Writing Task 2 questions",
    "",
    `> ${BANK_DESCRIPTION} ${absoluteUrl(QUESTION_BANK_PATH)}`,
    "",
    `Original practice questions written by ${SITE_NAME} in the IELTS Writing Task 2 format, not taken from any ` +
      `past paper or test book. Any of them can be written and marked free at ${absoluteUrl(PRACTISE_HREF)}.`,
    "",
    ...BANK_TOPICS.flatMap((topic) => [
      `## ${topic.label} — ${topic.count} questions`,
      "",
      absoluteUrl(topicPath(topic.slug)),
      "",
      ...topic.groups.flatMap((g) => [
        `### ${categoryLabel(g.category)}`,
        "",
        `${CATEGORY_GUIDE[g.category].recognise} ${CATEGORY_GUIDE[g.category].approach}`,
        "",
        ...g.questions.map((q) => `${q.n}. ${q.text}`),
        "",
      ]),
    ]),
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
