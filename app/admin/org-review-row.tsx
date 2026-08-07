"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { reviewOrganization, type ReviewState } from "./actions";

const initialState: ReviewState = {};

/** Approve / Reject controls for one pending center application. */
export function OrgReviewRow({
  orgId,
  name,
  email,
  applied,
}: {
  orgId: string;
  name: string;
  email: string | null;
  applied: string;
}) {
  const [state, formAction, pending] = useActionState(reviewOrganization, initialState);

  return (
    <li className="py-3">
      <form action={formAction} className="flex flex-wrap items-center justify-between gap-3">
        <input type="hidden" name="org_id" value={orgId} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{name}</span>
          <span className="text-muted-foreground block truncate text-xs">
            {email ?? "no email"} · applied {applied}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Button type="submit" name="decision" value="approve" size="sm" disabled={pending}>
            {pending ? "Working…" : "Approve"}
          </Button>
          <Button
            type="submit"
            name="decision"
            value="reject"
            size="sm"
            variant="outline"
            disabled={pending}
          >
            Reject
          </Button>
        </span>
        {state.error ? (
          <span className="text-destructive w-full text-xs" role="alert">
            {state.error}
          </span>
        ) : null}
        {state.notice ? (
          <span className="w-full text-xs" role="status">
            {state.notice}
          </span>
        ) : null}
      </form>
    </li>
  );
}
