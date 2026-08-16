import { redirect } from "next/navigation";

import { ReviewPanel } from "@/components/console/review-panel";
import { EssayFeedback, type CriterionScore } from "@/components/writing/essay-feedback";
import { cleanAnnotations } from "@/components/writing/annotations";
import { requireOrgUser } from "@/lib/auth";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { loadReview } from "@/lib/console/marking";
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
  const { profile } = await requireOrgUser();
  // Where to send someone who cannot see this piece of work. A learner belongs
  // back in their own history; a teacher does NOT — /activities is the learner's
  // page and is empty for staff, so bouncing them there reads as "I am not
  // allowed to see my student's work" when usually it just is not graded yet.
  const nowhere = profile.role === "student" ? "/activities" : "/console";
  const { id } = await params;
  const supabase = await createClient();

  const { data: essay } = await supabase
    .from("essays")
    .select("id, task_type, content, prompt_id")
    .eq("id", id)
    .maybeSingle();
  if (!essay) redirect(nowhere);

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
  if (!grading) redirect(nowhere);

  const taskType = essay.task_type as string;
  const criteria = (grading.criteria ?? {}) as Record<string, CriterionScore>;

  // THE VERDICT, on the page the student already reads.
  //
  // Deliberately not a separate staff-only screen. A centre's teacher and its
  // student have to be looking at the same report, or the band a parent is
  // shown and the band the teacher signed are two different artefacts that can
  // drift apart. The panel below simply shows less to a student: they see who
  // marked it and why, and no controls.
  const [review, centerSettings] = await Promise.all([
    loadReview("writing", id),
    loadCenterSettings(),
  ]);
  const isStaff = profile.role !== "student";
  const canReview =
    isStaff &&
    (centerSettings.overridePolicy === "teacher"
      ? true
      : centerSettings.overridePolicy === "admin_only"
        ? profile.role === "center_admin" || profile.role === "administrator"
        : false);
  const lockedNote =
    isStaff && !canReview
      ? centerSettings.overridePolicy === "nobody"
        ? "This centre has marking locked — the AI band stands. A centre admin can change that in Settings."
        : "Only a centre admin may correct a band at this centre."
      : undefined;
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
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <ReviewPanel
          kind="writing"
          refId={id}
          aiBand={Number(grading.overall_band)}
          aiCriteria={Object.fromEntries(
            Object.entries(criteria).map(([k, v]) => [k, v?.band != null ? Number(v.band) : null]),
          )}
          review={review}
          canReview={canReview}
          lockedNote={lockedNote}
        />
      </div>
    </EssayFeedback>
  );
}
