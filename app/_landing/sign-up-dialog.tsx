"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { signUp, type AuthFormState } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";

import {
  BODY,
  BRAND,
  BRAND_DEEP,
  BRAND_TINT,
  DISPLAY,
  FIELD,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  WHITE,
} from "./design";

/**
 * Individual sign-up, in a dialog.
 *
 * THERE IS NO /sign-up PAGE ANY MORE. It was the last screen still wearing the
 * old green/cream brand, and it was what a visitor hit after pressing "Choose
 * plan" on pricing — so the funnel handed people a page from the previous
 * design. Rather than rebuild it, account creation moved to where signing in
 * already happens: this dialog for a learner, `RegisterCenterDialog` for a
 * centre, both opened from /sign-in and from the pricing buttons.
 *
 * Same server action (`signUp`) and the same field names — full_name, phone,
 * email, password — so nothing about provisioning changed. A learner still gets
 * a personal organisation from the `handle_new_user` trigger.
 */

const initial: AuthFormState = {};

export function SignUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(signUp, initial);
  const [googlePending, setGooglePending] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  async function withGoogle() {
    setGooglePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setGooglePending(false);
  }

  if (!open) return null;

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: INK,
    marginBottom: 6,
  };
  const field: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    border: `1px solid ${FIELD}`,
    borderRadius: RADIUS.field,
    fontFamily: SANS,
    fontSize: 15,
    background: WHITE,
    color: INK,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create your account"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(18,19,23,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: WHITE,
          borderRadius: RADIUS.panel,
          border: `1px solid ${LINE}`,
          boxShadow: "0 40px 90px -30px rgba(18,19,23,0.45)",
          width: "100%",
          maxWidth: 480,
          padding: "clamp(24px,4vw,34px)",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: "-0.02em",
                margin: 0,
                color: INK,
              }}
            >
              Create your account
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: BODY, margin: "8px 0 0" }}>
              Free to start — no card required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flex: "none",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
              color: MUTED,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={withGoogle}
          disabled={googlePending}
          style={{
            width: "100%",
            marginTop: 22,
            background: WHITE,
            border: `1px solid ${FIELD}`,
            borderRadius: RADIUS.field,
            padding: 14,
            fontFamily: SANS,
            fontSize: 15,
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
          {googlePending ? "Opening Google…" : "Sign up with Google"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "18px 0",
            color: MUTED,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
          }}
        >
          <span style={{ flex: 1, height: 1, background: LINE }} />
          OR
          <span style={{ flex: 1, height: 1, background: LINE }} />
        </div>

        <form action={formAction}>
          <label htmlFor="su_name" style={label}>
            Full name
          </label>
          <input ref={first} id="su_name" name="full_name" autoComplete="name" required style={field} />

          <label htmlFor="su_phone" style={{ ...label, marginTop: 14 }}>
            Phone <span style={{ fontWeight: 500, color: MUTED }}>(optional)</span>
          </label>
          <input id="su_phone" name="phone" type="tel" autoComplete="tel" style={field} />

          <label htmlFor="su_email" style={{ ...label, marginTop: 14 }}>
            Email
          </label>
          <input id="su_email" name="email" type="email" autoComplete="email" required style={field} />

          <label htmlFor="su_password" style={{ ...label, marginTop: 14 }}>
            Password
          </label>
          <input
            id="su_password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            placeholder="At least 8 characters"
            style={field}
          />

          {state.error ? (
            <p
              role="alert"
              style={{
                margin: "14px 0 0",
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
          {state.notice ? (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 14,
                color: BRAND,
                background: BRAND_TINT,
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              {state.notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              marginTop: 20,
              background: pending ? BRAND_DEEP : BRAND,
              color: WHITE,
              border: 0,
              borderRadius: RADIUS.field,
              padding: 15,
              fontFamily: SANS,
              fontSize: 16,
              fontWeight: 700,
              cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Creating…" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 12.5, lineHeight: 1.55, color: MUTED, margin: "14px 0 0" }}>
          By creating an account you agree to our <a href="/terms" style={{ color: BRAND }}>Terms of Service</a> and{" "}
          <a href="/privacy" style={{ color: BRAND }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

/** A button that opens the dialog. Used by pricing and by sign-in. */
export function SignUpButton({
  label,
  style,
  className,
}: {
  label: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={{ cursor: "pointer", ...style }}>
        {label}
      </button>
      <SignUpDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
