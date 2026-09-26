"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset, type AuthFormState } from "@/lib/auth-actions";

const initial: AuthFormState = {};

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <main style={{ maxWidth: 440, margin: "10vh auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Reset your password</h1>
      <p>Enter your email address and we’ll send a secure reset link.</p>
      <form action={action}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 16px" }} />
        {state.error ? <p role="alert">{state.error}</p> : null}
        {state.notice ? <p role="status">{state.notice}</p> : null}
        <button type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
      </form>
      <p><Link href="/sign-in">Back to sign in</Link></p>
    </main>
  );
}
