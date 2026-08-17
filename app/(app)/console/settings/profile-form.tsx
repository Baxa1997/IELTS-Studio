"use client";

import { useActionState } from "react";

import { saveCenterProfile, type ActionState } from "../center-actions";

const GREEN = "#16794C";
const INK = "#16162E";
const MUTED = "#6E6C87";

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
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};
const readOnly: React.CSSProperties = { ...field, background: "#F7F6F2", color: "#737189" };

/**
 * The center's own profile. Only the name is editable, and that is a database
 * fact rather than a UI choice: column-level grants make `status` and `plan`
 * unwritable by any client, so they are shown as what they are — read-only.
 */
export function CenterProfileForm({
  name,
  status,
  plan,
  contactEmail,
}: {
  name: string;
  status: string;
  plan: string;
  contactEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveCenterProfile, {} as ActionState);

  return (
    <form action={formAction}>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="center-name" style={label}>
          Center name
        </label>
        <input
          id="center-name"
          name="name"
          defaultValue={name}
          required
          minLength={2}
          style={field}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="center-email" style={label}>
          Contact email
        </label>
        <input id="center-email" defaultValue={contactEmail ?? "—"} readOnly style={readOnly} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <span style={label}>Status</span>
          <input value={status} readOnly style={readOnly} />
        </div>
        <div>
          <span style={label}>Plan</span>
          <input value={plan} readOnly style={readOnly} />
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: "#777581", margin: "0 0 14px", lineHeight: 1.55 }}>
        Status and plan aren&apos;t editable here by design — they&apos;re not writable by any
        client at all, only by the platform. That&apos;s what stops a center approving or upgrading
        itself.
      </p>

      {state.error ? (
        <p style={{ fontSize: 12.5, color: "#A63A30", margin: "0 0 10px" }}>{state.error}</p>
      ) : null}
      {state.ok ? (
        <p style={{ fontSize: 12.5, color: GREEN, margin: "0 0 10px" }}>{state.ok}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="cn-btn cn-btn--green"
        style={{
          background: GREEN,
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
