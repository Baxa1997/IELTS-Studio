"use client";

import { useActionState, useState } from "react";

import { inviteStudent, type InviteFormState } from "@/app/(app)/console/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InviteFormState = {};

export function InvitePanel() {
  const [state, formAction, pending] = useActionState(inviteStudent, initialState);
  const [copied, setCopied] = useState(false);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Student email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="student@example.com"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Invite"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.inviteUrl ? (
        <div className="bg-muted/40 space-y-2 rounded-md border p-3">
          <p className="text-sm">
            Invite link for <span className="font-medium">{state.email}</span> — share it with the
            student (no email is sent):
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={state.inviteUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(state.inviteUrl!)}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
