"use client";

/**
 * The primitives that need state, kept apart from `./primitives` so importing a
 * card doesn't drag a client boundary along with it.
 *
 * `Modal` is the reason this file exists. Three were written independently —
 * `console-chrome.tsx`, `students-manager.tsx`, `teacher-practice.tsx` — and
 * none of the three closed on Escape, locked the background scroll, or moved
 * focus into the dialog. Every one of those is a bug a screen reader or a
 * keyboard user hits immediately, and none of them is worth re-solving per
 * screen. Consolidating them fixes all three at once.
 */

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

import { FAINT, INK, LINE, MUTED, RED_DEEP, SANS, WHITE } from "@/lib/theme/tokens";

/* ── modal ─────────────────────────────────────────────────────────────────── */

export function Modal({
  title,
  note,
  onClose,
  children,
  width = 460,
  footer,
}: {
  title: string;
  /** A line under the title — whose record this is, what the action affects. */
  note?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Escape closes, and the page behind stops scrolling while the dialog is up.
  // Both were missing from all three hand-rolled modals this replaces.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Move focus into the dialog on open, so the next Tab lands inside it rather
  // than continuing down the page behind the scrim.
  useEffect(() => {
    const first = panel.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (first ?? panel.current)?.focus();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(20,19,58,.4)",
          border: 0,
          cursor: "pointer",
        }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          position: "relative",
          width: `min(${width}px, 100%)`,
          // CENTRED, AND STILL SCROLLABLE WHEN IT IS TALLER THAN THE SCREEN.
          // `align-items: center` alone clips the TOP of an over-tall child in a
          // scrolling flex container — you can scroll down but never back up to
          // reach the title. `margin: auto` centres it while it fits and hands
          // the spare space back when it does not, which is the one combination
          // that behaves in both cases. (Carried over from the groups console's
          // local modal, which is where this was worked out.)
          margin: "auto",
          background: WHITE,
          borderRadius: 18,
          boxShadow: "0 30px 60px rgba(20,19,58,.28)",
          fontFamily: SANS,
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "20px 22px 14px",
          }}
        >
          {/* Title and note stack rather than sharing a baseline: side by side, a
              note of any length either wrapped under a hanging heading or pushed
              the close button off the row. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id={titleId}
              style={{
                fontSize: 19,
                fontWeight: 680,
                color: INK,
                margin: 0,
                letterSpacing: "-.01em",
              }}
            >
              {title}
            </h2>
            {note ? (
              <p style={{ margin: "3px 0 0", fontSize: 12.5, lineHeight: 1.45, color: FAINT }}>
                {note}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-modal-x"
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              width: 30,
              height: 30,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: WHITE,
              border: `1px solid ${LINE}`,
              borderRadius: 9,
              color: MUTED,
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "0 22px 22px" }}>{children}</div>

        {footer ? (
          <div style={{ borderTop: `1px solid ${LINE}`, padding: "14px 22px" }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ── spinner ───────────────────────────────────────────────────────────────── */

/**
 * The busy indicator. Animation lives in globals.css (`@keyframes lp-spin`,
 * already there and already respecting `prefers-reduced-motion`) because an
 * inline style cannot declare keyframes.
 *
 * `label` is not decoration: a spinner with no accessible name is a silent
 * "something is happening" to anyone not looking at it.
 */
export function Spinner({
  size = 16,
  label = "Loading",
  color,
  style,
}: {
  size?: number;
  label?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className="ui-spin"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color ?? FAINT}40`,
        borderTopColor: color ?? FAINT,
        ...style,
      }}
    />
  );
}

/* ── form field ────────────────────────────────────────────────────────────── */

/**
 * Label + control + error, wired together.
 *
 * The wiring is the point. Across the console's forms, labels were mostly plain
 * `<div>`s sitting above an input with no `htmlFor`, and error text was a red
 * line with nothing associating it to the field it described. This ties the
 * three with a generated id and `aria-describedby`, so the control announces its
 * own name and its own error.
 *
 * Render-prop rather than a wrapped `<input>` so it works for selects,
 * textareas and the custom pickers too.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  style,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (props: { id: string; "aria-describedby": string | undefined }) => ReactNode;
  style?: CSSProperties;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, fontFamily: SANS, ...style }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 650, color: INK }}>
        {label}
        {required ? (
          <span aria-hidden="true" style={{ color: RED_DEEP, marginLeft: 3 }}>
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <span id={hintId} style={{ fontSize: 11.5, color: FAINT, lineHeight: 1.45 }}>
          {hint}
        </span>
      ) : null}

      {children({ id, "aria-describedby": describedBy })}

      {error ? (
        <span id={errId} style={{ fontSize: 11.5, color: RED_DEEP, lineHeight: 1.45 }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
