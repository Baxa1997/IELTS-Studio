"use client";

import { useActionState, useEffect, useRef } from "react";

import { signUpOrganization, type AuthFormState } from "@/app/(auth)/actions";
import {
  errorStyle,
  HAIRLINE,
  INDIGO,
  inputStyle,
  labelStyle,
  MUTED,
  noticeStyle,
  primaryButtonStyle,
  SANS,
  SERIF,
} from "@/app/(auth)/brand-form";

const initialState: AuthFormState = {};

/**
 * Organization registration, in a dialog over the sign-in page.
 *
 * Rendered inline rather than through a portal on purpose: the brand fonts are
 * CSS variables scoped to the page's `.lp-root`, and a portal to document.body
 * would drop out of that subtree and render in the fallback system font.
 *
 * On success the server action redirects (to /awaiting-approval, or it returns
 * a "check your email" notice), so there is no success state to manage here.
 */
export function OrgRegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(signUpOrganization, initialState);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();

    // Escape closes; the page behind must not scroll while the dialog is up.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(26,28,51,.46)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 18px",
        overflowY: "auto",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-register-title"
        // Clicks inside must not reach the backdrop's close handler.
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "linear-gradient(180deg,#FFFFFF,#FBFAF3)",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 18,
          boxShadow: "0 28px 60px -24px rgba(26,28,51,.45)",
          padding: "26px clamp(20px,4vw,30px) 26px",
          margin: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: INDIGO,
              }}
            >
              For education centers
            </div>
            <h2
              id="org-register-title"
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 26,
                lineHeight: 1.15,
                letterSpacing: "-.015em",
                margin: "6px 0 0",
              }}
            >
              Register your organization
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flex: "none",
              width: 32,
              height: 32,
              borderRadius: 9,
              border: `1px solid ${HAIRLINE}`,
              background: "#fff",
              color: MUTED,
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <p
          style={{
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: MUTED,
            margin: "10px 0 22px",
          }}
        >
          Our team reviews every organization before it goes live. You&apos;ll get a confirmation
          email as soon as yours is approved.
        </p>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="org-modal-name" style={labelStyle}>
              Official organization name
            </label>
            <input
              ref={firstFieldRef}
              id="org-modal-name"
              name="org_name"
              autoComplete="organization"
              required
              placeholder="Cambridge Learning Centre"
              className="lp-input"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="org-modal-email" style={labelStyle}>
              Organization email
            </label>
            <input
              id="org-modal-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="info@yourcentre.uz"
              className="lp-input"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="org-modal-login" style={labelStyle}>
              Login <span style={{ fontWeight: 500, color: MUTED }}>(optional)</span>
            </label>
            <input
              id="org-modal-login"
              name="login"
              autoComplete="off"
              placeholder="cambridge-tashkent"
              pattern="[A-Za-z0-9][A-Za-z0-9._\-]{1,30}[A-Za-z0-9]"
              className="lp-input"
              style={inputStyle}
            />
            <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, margin: "7px 0 0" }}>
              A short name to sign in with instead of the email.
            </p>
          </div>

          <div>
            <label htmlFor="org-modal-password" style={labelStyle}>
              Password
            </label>
            <input
              id="org-modal-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              placeholder="At least 8 characters"
              className="lp-input"
              style={inputStyle}
            />
          </div>

          {state.error ? (
            <p role="alert" style={errorStyle}>
              {state.error}
            </p>
          ) : null}
          {state.notice ? (
            <p role="status" style={noticeStyle}>
              {state.notice}
            </p>
          ) : null}

          <button type="submit" disabled={pending} style={primaryButtonStyle(pending)}>
            {pending ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}
