"use client";

import { useActionState } from "react";

import { archivePractice, restorePractice, type PracticeFormState } from "./actions";

const MUTED = "#5A6076";
const LINE = "#ECEAF2";
const SANS = "var(--font-hanken), system-ui, sans-serif";

const empty: PracticeFormState = {};

/**
 * Archive / restore, inline on the row. There is no preview button because
 * there is no preview page any more: "Open" goes to the real runner, which is
 * how a teacher sees exactly what the group will see.
 */
export function PracticeRowActions({
  promptId,
  archived,
}: {
  promptId: string;
  archived: boolean;
}) {
  const [archiveState, archive, archiving] = useActionState(archivePractice, empty);
  const [restoreState, restore, restoring] = useActionState(restorePractice, empty);
  const error = archiveState.error ?? restoreState.error;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
      {error ? (
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: "#b91c1c" }} role="alert">
          {error}
        </span>
      ) : null}
      <form action={archived ? restore : archive}>
        <input type="hidden" name="prompt_id" value={promptId} />
        <button
          type="submit"
          disabled={archiving || restoring}
          style={{
            border: `1px solid ${LINE}`,
            background: "#fff",
            color: MUTED,
            borderRadius: 9,
            padding: "5px 11px",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            cursor: archiving || restoring ? "default" : "pointer",
          }}
        >
          {archived ? (restoring ? "Restoring…" : "Restore") : archiving ? "Archiving…" : "Archive"}
        </button>
      </form>
    </span>
  );
}
