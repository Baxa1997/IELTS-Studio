"use client";

import { useActionState } from "react";

import {
  generatePromptAction,
  reviewPromptAction,
  type GeneratePromptState,
  type ReviewPromptState,
} from "@/app/(app)/console/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_DIFFICULTY,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  TASK2_CATEGORIES,
  TASK2_CATEGORY_LABELS,
  TOPIC_FAMILIES,
  type Task2Category,
} from "@/lib/prompts/types";
import { cn } from "@/lib/utils";

/** A pending prompt awaiting review (subset of writing_prompts). */
export interface PendingPrompt {
  id: string;
  prompt_text: string;
  category: Task2Category | null;
  topic_family: string | null;
  difficulty: number | null;
}

const FIELD =
  "border-input h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const generateInitial: GeneratePromptState = {};

/** Teacher/admin generates one Task 2 prompt. It lands as pending and shows up in
 *  the review queue below (the action revalidates /console). */
export function GeneratePromptPanel() {
  const [state, formAction, pending] = useActionState(generatePromptAction, generateInitial);

  return (
    <div className="space-y-3">
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="category">Question type</Label>
          <select id="category" name="category" defaultValue="opinion" className={FIELD}>
            {TASK2_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TASK2_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topicFamily">Topic family</Label>
          <Input
            id="topicFamily"
            name="topicFamily"
            list="topic-families"
            defaultValue="environment"
            placeholder="environment"
          />
          <datalist id="topic-families">
            {TOPIC_FAMILIES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="w-20 space-y-2">
          <Label htmlFor="difficulty">Target band</Label>
          <Input
            id="difficulty"
            name="difficulty"
            type="number"
            min={MIN_DIFFICULTY}
            max={MAX_DIFFICULTY}
            defaultValue={DEFAULT_DIFFICULTY}
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.prompt ? (
        <div className="bg-muted/40 space-y-1 rounded-md border p-3">
          <p className="text-muted-foreground text-xs">
            Generated — pending your approval below. Students can&apos;t see it yet.
          </p>
          <p className="text-sm whitespace-pre-wrap">{state.prompt.prompt_text}</p>
        </div>
      ) : null}
    </div>
  );
}

const reviewInitial: ReviewPromptState = {};

/** One pending prompt with Approve / Reject. The submitter button's name/value
 *  ("decision") rides along in the FormData (React 19), so both buttons share one
 *  form. On success the action revalidates and this row disappears. */
export function PromptReviewRow({ prompt }: { prompt: PendingPrompt }) {
  const [state, formAction, pending] = useActionState(reviewPromptAction, reviewInitial);
  const label = prompt.category ? TASK2_CATEGORY_LABELS[prompt.category] : "Task 2";

  return (
    <li className="space-y-2 py-3">
      <p className="text-sm whitespace-pre-wrap">{prompt.prompt_text}</p>
      <p className="text-muted-foreground text-xs">
        {label}
        {prompt.topic_family ? ` · ${prompt.topic_family}` : ""}
        {prompt.difficulty ? ` · band ${prompt.difficulty}` : ""}
      </p>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="promptId" value={prompt.id} />
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
