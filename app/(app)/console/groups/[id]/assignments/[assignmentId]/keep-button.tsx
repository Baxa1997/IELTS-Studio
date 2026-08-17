"use client";

import { useActionState, useState } from "react";

import { saveToLibrary, type LibraryState } from "../../../../practice/library-actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16162E";
const FAINT = "#6E6C87";
const GREEN = "#166C4C";
const RED = "#C24539";
const RULE = "#C5C4BE";

/**
 * "Keep this" — §9's way onto the shelf.
 *
 * HERE, RATHER THAN AT THE MOMENT OF ASSIGNING, on purpose. When a teacher sets
 * practice they have not read the generated prompt yet and cannot judge whether
 * it is worth keeping. On the results page they have seen what the group did
 * with it — which is exactly when "that one worked, use it again" is a real
 * judgement rather than a guess.
 *
 * The tags are asked for at save time and only then. A tagging step in the
 * assign flow would be three fields between a teacher and setting homework, for
 * a benefit that arrives weeks later.
 */
export function KeepButton({
  source,
  defaultTitle,
  inLibrary,
}: {
  source: { kind: "writing_prompt" | "reading_test"; refId: string };
  defaultTitle: string;
  inLibrary: boolean;
}) {
  const [state, action, pending] = useActionState<LibraryState, FormData>(saveToLibrary, {});
  const [open, setOpen] = useState(false);

  if (inLibrary && !state.ok) {
    return (
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: GREEN, fontWeight: 500 }}>
        In the library
      </span>
    );
  }
  if (state.ok) {
    return (
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: GREEN }}>{state.ok}</span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          border: `1px solid ${RULE}`,
          background: "#FFF",
          color: INK,
          borderRadius: 8,
          padding: "6px 13px",
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Keep for reuse
      </button>
    );
  }

  return (
    <form
      action={action}
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 10,
        padding: 12,
        background: "#FFF",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 280,
      }}
    >
      <input type="hidden" name="kind" value={source.kind} />
      <input type="hidden" name="ref_id" value={source.refId} />
      <input
        type="hidden"
        name="skill"
        value={source.kind === "writing_prompt" ? "writing" : "reading"}
      />

      <input
        name="title"
        defaultValue={defaultTitle}
        placeholder="A name you would recognise in a list"
        required
        style={field}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input name="task_type" placeholder="Task type (opinion, discussion…)" style={field} />
        <input name="level" placeholder="Level (Band 5–6, B1…)" style={field} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            border: "none",
            background: INK,
            color: "#FFF",
            borderRadius: 8,
            padding: "6px 14px",
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Saving…" : "Save to library"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            border: "none",
            background: "none",
            color: FAINT,
            fontFamily: SANS,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {state.error ? (
        <div style={{ fontFamily: SANS, fontSize: 12, color: RED }}>{state.error}</div>
      ) : null}
    </form>
  );
}

const field: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "7px 9px",
  border: `1px solid ${RULE}`,
  borderRadius: 7,
  fontFamily: SANS,
  fontSize: 12.5,
  color: INK,
};
