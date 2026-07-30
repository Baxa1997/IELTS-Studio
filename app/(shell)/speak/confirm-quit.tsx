"use client";

import { useEffect } from "react";

/**
 * Confirmation before abandoning a live speaking session.
 *
 * Quitting a mock is expensive and irreversible: the minutes are spent, the
 * attempt counts against the monthly quota, and whatever was said gets graded
 * as a partial test. A two-tap button was too easy to hit by accident, so the
 * consequence is spelled out and the destructive choice is never the default.
 */

// The speaking surface's own type and ink, not the app-wide Hanken/Newsreader:
// this dialog opens ON TOP of the exam room, and a different typeface mid-test
// reads as a different product.
const SANS = "var(--font-jakarta), system-ui, sans-serif";
const DISPLAY = "var(--font-bricolage), Georgia, serif";
const INK = "#1A1520";
const MUTED = "#5C5460";
const RED = "#DC2626";

export function ConfirmQuit({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep going",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, background: "rgba(23,22,40,.45)",
        display: "grid", placeItems: "center", padding: 18, fontFamily: SANS,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, padding: "26px 26px 22px",
          maxWidth: 430, width: "100%", boxShadow: "0 24px 60px rgba(23,22,40,.28)",
        }}
      >
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: INK }}>
          {title}
        </h2>
        <p style={{ margin: "10px 0 24px", fontSize: 15, lineHeight: 1.6, color: MUTED }}>
          {body}
        </p>
        {/* STACKED, not side by side. Two flexed buttons split a 430px dialog
            into ~184px each, which wrapped "Carry on with the test" onto two
            lines beside a single-line "End the test" — two ragged, unequal
            boxes. Full width also makes each label unambiguous on a phone. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Staying is the default: it is the safe choice and the common one. */}
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            style={{
              width: "100%", background: INK, color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 18px", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: SANS,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: "100%", background: "#fff", color: RED,
              border: "1px solid #F0D2D2", borderRadius: 12, padding: "14px 18px",
              fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
