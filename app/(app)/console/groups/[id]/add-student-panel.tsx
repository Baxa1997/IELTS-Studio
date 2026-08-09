"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addStudentAccount, type AddStudentState } from "../actions";

const initial: AddStudentState = {};

/**
 * Add a student to this group by creating their account outright: name, login,
 * and a password (auto-generated unless the teacher sets one). The credentials
 * are shown once, to be handed over in class.
 *
 * The email is a CONTACT address, never a sign-in identity — a center account's
 * auth address is synthetic, so this may be one that already has a personal
 * account on the platform (see migration 20260809130000).
 */
export function AddStudentPanel({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(addStudentAccount, initial);
  const [copied, setCopied] = useState(false);

  async function copyCredentials(login: string, password: string) {
    await navigator.clipboard.writeText(`Login: ${login}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      {/* key resets the fields after each successful add, ready for the next student */}
      <form action={formAction} key={state.created?.login ?? "new"} className="space-y-3">
        <input type="hidden" name="group_id" value={groupId} />
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1 space-y-2">
            <Label htmlFor="student-name">Full name</Label>
            <Input id="student-name" name="full_name" autoComplete="off" required />
          </div>
          <div className="min-w-40 flex-1 space-y-2">
            <Label htmlFor="student-login">Login</Label>
            <Input
              id="student-login"
              name="login"
              autoComplete="off"
              placeholder="aziz.karimov"
              pattern="[A-Za-z0-9][A-Za-z0-9._\-]{1,30}[A-Za-z0-9]"
              required
            />
          </div>
          <div className="min-w-44 flex-1 space-y-2">
            <Label htmlFor="student-email">
              Contact email <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="student-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="student@example.com"
            />
            <p className="text-muted-foreground text-xs">
              Where we send their login — not how they sign in, so an address that already has a
              personal account here is fine.
            </p>
          </div>
          <div className="w-44 space-y-2">
            <Label htmlFor="student-password">Password</Label>
            <Input
              id="student-password"
              name="password"
              autoComplete="off"
              placeholder="Auto-generate"
              minLength={8}
            />
          </div>
          <div className="w-56 space-y-2">
            <Label htmlFor="student-photo">
              Photo <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="student-photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="h-8 py-0.5 text-xs file:mr-2 file:h-6 file:rounded file:border file:px-2 file:text-xs"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Add student"}
          </Button>
        </div>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.warning ? (
        <p className="text-sm text-amber-600" role="status">
          {state.warning}
        </p>
      ) : null}

      {state.created ? (
        <div className="space-y-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
          <p className="text-sm">
            <span className="font-medium">{state.created.name}</span> can sign in now. Give them
            these — the password isn&apos;t shown again:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="bg-background rounded border px-2 py-1 font-mono text-xs">
              {state.created.login}
            </code>
            <code className="bg-background rounded border px-2 py-1 font-mono text-xs">
              {state.created.password}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyCredentials(state.created!.login, state.created!.password)}
            >
              {copied ? "Copied" : "Copy both"}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            {state.emailNote ??
              "No email on file, so this login is the only way in — and there's no email password reset. Send it over Telegram or write it down. You can always add an email later."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
