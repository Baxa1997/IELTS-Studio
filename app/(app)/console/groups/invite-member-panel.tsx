"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { inviteMember, type InviteFormState } from "./actions";
import { useActionFeedback } from "@/components/console/toast";

const FIELD =
  "border-input h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const initialState: InviteFormState = {};

/**
 * Invite a teacher or student into the center. On a group page pass
 * `fixedGroupId` — the invitee joins that group the moment they accept.
 */
export function InviteMemberPanel({
  groups,
  fixedGroupId,
  canInviteTeachers,
}: {
  groups?: { id: string; name: string }[];
  fixedGroupId?: string;
  canInviteTeachers: boolean;
}) {
  const [state, formAction, pending] = useActionState(inviteMember, initialState);
  // Stays open: the invite link is generated here and nowhere else.
  useActionFeedback(state, { keepOpen: true });
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [copied, setCopied] = useState(false);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const showGroupPicker = !fixedGroupId && role === "student" && (groups?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        {fixedGroupId ? <input type="hidden" name="group_id" value={fixedGroupId} /> : null}
        {!canInviteTeachers ? <input type="hidden" name="role" value="student" /> : null}

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1 space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="person@example.com"
              required
            />
          </div>

          {canInviteTeachers ? (
            <div className="w-36 space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                name="role"
                className={FIELD}
                value={role}
                onChange={(e) => setRole(e.target.value as "student" | "teacher")}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          ) : null}

          {showGroupPicker ? (
            <div className="w-48 space-y-2">
              <Label htmlFor="invite-group">Group</Label>
              <select id="invite-group" name="group_id" className={FIELD} defaultValue="">
                <option value="">No group</option>
                {groups!.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Inviting…" : "Invite"}
          </Button>
        </div>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.inviteUrl ? (
        <div className="bg-muted/40 space-y-2 rounded-md border p-3">
          <p className="text-sm">
            Invite link for <span className="font-medium">{state.email}</span> — share it with them
            (no email is sent):
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
