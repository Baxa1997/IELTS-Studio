"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addTeacherAccount, type AddStudentState } from "../groups/actions";

const initial: AddStudentState = {};

/**
 * Create a teacher account on the spot — name, login, password. Email is
 * optional; supply one and the credentials are sent, leave it out and you hand
 * them over in person. Mirrors how teachers create students, because a center
 * admin standing next to a new teacher shouldn't have to wait on an invite email.
 */
export function AddTeacherPanel() {
  const [state, formAction, pending] = useActionState(addTeacherAccount, initial);
  const [copied, setCopied] = useState(false);

  async function copyCredentials(login: string, password: string) {
    await navigator.clipboard.writeText(`Login: ${login}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      {/* key resets the fields after each successful add */}
      <form action={formAction} key={state.created?.login ?? "new"} className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1 space-y-2">
            <Label htmlFor="teacher-name">Full name</Label>
            <Input id="teacher-name" name="full_name" autoComplete="off" required />
          </div>
          <div className="min-w-40 flex-1 space-y-2">
            <Label htmlFor="teacher-login">Login</Label>
            <Input
              id="teacher-login"
              name="login"
              autoComplete="off"
              placeholder="dilnoza.t"
              pattern="[A-Za-z0-9][A-Za-z0-9._\-]{1,30}[A-Za-z0-9]"
              required
            />
          </div>
          <div className="min-w-44 flex-1 space-y-2">
            <Label htmlFor="teacher-email">
              Email <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="teacher-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="teacher@example.com"
            />
            <p className="text-muted-foreground text-xs">Emails them the login and password.</p>
          </div>
          <div className="w-44 space-y-2">
            <Label htmlFor="teacher-password">Password</Label>
            <Input
              id="teacher-password"
              name="password"
              autoComplete="off"
              placeholder="Auto-generate"
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Add teacher"}
          </Button>
        </div>
      </form>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.created ? (
        <div className="space-y-2 rounded-md border border-indigo-500/40 bg-indigo-500/5 p-3">
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
              "No email on file, so this login is the only way in — and there's no email password reset. Hand it over in person or by Telegram."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
