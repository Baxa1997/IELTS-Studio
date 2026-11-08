import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BODY, BRAND, BRAND_TINT_LINE, FAINT, LINE, MUTED, PANEL } from "@/app/_landing/_lib/design";
import {
  BANK_TOPICS,
  bankTopic,
  CATEGORY_GUIDE,
  categoryLabel,
  PRACTISE_HREF,
  QUESTION_BANK_PATH,
  TASK2_EXAM,
  topicPath,
} from "@/lib/prompts/question-bank";

import { A, B, Cta, P, PageTitle, Related, Sec } from "../../_components/marketing";
import { HUB_HEADING, questionCount, topicGraph, topicHeading, topicMetadata } from "../_lib/page-meta";

/**
 * /ielts-writing-task-2-questions/[topic] — one topic's Task 2 questions,
 * grouped by question type, each type with a short note on how to approach it.
 *
 * ⚠️ ONLY THE TOPICS THE BANK GIVES A PAGE. `dynamicParams = false` 404s any
 * other slug, including a real topic_family that is under
 * MIN_QUESTIONS_PER_TOPIC — that topic is in the library but deliberately not
 * on the site, and a page for it would be the thin page the bar exists to stop.
 *
 * Each question is printed exactly as the library stores it; the page's test
 * reads every one back out of the rendered HTML.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return BANK_TOPICS.map((t) => ({ topic: t.slug }));
}

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = bankTopic((await params).topic);
  return topic ? topicMetadata(topic) : {};
}

export default async function Task2TopicPage({ params }: Props) {
  const topic = bankTopic((await params).topic);
  if (!topic) notFound();
  const others = BANK_TOPICS.filter((t) => t.slug !== topic.slug);

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(topicGraph(topic)) }} />
      <nav aria-label="Breadcrumb" style={{ marginBottom: 14, fontSize: 13.5, color: MUTED }}>
        <Link href={QUESTION_BANK_PATH} style={{ color: BRAND, fontWeight: 600, textDecoration: "none" }}>
          {HUB_HEADING}
        </Link>{" "}
        / {topic.label}
      </nav>
      <PageTitle
        path={topicPath(topic.slug)}
        webPageNode={false}
        title={topicHeading(topic)}
        lead={`${topic.count} original IELTS Writing Task 2 practice questions on the ${topic.slug} topic, written by EngProgress in the exam's format and grouped by question type, with a short note on how to approach each type. Each one can be practised and marked free: write at least ${TASK2_EXAM.minWords} words in about ${TASK2_EXAM.minutes} minutes, then paste the question and your essay into the free writing checker — no sign-up needed to start.`}
      />

      {topic.groups.map((g) => (
        <Sec key={g.category} title={`${categoryLabel(g.category)} — ${questionCount(g.questions.length)}`}>
          <P>
            <B>How to recognise it:</B> {CATEGORY_GUIDE[g.category].recognise} <B>How to approach it:</B>{" "}
            {CATEGORY_GUIDE[g.category].approach}
          </P>
          <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {g.questions.map((q) => (
              <li
                key={q.n}
                id={`q-${q.n}`}
                style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px" }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: FAINT }}>Question {q.n}</div>
                <p style={{ margin: "6px 0 0", fontSize: 16, lineHeight: 1.65, color: BODY }}>{q.text}</p>
                <Link
                  href={PRACTISE_HREF}
                  style={{
                    display: "inline-block",
                    marginTop: 10,
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: BRAND,
                    textDecoration: "none",
                    borderBottom: `1px solid ${BRAND_TINT_LINE}`,
                  }}
                >
                  Practise this question free →
                </Link>
              </li>
            ))}
          </ol>
        </Sec>
      ))}

      <Sec title="More Task 2 topics">
        <P>
          {others.map((t, i) => (
            <span key={t.slug}>
              {i > 0 ? " · " : null}
              <A href={topicPath(t.slug)}>
                {t.label} ({t.count})
              </A>
            </span>
          ))}
        </P>
        <P>
          Or see <A href={QUESTION_BANK_PATH}>every topic and question type</A> on one page.
        </P>
      </Sec>

      <Cta
        title="Write one, get it marked"
        sub="A band for each criterion, the thing holding it back, and the fix — free, no card needed."
      />
      <Related current={topicPath(topic.slug)} />
    </article>
  );
}
