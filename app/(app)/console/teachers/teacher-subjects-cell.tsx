"use client";

import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import { setTeacherSubjects, type SubjectState } from "../settings/subject-actions";

/**
 * Which subjects this teacher can be given.
 *
 * Editable from the row rather than from a separate screen, because it is a
 * fact ABOUT the teacher and this is the page listing them — and because it is
 * usually set once, right after the account is made.
 *
 * An empty set is shown as "Any", not "None". Nobody having said what someone
 * teaches is not the same as them teaching nothing, and the group form relies
 * on that reading: an unset teacher stays available for every group.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#E4E2DC";
const INDIGO = "#4340CB";

export interface SubjectChoice {
  id: string;
  name: string;
  color: string | null;
}

export function TeacherSubjectsCell({
  teacherId,
  subjects,
  selectedIds,
  canEdit,
}: {
  teacherId: string;
  subjects: SubjectChoice[];
  selectedIds: string[];
  /** Only the owner decides who may teach what. Everyone else reads it. */
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(setTeacherSubjects, {} as SubjectState);
  useActionFeedback(state, { keepOpen: true });

  // Close on success, adjusted during render rather than in an effect.
  const [seen, setSeen] = useState<string | undefined>(undefined);
  if (state.ok && state.ok !== seen) {
    setSeen(state.ok);
    setOpen(false);
  }

  const chosen = subjects.filter((s) => selectedIds.includes(s.id));

  const summary =
    chosen.length === 0 ? (
      <span style={{ color: FAINT }}>Any</span>
    ) : (
      <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {chosen.map((s) => (
          <span
            key={s.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "1px 7px",
              fontSize: 11.5,
              color: MUTED,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: s.color ?? "#9A97B5",
              }}
            />
            {s.name}
          </span>
        ))}
      </span>
    );

  if (!canEdit || subjects.length === 0) return summary;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Choose which subjects this teacher can take"
        style={{
          background: "none",
          border: 0,
          padding: 0,
          font: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        {summary}
      </button>

      {open ? (
        <>
          <span
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40, cursor: "default" }}
          />
          <form
            action={formAction}
            style={{
              position: "absolute",
              left: 0,
              top: "calc(100% + 6px)",
              zIndex: 41,
              width: 220,
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 10,
              boxShadow: "0 14px 40px rgba(20,25,50,.16)",
              padding: 12,
            }}
          >
            <input type="hidden" name="teacher_id" value={teacherId} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
              {subjects.map((s) => (
                <label
                  key={s.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: INK }}
                >
                  <input
                    type="checkbox"
                    name="subject_id"
                    value={s.id}
                    defaultChecked={selectedIds.includes(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            <p style={{ fontSize: 11, color: FAINT, margin: "0 0 9px", lineHeight: 1.4 }}>
              Tick none and they can be put on any group.
            </p>
            {state.error ? (
              <p style={{ fontSize: 12, color: "#A63A30", margin: "0 0 8px" }} role="alert">
                {state.error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 8,
                background: INDIGO,
                color: "#fff",
                padding: "7px 12px",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </form>
        </>
      ) : null}
    </span>
  );
}
