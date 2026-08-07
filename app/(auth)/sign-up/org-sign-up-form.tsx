"use client";

import { useActionState } from "react";

import { signUpOrganization, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

/** The "Organization" tab: a center applies with its official name + email.
 *  Email/password only — OAuth can't carry the official name. The account is
 *  created pending and unlocks after super_admin approval. */
export function OrgSignUpForm() {
  const [state, formAction, pending] = useActionState(signUpOrganization, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org_name">Official organization name</Label>
        <Input id="org_name" name="org_name" autoComplete="organization" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org_email">Organization email</Label>
        <Input id="org_email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org_password">Password</Label>
        <Input
          id="org_password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p className="text-sm" role="status">
          {state.notice}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Submitting application…" : "Apply for an organization account"}
      </Button>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Organization accounts are reviewed by our team. You&apos;ll receive a confirmation
        email as soon as your organization is approved.
      </p>
    </form>
  );
}
