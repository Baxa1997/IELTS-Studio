import Link from "next/link";
import { redirect } from "next/navigation";

import { SkillTracker } from "@/components/band-tracker";
import { buttonVariants } from "@/components/ui/button";
import { requireOrgUser } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Entry diagnostic: one timed reading set + one Task 2 essay → an initial,
 * deliberately conservative per-skill band. Each step is "done" once that skill
 * has been measured (its first graded submission seeds the baseline). Once both
 * are done we show the trackers; the estimate then keeps re-rolling as the student
 * submits more work.
 */
export default async function DiagnosticPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const { bySkill, readingMeasured, writingMeasured, diagnosticComplete } =
    await loadStudentEstimates(profile.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entry diagnostic</h1>
        <p className="text-muted-foreground mt-1">
          Do one timed reading set and one Task&nbsp;2 essay. We&apos;ll set your starting bands —
          deliberately cautious at first, then sharpened as you submit more work.
        </p>
      </div>

      {diagnosticComplete ? (
        <section className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Diagnostic complete — your baseline is set.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              These update automatically every time you submit graded work.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SkillTracker estimate={bySkill.reading} />
            <SkillTracker estimate={bySkill.writing} />
          </div>
          <Link href="/dashboard" className={cn(buttonVariants())}>
            Go to dashboard
          </Link>
        </section>
      ) : (
        <ol className="space-y-3">
          <DiagnosticStep
            n={1}
            title="Timed reading set"
            blurb="Read an original passage and answer across the real question types."
            done={readingMeasured}
            band={bySkill.reading.currentBand}
            href="/read"
            cta="Start reading"
          />
          <DiagnosticStep
            n={2}
            title="Task 2 essay"
            blurb="Write one timed Task 2 response; we grade it criterion by criterion."
            done={writingMeasured}
            band={bySkill.writing.currentBand}
            href="/write"
            cta="Start writing"
          />
        </ol>
      )}
    </div>
  );
}

function DiagnosticStep({
  n,
  title,
  blurb,
  done,
  band,
  href,
  cta,
}: {
  n: number;
  title: string;
  blurb: string;
  done: boolean;
  band: number | null;
  href: string;
  cta: string;
}) {
  return (
    <li className="flex items-start gap-4 rounded-lg border p-4">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium tabular-nums",
          done
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
        aria-hidden
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{blurb}</p>
      </div>
      <div className="shrink-0">
        {done ? (
          <span className="text-sm">
            <span className="text-muted-foreground">band </span>
            <span className="font-semibold tabular-nums">{band != null ? band.toFixed(1) : "—"}</span>
          </span>
        ) : (
          <Link href={href} className={cn(buttonVariants({ size: "sm" }))}>
            {cta}
          </Link>
        )}
      </div>
    </li>
  );
}
