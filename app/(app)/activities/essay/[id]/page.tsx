import { redirect } from "next/navigation";

import { AttemptReview } from "@/components/console/attempt-review";
import { EssayFeedback, type CriterionScore } from "@/components/writing/essay-feedback";
import { cleanAnnotations } from "@/components/writing/annotations";
import { requireOrgUser } from "@/lib/auth";
import { reportBackLink } from "@/lib/console/report-back";
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
    .select("id, task_type, content, prompt_id, student_id")
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

  const blocker = (grading.score_blocker ?? null) as { criterion: string; why: string } | null;
  const annotations = cleanAnnotations(grading.annotations);

  // A teacher arriving from a student's page needs to get back to that student,
  // not to their own (empty) activity list.
  const back = await reportBackLink({
    viewer: profile,
    studentId: essay.student_id as string,
    learnerHref: "/activities",
    learnerLabel: "Activities",
  });

  return (
    <EssayFeedback
      backHref={back.href}
      backLabel={back.label}
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
      {/* THE VERDICT, on the page the student already reads — deliberately not
          a staff-only screen. These four report routes gate on RLS rather than
          role, so a teacher and their student are looking at one artefact; two
          views would let the band a parent is shown and the band a teacher
          signed drift apart. */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <AttemptReview
          kind="writing"
          refId={id}
          aiBand={Number(grading.overall_band)}
          aiCriteria={Object.fromEntries(
            Object.entries(criteria).map(([k, v]) => [k, v?.band != null ? Number(v.band) : null]),
          )}
        />
      </div>
    </EssayFeedback>
  );
}
