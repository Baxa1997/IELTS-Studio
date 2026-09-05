"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { signUpOrganization, type AuthFormState } from "@/app/(auth)/actions";

import {
  BODY,
  BRAND,
  BRAND_DEEP,
  BRAND_TINT,
  DISPLAY,
  FIELD,
  GREY,
  INK,
  LINE,
  MUTED,
  RADIUS,
  SANS,
  solidButton,
  WELL,
  WHITE,
} from "./design";

/**
 * "Are you an education center? — Register here", plus the dialog behind it.
 *
 * Posts to `signUpOrganization`, the same server action the sign-in page's
 * original modal used, with the same field names (`org_name`, `email`, `login`,
 * `password`). On success that action redirects to /awaiting-approval or returns
 * a "check your email" notice, so there is no success state to hold here.
 *
 * WHY NOT REUSE `(auth)/sign-in/org-register-modal.tsx`: it draws from
 * `(auth)/brand-form.ts`, which is the OLD indigo palette and is still shared
 * with the sign-up page. Re-skinning it there would have repainted sign-up too.
 * This one is the canvas's burgundy and is used by both surfaces that now wear
 * it — the centre guide and sign-in.
 */

const initial: AuthFormState = {};

export function RegisterCenterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(signUpOrganization, initial);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    // The page behind must not scroll while the dialog is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

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
      aria-label="Register your education center"
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
          maxWidth: 520,
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
              Register your center
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: BODY, margin: "8px 0 0" }}>
              We review each application by hand. Once it is approved you can invite teachers and
              issue student logins.
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

        <form action={formAction} style={{ marginTop: 22 }}>
          <label htmlFor="org_name" style={label}>
            Official organization name
          </label>
          <input
            ref={first}
            id="org_name"
            name="org_name"
            required
            placeholder="Bright Future Education LLC"
            style={field}
          />

          <label htmlFor="org_email" style={{ ...label, marginTop: 16 }}>
            Contact email
          </label>
          <input
            id="org_email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="director@yourcenter.uz"
            style={field}
          />

          <label htmlFor="org_login" style={{ ...label, marginTop: 16 }}>
            Login for the center
          </label>
          <input
            id="org_login"
            name="login"
            required
            placeholder="brightfuture"
            style={field}
          />
          <p style={{ fontSize: 12.5, color: GREY, margin: "6px 0 0" }}>
            3–32 characters: letters, digits, and . _ - in the middle.
          </p>

          <label htmlFor="org_password" style={{ ...label, marginTop: 16 }}>
            Password
          </label>
          <input
            id="org_password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            style={field}
          />

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
          {state.notice ? (
            <p
              style={{
                margin: "16px 0 0",
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
              marginTop: 22,
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
            {pending ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** The full-width band used on the centre guide. */
export function RegisterCenterBand() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: 20,
          background: WELL,
          padding: 30,
          marginTop: 54,
          display: "flex",
          flexWrap: "wrap",
          gap: 22,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 620 }}>
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
            Are you an education center?
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: BODY, margin: "10px 0 0" }}>
            Register here and we will issue logins for your teachers and students. Applications are
            reviewed by hand, and we confirm by email.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lp-solid"
          style={{ ...solidButton(), whiteSpace: "nowrap" }}
        >
          Register here
        </button>
      </div>
      <RegisterCenterDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** The compact card used on sign-in, where vertical space is scarce. */
export function RegisterCenterCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        style={{
          border: `1px solid ${LINE}`,
          borderRadius: 16,
          padding: "clamp(12px,2vh,16px) 18px",
          marginTop: "clamp(14px,2.5vh,24px)",
          display: "flex",
          gap: 14,
          alignItems: "center",
          background: WELL,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>
            Are you an education center?
          </div>
          <div style={{ fontSize: 13.5, color: GREY, lineHeight: 1.45, marginTop: 2 }}>
            We&apos;ll issue logins for your students and teachers.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lp-ghost"
          style={{
            flex: "none",
            background: WHITE,
            border: `1px solid ${FIELD}`,
            borderRadius: RADIUS.pill,
            padding: "10px 18px",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 700,
            color: BRAND,
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          Register here
        </button>
      </div>
      <RegisterCenterDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
