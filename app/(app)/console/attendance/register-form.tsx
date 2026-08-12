"use client";

import { useActionState, useState } from "react";

import { saveRegister, type ActionState } from "../center-actions";

/**
 * The register itself: one row per student, three states, saved in a single
 * post. Client-side only for the toggle — the marks ride the form, so nothing
 * is written until the register is saved and a half-marked class can be
 * abandoned without leaving rows behind.
 */

const GREEN = "#16794C";
const AMBER = "#B8791F";
const RED = "#A63A30";
const INK = "#16162E";

type Status = "present" | "late" | "absent";

const OPTIONS: { value: Status; label: string; ink: string; bg: string }[] = [
  { value: "present", label: "Present", ink: GREEN, bg: "#EAF4EE" },
  { value: "late", label: "Late", ink: AMBER, bg: "#FDF2E3" },
  { value: "absent", label: "Absent", ink: RED, bg: "#FBEAE8" },
];

export interface RegisterStudent {
  id: string;
  name: string;
  meta: string;
  initials: string;
  tint: string;
  ink: string;
}

export function RegisterForm({
  groupId,
  heldOn,
  students,
  initial,
}: {
  groupId: string;
  heldOn: string;
  students: RegisterStudent[];
  /** Marks already saved for this date, so re-opening shows what was recorded. */
  initial: Record<string, Status>;
}) {
  const [state, formAction, pending] = useActionState(saveRegister, {} as ActionState);
  // Everyone starts present: a register is faster to correct than to fill in.
  const [marks, setMarks] = useState<Record<string, Status>>(() =>
    Object.fromEntries(students.map((s) => [s.id, initial[s.id] ?? "present"])),
  );

  const counts = students.reduce(
    (acc, s) => {
      acc[marks[s.id] ?? "present"] += 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 } as Record<Status, number>,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="held_on" value={heldOn} />
      {students.map((s) => (
        <input key={s.id} type="hidden" name={`mark:${s.id}`} value={marks[s.id] ?? "present"} />
      ))}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "16px 18px",
          borderBottom: "1px solid #F0EEE9",
        }}
      >
        <div style={{ fontSize: 12.5, color: "#7C7A93" }}>
          {counts.present} present · {counts.late} late · {counts.absent} absent
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() =>
              setMarks(Object.fromEntries(students.map((s) => [s.id, "present" as Status])))
            }
            className="cn-btn cn-btn--ghost"
            style={{
              background: "#F4F3EF",
              border: "1px solid #E4E2DC",
              borderRadius: 8,
              padding: "8px 12px",
              fontFamily: "inherit",
              fontSize: 12.5,
              cursor: "pointer",
              color: INK,
            }}
          >
            All present
          </button>
          <button
            type="submit"
            disabled={pending || students.length === 0}
            className="cn-btn cn-btn--green"
            style={{
              background: GREEN,
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "8px 14px",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: pending ? "wait" : "pointer",
              opacity: pending || students.length === 0 ? 0.6 : 1,
            }}
          >
            {pending ? "Saving…" : "Save register"}
          </button>
        </div>
      </div>

      {state.error ? (
        <p style={{ margin: 0, padding: "10px 18px", fontSize: 12.5, color: RED }}>{state.error}</p>
      ) : null}
      {state.ok ? (
        <p style={{ margin: 0, padding: "10px 18px", fontSize: 12.5, color: GREEN }}>{state.ok}</p>
      ) : null}

      {students.map((s) => {
        const value = marks[s.id] ?? "present";
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "11px 18px",
              borderBottom: "1px solid #F5F4F0",
              flexWrap: "wrap",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 30,
                height: 30,
                flex: "0 0 30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                background: s.tint,
                color: s.ink,
              }}
            >
              {s.initials}
            </span>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "#93919F" }}>{s.meta}</div>
            </div>
            <div
              style={{ display: "flex", gap: 6 }}
              role="group"
              aria-label={`Attendance for ${s.name}`}
            >
              {OPTIONS.map((o) => {
                const on = value === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMarks((m) => ({ ...m, [s.id]: o.value }))}
                    style={{
                      borderRadius: 7,
                      padding: "6px 13px",
                      fontFamily: "inherit",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      border: `1px solid ${on ? o.ink : "#E4E2DC"}`,
                      background: on ? o.bg : "#fff",
                      color: on ? o.ink : "#6E6C87",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {students.length === 0 ? (
        <div style={{ padding: 18, fontSize: 13, color: "#93919F" }}>
          This class has no students yet, so there is nobody to mark.
        </div>
      ) : null}
    </form>
  );
}
