"use client";

import { Send } from "lucide-react";

import { Bar, FAINT, INK, LINE, MUTED, Pill, SERIF } from "@/app/admin/_components/ui";
import { INDIGO_CONSOLE, PANEL, TRACK } from "@/lib/theme/tokens";

import { ghostBtn, primaryBtn, secondaryBtn } from "./composer-styles";

export type Progress = { sent: number; failed: number; remaining: number; running: boolean; done: boolean };

/**
 * The composer's status and actions, pinned to the top so sending is never a
 * long way from the message being sent.
 *
 * PRESENTATION ONLY. Every decision — whether it may send, what a test does,
 * the confirm step's two clicks — is the composer's; this draws the state it is
 * handed and reports clicks back.
 */
export function SendBar({
  subject,
  progress,
  recipients,
  testAddress,
  testing,
  canTest,
  canSend,
  confirming,
  onTest,
  onConfirm,
  onCancel,
  onSend,
  onResume,
}: {
  subject: string;
  progress: Progress | null;
  recipients: number;
  testAddress: string | null;
  testing: boolean;
  canTest: boolean;
  canSend: boolean;
  confirming: boolean;
  onTest: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onSend: () => void;
  /** Set when a queued send was interrupted and can be finished. */
  onResume: (() => void) | null;
}) {
  const busy = progress?.running === true;
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 3,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: INK, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {subject.trim() || "Untitled email"}
      </span>
      <Pill tone={busy ? "amber" : progress?.done ? "green" : "neutral"}>
        {busy ? "Sending" : progress?.done ? "Sent" : "Not sent"}
      </Pill>
      <span style={{ fontSize: 12.5, color: MUTED }}>
        {recipients} {recipients === 1 ? "recipient" : "recipients"}
      </span>
      <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <TestButton testing={testing} disabled={!canTest} onClick={onTest} title={testAddress ? `Sends to ${testAddress} only` : undefined} />
        {!confirming ? (
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSend || busy}
            style={{ ...primaryBtn, opacity: !canSend || busy ? 0.45 : 1 }}
          >
            Send to {recipients}
          </button>
        ) : (
          <>
            <span style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
              Email {recipients} {recipients === 1 ? "person" : "people"}? This cannot be undone.
            </span>
            <button type="button" onClick={onSend} style={primaryBtn}>
              Yes, send now
            </button>
            <button type="button" onClick={onCancel} style={ghostBtn}>
              Cancel
            </button>
          </>
        )}
        {onResume && !busy ? (
          <button type="button" onClick={onResume} style={secondaryBtn}>
            Resume
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The send as it happens — real numbers from each round, not a spinner. */
export function SendProgress({ progress }: { progress: Progress }) {
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, background: PANEL, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: INK, marginBottom: 7 }}>
        <span>
          {progress.running ? "Sending…" : progress.done ? "Sent." : "Stopped."} {progress.sent} delivered
          {progress.failed > 0 ? `, ${progress.failed} failed` : ""}
        </span>
        <span style={{ color: MUTED }}>{progress.remaining} to go</span>
      </div>
      <Bar
        width={`${Math.round((progress.sent / Math.max(1, progress.sent + progress.failed + progress.remaining)) * 100)}%`}
        fill={INDIGO_CONSOLE}
        track={TRACK}
      />
      {progress.running ? (
        <div style={{ fontSize: 12, color: FAINT, marginTop: 7 }}>
          Keep this tab open — closing it pauses the send, and Resume finishes it.
        </div>
      ) : null}
    </div>
  );
}

/** "Send test to me" — in the bar and again in "Before you send". */
export function TestButton({
  testing,
  disabled,
  onClick,
  title,
  wide = false,
}: {
  testing: boolean;
  disabled: boolean;
  onClick: () => void;
  title?: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ ...secondaryBtn, ...(wide ? { justifyContent: "center" } : {}), opacity: disabled ? 0.5 : 1 }}
    >
      <Send size={15} /> {testing ? "Sending test…" : "Send test to me"}
    </button>
  );
}
