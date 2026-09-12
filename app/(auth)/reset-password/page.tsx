"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePassword, type AuthFormState } from "@/app/(auth)/actions";

const initial: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  return (
    <main style={{ maxWidth: 440, margin: "10vh auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Choose a new password</h1>
      <p>Use at least eight characters.</p>
      <form action={action}>
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 16px" }} />
        <label htmlFor="confirmation">Confirm password</label>
        <input id="confirmation" name="confirmation" type="password" required minLength={8} autoComplete="new-password" style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 16px" }} />
        {state.error ? <p role="alert">{state.error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
      </form>
      <p><Link href="/sign-in">Back to sign in</Link></p>
    </main>
  );
}
