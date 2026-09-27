import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FreeTrialGate } from "@/shared/components/practice/free-trial-nudge";
import { onTodaysList } from "@/lib/free-practice/assignment";
import { freeTrialCopy } from "@/lib/free-practice/copy";
import { freePracticePage } from "@/lib/free-practice/links";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_GRAD_BOTTOM, PAGE_GRAD_TOP } from "@/lib/theme/tokens";
import { parseFigure } from "@/lib/writing/figure";

import { WritingStudio, type ServedPrompt } from "../../_components/writing-studio";

/**
 * /write/free/[id] — one free Writing practice, for a visitor with no account.
 *
 * THE WRITING STUDIO a signed-in learner uses, in public mode (see
 * `WritingPublicMode`): same editor, same timer, and the same full feedback —
 * graded by the same grader through /api/public/practice/writing (owner,
 * 2026-09-27: "the same grading as inside … and the same practice UI").
 *
 * The prompt must be on this visitor's list today, or back to the list; today's
 * free practice already used → the gate, which recommends signing in for more.
 * Public by PUBLIC_PATHS; not indexed — the list is the page that ranks.
 */
const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("free.runnerTitleWriting"),
  robots: { index: false, follow: true },
};

export default async function FreeWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await onTodaysList("writing", decodeURIComponent(id));
  if (!entry) redirect(freePracticePage("writing"));
  const copy = freeTrialCopy(t, "writing");
  const frame = { minHeight: "100dvh", background: `linear-gradient(180deg,${PAGE_GRAD_TOP},${PAGE_GRAD_BOTTOM})` };

  if (entry.done) {
    return (
      <div lang="en" style={frame}>
        <FreeTrialGate
          copy={copy}
          title={t("free.doneTitle")}
          body={t("free.doneBody")}
          backHref={freePracticePage("writing")}
          backLabel={t("free.allFreePractice")}
        />
      </div>
    );
  }

  const { data: p } = await createAdminClient()
    .from("writing_prompts")
    .select("id, task_type, prompt_text, figure, category, topic_family, difficulty")
    .eq("id", entry.item.key)
    .is("organization_id", null)
    .maybeSingle();
  if (!p) redirect(freePracticePage("writing"));

  const prompt: ServedPrompt = {
    id: p.id as string,
    task_type: p.task_type as ServedPrompt["task_type"],
    prompt_text: p.prompt_text as string,
    figure: parseFigure(p.figure), // Academic Task 1 only; null otherwise
    category: (p.category as string | null) ?? null,
    topic_family: (p.topic_family as string | null) ?? null,
    difficulty: (p.difficulty as number | null) ?? null,
  };

  return (
    <div lang="en" style={frame}>
      <WritingStudio
        prompt={prompt}
        essayId={null}
        initialContent=""
        resumed={false}
        publicMode={{
          gradeUrl: "/api/public/practice/writing",
          exitHref: freePracticePage("writing"),
          copy,
        }}
      />
    </div>
  );
}
