"use client";

import { useActionState } from "react";

import { issueCertificate, type ActionState } from "../center-actions";

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";

const label: React.CSSProperties = { fontSize: 12, color: MUTED, display: "block", marginBottom: 5 };
const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #CFCABC",
  borderRadius: 8,
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

/** Issue a certificate: who, which course, and the band it records. */
export function IssueCertificateForm({
  students,
}: {
  students: { id: string; name: string; group: string }[];
}) {
  const [state, formAction, pending] = useActionState(issueCertificate, {} as ActionState);

  if (students.length === 0) {
    return (
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>
        No students yet. A certificate names a person and a course, so there is nobody to issue one
        to.
      </p>
    );
  }

  return (
    <form action={formAction} key={state.ok ?? "new"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label htmlFor="cert-student" style={label}>
            Student
          </label>
          <select id="cert-student" name="student_id" required style={field}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.group ? ` — ${s.group}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr", gap: 12 }}>
          <div>
            <label htmlFor="cert-course" style={label}>
              Course
            </label>
            <input
              id="cert-course"
              name="course"
              required
              placeholder="IELTS Intensive"
              style={field}
            />
          </div>
          <div>
            <label htmlFor="cert-band" style={label}>
              Band <span style={{ color: "#93919F" }}>(optional)</span>
            </label>
            <input
              id="cert-band"
              name="band"
              type="number"
              min="0"
              max="9"
              step="0.5"
              placeholder="7.0"
              style={field}
            />
          </div>
        </div>

        {state.error ? (
          <p style={{ fontSize: 12.5, color: "#A63A30", margin: 0 }}>{state.error}</p>
        ) : null}
        {state.ok ? <p style={{ fontSize: 12.5, color: "#16794C", margin: 0 }}>{state.ok}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="cn-btn cn-btn--primary"
          style={{
            background: INDIGO,
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "10px 15px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Issuing…" : "Issue certificate"}
        </button>
      </div>
    </form>
  );
}
