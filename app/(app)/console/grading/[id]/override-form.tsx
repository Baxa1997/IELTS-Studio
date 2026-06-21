"use client";

import { useActionState } from "react";

import { overrideGradingAction, type OverrideState } from "@/app/(app)/console/actions";
import { Button } from "@/components/ui/button";

const BANDS: number[] = [];
for (let b = 9; b >= 0; b -= 0.5) BANDS.push(b);

const initial: OverrideState = {};

/**
 * Adjust an AI band with a required comment, marking it a teacher override. On
 * success the action revalidates the page, so the header re-renders with the new
 * band and "Teacher override" badge; we also confirm inline.
 */
export function OverrideForm({ gradingId, currentBand }: { gradingId: string; currentBand: number }) {
  const [state, formAction, pending] = useActionState(overrideGradingAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="gradingId" value={gradingId} />

      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="band" className="text-sm font-medium">
            Corrected band
          </label>
          <select
            id="band"
            name="band"
            defaultValue={currentBand}
            className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm tabular-nums"
          >
            {BANDS.map((b) => (
              <option key={b} value={b}>
                {b.toFixed(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comment" className="text-sm font-medium">
          Comment <span className="text-muted-foreground font-normal">(becomes a calibration anchor)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          minLength={3}
          rows={3}
          placeholder="Why does the band change? Cite the criterion and the evidence — this teaches the grader."
          className="border-input bg-background w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save override"}
        </Button>
        {state.error ? (
          <span className="text-destructive text-sm" role="alert">
            {state.error}
          </span>
        ) : null}
        {state.newBand != null ? (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Override saved — band set to {state.newBand.toFixed(1)}.
          </span>
        ) : null}
      </div>
    </form>
  );
}
