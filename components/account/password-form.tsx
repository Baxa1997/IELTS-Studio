"use client";

import { useActionState } from "react";

import { changePassword, type PasswordState } from "@/app/(app)/account-actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/account/password";
import { FIELD_LINE, GREEN, INK, MUTED, PANEL, RED_DEEP, WHITE } from "@/lib/theme/tokens";

/**
 * Change (or, for a Google-only account, set) your own password.
 *
 * Styled by its host: the console and the learner app use different type and a
 * different action colour, so the font is inherited and the button takes
 * `accent`. Nothing else here is surface-specific.
 */
export function PasswordForm({
  hasPassword,
  accent,
}: {
  /** False for a Google-only account — there is no current password to ask for. */
  hasPassword: boolean;
  accent: string;
}) {
  const [state, action, pending] = useActionState(changePassword, {} as PasswordState);

  return (
    <form action={action} style={{ display: "grid", gap: 14, maxWidth: 420 }}>
      {hasPassword ? (
        <Field label="Current password">
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            required
            style={inputStyle}
          />
        </Field>
      ) : (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#5c616b" }}>
          You sign in with Google, so this account has no password yet. Setting one lets you also
          sign in with your email address.
        </p>
      )}

      <Field label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
        <input
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Repeat the new password">
        <input
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          style={inputStyle}
        />
      </Field>

      {state.error ? (
        <p role="alert" style={{ ...messageStyle, color: RED_DEEP, background: "#fbefec" }}>
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" style={{ ...messageStyle, color: GREEN, background: "#e8f3ec" }}>
          {state.ok}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          style={{
            height: 42,
            padding: "0 18px",
            border: "none",
            borderRadius: 10,
            background: accent,
            color: WHITE,
            font: "inherit",
            fontSize: 14,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 12.5, color: MUTED }}>{hint}</span> : null}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  height: 42,
  padding: "0 12px",
  border: `1px solid ${FIELD_LINE}`,
  borderRadius: 10,
  background: PANEL,
  font: "inherit",
  fontSize: 14.5,
  color: INK,
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  padding: "9px 12px",
  borderRadius: 9,
  fontSize: 13.5,
  lineHeight: 1.5,
};
