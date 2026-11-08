import Link from "next/link";

import { BODY, BRAND, LINE, PANEL } from "@/app/_landing/_lib/design";
import {
  BANK_CATEGORIES,
  BANK_QUESTION_COUNT,
  BANK_TOPICS,
  bankCountOf,
  CATEGORY_GUIDE,
  categoryLabel,
  PRACTISE_HREF,
  QUESTION_BANK_PATH,
  TASK2_EXAM,
  topicPath,
} from "@/lib/prompts/question-bank";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../_components/marketing";
import { HUB_HEADING, hubGraph, hubMetadata, questionCount } from "./_lib/page-meta";

/**
 * /ielts-writing-task-2-questions — the curated library's Task 2 essays, as a
 * public question bank: this hub, and a page per topic (./[topic]).
 *
 * ANSWER FIRST. The lead says what the page is, how many questions, that they
 * are our own in the exam's format, and that each can be marked free — the
 * sentence an answer engine lifts when someone asks for Task 2 questions. Every
 * number in it is counted from the library (lib/prompts/question-bank), never
 * typed, so it cannot go stale when a prompt is added.
 *
 * ENGLISH, AND WRITTEN INTO THE PAGE, like every page in app/(marketing): they
 * are single-language (unprefixed, outside the sitemap's LOCALISED set), so a
 * key in lib/i18n/messages/en.ts would only add uz/ru strings nobody is shown.
 * If these pages are ever localised, they move to keys with the rest.
 */

export const metadata = hubMetadata();

const topicNames = BANK_TOPICS.map((t) => t.slug);
const topicList = `${topicNames.slice(0, -1).join(", ")} and ${topicNames.at(-1)}`;

const FAQ = [
  {
    q: "Are these real IELTS exam questions?",
    a: "No. They are original practice questions written by EngProgress in the IELTS Writing Task 2 format; none is copied from a past paper or a test book. EngProgress is not affiliated with or endorsed by IELTS®, the British Council, IDP or Cambridge Assessment English.",
  },
  {
    q: "How long should my answer be?",
    a: `The exam asks for at least ${TASK2_EXAM.minWords} words and suggests spending about ${TASK2_EXAM.minutes} minutes on Task 2. Practise each question under the same limit, because writing it in an afternoon is a different skill from writing it in ${TASK2_EXAM.minutes} minutes.`,
  },
  {
    q: "How can I get my essay marked for free?",
    a: "Open the free EngProgress writing checker, paste the question and your essay into its Writing Task 2 tab, and grade it. You get an overall band and a band for each of the four criteria, each with a quote from your essay, what is holding it back, and a fix. Your first gradings need no account.",
  },
  {
    q: "Which question types are included?",
    a: `${BANK_CATEGORIES.map(categoryLabel).join("; ")}. Each topic page groups its questions by type, with a short note on how to recognise and approach each one.`,
  },
];

export default function IeltsWritingTask2QuestionsPage() {
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hubGraph()) }} />
      <PageTitle
        path={QUESTION_BANK_PATH}
        webPageNode={false}
        title={HUB_HEADING}
        lead={`${BANK_QUESTION_COUNT} IELTS Writing Task 2 questions in ${BANK_TOPICS.length} topics — ${topicList} — grouped by question type. They are original practice questions written by EngProgress in the current IELTS Task 2 format, not questions copied from past papers. Each one can be practised and marked free in the EngProgress writing checker, with no sign-up needed to start.`}
      />

      <Sec title="Topics">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {BANK_TOPICS.map((t) => (
            <li key={t.slug} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px" }}>
              <Link href={topicPath(t.slug)} style={{ fontSize: 16, fontWeight: 700, color: BRAND, textDecoration: "none" }}>
                {t.label} — {questionCount(t.count)} →
              </Link>
              <p style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.6, color: BODY }}>
                {t.groups.map((g) => `${categoryLabel(g.category)}: ${g.questions.length}`).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </Sec>

      <Sec title="The question types">
        <P>
          Every Task 2 question asks for one of a handful of essay shapes, and the wording tells you which.
          An essay that answers a different shape from the one set — only your opinion when the question asks
          you to discuss both views, or one half of a two-part question — loses marks under Task Response,
          however good the English is.
        </P>
        <UL>
          {BANK_CATEGORIES.map((c) => (
            <LI key={c}>
              <B>
                {categoryLabel(c)} — {questionCount(bankCountOf(c))}.
              </B>{" "}
              {CATEGORY_GUIDE[c].recognise}
            </LI>
          ))}
        </UL>
      </Sec>

      <Sec title="How to practise with them">
        <P>
          Pick a question, set a timer for {TASK2_EXAM.minutes} minutes and write at least{" "}
          {TASK2_EXAM.minWords} words, as you would in the exam. Then paste the question and your essay into
          the <A href={PRACTISE_HREF}>free writing checker</A>: it marks the essay on the four official
          criteria — Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and
          Accuracy — and tells you what is holding each one back. Your first gradings need no account.
        </P>
        <P>
          Every question here is also in the writing library inside a free account, where you write it in the
          timed studio and can then rewrite the same essay and have it marked again — see{" "}
          <A href="/ielts-writing-practice">IELTS Writing practice</A>.
        </P>
      </Sec>

      <Faq items={FAQ} />

      <Cta
        title="Write one, get it marked"
        sub="A band for each criterion, the thing holding it back, and the fix — free, no card needed."
      />
      <Related current={QUESTION_BANK_PATH} />
    </article>
  );
}
