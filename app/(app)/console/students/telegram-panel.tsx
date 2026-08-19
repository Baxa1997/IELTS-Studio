"use client";

import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import { createTelegramInvite, type InviteState } from "./telegram-actions";

/**
 * Getting a student onto Telegram, from the teacher's side.
 *
 * WHY THERE IS A LINK TO HAND OVER AT ALL. A Telegram bot cannot start a
 * conversation — the student has to open it first. So the only possible flow is
 * one the student initiates, and the job here is to make that as close to one
 * tap as it can be: press the button, get a link, send it however you already
 * talk to them. They tap it once and everything personal reaches them for free
 * from then on.
 *
 * The link is shown rather than sent for us. We often have no way to reach the
 * student yet — that is the entire problem being solved — so the teacher, who
 * does, is the delivery mechanism for exactly one message.
 */
export function TelegramInvitePanel({
  studentId,
  studentName,
  connected,
}: {
  studentId: string;
  studentName: string;
  connected: boolean;
}) {
  const [state, action, pending] = useActionState(createTelegramInvite, {} as InviteState);
  const [copied, setCopied] = useState(false);
  useActionFeedback(state, { keepOpen: true });

  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h3 style={heading}>Telegram</h3>
        <span style={connected ? okPill : offPill}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <p style={note}>
        {connected
          ? `${studentName} gets sign-in details and reminders privately, at no cost. Making a new link disconnects the old device.`
          : "Send this link to the student. One tap and their sign-in details and reminders arrive in Telegram — free, and no SMS needed."}
      </p>

      <form action={action}>
        <input type="hidden" name="student_id" value={studentId} />
        <button type="submit" disabled={pending} style={button}>
          {pending ? "Making a link…" : connected ? "Make a new link" : "Make an invite link"}
        </button>
      </form>

      {state.url ? (
        <div style={{ marginTop: 12 }}>
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
            {/* The code is for reading aloud or printing on a slip — a URL is
                not something anyone types off paper. */}
            <span style={codeChip}>or code: {state.code}</span>
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
const pill: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: 999,
};
const okPill: React.CSSProperties = { ...pill, background: "#E4F0E9", color: "#2F6B4F" };
const offPill: React.CSSProperties = { ...pill, background: "#FBEEE0", color: "#8A5A20" };
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
const codeChip: React.CSSProperties = {
  alignSelf: "center",
  fontSize: 12.5,
  color: "#5C5A70",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
