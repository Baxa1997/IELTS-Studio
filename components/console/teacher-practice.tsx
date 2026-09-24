"use client";

import { useActionState } from "react";

import { assignPractice, type PracticeFormState } from "@/app/(app)/console/practices/actions";
import {
  FAINT,
  INDIGO,
  INDIGO_FILL,
  ON_INDIGO,
  PANEL,
  SLATE_INK,
  SLATE_LINE,
  SLATE_MUTED,
  WARM_GREEN,
  WARM_LINE_DEEP,
  WARM_RED,
  WELL,
  WHITE,
} from "@/lib/theme/tokens";

/**
 * The two pieces every practice hub shares for setting content to a group: the
 * modal shell, and the group-picker form inside it.
 *
 * There is deliberately no "teacher bench" component any more. A teacher uses
 * the learner's own hub — the same Generate button, the same cards — and these
 * two just dress the extra step. Styled to the Option A tokens, because that is
 * what the hub pages load; the console's fonts are not mounted there.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = SLATE_INK;
const MUTED = SLATE_MUTED;
const LINE = SLATE_LINE;

const field: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${WARM_LINE_DEEP}`,
  borderRadius: 9,
  padding: "10px 11px",
  fontFamily: SANS,
  fontSize: 13.5,
  color: INK,
  background: PANEL,
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontSize: 12.5,
  color: MUTED,
  marginBottom: 5,
};

/** Group picker + optional deadline, posting the same action the runner uses. */
export function AttachForm({
  kind,
  contentId,
  groups,
  onDone,
}: {
  kind: "writing" | "reading" | "listening";
  /** The row the assignment will point at — a prompt, a reading test, or a
   *  promoted listening library item. */
  contentId: string;
  groups: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(assignPractice, {} as PracticeFormState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="content_id" value={contentId} />

      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>
        Everyone in the group gets this exact practice, so their bands compare. It is published as
        part of attaching.
      </p>

      <div>
        <span style={labelStyle}>Groups</span>
        <div
          style={{
            display: "grid",
            gap: 2,
            maxHeight: 190,
            overflowY: "auto",
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: 6,
          }}
        >
          {groups.map((g) => (
            <label
              key={g.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontSize: 13.5,
                color: INK,
                padding: "7px 8px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" name="group_ids" value={g.id} />
              {g.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="tp-due" style={labelStyle}>
          Due <span style={{ color: FAINT }}>(optional)</span>
        </label>
        <input id="tp-due" type="date" name="due_at" style={field} />
      </div>

      <div>
        <label htmlFor="tp-instructions" style={labelStyle}>
          A note for the group <span style={{ color: FAINT }}>(optional)</span>
        </label>
        <textarea
          id="tp-instructions"
          name="instructions"
          rows={3}
          placeholder="Read the question twice before you plan."
          style={{ ...field, resize: "vertical", lineHeight: 1.55 }}
        />
      </div>

      {state.error ? (
        <p style={{ fontSize: 13, color: WARM_RED, margin: 0 }}>{state.error}</p>
      ) : null}
      {state.notice ? (
        <p style={{ fontSize: 13, color: WARM_GREEN, margin: 0 }}>{state.notice}</p>
      ) : null}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            flex: 1,
            background: INDIGO_FILL,
            color: ON_INDIGO,
            border: 0,
            borderRadius: 10,
            padding: 11,
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Attaching…" : "Attach"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: "11px 16px",
            fontFamily: SANS,
            fontSize: 14,
            color: INK,
            cursor: "pointer",
          }}
        >
          {state.notice ? "Done" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

export function PracticeModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "var(--tk-scrim)", border: 0 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "relative",
          width: 460,
          maxWidth: "100%",
          maxHeight: "90dvh",
          overflowY: "auto",
          background: PANEL,
          borderRadius: 18,
          padding: "22px 24px",
          boxShadow: "var(--tk-modal-shadow)",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: INK, margin: 0 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              background: WELL,
              border: `1px solid ${LINE}`,
              borderRadius: 9,
              width: 30,
              height: 30,
              flex: "none",
              cursor: "pointer",
              fontSize: 15,
              color: MUTED,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
