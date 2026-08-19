"use client";

import { useEffect, useState } from "react";

import { AssignPanel } from "./assign-panel";
import { V2 } from "./ui";

/**
 * "Assign practice" as a centred sheet rather than a card parked at the top of
 * the practice tab.
 *
 * The card was the first thing on the tab every time, so the board it changes —
 * the thing a teacher actually came to look at — started below the fold. It is
 * also a form you touch once a week and then want out of the way.
 *
 * It closes ON SUCCESS, not on submit: generating a writing prompt takes a few
 * seconds and can fail, and a sheet that has already vanished gives a teacher
 * nowhere to read why.
 */
export function AssignSheet({
  groupId,
  libraryTests,
  library,
  label = "Assign practice",
  variant = "primary",
}: {
  groupId: string;
  libraryTests: { id: string; label: string }[];
  library: { id: string; title: string; skill: string; level: string | null }[];
  label?: string;
  variant?: "primary" | "quiet";
}) {
  const [open, setOpen] = useState(false);

  // Escape closes it, and the page behind must not scroll while it is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={
          variant === "primary"
            ? {
                padding: "11px 20px",
                borderRadius: 12,
                background: V2.indigo,
                border: `1px solid ${V2.indigo}`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }
            : {
                padding: "9px 16px",
                borderRadius: 12,
                background: "#fff",
                border: `1px solid ${V2.field}`,
                color: V2.ink,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }
        }
      >
        {label}
      </button>

      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(20,32,58,.42)",
            display: "flex",
            padding: 20,
            overflowY: "auto",
          }}
        >
          {/* `margin: auto` rather than `align-items: center`: a centred flex
              child that grows taller than the viewport has its top clipped and
              cannot be scrolled to. This one stays centred while it fits and
              scrolls from the top once it does not. */}
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Assign practice"
            style={{
              margin: "auto",
              width: "min(640px, 100%)",
              background: "#fff",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 30px 70px -30px rgba(20,32,58,.5)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${V2.rule}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-serif4), Georgia, serif", fontWeight: 700, fontSize: 24, color: V2.ink }}>
                  Assign practice
                </div>
                <div style={{ fontSize: 13, color: V2.faint, marginTop: 2 }}>
                  Everyone in the group gets identical content, so their bands compare.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  flex: "none",
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: `1px solid ${V2.field}`,
                  background: "#fff",
                  color: V2.muted,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <AssignPanel
                groupId={groupId}
                libraryTests={libraryTests}
                library={library}
                onDone={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
