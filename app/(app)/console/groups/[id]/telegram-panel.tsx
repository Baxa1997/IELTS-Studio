"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { FiCheckCircle, FiExternalLink, FiRadio, FiUsers } from "react-icons/fi";

import { useActionFeedback } from "@/components/console/toast";

import { startTelegramLink, unlinkTelegram, type ActionState } from "../../center-actions";

/**
 * Connect this class to a Telegram channel — in one tap.
 *
 * HOW THE TAP WORKS. The button is a Telegram deep link carrying the link code:
 * `t.me/<bot>?startgroup=CODE`. Telegram opens, the admin picks a group, the
 * bot is added, and Telegram itself sends `/start CODE` into that group. The
 * webhook matches the code and the class is connected. Nobody copies anything.
 *
 * WHY THE CODE IS STILL THERE. It is not ceremony — it is the authorisation.
 * Telegram chat ids are not secret and cannot be looked up by name, so the bot
 * has to LEARN the id from an update it can trust. The code proves the person
 * holds something the app only shows to staff who manage this class, and adding
 * the bot proves they can act in that chat. A "paste your chat id" box would
 * prove neither, and would let anyone who guessed an id post into another
 * center's channel. The one-tap flow hides the code without removing it.
 *
 * The typed `/link CODE` stays as the fallback for a chat the bot is already
 * in, or for an admin reading this on a laptop with no Telegram installed.
 */

const INDIGO = "#4340CB";
const GREEN = "#16794C";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const TELEGRAM = "#229ED9";

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
  useActionFeedback(unlinkState, { keepOpen: true });

  const code = startState.ok;

  if (!botUsername) {
    return (
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>
        Telegram isn&apos;t set up on this platform yet. Once the bot is configured, you&apos;ll be
        able to connect each class to its own channel here in one tap.
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
          <FiCheckCircle size={16} color={GREEN} aria-hidden />
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
        </form>
      </div>
    );
  }

  return (
    <div>
      {code ? (
        <ConnectChoices code={code} botUsername={botUsername} />
      ) : (
        <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 12px", lineHeight: 1.6 }}>
          Announce new practice where the class already talks. Parents are usually in the channel
          and have no account here, so this is often the only way they hear anything.
        </p>
      )}

      <form action={startAction} style={{ marginTop: code ? 14 : 0 }}>
        <input type="hidden" name="group_id" value={groupId} />
        <button
          type="submit"
          disabled={starting}
          className="cn-btn cn-btn--primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: code ? "#fff" : INDIGO,
            color: code ? MUTED : "#fff",
            border: code ? "1px solid #E4E2DC" : 0,
            borderRadius: 9,
            padding: "10px 15px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: starting ? "wait" : "pointer",
          }}
        >
          {starting ? "Preparing…" : code ? "Start over with a new code" : "Connect Telegram"}
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

/**
 * The two one-tap targets, plus the manual escape hatch.
 *
 * A group and a channel are different Telegram objects and need different deep
 * links — `startgroup` versus `startchannel` — and a channel additionally needs
 * the bot to hold `post_messages` or it can be a member that cannot speak. The
 * `admin=` parameter asks for exactly that right at the moment of adding, so
 * the admin approves it in the same dialog instead of hunting for it afterwards.
 */
function ConnectChoices({ code, botUsername }: { code: string; botUsername: string }) {
  const router = useRouter();
  const [waiting, setWaiting] = useState(false);

  // Telegram tells the SERVER, not this tab, so the page has no idea the
  // connection landed. Once a link has been opened we poll for a couple of
  // minutes; the alternative is an admin staring at an unchanged screen after
  // the bot has already replied "Connected" in their channel.
  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > 150_000) {
        setWaiting(false);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [waiting, router]);

  const link = (kind: "group" | "channel") =>
    kind === "group"
      ? `https://t.me/${botUsername}?startgroup=${code}`
      : `https://t.me/${botUsername}?startchannel=${code}&admin=post_messages`;

  return (
    <div
      style={{
        background: "#F7F6F2",
        border: "1px solid #E4E2DC",
        borderRadius: 11,
        padding: 14,
      }}
    >
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 11px", lineHeight: 1.55 }}>
        Pick where this class talks. If Telegram opens a chat with the bot instead of a list of
        groups, that is the wrong screen — back out and use the manual line below.
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        <TapTarget
          href={link("group")}
          onOpen={() => setWaiting(true)}
          icon={<FiUsers size={16} color={TELEGRAM} />}
          title="Add to a group"
          badge="connects itself"
          note="A normal Telegram group the class is already in"
        />
        <TapTarget
          href={link("channel")}
          onOpen={() => setWaiting(true)}
          icon={<FiRadio size={16} color={TELEGRAM} />}
          title="Add to a channel"
          badge="one paste"
          note="A broadcast channel. Telegram won't send the code for a channel, so the bot asks for it there — paste the line below."
        />
      </div>

      {waiting ? (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "11px 0 0",
            fontSize: 12.5,
            color: INDIGO,
          }}
        >
          <span className="cn-pulse" aria-hidden>
            ●
          </span>
          Waiting for Telegram… this page updates itself the moment it connects.
        </p>
      ) : null}

      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 12, color: FAINT, cursor: "pointer" }}>
          Telegram not on this device? Do it by hand
        </summary>
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginTop: 9 }}>
          Add <strong style={{ color: INK }}>@{botUsername}</strong> to the chat, then post this
          message in it:
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 15,
              color: INDIGO,
              background: "#fff",
              border: "1px solid #E4E2DC",
              borderRadius: 8,
              padding: "9px 11px",
              margin: "9px 0 0",
              userSelect: "all",
            }}
          >
            /link {code}
          </div>
          <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 7 }}>
            The code lasts 15 minutes and works once.
          </span>
        </div>
      </details>
    </div>
  );
}

function TapTarget({
  href,
  onOpen,
  icon,
  title,
  badge,
  note,
}: {
  href: string;
  onOpen: () => void;
  icon: React.ReactNode;
  title: string;
  /** How much work this one is, said before it is chosen rather than after. */
  badge: string;
  note: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 13px",
        borderRadius: 10,
        border: "1px solid #D9E9F4",
        background: "#fff",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span aria-hidden style={{ display: "inline-flex", flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{title}</span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: TELEGRAM,
              background: "#E8F5FC",
              borderRadius: 20,
              padding: "1px 7px",
            }}
          >
            {badge}
          </span>
        </span>
        <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 1 }}>{note}</span>
      </span>
      <FiExternalLink size={14} color={TELEGRAM} aria-hidden />
    </a>
  );
}
