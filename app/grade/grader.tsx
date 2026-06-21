"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  countWords,
  MAX_WORDS,
  MIN_WORDS,
  PUBLIC_PROMPTS,
  type PublicPrompt,
} from "@/lib/public-grader/prompts";
import type { PublicTeaser } from "@/lib/public-grader/teaser";
import { cn } from "@/lib/utils";

type Status = "idle" | "grading" | "done" | "error";

const BAND_NOTE = "Grades are deliberately conservative — your 6.5 here is a real 6.5 on exam day.";

export function PublicGrader() {
  const [promptId, setPromptId] = useState<string>(PUBLIC_PROMPTS[0]!.id);
  const [essay, setEssay] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<PublicTeaser | null>(null);

  const prompt = useMemo<PublicPrompt>(
    () => PUBLIC_PROMPTS.find((p) => p.id === promptId) ?? PUBLIC_PROMPTS[0]!,
    [promptId],
  );
  const words = useMemo(() => countWords(essay), [essay]);
  const tooShort = words > 0 && words < MIN_WORDS;
  const tooLong = words > MAX_WORDS;
  const canGrade = status !== "grading" && words >= MIN_WORDS && !tooLong;

  async function grade() {
    setStatus("grading");
    setError(null);
    setTeaser(null);
    try {
      const res = await fetch("/api/public/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, essay }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        teaser?: PublicTeaser;
        error?: string;
      };
      if (res.ok && body.teaser) {
        setTeaser(body.teaser);
        setStatus("done");
        return;
      }
      setStatus("error");
      setError(messageFor(res.status, body.error));
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
      {/* ---- Input ---- */}
      <section className="space-y-4">
        <div>
          <label className="text-sm font-medium">1. Pick a Task 2 prompt</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PUBLIC_PROMPTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPromptId(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  p.id === promptId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                {p.title}
              </button>
            ))}
          </div>
          <p className="bg-muted/50 text-foreground/90 mt-2 rounded-lg border p-3 text-sm whitespace-pre-line">
            {prompt.prompt}
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <label htmlFor="essay" className="text-sm font-medium">
              2. Paste your essay
            </label>
            <span
              className={cn(
                "text-xs tabular-nums",
                tooLong ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {words} word{words === 1 ? "" : "s"}
            </span>
          </div>
          <textarea
            id="essay"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={14}
            placeholder="Write or paste your response here…"
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 mt-2 w-full resize-y rounded-lg border bg-transparent p-3 text-sm outline-none focus-visible:ring-3"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {tooShort
              ? `At least ${MIN_WORDS} words to grade.`
              : tooLong
                ? `Free preview grades up to ${MAX_WORDS} words — sign up to grade full-length essays.`
                : `${MIN_WORDS}–${MAX_WORDS} words. We grade conservatively.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" size="lg" disabled={!canGrade} onClick={grade}>
            {status === "grading" ? "Grading…" : "Grade my essay"}
          </Button>
          {error ? (
            <span className="text-destructive text-sm" role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </section>

      {/* ---- Result / CTA ---- */}
      <section className="space-y-4">
        {teaser ? (
          <Result teaser={teaser} />
        ) : (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
            <p className="text-foreground font-medium">Your free preview</p>
            <p className="mt-1">
              You&apos;ll get your overall band, a band for each of the four criteria, and your top 3
              fixes. {BAND_NOTE}
            </p>
          </div>
        )}
        <SignupCta />
      </section>
    </div>
  );
}

function Result({ teaser }: { teaser: PublicTeaser }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-5 text-center">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Overall band
        </p>
        <p className="text-primary mt-1 text-5xl font-semibold tabular-nums">
          {teaser.overallBand.toFixed(1)}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{BAND_NOTE}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {teaser.criteria.map((c) => (
          <div key={c.key} className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">{c.label}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{c.band.toFixed(1)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-semibold">Your top 3 fixes</p>
        <ol className="mt-2 space-y-2">
          {teaser.topFixes.map((f, i) => (
            <li key={f.criterion} className="flex gap-2 text-sm">
              <span className="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {i + 1}
              </span>
              <span>
                <span className="font-medium">{f.label}:</span> {f.fix}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-muted-foreground text-[11px] leading-relaxed">{teaser.disclaimer}</p>
    </div>
  );
}

/** The conversion surface — names exactly what's withheld so the value is concrete. */
function SignupCta() {
  return (
    <div className="border-primary/30 bg-primary/5 rounded-lg border p-5">
      <p className="font-semibold">Unlock the full coaching loop</p>
      <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
        <li>• The evidence behind every score — quoted from your essay</li>
        <li>• What&apos;s capping each criterion, and your band-with-fixes target</li>
        <li>• The revision loop: rewrite, resubmit, and re-grade the same essay</li>
        <li>• Progress history and your current → target band tracker</li>
        <li>• Reading practice with original passages and trap explanations</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
          Create a free account
        </Link>
        <Link href="/sign-in" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
          Sign in
        </Link>
      </div>
    </div>
  );
}

function messageFor(httpStatus: number, code: string | undefined): string {
  switch (code) {
    case "rate_limited":
      return "You've used your free previews for now. Create a free account to keep going.";
    case "busy":
      return "The free grader is busy right now — try again in a few minutes, or sign up.";
    case "too_short":
      return `Add a bit more — at least ${MIN_WORDS} words to grade.`;
    case "too_long":
      return `That's over ${MAX_WORDS} words. Sign up to grade full-length essays.`;
    case "invalid_prompt":
      return "Please pick one of the prompts above.";
    case "grade_failed":
      return "Grading failed this time — please try again in a moment.";
    default:
      return httpStatus === 429
        ? "Too many requests — please wait a bit."
        : "Something went wrong — please try again.";
  }
}
