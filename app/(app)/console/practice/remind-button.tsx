"use client";

import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import { remindNonSubmitters, type ActionState } from "../center-actions";

/**
 * "Remind the ones who haven't" — §9's row action.
 *
 * IT NAMES THEM BEFORE IT SENDS. A button that fires a message at an unnamed
 * set of people is one a teacher presses once and then stops trusting; seeing
 * "Aziz, Dilnoza and 2 others" first is the difference between a reminder and a
 * broadcast. It also catches the case that matters — a student who left the
 * group last week and should not be chased at all.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const INDIGO = "#4340CB";

export function RemindButton({
  groupId,
  title,
  missing,
  dueAt,
}: {
  groupId: string;
  title: string;
  missing: { id: string; name: string }[];
  dueAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(remindNonSubmitters, {} as ActionState);
  useActionFeedback(state, { keepOpen: true });

  const names =
    missing.length <= 3
      ? missing.map((m) => m.name).join(", ")
      : `${missing
          .slice(0, 2)
          .map((m) => m.name)
          .join(", ")} and ${missing.length - 2} others`;

  if (state.ok) {
    return <span style={{ fontSize: 11.5, color: "#16794C", fontWeight: 600 }}>sent</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Not handed in: ${missing.map((m) => m.name).join(", ")}`}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 11.5,
          color: INDIGO,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        remind {missing.length}
      </button>
    );
  }

  return (
    <form
      action={action}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="due_at" value={dueAt ?? ""} />
      {missing.map((m) => (
        <input key={m.id} type="hidden" name="student_id" value={m.id} />
      ))}
      <span style={{ fontSize: 11.5, color: MUTED, maxWidth: 190 }}>{names}</span>
      <button
        type="submit"
        disabled={pending}
        style={{
          background: INDIGO,
          color: "#fff",
          border: 0,
          borderRadius: 7,
          padding: "4px 9px",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Sending…" : "Send"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 11.5,
          color: INK,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </form>
  );
}
