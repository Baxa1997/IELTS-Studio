"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK2_CATEGORIES, TASK2_CATEGORY_LABELS, TOPIC_FAMILIES } from "@/lib/prompts/types";

import { createAssignment, type GroupFormState } from "../actions";
import { useActionFeedback } from "@/components/console/toast";

const FIELD =
  "border-input h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const initial: GroupFormState = {};

/**
 * Assign one piece of practice to this group. Writing generates a fresh prompt
 * (a few seconds); reading pins a shared library test. Either way the whole
 * group gets the SAME content, so the results table compares like with like.
 */
export function AssignPanel({
  groupId,
  libraryTests,
  library = [],
  hasPlacement = false,
  onDone,
}: {
  groupId: string;
  libraryTests: { id: string; label: string }[];
  /** §9's shelf: content the centre has already made and kept. */
  library?: { id: string; title: string; skill: string; level: string | null }[];
  /** This class already has a diagnostic. Said out loud at the checkbox,
   *  because the rule is counter-intuitive and silently ignoring the tick is
   *  how a teacher comes to believe the baseline moved when it did not. */
  hasPlacement?: boolean;
  /** Called once the assignment is actually created — how the sheet that
   *  wraps this knows to close itself. */
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createAssignment, initial);
  useActionFeedback(state, { onSuccess: onDone });
  const [libraryId, setLibraryId] = useState(library[0]?.id ?? "");
  const [kind, setKind] = useState<"writing" | "reading" | "library">(
    // The shelf goes FIRST when there is one. Generating is the expensive path
    // — it costs quota, takes seconds, and produces a paper no other group has
    // sat — so it should be the deliberate choice, not the default.
    library.length > 0 ? "library" : "writing",
  );

  // Writing and reading produce a band. Nothing else does, so nothing else can
  // anchor "how far they have come".
  const librarySkill = library.find((i) => i.id === libraryId)?.skill;
  const canPlace =
    kind === "writing" ||
    kind === "reading" ||
    (kind === "library" && (librarySkill === "writing" || librarySkill === "reading"));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="group_id" value={groupId} />

      <div className="flex flex-wrap gap-3">
        <div className="w-44 space-y-2">
          <Label htmlFor="assign-kind">Practice type</Label>
          <select
            id="assign-kind"
            name="kind"
            className={FIELD}
            value={kind}
            onChange={(e) => setKind(e.target.value as "writing" | "reading")}
          >
            {library.length > 0 ? (
              <option value="library">From the library ({library.length})</option>
            ) : null}
            <option value="writing">Writing — Task 2 (new)</option>
            <option value="reading">Reading — full test</option>
          </select>
        </div>

        {kind === "library" ? (
          <div className="w-80 space-y-2">
            <Label htmlFor="assign-library">Saved practice</Label>
            <select
              id="assign-library"
              name="library_id"
              className={FIELD}
              required
              value={libraryId}
              onChange={(e) => setLibraryId(e.target.value)}
            >
              {library.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.level ? ` · ${item.level}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : kind === "writing" ? (
          <>
            <div className="w-52 space-y-2">
              <Label htmlFor="assign-category">Question type</Label>
              <select id="assign-category" name="category" className={FIELD} defaultValue="opinion">
                {TASK2_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {TASK2_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-44 space-y-2">
              <Label htmlFor="assign-topic">Topic family</Label>
              <input
                id="assign-topic"
                name="topic_family"
                className={FIELD}
                list="assign-topics"
                defaultValue={TOPIC_FAMILIES[0]}
                required
              />
              <datalist id="assign-topics">
                {TOPIC_FAMILIES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </>
        ) : (
          <div className="w-64 space-y-2">
            <Label htmlFor="assign-test">Reading test</Label>
            <select id="assign-test" name="library_test_id" className={FIELD} required>
              {libraryTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="w-44 space-y-2">
          <Label htmlFor="assign-due">Due date (optional)</Label>
          <Input id="assign-due" name="due_at" type="date" />
        </div>
        {/* Offered only where it can do something. A baseline is frozen from a
            writing or a reading band; tick it on a listening paper and the
            flag is stored, no baseline is ever set, and the teacher has been
            told their progress figures are anchored when they are not. */}
        {canPlace ? (
        <div className="space-y-2">
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" name="is_placement" className="mt-0.5" />
            <span>
              This is a placement test
              <span className="text-muted-foreground block text-xs">
                {hasPlacement
                  ? "This class already has one, and a baseline only moves once — ticking this will not replace it. Re-testing a student who has improved would erase the very progress you are showing."
                  : "Its band becomes where these students started, so every later report can say how far they have come. Set one per group, at the beginning."}
              </span>
            </span>
          </label>
        </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="assign-instructions">Instructions (optional)</Label>
        <Input
          id="assign-instructions"
          name="instructions"
          placeholder="Focus on paragraphing this week."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending || (kind === "reading" && libraryTests.length === 0)}
        >
          {pending ? "Preparing…" : "Assign to group"}
        </Button>
        {kind === "writing" ? (
          <span className="text-muted-foreground text-xs">
            Generates an original prompt — takes a few seconds, and uses a generation from your
            monthly allowance.
          </span>
        ) : null}
        {kind === "library" ? (
          <span className="text-muted-foreground text-xs">
            Sets the identical paper — instant, no generation used, and comparable with every other
            group that has sat it.
          </span>
        ) : null}
        {kind === "reading" && libraryTests.length === 0 ? (
          <span className="text-muted-foreground text-xs">No library tests available yet.</span>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.notice}
        </p>
      ) : null}
    </form>
  );
}
