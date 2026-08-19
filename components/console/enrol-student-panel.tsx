"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { addStudentAccount, type AddStudentState } from "@/app/(app)/console/groups/actions";
import { useConsolePanels } from "@/components/console/console-chrome";
import { useActionFeedback } from "@/components/console/toast";

/**
 * The design's "Enrol a student" slide-over: one form that creates the account
 * AND puts them in a group, so a center admin standing next to a new student
 * never has to open the group first.
 *
 * It posts to the same `addStudentAccount` the group page uses — the group is
 * chosen here rather than implied by the route, and the server still checks
 * that the caller manages it.
 */

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#777581";

const label: React.CSSProperties = {
  fontSize: 12,
  color: MUTED,
  display: "block",
  marginBottom: 5,
};
const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #CFCABC",
  borderRadius: 8,
  padding: "10px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export interface EnrolGroup {
  id: string;
  name: string;
  meta: string;
  students: number;
}

export function EnrolStudentPanel({ groups }: { groups: EnrolGroup[] }) {
  const [state, formAction, pending] = useActionState(addStudentAccount, {} as AddStudentState);
  // Stays open: the generated password is shown once, below.
  useActionFeedback(state, { keepOpen: true });
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const { finish } = useConsolePanels();

  // On success the drawer closes and the banner takes over. It MUST carry the
  // credentials: the password is generated once and never shown again, so
  // closing without them would leave an account nobody can sign into.
  // The ref keeps a re-render from firing this twice for the same student.
  const reported = useRef<string | null>(null);
  useEffect(() => {
    const made = state.created;
    if (!made || reported.current === made.login) return;
    reported.current = made.login;
    finish({
      title: `${made.name} is enrolled`,
      body: made.email
        ? `Sign-in details sent to ${made.email}.`
        : "No email on file — hand these over in person. There's no email reset, so you reset it if it's lost.",
      credentials: { login: made.login, password: made.password },
    });
  }, [state.created, finish]);

  if (groups.length === 0) {
    return (
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
        There are no groups yet, and a student is enrolled into one. Create a group first — then
        this panel can put people straight into it.
      </p>
    );
  }

  return (
    <div>
      {/* key resets the fields after each success, ready for the next student */}
      <form action={formAction} key={state.created?.login ?? "new"}>
        <input type="hidden" name="group_id" value={groupId} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="enrol-name" style={label}>
              Full name
            </label>
            <input
              id="enrol-name"
              name="full_name"
              required
              autoComplete="off"
              placeholder="Malika Abdullaeva"
              style={field}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="enrol-login" style={label}>
                Login
              </label>
              <input
                id="enrol-login"
                name="login"
                required
                autoComplete="off"
                placeholder="malika.a"
                pattern="[A-Za-z0-9][A-Za-z0-9._\-]{1,30}[A-Za-z0-9]"
                style={field}
              />
            </div>
            <div>
              <label htmlFor="enrol-password" style={label}>
                Password
              </label>
              <input
                id="enrol-password"
                name="password"
                autoComplete="off"
                placeholder="Auto-generate"
                minLength={8}
                style={field}
              />
            </div>
          </div>

          <div>
            <label htmlFor="enrol-email" style={label}>
              Contact email <span style={{ color: FAINT }}>(optional)</span>
            </label>
            <input
              id="enrol-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="student@example.com"
              style={field}
            />
          </div>

          {/* THE FIELD THIS FORM ALSO NEVER HAD. There are two ways to create a
              student — this drawer and the panel inside a group — and adding a
              phone to one of them leaves half the roster unidentifiable. The
              phone is what lets a student collect their own login from the
              class invite, so a form that cannot capture it quietly creates
              accounts that have to be handed over by hand. */}
          <div>
            <label htmlFor="enrol-phone" style={label}>
              Phone <span style={{ color: FAINT }}>(optional)</span>
            </label>
            <input
              id="enrol-phone"
              name="phone"
              type="tel"
              autoComplete="off"
              placeholder="+998 90 123 45 67"
              style={field}
            />
          </div>

          <div>
            <span style={{ ...label, marginBottom: 6 }}>Group</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {groups.map((g) => {
                const on = g.id === groupId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGroupId(g.id)}
                    aria-pressed={on}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                      borderRadius: 9,
                      padding: "11px 12px",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      border: `1px solid ${on ? INDIGO : "#C5C4BE"}`,
                      background: on ? "#F5F5FC" : "#fff",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: INK }}>
                        {g.name}
                      </span>
                      <span style={{ display: "block", fontSize: 11.5, color: "#737189" }}>
                        {g.meta}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: on ? INDIGO : "#737189",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.students} enrolled
                    </span>
                  </button>
                );
              })}
            </div>
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
            They sign in with their <strong>login</strong>, never an email — so an address that
            already has a personal account here is fine. Give one and the sign-in details are sent
            there; leave it blank and you hand them over in person. Either way you reset the password
            for them if it&apos;s lost.
          </div>

          {state.error ? (
            <p style={{ fontSize: 12.5, color: "#A63A30", margin: 0 }}>{state.error}</p>
          ) : null}
          {state.warning ? (
            <p style={{ fontSize: 12.5, color: "#B8791F", margin: 0 }}>{state.warning}</p>
          ) : null}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="submit"
              disabled={pending}
              className="cn-btn cn-btn--primary"
              style={{
                flex: 1,
                background: INDIGO,
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
              {pending ? "Enrolling…" : "Enrol student"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
