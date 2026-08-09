"use client";

import { useActionState, useState } from "react";

import { addStudentAccount, type AddStudentState } from "@/app/(app)/console/groups/actions";

/**
 * The design's "Enrol a student" slide-over: one form that creates the account
 * AND puts them in a class, so a center admin standing next to a new student
 * never has to open the group first.
 *
 * It posts to the same `addStudentAccount` the group page uses — the group is
 * chosen here rather than implied by the route, and the server still checks
 * that the caller manages it.
 */

const INDIGO = "#4340CB";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";

const label: React.CSSProperties = {
  fontSize: 12,
  color: MUTED,
  display: "block",
  marginBottom: 5,
};
const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E4E2DC",
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
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  async function copy(login: string, password: string) {
    await navigator.clipboard.writeText(`Login: ${login}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (groups.length === 0) {
    return (
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
        There are no classes yet, and a student is enrolled into one. Create a group first — then
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
            <input id="enrol-name" name="full_name" required autoComplete="off" placeholder="Malika Abdullaeva" style={field} />
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
              Email <span style={{ color: FAINT }}>(optional — we send the login details)</span>
            </label>
            <input id="enrol-email" name="email" type="email" autoComplete="off" placeholder="student@example.com" style={field} />
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
                      border: `1px solid ${on ? INDIGO : "#E4E2DC"}`,
                      background: on ? "#F5F5FC" : "#fff",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: INK }}>
                        {g.name}
                      </span>
                      <span style={{ display: "block", fontSize: 11.5, color: "#7C7A93" }}>
                        {g.meta}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: on ? INDIGO : "#7C7A93",
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

          <div style={{ background: "#F7F6F2", borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
            Give an email and the sign-in details are sent there. Leave it blank and the student
            gets an address that can&apos;t receive mail — you hand the login over in class, and
            you reset it for them if it&apos;s lost.
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
              className="crm-btn-primary"
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

      {state.created ? (
        <div
          style={{
            marginTop: 16,
            border: "1px solid #CFE6D9",
            background: "#EAF4EE",
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#16794C" }}>
            {state.created.name} is enrolled
          </div>
          <div style={{ fontSize: 12.5, color: "#16794C", marginTop: 6, lineHeight: 1.6 }}>
            Login <strong>{state.created.login}</strong>
            <br />
            Password <strong>{state.created.password}</strong>
            <br />
            {state.created.email
              ? `Sent to ${state.created.email}`
              : "No email — hand these over in class."}
          </div>
          <button
            type="button"
            onClick={() => copy(state.created!.login, state.created!.password)}
            style={{
              marginTop: 10,
              background: "#fff",
              border: "1px solid #CFE6D9",
              borderRadius: 7,
              padding: "6px 11px",
              fontFamily: "inherit",
              fontSize: 12,
              color: "#16794C",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy credentials"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
