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

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const LINE = "#E8E6F0";
const RED = "#b91c1c";

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
        <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: INK }}>
          {title}
        </h2>
        <p style={{ margin: "10px 0 22px", fontSize: 14.5, lineHeight: 1.6, color: MUTED }}>
          {body}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Staying is the default: it is the safe choice and the common one. */}
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            style={{
              flex: 1, minWidth: 140, background: INK, color: "#fff", border: "none",
              borderRadius: 11, padding: "12px 18px", fontSize: 14.5, fontWeight: 700,
              cursor: "pointer", fontFamily: SANS,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, minWidth: 140, background: "#fff", color: RED,
              border: `1.5px solid #F3C6C6`, borderRadius: 11, padding: "12px 18px",
              fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: SANS,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
