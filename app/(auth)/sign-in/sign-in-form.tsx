"use client";

import { useActionState, useState } from "react";

import { signIn, type AuthFormState } from "@/app/(auth)/actions";
import {
  errorStyle,
  INK,
  inputStyle,
  labelStyle,
  MUTED,
  primaryButtonStyle,
  SANS,
  secondaryButtonStyle,
} from "@/app/(auth)/brand-form";
import { createClient } from "@/lib/supabase/client";

import { OrgRegisterModal } from "./org-register-modal";

const initialState: AuthFormState = {};

type Audience = "individual" | "organization";

/**
 * Brand sign-in panel (Option A). Owns both auth paths so the look stays
 * cohesive: Google OAuth (client redirect) and email/password via the shared
 * `signIn` server action. No AI or business logic here — just the form.
 *
 * The Individual / Organization switch is presentation only — BOTH tabs post
 * the same credentials to the same action, and the app routes by the role
 * already on the account. That is deliberate: a tab that actually filtered
 * would let someone pick "wrong" and be told their correct password failed.
 * What the switch changes is context — Google (which no center account uses)
 * and the sign-up link that makes sense for who you are.
 */
export function SignInForm({ next }: { next?: string | null }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [googlePending, setGooglePending] = useState(false);
  const [audience, setAudience] = useState<Audience>("individual");
  const [registerOpen, setRegisterOpen] = useState(false);

  async function signInWithGoogle() {
    setGooglePending(true);
    const supabase = createClient();
    // Carry the post-login target through OAuth: the /auth/callback route forwards
    // to `next` after exchanging the code.
    const callback = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    // On success the browser is redirected to Google; we only land here on error.
    if (error) setGooglePending(false);
  }

  return (
    <div>
      {/* Individual / Organization */}
      <div
        role="tablist"
        aria-label="Account type"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          background: "#EFEDE0",
          border: "1px solid #E1DECD",
          borderRadius: 12,
          padding: 4,
          marginBottom: 22,
        }}
      >
        {(
          [
            ["individual", "Individual"],
            ["organization", "Organization"],
          ] as const
        ).map(([value, label]) => {
          const on = audience === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setAudience(value)}
              style={{
                border: "none",
                borderRadius: 9,
                padding: "9px 12px",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                background: on ? "#fff" : "transparent",
                color: on ? INK : "#6b6e84",
                boxShadow: on ? "0 1px 3px rgba(26,28,51,.12)" : "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {audience === "individual" ? (
        <>
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
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 12, color: "#9a998c" }}>
              or sign in with email
            </span>
            <span style={{ height: 1, flex: 1, background: "#E6E3D4" }} />
          </div>
        </>
      ) : null}

      {/* email + password */}
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div>
          <label htmlFor="email" style={labelStyle}>
            {audience === "organization" ? "Login or email" : "Email"}
          </label>
          {/* type="text" on the organization side: a login is not an email, and
              the browser would refuse to submit one in an email field. */}
          <input
            id="email"
            name="email"
            type={audience === "organization" ? "text" : "email"}
            autoComplete={audience === "organization" ? "username" : "email"}
            required
            placeholder={audience === "organization" ? "aziz.karimov" : "you@email.com"}
            className="lp-input"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="lp-input"
            style={inputStyle}
          />
        </div>

        {state.error ? (
          <p role="alert" style={errorStyle}>
            {state.error}
          </p>
        ) : null}

        {audience === "organization" ? (
          <>
            {/* Two doors for a center: sign in, or apply. Register is a plain
                button, not a submit — it opens the application dialog. */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="submit" disabled={pending} style={primaryButtonStyle(pending)}>
                {pending ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                className="lp-ghost-btn"
                style={secondaryButtonStyle()}
              >
                Register
              </button>
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13,
                lineHeight: 1.55,
                color: MUTED,
                textAlign: "center",
                margin: 0,
              }}
            >
              Students and teachers sign in with the login their center gave them. Registering is
              for the center itself — our team reviews it before it goes live.
            </p>
          </>
        ) : (
          <button type="submit" disabled={pending} style={primaryButtonStyle(pending)}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        )}
      </form>

      <OrgRegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flex: "none" }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
