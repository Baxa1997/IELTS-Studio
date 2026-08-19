"use client";

import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import { inviteGroupToTelegram, type GroupInviteState } from "../actions";

/**
 * Getting a whole class signed in, in one action.
 *
 * THE PROBLEM THIS SOLVES. A teacher imports thirty students from a
 * spreadsheet: thirty accounts now exist and not one of them can sign in.
 * Handing out thirty passwords is the bottleneck that makes the import
 * pointless, and the per-student codes built first do not scale to a room.
 *
 * So: one message in the class channel. Each student taps it, confirms their
 * phone, and gets their own login privately. The teacher does nothing else.
 *
 * Nothing secret is in that message. The code names a CLASS — it lets the
 * holder ask the bot "who am I?", and the bot answers only if the phone
 * Telegram reports matches somebody on that roster. The student's own phone is
 * the secret, and the code neither contains nor reveals it.
 */
export function InviteClassPanel({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(inviteGroupToTelegram, {} as GroupInviteState);
  const [copied, setCopied] = useState(false);
  useActionFeedback(state, { keepOpen: true });

  return (
    <section style={card}>
      <h3 style={heading}>Get the class signed in</h3>
      <p style={note}>
        Posts one message to the class Telegram channel. Each student taps it, confirms their
        phone number, and receives their own login privately — no passwords in the channel, and
        nothing for you to hand out.
      </p>
      <p style={{ ...note, marginTop: -4 }}>
        <b>Their phone number must be on the roster</b> — that is how they are identified. The
        student import reads a phone column.
      </p>

      <form action={action}>
        <input type="hidden" name="group_id" value={groupId} />
        <button type="submit" disabled={pending} style={button}>
          {pending ? "Sending…" : "Invite the class"}
        </button>
      </form>

      {state.url ? (
        <div style={{ marginTop: 12 }}>
          {!state.posted ? (
            <p style={{ ...note, margin: "0 0 8px" }}>
              This class has no Telegram channel connected, so nothing was posted. Send this to
              them yourself, or connect a channel first.
            </p>
          ) : null}
          <div style={linkBox}>{state.url}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={ghost}
              onClick={() => {
                void navigator.clipboard?.writeText(state.url as string);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <span style={{ alignSelf: "center", fontSize: 12.5, color: "#5C5A70" }}>
              or code <b>{state.code}</b>
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2E0DA",
  borderRadius: 14,
  padding: "16px 18px",
};
const heading: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 650, color: "#15171C" };
const note: React.CSSProperties = {
  margin: "8px 0 12px",
  fontSize: 13.5,
  lineHeight: 1.5,
  color: "#5C5A70",
};
const button: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 999,
  border: 0,
  background: "#15171C",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const ghost: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #E2E0DA",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const linkBox: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#F6F5F1",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12.5,
  wordBreak: "break-all",
  color: "#15171C",
};
