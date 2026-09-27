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

import { ReadingRunner, type DeliveredQuestion, type PublicMode } from "../../_components/reading-runner";
import { ReadingTestRunner, type TestPassage } from "../../_components/test-runner";

/**
 * /read/free/[id] — one free Reading practice, for a visitor with no account:
 * a FULL library test (three passages, the hour) or one passage of one — the
 * visitor's list says which (lib/free-practice/pools). `id` is the test's id
 * or the passage's.
 *
 * The runners a signed-in learner uses — the full-test runner or the passage
 * runner — in public mode, with the same marking (/api/public/practice/reading
 * runs the same `gradeReadingTest` / `gradeReadingAttempt` against the same
 * shared keys). The practice must be on this visitor's list today (see
 * `onTodaysList`) — otherwise back to the list; today's free practice already
 * used → the gate, which recommends signing in for more.
 *
 * Questions are loaded ANSWER-FREE, exactly as `/read/test/[id]` and
 * `/read/[id]` load them. Public by PUBLIC_PATHS; not indexed — the list is the
 * page that ranks.
 */
const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("free.runnerTitleReading"),
  robots: { index: false, follow: true },
};

/** The answer-free projection every reading runner is given. */
const DELIVERED = "id, question_type, order_index, prompt, options, word_limit, section, note_meta, passage_id";

function deliver(q: Record<string, unknown>): DeliveredQuestion {
  return {
    id: q.id as string,
    question_type: q.question_type as ReadingQuestionType,
    order_index: q.order_index as number,
    prompt: (q.prompt as string) ?? "",
    options: (q.options as string[] | null) ?? null,
    word_limit: (q.word_limit as string | null) ?? null,
    section: (q.section as string | null) ?? null,
    note_meta: (q.note_meta as NoteMeta | null) ?? null,
  };
}

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

  const publicMode: PublicMode = {
    submitUrl: "/api/public/practice/reading",
    exitHref: freePracticePage("reading"),
    copy,
  };
  const admin = createAdminClient();

  if (entry.item.format === "full") {
    const { data: passages } = await admin
      .from("reading_passages")
      .select("id, title, body, topic, order_in_test")
      .eq("test_id", entry.item.source)
      .eq("is_library", true)
      .order("order_in_test", { ascending: true });
    if (!passages || passages.length === 0) redirect(freePracticePage("reading"));
    const { data: questions } = await admin
      .from("reading_questions")
      .select(DELIVERED) // deliberately answer-free
      .in(
        "passage_id",
        passages.map((p) => p.id as string),
      )
      .is("organization_id", null)
      .order("order_index", { ascending: true });

    const testPassages: TestPassage[] = passages
      .map((p, i) => ({
        id: p.id as string,
        order: (p.order_in_test as number | null) ?? i + 1,
        title: (p.title as string) ?? "",
        body: (p.body as string) ?? "",
        topic: (p.topic as string | null) ?? null,
        questions: (questions ?? []).filter((q) => q.passage_id === p.id).map(deliver),
      }))
      .filter((p) => p.questions.length > 0);
    if (testPassages.length === 0) redirect(freePracticePage("reading"));

    return (
      <div lang="en" style={frame}>
        <ReadingTestRunner
          testId={entry.item.source}
          passages={testPassages}
          practiceNo={entry.item.testNo}
          publicMode={publicMode}
        />
      </div>
    );
  }

  const [{ data: passage }, { data: questions }] = await Promise.all([
    admin
      .from("reading_passages")
      .select("id, title, body, module, topic, difficulty")
      .eq("id", entry.item.source)
      .eq("is_library", true)
      .maybeSingle(),
    admin
      .from("reading_questions")
      .select(DELIVERED) // deliberately answer-free
      .eq("passage_id", entry.item.source)
      .is("organization_id", null)
      .order("order_index", { ascending: true }),
  ]);
  if (!passage || !questions || questions.length === 0) redirect(freePracticePage("reading"));

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
        questions={questions.map(deliver)}
        practiceNo={entry.item.testNo}
        publicMode={publicMode}
      />
    </div>
  );
}
