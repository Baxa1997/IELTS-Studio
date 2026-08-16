"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { FAINT, INK, SANS, TONE, type Tone } from "./ui";

/**
 * The bell, and the panel behind it.
 *
 * The design draws a dropdown of what needs attention; a badge with no panel is
 * a number you cannot act on. Each row here is a real count with a real
 * destination — applications waiting, centres that were approved and have
 * graded nothing, mocks the grader flagged.
 *
 * The data is gathered on the server (see header.tsx) and passed in, so the
 * panel costs no request when it opens and cannot disagree with the badge.
 */

export interface AlertRow {
  title: string;
  detail: string;
  href: string;
  tone: Tone;
  icon: "building" | "warn" | "shield";
}

const ICON: Record<AlertRow["icon"], React.ReactNode> = {
  building: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h3M13 7h3M8 11h3M13 11h3M8 15h3M13 15h3" />
    </svg>
  ),
  warn: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6z" />
    </svg>
  ),
};

export function AlertsBell({ alerts, count }: { alerts: AlertRow[]; count: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `${count} alerts` : "No alerts"}
        aria-expanded={open}
        style={{
          position: "relative",
          width: 34,
          height: 34,
          background: "#fff",
          border: "1px solid #E0DED8",
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          color: "#4C4A63",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 01-3.4 0" />
        </svg>
        {count > 0 ? (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: TONE.red.ink,
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 20,
              padding: "1px 5px",
            }}
          >
            {count}
          </span>
        ) : null}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <div
                onClick={() => setOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 70 }}
                aria-hidden
              />
              <div
                role="dialog"
                aria-label="Alerts"
                style={{
                  position: "fixed",
                  top: 58,
                  right: 28,
                  width: 330,
                  background: "#fff",
                  border: "1px solid #E4E2DC",
                  borderRadius: 12,
                  boxShadow: "0 18px 44px rgba(20,19,58,.16)",
                  padding: 6,
                  zIndex: 71,
                  fontFamily: SANS,
                }}
              >
                {alerts.map((a) => (
                  <Link
                    key={a.title}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="ad-menu-item"
                    style={{
                      display: "flex",
                      gap: 11,
                      padding: 10,
                      borderRadius: 8,
                      textDecoration: "none",
                      color: INK,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        background: TONE[a.tone].tint,
                        color: TONE[a.tone].ink,
                      }}
                    >
                      {ICON[a.icon]}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
                        {a.title}
                      </span>
                      <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 2 }}>
                        {a.detail}
                      </span>
                    </span>
                  </Link>
                ))}
                {alerts.length === 0 ? (
                  <div style={{ padding: "18px 10px", textAlign: "center", fontSize: 13, color: FAINT }}>
                    Nothing needs you right now.
                  </div>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </span>
  );
}
