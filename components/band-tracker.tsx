"use client";

import { useState, useTransition } from "react";

import { setTargetBand } from "@/app/(app)/dashboard/actions";
import {
  MAX_TARGET_BAND,
  MIN_TARGET_BAND,
  SKILL_LABELS,
  type SkillEstimateView,
} from "@/lib/estimates/compute";
import { cn } from "@/lib/utils";

const TARGET_OPTIONS: number[] = [];
for (let b = MIN_TARGET_BAND; b <= MAX_TARGET_BAND; b += 0.5) TARGET_OPTIONS.push(b);

/**
 * "Current band → target band" for one skill. The current/baseline bands are
 * read-only (server-owned, conservative); the student can edit only the target,
 * which saves through the setTargetBand action.
 */
export function SkillTracker({ estimate }: { estimate: SkillEstimateView }) {
  const { skill, currentBand, baselineBand, sampleCount } = estimate;
  const [target, setTarget] = useState(estimate.targetBand);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onTargetChange(value: number) {
    const previous = target;
    setTarget(value); // optimistic
    setError(null);
    startTransition(async () => {
      const res = await setTargetBand(skill, value);
      if (res.error) {
        setTarget(previous);
        setError(res.error);
      }
    });
  }

  const measured = currentBand != null;
  const base = baselineBand ?? currentBand;
  const delta = measured && base != null ? Math.round((currentBand - base) * 10) / 10 : 0;
  const reached = measured && currentBand >= target;

  // Progress along baseline → target.
  const span = base != null ? target - base : 0;
  const fill = !measured ? 0 : span <= 0 ? 1 : clamp01((currentBand - (base ?? 0)) / span);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{SKILL_LABELS[skill]}</h3>
        <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
          target
          <select
            value={target}
            disabled={pending}
            onChange={(e) => onTargetChange(Number(e.target.value))}
            className="border-input bg-background rounded-md border px-1.5 py-0.5 text-xs tabular-nums"
            aria-label={`${SKILL_LABELS[skill]} target band`}
          >
            {TARGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b.toFixed(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {measured ? currentBand.toFixed(1) : "—"}
        </span>
        <span className="text-muted-foreground text-sm">→ {target.toFixed(1)}</span>
        {reached ? (
          <span className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400">
            target reached
          </span>
        ) : null}
      </div>

      {/* baseline → target progress */}
      <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full" aria-hidden>
        <div
          className={cn("h-full rounded-full", reached ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {!measured ? (
          "Not yet measured — take the entry diagnostic."
        ) : (
          <>
            {base != null ? `from ${base.toFixed(1)} baseline` : "baseline set"}
            {delta > 0 ? <span className="text-emerald-600 dark:text-emerald-400"> · +{delta.toFixed(1)}</span> : null}
            {` · ${sampleCount} ${sampleCount === 1 ? "submission" : "submissions"}`}
          </>
        )}
      </p>

      {error ? (
        <p className="text-destructive mt-1 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
