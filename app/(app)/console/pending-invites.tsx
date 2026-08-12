"use client";

import { useActionState, useState } from "react";

import { FAINT, INDIGO, LINE, MUTED, SANS, TINT } from "@/components/console/page-ui";

import {
  refreshInvite,
  revokeInvite,
  type GroupFormState,
  type InviteFormState,
} from "./groups/actions";

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

/**
 * The pending-invite list, with the two actions that were missing: revoke (the
 * link dies now) and a fresh link (new token, another 7 days).
 *
 * "Pending" here is whatever `v_pending_invites` returned — unaccepted AND
 * unexpired. The page must not re-derive it.
 */
export function PendingInvites({ invites }: { invites: PendingInvite[] }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {invites.map((invite, i) => (
        <InviteRow key={invite.id} invite={invite} first={i === 0} />
      ))}
    </ul>
  );
}

function InviteRow({ invite, first }: { invite: PendingInvite; first: boolean }) {
  const [refreshState, refreshAction, refreshing] = useActionState(
    refreshInvite,
    {} as InviteFormState,
  );
  const [revokeState, revokeAction, revoking] = useActionState(revokeInvite, {} as GroupFormState);
  const [copied, setCopied] = useState(false);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const error = refreshState.error ?? revokeState.error;

  return (
    <li
      style={{
        padding: "11px 0",
        borderTop: first ? "none" : `1px solid ${LINE}`,
        fontFamily: SANS,
        fontSize: 14.5,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}
      >
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {invite.email}
          </span>
          <span style={{ display: "block", fontSize: 12.5, color: FAINT, marginTop: 2 }}>
            {invite.role === "teacher" ? "Teacher" : "Student"} · expires{" "}
            {new Date(invite.expiresAt).toLocaleDateString()}
          </span>
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
          <form action={refreshAction}>
            <input type="hidden" name="invite_id" value={invite.id} />
            <ActionButton pending={refreshing} label="New link" busyLabel="Renewing…" />
          </form>
          <form action={revokeAction}>
            <input type="hidden" name="invite_id" value={invite.id} />
            <ActionButton pending={revoking} label="Revoke" busyLabel="Revoking…" danger />
          </form>
        </span>
      </div>

      {refreshState.inviteUrl ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            background: TINT,
            borderRadius: 10,
            padding: "8px 10px",
          }}
        >
          <code
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              color: MUTED,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {refreshState.inviteUrl}
          </code>
          <button
            type="button"
            onClick={() => copy(refreshState.inviteUrl!)}
            style={{
              flex: "none",
              border: `1px solid ${INDIGO}`,
              background: "transparent",
              color: INDIGO,
              borderRadius: 8,
              padding: "4px 10px",
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p style={{ marginTop: 6, fontSize: 12.5, color: "#b91c1c" }} role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function ActionButton({
  pending,
  label,
  busyLabel,
  danger = false,
}: {
  pending: boolean;
  label: string;
  busyLabel: string;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        border: `1px solid ${danger ? "#F0D2D2" : LINE}`,
        background: "#fff",
        color: danger ? "#b91c1c" : MUTED,
        borderRadius: 9,
        padding: "5px 11px",
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? busyLabel : label}
    </button>
  );
}
