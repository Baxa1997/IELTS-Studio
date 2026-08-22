"use client";

import { useState, useTransition } from "react";

import { connectMyTelegram, disconnectMyTelegram, type StaffLinkState } from "./telegram-actions";

/**
 * Putting the assistant on your phone.
 *
 * THE CODE IS THE CREDENTIAL, and it is worded to say so. Whoever types it
 * becomes this person on Telegram — their centre, their role — so it lives
 * fifteen minutes, works once, and can be revoked here. That is a different
 * thing from the class invite, which merely identifies a learner and is safe to
 * post in a channel for a term.
 */
export function TelegramStaffPanel({
  connected,
  botUsername,
}: {
  connected: boolean;
  botUsername: string | null;
}) {
  const [state, setState] = useState<StaffLinkState>({});
  const [pending, start] = useTransition();

  if (!botUsername) return null;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: "#6f7788", lineHeight: 1.55 }}>
        {connected
          ? "Your Telegram is connected. Message the bot to ask about your centre from your phone."
          : "Ask about your centre from your phone. It answers and fetches reports; anything that changes something is still confirmed here."}
      </p>

      {state.code ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "#f4f3ff",
            border: "1px solid #ddd9fb",
            fontSize: 13,
            color: "#2a3350",
            lineHeight: 1.5,
          }}
        >
          {state.url ? (
            <a href={state.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
              Open the bot and connect →
            </a>
          ) : null}
          <div style={{ marginTop: 6, fontFamily: "ui-monospace, monospace", fontSize: 15 }}>
            {state.code}
          </div>
          <div style={{ marginTop: 4, fontSize: 11.5, color: "#6f6a9e" }}>
            Works once, for 15 minutes. Anyone who types it becomes you on Telegram — don&apos;t
            forward it.
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState(await connectMyTelegram()))}
          className="cn-cap"
          style={{
            padding: "8px 13px",
            borderRadius: 999,
            border: "1px solid #e2e2ea",
            background: "#fafaff",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#2a3350",
            cursor: "pointer",
          }}
        >
          {pending ? "…" : connected ? "Connect a different phone" : "Connect Telegram"}
        </button>
        {connected ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => setState(await disconnectMyTelegram()))}
            style={{
              padding: "8px 13px",
              borderRadius: 999,
              border: "1px solid transparent",
              background: "none",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#9a4b36",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        ) : null}
      </div>
      {state.error ? (
        <p style={{ margin: 0, fontSize: 12.5, color: "#a13a2c" }}>{state.error}</p>
      ) : null}
    </div>
  );
}
