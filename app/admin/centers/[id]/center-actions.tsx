"use client";

import { useActionState, useState } from "react";

import { TONE } from "@/components/admin/ui";

import { setAccountSuspended, type ReviewState } from "../../actions";

/**
 * Suspend a centre, or bring it back.
 *
 * The design puts "Sign in as center" in this slot. That is account
 * impersonation, and it is left out by the owner's decision: doing it safely
 * needs a scoped token, a banner that never lets you forget you are inside
 * someone else's account, and an audit trail — a button that only looks the
 * part would be worse than none. Suspend takes the primary position instead,
 * because it is the one irreversible-feeling thing a platform owner does here.
 *
 * TWO CLICKS, deliberately. Locking out a whole centre from a single press,
 * with no name in front of you, is how the wrong row gets hit. The second press
 * names the centre and the number of people it will affect.
 */
export function CenterActions({
  orgId,
  name,
  suspended,
  memberCount,
}: {
  orgId: string;
  name: string;
  suspended: boolean;
  memberCount: number;
}) {
  const [state, action, pending] = useActionState(setAccountSuspended, {} as ReviewState);
  const [armed, setArmed] = useState(false);

  // Once the write lands the page re-renders with the new status, so the
  // confirm state has to fall away with it.
  const [seen, setSeen] = useState<string | undefined>(undefined);
  if (state.notice && state.notice !== seen) {
    setSeen(state.notice);
    setArmed(false);
  }

  return (
    <form action={action} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="member_count" value={memberCount} />
      <input type="hidden" name="suspend" value={suspended ? "0" : "1"} />
      <input type="hidden" name="label" value={name} />

      {state.error ? (
        <span style={{ fontSize: 12.5, color: TONE.red.ink, maxWidth: 260 }} role="alert">
          {state.error}
        </span>
      ) : null}

      {armed || suspended ? (
        <button
          type="submit"
          disabled={pending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: suspended ? TONE.green.ink : TONE.red.ink,
            color: "#fff",
            border: 0,
            borderRadius: 9,
            padding: "10px 15px",
            fontFamily: "inherit",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {pending
            ? "Working…"
            : suspended
              ? "Restore this center"
              : `Yes — lock out ${memberCount} ${memberCount === 1 ? "person" : "people"}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "#fff",
            color: TONE.red.ink,
            border: `1px solid ${TONE.red.border}`,
            borderRadius: 9,
            padding: "10px 15px",
            fontFamily: "inherit",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" />
            <path d="M10 8v8M14 8v8" />
          </svg>
          Suspend
        </button>
      )}

      {armed && !suspended ? (
        <button
          type="button"
          onClick={() => setArmed(false)}
          style={{
            background: "#F4F3EF",
            border: "1px solid #E4E2DC",
            borderRadius: 9,
            padding: "10px 14px",
            fontFamily: "inherit",
            fontSize: 13,
            cursor: "pointer",
            color: "#16162E",
          }}
        >
          Cancel
        </button>
      ) : null}
    </form>
  );
}
