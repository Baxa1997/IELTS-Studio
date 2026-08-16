"use client";

import { useActionState, useEffect, useRef } from "react";

import { useConsolePanels } from "@/components/console/console-chrome";

import { addTeacherAccount, type AddStudentState } from "../groups/actions";
import { useActionFeedback } from "@/components/console/toast";

/**
 * Create a teacher account on the spot — name, login, password. Email is
 * optional; supply one and the credentials are sent, leave it out and you hand
 * them over in person. Mirrors how teachers create students, because a center
 * admin standing next to a new teacher shouldn't have to wait on an invite email.
 *
 * Written for the 460px slide-over it lives in. It used to be the shared
 * shadcn kit laid out with `flex-wrap`, which is why the fields broke into
 * uneven rows once the drawer narrowed them — a two-column grid can't wrap into
 * a mess, and every field is full-width inside its column.
 */

const GREEN = "#16794C";
const RED = "#A63A30";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: MUTED,
  display: "block",
  marginBottom: 5,
};
const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #CFCABC",
  borderRadius: 8,
  padding: "10px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export function AddTeacherPanel({ onDone }: { onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(addTeacherAccount, {} as AddStudentState);
  // Stays open: the generated password is shown once, below.
  useActionFeedback(state, { keepOpen: true });
  const { finish } = useConsolePanels();

  // Same one-time-password rule as enrolling a student: close the drawer, but
  // only by handing the credentials to the banner.
  const reported = useRef<string | null>(null);
  useEffect(() => {
    const made = state.created;
    if (!made || reported.current === made.login) return;
    reported.current = made.login;
    finish({
      title: `${made.name} can sign in now`,
      body:
        state.emailNote ??
        (made.email
          ? `Sign-in details sent to ${made.email}.`
          : "No email on file, so this login is the only way in — and there's no email reset. Hand it over in person or by Telegram."),
      credentials: { login: made.login, password: made.password },
    });
  }, [state.created, state.emailNote, finish]);

  return (
    <div>
      {/* key resets the fields after each successful add, ready for the next */}
      <form action={formAction} key={state.created?.login ?? "new"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="teacher-name" style={labelStyle}>
              Full name
            </label>
            <input
              id="teacher-name"
              name="full_name"
              required
              autoComplete="off"
              placeholder="Dilnoza Tashmatova"
              style={fieldStyle}
            />
          </div>

          {/* Both staff roles are created the same way — they differ only in
              what they can reach, and the owner is standing next to whichever
              one they just hired. Without this the administrator role existed
              in the database and could be given to nobody. */}
          <div>
            <label htmlFor="teacher-role" style={labelStyle}>
              Role
            </label>
            <select id="teacher-role" name="staff_role" defaultValue="teacher" style={fieldStyle}>
              <option value="teacher">Teacher — their own groups</option>
              <option value="administrator">
                Administrator — classes, students and the front desk
              </option>
            </select>
            <p style={{ fontSize: 11.5, color: FAINT, margin: "5px 0 0", lineHeight: 1.45 }}>
              An administrator runs the center day to day and can take tuition, but never sees
              payroll, the ledger or billing.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="teacher-login" style={labelStyle}>
                Login
              </label>
              <input
                id="teacher-login"
                name="login"
                required
                autoComplete="off"
                placeholder="dilnoza.t"
                pattern="[A-Za-z0-9][A-Za-z0-9._\-]{1,30}[A-Za-z0-9]"
                title="3–32 characters: letters, digits, and . _ - in the middle"
                style={fieldStyle}
              />
            </div>
            <div>
              <label htmlFor="teacher-password" style={labelStyle}>
                Password
              </label>
              <input
                id="teacher-password"
                name="password"
                autoComplete="off"
                placeholder="Auto-generate"
                minLength={8}
                style={fieldStyle}
              />
            </div>
          </div>

          <div>
            <label htmlFor="teacher-email" style={labelStyle}>
              Contact email <span style={{ color: FAINT }}>(optional)</span>
            </label>
            <input
              id="teacher-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="teacher@example.com"
              style={fieldStyle}
            />
          </div>

          <div
            style={{
              background: "#F7F6F2",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 12.5,
              color: MUTED,
              lineHeight: 1.5,
            }}
          >
            They sign in with their <strong>login</strong>, not an email — so a contact address that
            already has a personal account on the platform is fine here. It&apos;s only where we
            send their sign-in details. A teacher runs their own classes and sees only the students
            in them.
          </div>

          {state.error ? (
            <p style={{ fontSize: 12.5, color: RED, margin: 0 }} role="alert">
              {state.error}
            </p>
          ) : null}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="submit"
              disabled={pending}
              className="cn-btn cn-btn--green"
              style={{
                flex: 1,
                background: GREEN,
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: 11,
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: pending ? "wait" : "pointer",
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? "Creating…" : "Add teacher"}
            </button>
            {onDone ? (
              <button
                type="button"
                onClick={onDone}
                style={{
                  background: "#F4F3EF",
                  border: "1px solid #E4E2DC",
                  borderRadius: 8,
                  padding: "11px 16px",
                  fontFamily: "inherit",
                  fontSize: 13.5,
                  color: INK,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
