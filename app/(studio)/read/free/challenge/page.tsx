import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CHALLENGE_ANCHOR } from "@/lib/challenge/board";
import { todaysChallenge } from "@/lib/challenge/daily";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import type { NoteMeta, ReadingModule, ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_GRAD_BOTTOM, PAGE_GRAD_TOP } from "@/lib/theme/tokens";

import { ReadingRunner, type DeliveredQuestion, type PublicMode } from "../../_components/reading-runner";

/**
 * /read/free/challenge — today's daily challenge: the one Reading passage every
 * visitor gets (lib/challenge/daily.ts), in the passage runner a signed-in
 * learner uses, in public mode. Marking goes to /api/public/practice/challenge,
 * which keeps the visitor's first score for the board on the landing page.
 *
 * ⚠️ A STATIC SEGMENT BESIDE `[id]`. `/read/free/[id]` serves a practice from
 * the visitor's OWN list and would bounce this passage as "not on your list";
 * Next matches the static `challenge` first, so the two never meet. It sits
 * under /read/free so the proxy already treats it as public and mints the
 * visitor id here (lib/supabase/middleware.ts) — a new path would need both.
 *
 * Not gated on "already played": the board keeps a first score only, so a
 * second sitting is practice and changes nothing. Questions are loaded
 * ANSWER-FREE, as on every reading runner. Not indexed — the landing page is
 * what ranks.
 */
export const dynamic = "force-dynamic";

const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("ch.runnerTitle"),
  robots: { index: false, follow: true },
};

/** The answer-free projection every reading runner is given. */
const DELIVERED = "id, question_type, order_index, prompt, options, word_limit, section, note_meta";

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

export default async function DailyChallengePage() {
  const board = `/#${CHALLENGE_ANCHOR}`;
  const today = await todaysChallenge();
  if (!today) redirect(board);

  const admin = createAdminClient();
  const [{ data: passage }, { data: questions }] = await Promise.all([
    admin
      .from("reading_passages")
      .select("id, title, body, module, topic, difficulty")
      .eq("id", today.item.source)
      .eq("is_library", true)
      .maybeSingle(),
    admin
      .from("reading_questions")
      .select(DELIVERED) // deliberately answer-free
      .eq("passage_id", today.item.source)
      .is("organization_id", null)
      .order("order_index", { ascending: true }),
  ]);
  if (!passage || !questions || questions.length === 0) redirect(board);

  const publicMode: PublicMode = {
    submitUrl: "/api/public/practice/challenge",
    exitHref: board,
    // The runner's two nudges, pointed at the board instead of at sign-in: the
    // strip while the passage is open, the card on the result.
    copy: {
      lead: t("ch.stripLead"),
      title: t("ch.resultTitle"),
      body: t("ch.resultBody"),
      cta: t("ch.seeBoard"),
      href: board,
    },
  };

  return (
    <div lang="en" style={{ minHeight: "100dvh", background: `linear-gradient(180deg,${PAGE_GRAD_TOP},${PAGE_GRAD_BOTTOM})` }}>
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
        practiceNo={today.item.testNo}
        publicMode={publicMode}
      />
    </div>
  );
}
