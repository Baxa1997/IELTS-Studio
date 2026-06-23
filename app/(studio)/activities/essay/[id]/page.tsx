import { redirect } from "next/navigation";

import { EssayFeedback, type CriterionScore } from "@/components/writing/essay-feedback";
import { cleanAnnotations } from "@/components/writing/annotations";
import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseFigure } from "@/lib/writing/figure";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Full-page, read-only feedback for one past essay — its latest stored grading,
 * rendered from the `gradings` row (no model call). Chrome-free (no sidebar) so the
 * marked-up essay + per-criterion panel get the whole viewport. RLS guarantees the
 * student only sees their own essay.
 */
export default async function EssayFeedbackPage({ params }: PageProps) {
  await requireOrgUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: essay } = await supabase
    .from("essays")
    .select("id, task_type, content, prompt_id")
    .eq("id", id)
    .maybeSingle();
  if (!essay) redirect("/activities");

  const [{ data: grading }, promptRes] = await Promise.all([
    supabase
      .from("gradings")
      .select("overall_band, band_with_fixes, criteria, score_blocker, annotations, created_at")
      .eq("essay_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    essay.prompt_id
      ? supabase.from("writing_prompts").select("topic_family, figure, prompt_text").eq("id", essay.prompt_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // No grading yet → nothing to show on this dedicated page; back to the list.
  if (!grading) redirect("/activities");

  const taskType = essay.task_type as string;
  const criteria = (grading.criteria ?? {}) as Record<string, CriterionScore>;
  const blocker = (grading.score_blocker ?? null) as { criterion: string; why: string } | null;
  const annotations = cleanAnnotations(grading.annotations);

  return (
    <EssayFeedback
      taskType={taskType}
      topicFamily={(promptRes.data?.topic_family as string | null) ?? null}
      figure={parseFigure(promptRes.data?.figure)}
      overallBand={Number(grading.overall_band)}
      bandWithFixes={grading.band_with_fixes == null ? null : Number(grading.band_with_fixes)}
      criteria={criteria}
      blocker={blocker}
      essayText={(essay.content as string | null) ?? ""}
      annotations={annotations}
      promptText={(promptRes.data?.prompt_text as string | null) ?? null}
      reviseHref={essay.prompt_id ? `/write/${essay.prompt_id as string}` : null}
    />
  );
}
