"use client";

import { useActionState } from "react";

import { startTelegramLink, unlinkTelegram, type ActionState } from "../../center-actions";

const INDIGO = "#4340CB";
const GREEN = "#16794C";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";

/**
 * Connect this class to a Telegram channel.
 *
 * The flow is a handshake rather than a "paste your chat id" box, and that is a
 * security decision, not a UX one: Telegram chat ids are not secret, so a typed
 * id would let anyone who knew one point their class at somebody else's
 * channel. Posting the code inside the channel proves the person doing it can
 * post there.
 */
export function TelegramPanel({
  groupId,
  linked,
  botUsername,
}: {
  groupId: string;
  /** The channel already connected, if the handshake has completed. */
  linked: { chatTitle: string | null } | null;
  /** e.g. "EngProgressBot" — what they search for in Telegram. */
  botUsername: string | null;
}) {
  const [startState, startAction, starting] = useActionState(startTelegramLink, {} as ActionState);
  const [unlinkState, unlinkAction, unlinking] = useActionState(unlinkTelegram, {} as ActionState);

  if (!botUsername) {
    return (
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>
        Telegram isn&apos;t set up on this platform yet. Once the bot is configured, you&apos;ll be
        able to connect each class to its own channel here.
      </p>
    );
  }

  if (linked) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#EAF4EE",
            border: "1px solid #CFE6D9",
            borderRadius: 10,
            padding: "12px 14px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: GREEN }}>
            Connected{linked.chatTitle ? ` — ${linked.chatTitle}` : ""}
          </span>
          <span style={{ fontSize: 12.5, color: GREEN, marginLeft: "auto" }}>
            New practice is announced there.
          </span>
        </div>
        <form action={unlinkAction} style={{ marginTop: 12 }}>
          <input type="hidden" name="group_id" value={groupId} />
          <button
            type="submit"
            disabled={unlinking}
            style={{
              background: "#fff",
              border: "1px solid #E4E2DC",
              borderRadius: 8,
              padding: "8px 13px",
              fontFamily: "inherit",
              fontSize: 12.5,
              color: INK,
              cursor: unlinking ? "wait" : "pointer",
            }}
          >
            {unlinking ? "Disconnecting…" : "Disconnect"}
          </button>
          {unlinkState.error ? (
            <p style={{ fontSize: 12.5, color: "#A63A30", margin: "8px 0 0" }}>
              {unlinkState.error}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  const code = startState.ok;

  return (
    <div>
      {code ? (
        <div
          style={{
            background: "#F7F6F2",
            border: "1px solid #E4E2DC",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>
            <strong style={{ color: INK }}>1.</strong> Add{" "}
            <strong style={{ color: INK }}>@{botUsername}</strong> to your class channel as an
            administrator.
            <br />
            <strong style={{ color: INK }}>2.</strong> Post this in the channel:
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 16,
              color: INDIGO,
              background: "#fff",
              border: "1px solid #E4E2DC",
              borderRadius: 8,
              padding: "10px 12px",
              margin: "10px 0",
              userSelect: "all",
            }}
          >
            /link {code}
          </div>
          <div style={{ fontSize: 11.5, color: FAINT, lineHeight: 1.55 }}>
            The bot replies in the channel once it&apos;s connected — reload this page to see it.
            The code lasts 15 minutes.
          </div>
        </div>
      ) : null}

      <form action={startAction} style={{ marginTop: code ? 12 : 0 }}>
        <input type="hidden" name="group_id" value={groupId} />
        <button
          type="submit"
          disabled={starting}
          className="cn-btn cn-btn--primary"
          style={{
            background: INDIGO,
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "10px 15px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: starting ? "wait" : "pointer",
          }}
        >
          {starting ? "Preparing…" : code ? "New code" : "Connect Telegram"}
        </button>
        {startState.error ? (
          <p style={{ fontSize: 12.5, color: "#A63A30", margin: "8px 0 0" }}>{startState.error}</p>
        ) : null}
      </form>

      <p style={{ fontSize: 11.5, color: FAINT, margin: "12px 0 0", lineHeight: 1.55 }}>
        Posts say a new practice exists and link to it — never a student&apos;s name, band or score.
        Anyone in the channel can read it.
      </p>
    </div>
  );
}
