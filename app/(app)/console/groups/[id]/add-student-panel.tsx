"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addStudentAccount, type AddStudentState } from "../actions";
import { useActionFeedback } from "@/components/console/toast";

const initial: AddStudentState = {};

/**
 * Add one student: type their name.
 *
 * THE NAME IS THE ONLY REQUIRED FIELD, and that is the whole design. The
 * account is not optional — homework on this platform hangs off a student id,
 * so there is no student without one — but the teacher should never have to
 * INVENT one. The login is derived from the name (`dilnoza.r`, de-duplicated
 * against every login on the platform) and the password is generated, both
 * server-side, and both are shown once afterwards to hand over.
 *
 * Everything else is behind "More options" because it is rare: a login the
 * center has already promised the student, a password they chose, a photo. The
 * email is a CONTACT address, never a sign-in identity — a center account's
 * auth address is synthetic, so this may be one that already has a personal
 * account on the platform (see migration 20260809130000).
 */
export function AddStudentPanel({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(addStudentAccount, initial);
  // Stays open on success: the generated password is shown once, below.
  useActionFeedback(state, { keepOpen: true });
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState(false);

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
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="student-name">Full name</Label>
            <Input
              id="student-name"
              name="full_name"
              autoComplete="off"
              placeholder="Aziza Karimova"
              required
            />
            <p className="text-muted-foreground text-xs">
              That&apos;s all we need — no email required. A login and password are made for them
              and shown here once you add them.
            </p>
          </div>

          <div className="space-y-2">
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
              Give one and their login is emailed to them. It is not how they sign in, so an address
              that already has a personal account here is fine.
            </p>
          </div>

          {/* THE FIELD THE ACTION ALREADY READ AND NO FORM EVER SENT.
              `phone` has been pulled off this formData since the panel was
              written; there was simply nowhere to type it, so every student was
              created without one. It stopped being a contact detail when the
              bot started using it to decide who is asking for a password. */}
          <div className="space-y-2">
            <Label htmlFor="student-phone">
              Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="student-phone"
              name="phone"
              type="tel"
              autoComplete="off"
              placeholder="+998 90 123 45 67"
            />
            <p className="text-muted-foreground text-xs">
              Their own number, the one on their Telegram. It is how they collect their login from
              the class invite — without it they have to be given it by hand.
            </p>
          </div>

          {/* Rare enough to fold away, real enough to keep: a center that has
              already told a student their login has to be able to honour it. */}
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="text-muted-foreground text-xs underline"
          >
            {more ? "Fewer options" : "Set the login, password or photo myself"}
          </button>

          {more ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-2">
                <Label htmlFor="student-login">Login</Label>
                <Input
                  id="student-login"
                  name="login"
                  autoComplete="off"
                  placeholder="built from the name"
                  pattern="[A-Za-z0-9][A-Za-z0-9._\-]{1,30}[A-Za-z0-9]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  name="password"
                  autoComplete="off"
                  placeholder="Auto-generate"
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-photo">Photo</Label>
                <Input
                  id="student-photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="h-8 py-0.5 text-xs file:mr-2 file:h-6 file:rounded file:border file:px-2 file:text-xs"
                />
              </div>
            </div>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
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
