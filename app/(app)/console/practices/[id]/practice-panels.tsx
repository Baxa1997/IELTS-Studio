"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  archivePractice,
  assignPractice,
  duplicatePractice,
  publishPractice,
  restorePractice,
  type PracticeFormState,
} from "../actions";

const empty: PracticeFormState = {};

/**
 * Publish / archive / restore / duplicate. Four one-field forms rather than one
 * form with a hidden intent, so each button reports its own pending state and
 * its own error.
 */
export function PracticeStateActions({
  promptId,
  status,
}: {
  promptId: string;
  status: string;
}) {
  const [publishState, publish, publishing] = useActionState(publishPractice, empty);
  const [archiveState, archive, archiving] = useActionState(archivePractice, empty);
  const [restoreState, restore, restoring] = useActionState(restorePractice, empty);
  const [copyState, copy, copying] = useActionState(duplicatePractice, empty);

  const message =
    publishState.error ??
    archiveState.error ??
    restoreState.error ??
    copyState.error ??
    publishState.notice ??
    archiveState.notice ??
    restoreState.notice;
  const isError = Boolean(
    publishState.error ?? archiveState.error ?? restoreState.error ?? copyState.error,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <form action={publish}>
            <input type="hidden" name="prompt_id" value={promptId} />
            <Button type="submit" disabled={publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </form>
        ) : null}

        {status === "archived" ? (
          <form action={restore}>
            <input type="hidden" name="prompt_id" value={promptId} />
            <Button type="submit" disabled={restoring}>
              {restoring ? "Restoring…" : "Move back to Published"}
            </Button>
          </form>
        ) : (
          <form action={archive}>
            <input type="hidden" name="prompt_id" value={promptId} />
            <Button type="submit" variant="outline" disabled={archiving}>
              {archiving ? "Archiving…" : "Archive"}
            </Button>
          </form>
        )}

        <form action={copy}>
          <input type="hidden" name="prompt_id" value={promptId} />
          <Button type="submit" variant="outline" disabled={copying}>
            {copying ? "Copying…" : "Duplicate as draft"}
          </Button>
        </form>
      </div>

      {message ? (
        <p
          className={isError ? "text-destructive text-sm" : "text-sm text-emerald-700"}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Set this practice to one or more classes at once — the thing the group page
 * structurally cannot do, since it only ever knows the group you came from.
 */
export function AssignForm({
  promptId,
  groups,
}: {
  promptId: string;
  groups: { id: string; name: string; members: number }[];
}) {
  const [state, formAction, pending] = useActionState(assignPractice, empty);

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        You have no classes yet. Create a group first and this practice can go straight to it.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="prompt_id" value={promptId} />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Groups</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="group_ids" value={g.id} className="size-4" />
                {g.name}
                <span className="text-muted-foreground text-xs">
                  {g.members} student{g.members === 1 ? "" : "s"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1 space-y-2">
            <Label htmlFor="assign-title">Title</Label>
            <Input id="assign-title" name="title" placeholder="Writing Task 2" autoComplete="off" />
          </div>
          <div className="w-52 space-y-2">
            <Label htmlFor="assign-due">
              Due <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="assign-due" name="due_at" type="date" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Setting…" : "Set to these groups"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assign-instructions">
            Instructions <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="assign-instructions"
            name="instructions"
            placeholder="40 minutes, no notes."
            autoComplete="off"
          />
        </div>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.notice}
        </p>
      ) : null}
    </div>
  );
}
