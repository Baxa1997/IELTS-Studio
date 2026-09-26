"use client";

import { useActionState, useState } from "react";

import { DELETE_CONFIRMATION } from "@/lib/account/deletion-rules";

import { deleteMyAccount, type SettingsState } from "../../actions";

import { buttonStyle, fieldStyle, labelStyle, Message } from "./form-ui";

/**
 * The button stays disabled until the word is typed exactly. The server checks
 * the same word again — this only saves a round trip, it is not the lock.
 */
export function DeleteForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(deleteMyAccount, {} as SettingsState);
  const [typed, setTyped] = useState("");
  const ready = typed.trim() === DELETE_CONFIRMATION;

  return (
    <form action={action} style={{ display: "grid", gap: 14, maxWidth: 440 }}>
      {hasPassword ? (
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Your password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={fieldStyle}
          />
        </label>
      ) : null}

      <label style={{ display: "grid", gap: 6 }}>
        <span style={labelStyle}>
          Type <strong>{DELETE_CONFIRMATION}</strong> to confirm
        </span>
        <input
          name="confirmation"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          style={fieldStyle}
        />
      </label>

      <Message state={state} />

      <div>
        <button
          type="submit"
          disabled={pending || !ready}
          style={buttonStyle(pending || !ready, "danger")}
        >
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </form>
  );
}
