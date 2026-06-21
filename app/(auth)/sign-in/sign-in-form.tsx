"use client";

import { useActionState, useState } from "react";

import { signIn, type AuthFormState } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";

const initialState: AuthFormState = {};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 13,
  color: "#3a3d52",
  marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #DAD8C9",
  borderRadius: 11,
  fontFamily: SANS,
  fontWeight: 500,
  fontSize: 15,
  color: INK,
  background: "#fff",
};

/**
 * Brand sign-in panel (Option A). Owns both auth paths so the look stays
 * cohesive: Google OAuth (client redirect) and email/password via the shared
 * `signIn` server action. No AI or business logic here — just the form.
 */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [googlePending, setGooglePending] = useState(false);

  async function signInWithGoogle() {
    setGooglePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser is redirected to Google; we only land here on error.
    if (error) setGooglePending(false);
  }

  return (
    <div>
      {/* Google */}
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={googlePending}
        className="lp-ghost-btn"
        style={{
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "#fff",
          border: "1px solid #DAD8C9",
          borderRadius: 11,
          padding: "12px 16px",
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 15,
          color: INK,
          cursor: googlePending ? "default" : "pointer",
          opacity: googlePending ? 0.7 : 1,
        }}
      >
        <GoogleG />
        {googlePending ? "Redirecting…" : "Continue with Google"}
      </button>

      {/* divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <span style={{ height: 1, flex: 1, background: "#E6E3D4" }} />
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 12, color: "#9a998c" }}>or sign in with email</span>
        <span style={{ height: 1, flex: 1, background: "#E6E3D4" }} />
      </div>

      {/* email + password */}
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@email.com" className="lp-input" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" className="lp-input" style={inputStyle} />
        </div>

        {state.error ? (
          <p role="alert" style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13.5, color: "#c2410c", background: "#FEF2E8", border: "1px solid #F6D7BE", borderRadius: 10, padding: "10px 12px", margin: 0 }}>
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: INDIGO,
            color: "#fff",
            border: "none",
            borderRadius: 11,
            padding: "13px 16px",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 16,
            cursor: pending ? "default" : "pointer",
            boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)",
            opacity: pending ? 0.75 : 1,
          }}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flex: "none" }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
