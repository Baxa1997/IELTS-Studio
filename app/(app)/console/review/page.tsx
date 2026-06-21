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
          Audit AI gradings, approve generated content, and correct bands. Your corrections
          become calibration anchors — the grader gets sharper the more you review.
        </p>
      </div>

      {/* Low-confidence gradings to audit. */}
      <section className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-base font-medium">AI gradings to review</h2>
            <p className="text-muted-foreground text-xs">
              {gradings.length} pending · {borderlineCount} low-confidence
            </p>
          </div>
        </div>
        <ul className="divide-y text-sm">
          {gradings.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{g.studentName}</span>
                {g.borderline ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    low confidence
                  </span>
                ) : null}
                <span className="text-muted-foreground text-xs tabular-nums">
                  band {g.band.toFixed(1)} · {new Date(g.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Link href={`/console/grading/${g.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Review
              </Link>
            </li>
          ))}
          {gradings.length === 0 ? (
            <li className="text-muted-foreground px-4 py-3">No gradings awaiting review.</li>
          ) : null}
        </ul>
      </section>

      {/* Unapproved generated content. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-medium">Prompts awaiting approval</h2>
            <p className="text-muted-foreground text-xs">{prompts.length} pending · hidden from students</p>
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
            <p className="text-muted-foreground text-xs">{passages.length} pending · low-confidence flagged</p>
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
