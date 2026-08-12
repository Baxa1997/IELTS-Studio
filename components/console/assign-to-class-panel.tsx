"use client";

import { useActionState, useState } from "react";

import { assignPractice, type PracticeFormState } from "@/app/(app)/console/practices/actions";
import { useActionFeedback } from "@/components/console/toast";

const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const LINE = "#ECEAF2";
const SANS = "var(--font-hanken), system-ui, sans-serif";

/**
 * Floating, staff-only, collapsed by default — so the runner it sits on looks
 * exactly like the learner's until a teacher chooses to act.
 */
export function AssignToClassPanel({
  kind,
  contentId,
  groups,
}: {
  kind: "writing" | "reading" | "listening";
  contentId: string;
  groups: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(assignPractice, {} as PracticeFormState);
  useActionFeedback(state);

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 60,
        fontFamily: SANS,
        maxWidth: "min(340px, calc(100vw - 36px))",
      }}
    >
      {open ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            boxShadow: "0 12px 34px rgba(26,33,56,0.16)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <strong style={{ fontSize: 14, color: INK }}>Set this to a class</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                border: "none",
                background: "none",
                color: MUTED,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: MUTED, margin: "6px 0 12px" }}>
            Everyone in the group gets this exact practice, so their results compare.
          </p>

          <form action={formAction} style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="content_id" value={contentId} />

            <div style={{ display: "grid", gap: 6, maxHeight: 168, overflowY: "auto" }}>
              {groups.map((g) => (
                <label
                  key={g.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13.5,
                    color: INK,
                  }}
                >
                  <input type="checkbox" name="group_ids" value={g.id} />
                  {g.name}
                </label>
              ))}
            </div>

            <label style={{ display: "grid", gap: 4, fontSize: 12.5, color: MUTED }}>
              Due (optional)
              <input
                type="date"
                name="due_at"
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 9,
                  padding: "6px 9px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  color: INK,
                }}
              />
            </label>

            <button
              type="submit"
              disabled={pending}
              style={{
                background: INDIGO,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "9px 14px",
                fontWeight: 600,
                fontSize: 13.5,
                cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? "Setting…" : "Set as homework"}
            </button>
          </form>

          {state.error ? (
            <p style={{ marginTop: 8, fontSize: 12.5, color: "#b91c1c" }} role="alert">
              {state.error}
            </p>
          ) : null}
          {state.notice ? (
            <p style={{ marginTop: 8, fontSize: 12.5, color: "#15803d" }} role="status">
              {state.notice}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: INK,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: 13.5,
            boxShadow: "0 10px 26px rgba(26,33,56,0.22)",
            cursor: "pointer",
          }}
        >
          Set this to a class
        </button>
      )}
    </div>
  );
}
