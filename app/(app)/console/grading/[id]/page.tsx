import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { CRITERIA, CRITERION_LABELS, type Criterion } from "@/lib/dashboard/compute";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

import { OverrideForm } from "./override-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CriterionScore {
  band?: number;
  evidence?: string;
  what_caps_it?: string;
  fix?: string;
}

/**
 * Review one AI grading: the prompt, the essay as graded, the per-criterion
 * breakdown, and the override form. Teacher/admin only — RLS also restricts the
 * grading/essay reads to the org. Any grading id is reachable here (the queue
 * just prioritizes which to look at).
 */
export default async function GradingReviewPage({ params }: PageProps) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");
  const { id } = await params;

  const supabase = await createClient();
  const { data: grading } = await supabase
    .from("gradings")
    .select(
      "id, essay_id, overall_band, band_with_fixes, criteria, score_blocker, model, is_teacher_override, version_no, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!grading) redirect("/console/review");

  const { data: essay } = await supabase
    .from("essays")
    .select("student_id, prompt_id, content, word_count, task_type")
    .eq("id", grading.essay_id)
    .maybeSingle();

  const [studentRes, promptRes, overridesRes] = await Promise.all([
    essay?.student_id
      ? supabase.from("profiles").select("full_name").eq("id", essay.student_id).maybeSingle()
      : Promise.resolve({ data: null }),
    essay?.prompt_id
      ? supabase.from("writing_prompts").select("prompt_text").eq("id", essay.prompt_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("grading_overrides")
      .select("previous_band, new_band, comment, created_at")
      .eq("grading_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const studentName = studentRes.data?.full_name ?? "—";
  const promptText = promptRes.data?.prompt_text ?? "";
  const overrides = overridesRes.data ?? [];
  const criteria = (grading.criteria ?? {}) as Record<string, CriterionScore>;
  const blockerKey = (grading.score_blocker as { criterion?: string } | null)?.criterion;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/console/review" className="text-muted-foreground hover:text-foreground text-sm">
          ← Review queue
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Review grading</h1>
          {grading.is_teacher_override ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Teacher override
            </span>
          ) : (
            <span className="text-muted-foreground rounded-full border px-2 py-0.5 text-xs">AI · {grading.model}</span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {studentName}
          {grading.version_no ? ` · draft ${grading.version_no}` : ""} · band{" "}
          <span className="text-foreground font-medium tabular-nums">{Number(grading.overall_band).toFixed(1)}</span>
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* The work as graded. */}
        <div className="space-y-3">
          {promptText ? (
            <section className="rounded-lg border p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Prompt</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{promptText}</p>
            </section>
          ) : null}
          <section className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Essay</p>
              <p className="text-muted-foreground text-xs">{essay?.word_count ?? 0} words</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{essay?.content ?? "—"}</p>
          </section>
        </div>

        {/* The AI verdict + the override. */}
        <div className="space-y-3">
          <section className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">AI breakdown</p>
            <div className="mt-2 space-y-2">
              {CRITERIA.map((key: Criterion) => {
                const c = criteria[key];
                if (!c) return null;
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-md border p-2.5",
                      key === blockerKey && "border-destructive/40 bg-destructive/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{CRITERION_LABELS[key]}</span>
                      <span className="text-sm tabular-nums">{c.band != null ? c.band.toFixed(1) : "—"}</span>
                    </div>
                    {c.what_caps_it ? (
                      <p className="text-muted-foreground mt-1 text-xs">{c.what_caps_it}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Adjust the band</p>
            <p className="text-muted-foreground mt-1 mb-3 text-xs">
              Your correction becomes the authoritative band and feeds the grader&apos;s calibration anchors.
            </p>
            <OverrideForm gradingId={grading.id as string} currentBand={Number(grading.overall_band)} />
          </section>

          {overrides.length > 0 ? (
            <section className="rounded-lg border p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Override history</p>
              <ul className="mt-2 space-y-2">
                {overrides.map((o, i) => (
                  <li key={i} className="text-sm">
                    <span className="tabular-nums">
                      {o.previous_band != null ? Number(o.previous_band).toFixed(1) : "—"} →{" "}
                      <span className="font-medium">{Number(o.new_band).toFixed(1)}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {" "}
                      · {new Date(o.created_at as string).toLocaleDateString()}
                    </span>
                    <p className="text-muted-foreground mt-0.5 text-xs">{o.comment as string}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
