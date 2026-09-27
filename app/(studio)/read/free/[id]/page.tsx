import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FreeTrialGate } from "@/shared/components/practice/free-trial-nudge";
import { onTodaysList } from "@/lib/free-practice/assignment";
import { freeTrialCopy } from "@/lib/free-practice/copy";
import { freePracticePage } from "@/lib/free-practice/links";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import type { NoteMeta, ReadingModule, ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_GRAD_BOTTOM, PAGE_GRAD_TOP } from "@/lib/theme/tokens";

import { ReadingRunner, type DeliveredQuestion } from "../../_components/reading-runner";

/**
 * /read/free/[id] — one free Reading practice, for a visitor with no account.
 *
 * The runner a signed-in learner uses, in public mode, with the same marking
 * (/api/public/practice/reading runs the same `gradeReadingAttempt` against the
 * same shared keys). The passage must be on this visitor's list today (see
 * `onTodaysList`) — otherwise back to the list; today's free practice already
 * used → the gate, which recommends signing in for more.
 *
 * Questions are loaded ANSWER-FREE, exactly as `/read/[id]` loads them. Public
 * by PUBLIC_PATHS; not indexed — the list is the page that ranks.
 */
const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("free.runnerTitleReading"),
  robots: { index: false, follow: true },
};

export default async function FreeReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await onTodaysList("reading", decodeURIComponent(id));
  if (!entry) redirect(freePracticePage("reading"));
  const copy = freeTrialCopy(t, "reading");
  const frame = { minHeight: "100dvh", background: `linear-gradient(180deg,${PAGE_GRAD_TOP},${PAGE_GRAD_BOTTOM})` };

  if (entry.done) {
    return (
      <div lang="en" style={frame}>
        <FreeTrialGate
          copy={copy}
          title={t("free.doneTitle")}
          body={t("free.doneBody")}
          backHref={freePracticePage("reading")}
          backLabel={t("free.allFreePractice")}
        />
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: passage }, { data: questions }] = await Promise.all([
    admin
      .from("reading_passages")
      .select("id, title, body, module, topic, difficulty")
      .eq("id", entry.item.key)
      .is("organization_id", null)
      .maybeSingle(),
    admin
      .from("reading_questions")
      .select("id, question_type, order_index, prompt, options, word_limit, section, note_meta") // deliberately answer-free
      .eq("passage_id", entry.item.key)
      .is("organization_id", null)
      .order("order_index", { ascending: true }),
  ]);
  if (!passage || !questions || questions.length === 0) redirect(freePracticePage("reading"));

  const delivered: DeliveredQuestion[] = questions.map((q) => ({
    id: q.id as string,
    question_type: q.question_type as ReadingQuestionType,
    order_index: q.order_index as number,
    prompt: (q.prompt as string) ?? "",
    options: (q.options as string[] | null) ?? null,
    word_limit: (q.word_limit as string | null) ?? null,
    section: (q.section as string | null) ?? null,
    note_meta: (q.note_meta as NoteMeta | null) ?? null,
  }));

  return (
    <div lang="en" style={frame}>
      <ReadingRunner
        passage={{
          id: passage.id as string,
          title: passage.title as string,
          body: passage.body as string,
          module: passage.module as ReadingModule,
          topic: (passage.topic as string | null) ?? null,
          difficulty: (passage.difficulty as number | null) ?? null,
        }}
        questions={delivered}
        publicMode={{
          submitUrl: "/api/public/practice/reading",
          exitHref: freePracticePage("reading"),
          copy,
        }}
      />
    </div>
  );
}
