"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signIn, type AuthFormState } from "@/app/(auth)/actions";
import {
  BODY,
  BRAND,
  BRAND_DEEP,
  DISPLAY,
  FIELD,
  GREY,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  WELL,
  WHITE,
} from "@/app/_landing/design";
import { createClient } from "@/lib/supabase/client";

const initial: AuthFormState = {};

/**
 * The sign-in form from the design canvas.
 *
 * Only the LOOK is new. The auth paths are the ones that were already here and
 * already work: the `signIn` server action (which resolves a centre login
 * without an `@` to its account server-side) and Google OAuth via the browser
 * client. Field names are unchanged — the action reads `email`, `password` and
 * `next` — because renaming them would break sign-in for a cosmetic reason.
 *
 * The canvas's Individual/Organization tab strip is not here: the old form's
 * comment explains why it was presentation-only, and the canvas does not draw
 * it. Both kinds of account post the same credentials to the same action, and
 * the app routes by the role already on the account.
 */
export function DesignSignInForm({ next }: { next?: string | null }) {
  const [state, formAction, pending] = useActionState(signIn, initial);
  const [showPw, setShowPw] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  async function signInWithGoogle() {
    setGooglePending(true);
    const supabase = createClient();
    // Carry the post-login target through OAuth — /auth/callback forwards to it.
    const callback = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    if (error) setGooglePending(false);
  }

  const label: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 700, color: INK };
  const field: React.CSSProperties = {
    width: "100%",
    padding: "15px 16px",
    border: `1px solid ${FIELD}`,
    borderRadius: RADIUS.field,
    fontFamily: SANS,
    fontSize: 16,
    background: WHITE,
    color: INK,
  };

  return (
    <>
      <h1
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 32,
          letterSpacing: "-0.03em",
          margin: 0,
          color: INK,
        }}
      >
        Sign in to your account
      </h1>
      <p style={{ fontSize: 16, color: BODY, margin: "10px 0 0" }}>
        Use your email, or the login your education center gave you.
      </p>

      <form action={formAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label htmlFor="email" style={{ ...label, margin: "30px 0 8px" }}>
          Email or center login
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          required
          placeholder="you@email.com  ·  aziz.karimov"
          className="lp-field"
          style={field}
        />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            margin: "18px 0 8px",
          }}
        >
          <label htmlFor="password" style={label}>
            Password
          </label>
          {/* There is no self-serve reset route in this app — the canvas draws
              this as `href="#"`, and a dead link is worse than an honest one.
              /contact is where it can actually be dealt with, and it is also the
              right answer for a centre student, whose account has a synthetic
              address that no reset email could ever reach: their teacher resets
              it. Repoint this the day a reset flow exists. */}
          <Link href="/contact" style={{ fontSize: 14, fontWeight: 600, color: BRAND }}>
            Forgot password?
          </Link>
        </div>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="lp-field"
            style={{ ...field, padding: "15px 74px 15px 16px" }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 700,
              color: BRAND,
              padding: "8px 10px",
              borderRadius: 8,
            }}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        {state.error ? (
          <p
            role="alert"
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              color: "#a4222a",
              background: "#fdeceb",
              border: "1px solid #f5cfcd",
              borderRadius: 12,
              padding: "11px 14px",
            }}
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            marginTop: 24,
            background: pending ? BRAND_DEEP : BRAND,
            color: WHITE,
            border: 0,
            borderRadius: RADIUS.field,
            padding: 17,
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 700,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          margin: "24px 0",
          color: MUTED,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.14em",
        }}
      >
        <span style={{ flex: 1, height: 1, background: LINE }} />
        OR CONTINUE WITH
        <span style={{ flex: 1, height: 1, background: LINE }} />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={googlePending}
        className="lp-ghost"
        style={{
          width: "100%",
          background: WHITE,
          border: `1px solid ${FIELD}`,
          borderRadius: RADIUS.field,
          padding: 16,
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 600,
          cursor: googlePending ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: INK,
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: BRAND }} aria-hidden>
          G
        </span>
        {googlePending ? "Opening Google…" : "Sign in with Google"}
      </button>

      <div style={{ textAlign: "center", fontSize: 15, color: BODY, marginTop: 26 }}>
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" style={{ fontWeight: 700, color: BRAND }}>
          Sign up
        </Link>
      </div>

      <div
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: 16,
          padding: "18px 20px",
          marginTop: 26,
          display: "flex",
          gap: 16,
          alignItems: "center",
          background: WELL,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
            Are you an education center?
          </div>
          <div style={{ fontSize: 14, color: GREY, lineHeight: 1.5, marginTop: 4 }}>
            Register your center and we&apos;ll issue logins for your students and teachers.
          </div>
        </div>
        <Link
          href="/sign-up?tab=organization"
          className="lp-ghost"
          style={{
            flex: "none",
            background: WHITE,
            border: `1px solid ${FIELD}`,
            borderRadius: RADIUS.pill,
            padding: "11px 20px",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 700,
            color: BRAND,
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}
        >
          Contact us
        </Link>
      </div>

      <p style={{ fontSize: 13, color: "#9aa0ac", lineHeight: 1.55, marginTop: 24 }}>
        Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment
        English.
      </p>
    </>
  );
}
