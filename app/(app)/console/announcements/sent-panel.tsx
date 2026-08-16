"use client";

import Link from "next/link";
import { useState } from "react";
import { FiCheckCircle, FiExternalLink, FiSend } from "react-icons/fi";

/**
 * The right-hand column: what you sent, and how Telegram gets connected.
 *
 * Two tabs rather than two stacked cards, because this column has a fixed
 * height — it fills the viewport and scrolls inside itself. Stacking would put
 * the Telegram guidance permanently below the fold, which is exactly where a
 * setup guide is least useful.
 */

const SANS = "var(--font-sans3), ui-sans-serif, system-ui, sans-serif";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#EFEDE7";
const GREEN = "#16794C";
const INDIGO = "#4340CB";
const TELEGRAM = "#229ED9";

const AUDIENCE_LABEL: Record<string, string> = {
  everyone: "Everyone",
  students: "All students",
  teachers: "All teachers",
  group: "One group",
};

export interface SentRow {
  id: string;
  subject: string;
  body: string;
  audience: string;
  recipients: number;
  sentAt: string;
  readPct: number | null;
}

export interface TelegramClass {
  id: string;
  name: string;
  students: number;
  /** The connected channel's title, or null when the class has none. */
  channel: string | null;
}

export function SentPanel({
  rows,
  classes,
  botUsername,
}: {
  rows: SentRow[];
  classes: TelegramClass[];
  botUsername: string | null;
}) {
  const [tab, setTab] = useState<"sent" | "telegram">("sent");
  const connected = classes.filter((c) => c.channel).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "#fff",
        border: "1px solid #E9E7E1",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{ display: "flex", gap: 4, padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}
      >
        <TabButton on={tab === "sent"} onClick={() => setTab("sent")}>
          Sent {rows.length > 0 ? <Count on={tab === "sent"}>{rows.length}</Count> : null}
        </TabButton>
        <TabButton on={tab === "telegram"} onClick={() => setTab("telegram")}>
          Telegram <Count on={tab === "telegram"}>{`${connected}/${classes.length}`}</Count>
        </TabButton>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {tab === "sent" ? (
          <SentList rows={rows} />
        ) : (
          <TelegramGuide classes={classes} botUsername={botUsername} />
        )}
      </div>
    </div>
  );
}

function SentList({ rows }: { rows: SentRow[] }) {
  if (rows.length === 0) {
    return (
      <p style={{ padding: 20, fontFamily: SANS, fontSize: 13, color: FAINT, margin: 0 }}>
        Nothing sent yet. Whatever you write appears here with the share of people who opened it —
        measured from the notification each person received, not estimated.
      </p>
    );
  }

  return (
    <>
      {rows.map((a) => (
        <div key={a.id} style={{ padding: "13px 16px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: INK }}>
              {a.subject}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 600,
                color: INDIGO,
                background: "#EDEBFB",
                borderRadius: 20,
                padding: "2px 8px",
              }}
            >
              {AUDIENCE_LABEL[a.audience] ?? a.audience}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: SANS,
                fontSize: 11.5,
                color: FAINT,
                whiteSpace: "nowrap",
              }}
            >
              {new Date(a.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>

          <p
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: MUTED,
              margin: "5px 0 9px",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {a.body}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                background: "#EFEDE7",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: `${a.readPct ?? 0}%`,
                  background: GREEN,
                  borderRadius: 3,
                }}
              />
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 11.5,
                color: MUTED,
                whiteSpace: "nowrap",
                flex: "none",
              }}
            >
              {a.readPct == null ? "not opened yet" : `${a.readPct}% read`} · {a.recipients} sent
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * How to connect a class channel, written for someone holding a phone.
 *
 * Three steps, not five: the deep link on the class page does the adding, the
 * permissions and the code in one tap. The steps still SAY there is a code and
 * why, because the manual fallback exists and because a security step nobody
 * can see is a security step nobody trusts.
 */
function TelegramGuide({
  classes,
  botUsername,
}: {
  classes: TelegramClass[];
  botUsername: string | null;
}) {
  const connected = classes.filter((c) => c.channel);
  const missing = classes.filter((c) => !c.channel);

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      {!botUsername ? (
        <p style={note}>
          Telegram isn&apos;t configured on this platform yet — <code>TELEGRAM_BOT_USERNAME</code>,
          the bot token and the webhook have to be set before channels can be connected. Everything
          below is what it will look like once they are.
        </p>
      ) : null}

      <section>
        <h3 style={heading}>
          <FiSend size={14} color={TELEGRAM} aria-hidden />
          Connect a class channel
        </h3>
        <p style={note}>
          One channel per class. Posts there reach parents, who usually have no account here at all
          — which is why it is worth the two minutes.
        </p>
        <ol style={steps}>
          <li style={step}>
            <b>Create the Telegram group or channel</b> for the class, if it doesn&apos;t exist.
          </li>
          <li style={step}>
            <b>Open the group</b> → Settings → Telegram, and press <i>Connect Telegram</i>, then{" "}
            <i>Add to a group</i>.
          </li>
          <li style={step}>
            <b>Pick the chat in Telegram.</b> That&apos;s it — the bot is added and connects itself,
            and the page updates on its own.
          </li>
        </ol>
        <p style={{ ...note, marginTop: 9 }}>
          The link carries a one-use code that expires in 15 minutes. That code is the security
          check, not red tape: Telegram chat ids aren&apos;t secret, so without it anyone who
          guessed one could post into another center&apos;s channel. If Telegram isn&apos;t on the
          device you&apos;re using, the same panel shows the code to post by hand.
        </p>
      </section>

      <section>
        <h3 style={heading}>
          <FiCheckCircle size={14} color={connected.length > 0 ? GREEN : FAINT} aria-hidden />
          {connected.length} of {classes.length} classes connected
        </h3>
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {[...connected, ...missing].map((c) => (
            <Link
              key={c.id}
              href={`/console/groups/${c.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 11px",
                borderRadius: 9,
                border: `1px solid ${c.channel ? "#CFE6D9" : LINE}`,
                background: c.channel ? "#F4FAF6" : "#fff",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: c.channel ? GREEN : "#D6D3CA",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontFamily: SANS,
                    fontSize: 13,
                    fontWeight: 500,
                    color: INK,
                  }}
                >
                  {c.name}
                </span>
                <span style={{ display: "block", fontFamily: SANS, fontSize: 11.5, color: FAINT }}>
                  {c.channel ? c.channel : `${c.students} students · no channel yet`}
                </span>
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: c.channel ? GREEN : INDIGO,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {c.channel ? "Connected" : "Connect"}
                <FiExternalLink size={11} aria-hidden />
              </span>
            </Link>
          ))}
          {classes.length === 0 ? (
            <p style={note}>No classes yet — a channel belongs to one, so create a class first.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function TabButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border: 0,
        borderRadius: 8,
        padding: "7px 13px",
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: on ? 600 : 500,
        color: on ? INK : MUTED,
        background: on ? "#F2F1FB" : "transparent",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Count({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: on ? INDIGO : FAINT,
        background: on ? "#E4E1F8" : "#EFEDE7",
        borderRadius: 20,
        padding: "1px 7px",
      }}
    >
      {children}
    </span>
  );
}

const heading: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  margin: "0 0 6px",
  fontFamily: SANS,
  fontSize: 13.5,
  fontWeight: 600,
  color: INK,
};

const note: React.CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 12.5,
  color: MUTED,
  lineHeight: 1.6,
};

const steps: React.CSSProperties = {
  margin: "10px 0 0",
  paddingLeft: 20,
  display: "grid",
  gap: 7,
};

const step: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12.5,
  color: MUTED,
  lineHeight: 1.6,
};
