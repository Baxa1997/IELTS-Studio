import Link from "next/link";
import { redirect } from "next/navigation";

import { PromptReviewRow, type PendingPrompt } from "@/app/(app)/console/prompt-studio";
import { buttonVariants } from "@/components/ui/button";
import { requireOrgUser } from "@/lib/auth";
import { loadReviewQueue } from "@/lib/console/review";
import { cn } from "@/lib/utils";

import { ReadingReviewRow } from "./reading-review-row";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const { profile } = await requireOrgUser();
  // Staff surface — students go to their dashboard.
  if (profile.role === "student") redirect("/dashboard");

  const { gradings, prompts, passages, overrides } = await loadReviewQueue();
  const borderlineCount = gradings.filter((g) => g.borderline).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/console" className="text-muted-foreground hover:text-foreground text-sm">
          ← Console
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="text-muted-foreground">
          Approve generated content before it reaches a student. Marking essays and tests happens
          on each report now — see Marking.
        </p>
      </div>

      {/* THE GRADING QUEUE MOVED. It lived here, writing-only, listing
          low-confidence gradings and linking to a form that overwrote the AI's
          band. Marking is now /console/marking: all four skills, oldest first,
          and it keeps the model's band beside the teacher's instead of
          replacing it. This page keeps only what it alone does — approving
          generated content. */}
      <section className="rounded-lg border p-4">
        <h2 className="text-base font-medium">Marking moved</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {gradings.length > 0
            ? `${gradings.length} graded ${gradings.length === 1 ? "essay" : "essays"} were listed here, ${borderlineCount} of them low-confidence.`
            : "Nothing was waiting here."}{" "}
          Marking now covers all four skills and keeps the AI&rsquo;s band beside the
          teacher&rsquo;s.
        </p>
        <Link
          href="/console/marking"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
        >
          Open marking →
        </Link>
      </section>

      {/* Unapproved generated content. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-medium">Prompts awaiting approval</h2>
            <p className="text-muted-foreground text-xs">
              {prompts.length} pending · hidden from students
            </p>
          </div>
          <ul className="divide-y px-4 text-sm">
            {prompts.map((p) => (
              <PromptReviewRow key={p.id} prompt={p as PendingPrompt} />
            ))}
            {prompts.length === 0 ? (
              <li className="text-muted-foreground py-3">Nothing pending.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-medium">Reading awaiting approval</h2>
            <p className="text-muted-foreground text-xs">
              {passages.length} pending · low-confidence flagged
            </p>
          </div>
          <ul className="divide-y px-4 text-sm">
            {passages.map((p) => (
              <ReadingReviewRow key={p.id} passage={p} />
            ))}
            {passages.length === 0 ? (
              <li className="text-muted-foreground py-3">Nothing pending.</li>
            ) : null}
          </ul>
        </section>
      </div>

      {/* The flywheel, made visible. */}
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-medium">Recent overrides</h2>
          <p className="text-muted-foreground text-xs">
            Each is a calibration anchor — a human (essay → band + why) pair the grader learns from.
          </p>
        </div>
        <ul className="divide-y text-sm">
          {overrides.map((o, i) => (
            <li key={i} className="px-4 py-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{o.studentName}</span>
                <span className="tabular-nums">
                  {o.previousBand != null ? o.previousBand.toFixed(1) : "—"} →{" "}
                  <span className="font-medium">{o.newBand.toFixed(1)}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  by {o.teacherName} · {new Date(o.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">{o.comment}</p>
            </li>
          ))}
          {overrides.length === 0 ? (
            <li className="text-muted-foreground px-4 py-3">
              No overrides yet — adjust a grading above to start the anchor set.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
