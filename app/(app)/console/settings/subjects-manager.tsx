"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import {
  createSubject,
  renameSubject,
  setSubjectActive,
  type SubjectState,
} from "./subject-actions";

/**
 * The center's subject list.
 *
 * Lives in Settings because it is a description of the business — what we
 * teach — and it changes once a year, not once a week. It sits beside the roles
 * list for the same reason: both answer "how is this center set up".
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#777581";
const LINE = "#C5C4BE";
const INDIGO = "#4340CB";

/** A small fixed palette. Free-form hex in the column, chosen from here in the
 *  UI — so chips stay distinguishable instead of six shades of one blue. */
const COLORS = ["#4340CB", "#1B8A5A", "#C2453A", "#B07B18", "#7A4FBF", "#0F7C8A"];

const field: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export interface SubjectItem {
  id: string;
  name: string;
  color: string | null;
  active: boolean;
  teacherCount: number;
  groupCount: number;
}

export function SubjectsManager({ subjects }: { subjects: SubjectItem[] }) {
  const [state, formAction, pending] = useActionState(createSubject, {} as SubjectState);
  const [color, setColor] = useState(COLORS[0]);
  useActionFeedback(state, { keepOpen: true });

  const live = subjects.filter((s) => s.active);
  const retired = subjects.filter((s) => !s.active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <form
        action={formAction}
        key={state.ok ?? "new"}
        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      >
        <input name="name" placeholder="General English" style={{ ...field, flex: 1, minWidth: 160 }} />
        <input type="hidden" name="color" value={color} />
        <span style={{ display: "flex", gap: 5 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border: color === c ? "2px solid #16162E" : "2px solid transparent",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </span>
        <button
          type="submit"
          disabled={pending}
          style={{
            border: 0,
            borderRadius: 8,
            background: INDIGO,
            color: "#fff",
            padding: "9px 14px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Adding…" : "Add subject"}
        </button>
      </form>

      {state.error ? (
        <p style={{ fontSize: 12.5, color: "#A63A30", margin: 0 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {live.map((s, i) => (
          <SubjectRow key={s.id} subject={s} first={i === 0} />
        ))}
        {live.length === 0 ? (
          <p style={{ fontSize: 13, color: FAINT, margin: "6px 0" }}>
            No subjects yet. Add the first one above.
          </p>
        ) : null}
      </div>

      {retired.length > 0 ? (
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: FAINT,
              margin: "4px 0 2px",
            }}
          >
            Retired
          </p>
          {retired.map((s, i) => (
            <SubjectRow key={s.id} subject={s} first={i === 0} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SubjectRow({ subject, first }: { subject: SubjectItem; first: boolean }) {
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction, renaming] = useActionState(renameSubject, {} as SubjectState);
  const [activeState, activeAction, toggling] = useActionState(setSubjectActive, {} as SubjectState);
  useActionFeedback(renameState, { keepOpen: true });
  useActionFeedback(activeState, { keepOpen: true });

  // Close the rename box once it lands. Adjusted during render, not in an
  // effect — same reason as the console chrome's panels.
  const [seen, setSeen] = useState<string | undefined>(undefined);
  if (renameState.ok && renameState.ok !== seen) {
    setSeen(renameState.ok);
    setEditing(false);
  }

  const used = subject.groupCount > 0 || subject.teacherCount > 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderTop: first ? 0 : `1px solid ${LINE}`,
        opacity: subject.active ? 1 : 0.62,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: subject.color ?? "#9A97B5",
          flex: "none",
        }}
      />

      {editing ? (
        <form action={renameAction} style={{ display: "flex", gap: 6, flex: 1 }}>
          <input type="hidden" name="id" value={subject.id} />
          <input name="name" defaultValue={subject.name} autoFocus style={{ ...field, flex: 1 }} />
          <button
            type="submit"
            disabled={renaming}
            style={{ ...field, cursor: "pointer", fontWeight: 600, color: INDIGO }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={{ ...field, cursor: "pointer", color: MUTED }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{subject.name}</span>
            {/* "0 teachers · 0 groups" beside four real groups reads as a
                broken query, not as an unused feature. A subject nothing is
                attached to says so, and says where to attach it. */}
            <span style={{ display: "block", fontSize: 12, color: FAINT, marginTop: 1 }}>
              {subject.teacherCount === 0 && subject.groupCount === 0 ? (
                <>
                  Not on any group yet —{" "}
                  <Link href="/console/groups" style={{ color: INDIGO, textDecoration: "none" }}>
                    put it on one →
                  </Link>
                </>
              ) : (
                <>
                  {subject.teacherCount} teacher{subject.teacherCount === 1 ? "" : "s"} ·{" "}
                  {subject.groupCount} group{subject.groupCount === 1 ? "" : "s"}
                </>
              )}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              fontFamily: "inherit",
              fontSize: 12.5,
              color: INDIGO,
              cursor: "pointer",
            }}
          >
            Rename
          </button>

          <form action={activeAction}>
            <input type="hidden" name="id" value={subject.id} />
            <input type="hidden" name="active" value={subject.active ? "off" : "on"} />
            <button
              type="submit"
              disabled={toggling}
              title={
                subject.active && !used
                  ? "Nothing uses it yet, so this removes it"
                  : subject.active
                    ? "Existing groups keep it; it stops being offered"
                    : undefined
              }
              style={{
                background: "none",
                border: 0,
                padding: 0,
                fontFamily: "inherit",
                fontSize: 12.5,
                color: subject.active ? "#A63A30" : INDIGO,
                cursor: toggling ? "default" : "pointer",
              }}
            >
              {subject.active ? (used ? "Retire" : "Remove") : "Restore"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
