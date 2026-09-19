"use client";

import { useActionState } from "react";

import { saveProfileDetails, type SettingsState } from "../actions";

import { buttonStyle, fieldStyle, labelStyle, Message } from "./form-ui";
import { MUTED } from "@/lib/theme/tokens";

/** Name and phone. The email is shown, not edited — it is how they sign in. */
export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string | null;
}) {
  const [state, action, pending] = useActionState(saveProfileDetails, {} as SettingsState);

  return (
    <form action={action} style={{ display: "grid", gap: 14, maxWidth: 440 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>Name</span>
        <input
          name="full_name"
          defaultValue={fullName}
          maxLength={80}
          required
          style={fieldStyle}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>Phone (optional)</span>
        <input
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
          style={fieldStyle}
        />
      </label>

      <div style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>Email</span>
        <div
          style={{ ...fieldStyle, display: "flex", alignItems: "center", background: "#F6F6F4" }}
        >
          {email ?? "—"}
        </div>
        <span style={{ fontSize: 12.5, color: MUTED }}>
          This is how you sign in, so it can&apos;t be changed here.
        </span>
      </div>

      <Message state={state} />

      <div>
        <button type="submit" disabled={pending} style={buttonStyle(pending)}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
