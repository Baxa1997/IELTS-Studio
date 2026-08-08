"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK2_CATEGORIES, TASK2_CATEGORY_LABELS } from "@/lib/prompts/types";

import { generatePracticeDraft, type PracticeFormState } from "./actions";

const FIELD =
  "border-input h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

/** Generate a Task 2 prompt as a DRAFT. On success the action redirects to the
 *  preview, because reading it is the point of having a draft at all. */
export function NewPracticeForm() {
  const [state, formAction, pending] = useActionState(
    generatePracticeDraft,
    {} as PracticeFormState,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="w-56 space-y-2">
          <Label htmlFor="practice-category">Question type</Label>
          <select id="practice-category" name="category" className={FIELD} defaultValue="opinion">
            {TASK2_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TASK2_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-44 flex-1 space-y-2">
          <Label htmlFor="practice-topic">Topic</Label>
          <Input
            id="practice-topic"
            name="topic_family"
            placeholder="environment, education, technology…"
            autoComplete="off"
            required
          />
        </div>

        <div className="w-32 space-y-2">
          <Label htmlFor="practice-band">Target band</Label>
          <Input
            id="practice-band"
            name="difficulty"
            type="number"
            min={4}
            max={9}
            step={1}
            defaultValue={7}
          />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Writing…" : "Generate draft"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
