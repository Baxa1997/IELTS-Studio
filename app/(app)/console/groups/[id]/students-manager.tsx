"use client";

import { useActionState, useState } from "react";

import {
  type GroupFormState,
  removeMember,
  resetStudentPassword,
  type ResetPasswordState,
} from "../actions";

/**
 * The class list, as a list.
 *
 * WHAT THIS REPLACED, AND WHY. The Manage tab used to open with two forms —
 * "Add a student" and "Add a whole class" — both permanently expanded, both
 * asking for a login and a password, and neither showing who was already in the
 * class. The page answered "how do I add someone" three times and "who is in
 * this class" not at all, which is the wrong way round: the roster is the thing
 * you came to look at, and adding is an occasional action on it.
 *
 * So: the students are the page, and the two ways of adding are buttons above
 * them.
 *
 * EVERY STUDENT HAS AN ACCOUNT, AND THAT IS NOT OPTIONAL. Homework on this
 * platform IS the account — an essay, its band and its feedback all hang off a
 * student id, and there is no version of "hand work in" that works without one.
 * What IS optional is the teacher ever thinking about it: the login is built
 * from the name and the password is generated, so adding a student is typing a
 * name. This column exists so the credentials can be read back out later, and
 * the reset beside it exists because a center student's address is synthetic —
 * they cannot reset their own password by email, so their teacher does it here.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#EAE8E1";
const GREEN = "#16794C";
const RED = "#B3261E";

export interface StudentRow {
  id: string;
  name: string;
  login: string | null;
  contactEmail: string | null;
  joinedAt: string;
  photoUrl: string | null;
}

export function StudentsManager({
  groupId,
  students,
}: {
  groupId: string;
  students: StudentRow[];
}) {
  if (students.length === 0) {
    return (
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
        Nobody in this class yet. Add them one at a time, or upload the register you already have —
        logins and passwords are made for you.
      </p>
    );
  }

  return (
    <div>
      {students.map((s, i) => (
        <StudentLine key={s.id} groupId={groupId} student={s} first={i === 0} />
      ))}
    </div>
  );
}

function StudentLine({
  groupId,
  student,
  first,
}: {
  groupId: string;
  student: StudentRow;
  first: boolean;
}) {
  const [reset, resetAction, resetting] = useActionState(
    resetStudentPassword,
    {} as ResetPasswordState,
  );
  // `removeMember` takes (prevState, formData), so it has to be driven through
  // useActionState — passed straight to `<form action>` it would receive the
  // FormData as its first argument and silently do nothing.
  const [removal, removeAction, removing] = useActionState(removeMember, {} as GroupFormState);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ borderTop: first ? "none" : `1px solid ${LINE}`, padding: "11px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Avatar name={student.name} photoUrl={student.photoUrl} />

        <div style={{ minWidth: 160, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{student.name}</div>
          <div style={{ fontSize: 11.5, color: FAINT, marginTop: 1 }}>
            {student.login ? (
              <code style={{ fontFamily: "ui-monospace, monospace" }}>{student.login}</code>
            ) : (
              "no login"
            )}
            {student.contactEmail ? ` · ${student.contactEmail}` : " · no email"}
          </div>
        </div>

        <span style={{ fontSize: 12, color: FAINT, whiteSpace: "nowrap" }}>
          joined {new Date(student.joinedAt).toLocaleDateString()}
        </span>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <a href={`/console/groups/${groupId}/students/${student.id}`} style={linkStyle}>
            Report
          </a>

          <form action={resetAction}>
            <input type="hidden" name="group_id" value={groupId} />
            <input type="hidden" name="student_id" value={student.id} />
            <button type="submit" disabled={resetting} style={quietStyle}>
              {resetting ? "Resetting…" : "Reset password"}
            </button>
          </form>

          {/* Two clicks, because the roster is where a mis-click costs someone
              their place in the class. The account and its work survive. */}
          {confirming ? (
            <form action={removeAction} style={{ display: "flex", gap: 6 }}>
              <input type="hidden" name="group_id" value={groupId} />
              <input type="hidden" name="student_id" value={student.id} />
              <button
                type="submit"
                disabled={removing}
                style={{ ...quietStyle, color: RED, borderColor: "#F2C9C4" }}
              >
                {removing ? "Removing…" : "Really remove"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} style={quietStyle}>
                Cancel
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} style={quietStyle}>
              Remove
            </button>
          )}
        </div>
      </div>

      {removal.error ? (
        <p style={{ fontSize: 12, color: RED, margin: "6px 0 0" }} role="alert">
          {removal.error}
        </p>
      ) : null}

      {reset.error ? (
        <p style={{ fontSize: 12, color: RED, margin: "6px 0 0" }} role="alert">
          {reset.error}
        </p>
      ) : null}

      {reset.done ? (
        <div
          style={{
            marginTop: 8,
            padding: "9px 11px",
            borderRadius: 8,
            border: "1px solid #BFE3D0",
            background: "#F2FAF6",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12.5, color: INK }}>
            New password for {reset.done.name} — it isn&apos;t shown again:
          </span>
          <code
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 12.5,
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 6,
              padding: "3px 7px",
            }}
          >
            {reset.done.password}
          </code>
          <button
            type="button"
            onClick={() => copy(`Login: ${reset.done!.login}\nPassword: ${reset.done!.password}`)}
            style={{ ...quietStyle, color: GREEN }}
          >
            {copied ? "Copied" : "Copy both"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return photoUrl ? (
    // A signed, expiring Storage URL: next/image would proxy and cache a link
    // that has expired by the time it's fetched, so this stays a plain <img>.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt=""
      width={30}
      height={30}
      style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }}
    />
  ) : (
    <span
      aria-hidden
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "#EDEBFB",
        color: "#4340CB",
        fontSize: 11.5,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initials || "?"}
    </span>
  );
}

const quietStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 7,
  padding: "4px 9px",
  fontSize: 12,
  fontFamily: "inherit",
  color: MUTED,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const linkStyle: React.CSSProperties = {
  ...quietStyle,
  color: "#4340CB",
  textDecoration: "none",
  display: "inline-block",
};
