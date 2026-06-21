"use client";

import { useActionState } from "react";

import { reviewReadingAction, type ReviewReadingState } from "@/app/(app)/console/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PendingPassageItem } from "@/lib/console/review";

const initial: ReviewReadingState = {};

/** One pending reading passage with Approve / Reject (same submitter-value pattern
 *  as the prompt review row). Approval releases the passage + its questions to
 *  students; rejection hides it. */
export function ReadingReviewRow({ passage }: { passage: PendingPassageItem }) {
  const [state, formAction, pending] = useActionState(reviewReadingAction, initial);

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{passage.title}</span>
        {passage.needsReview ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            low-confidence answer key
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {passage.module === "general" ? "General Training" : "Academic"}
        {passage.topic ? ` · ${passage.topic}` : ""}
      </p>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="passageId" value={passage.id} />
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          {pending ? "Saving…" : "Approve"}
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
        >
          Reject
        </button>
        {state.error ? (
          <span className="text-destructive text-xs" role="alert">
            {state.error}
          </span>
        ) : null}
      </form>
    </li>
  );
}
