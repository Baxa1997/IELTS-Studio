"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";

import { BRAND_DARK, MONO, SANS } from "@/lib/theme/tokens";

/**
 * The link and the code, with the only interaction this page has.
 *
 * THE LINK IS THE PRODUCT HERE. Everything else on the page reports on it, so it
 * gets the full width of the row rather than sitting in a field somebody has to
 * select by hand on a phone. The code rides along in its own button because the
 * link is useless in the places people actually share — read aloud in a class,
 * or typed from a story — and the two resolve to the same attribution.
 *
 * One live region announces whichever was copied. Two separate "Copied" states
 * next to two buttons is noise; the buttons are adjacent and the message says
 * which one landed.
 */
export function ShareCard({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = useState("");

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      // Clipboard is refused in some embedded browsers and over plain http.
      // The link stays visible and selectable above, so there is still a way
      // through rather than a button that silently did nothing.
      setCopied("");
    }
  }

  /* SHARE TO TELEGRAM, NOT JUST COPY.
     A copy button assumes the link is going somewhere you paste it. Here it is
     going into a Telegram group — that is how things spread in this market, and
     the product already lives there (the bot handles class invites and staff
     notifications). t.me/share is a plain URL, so this needs no bot, no token
     and no API call: it opens Telegram with the message already written, which
     is the difference between "I'll send it later" and sending it.

     The text is prewritten because most people will not write their own, and an
     unexplained link in a group chat gets ignored. */
  const message = `I'm using EngProgress to prepare for IELTS — AI band feedback on writing, reading, listening and speaking. Sign up with my link:`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <div
        style={{
          flex: "1 1 280px",
          minWidth: 0,
          background: "rgba(255,255,255,.10)",
          border: "1px solid rgba(255,255,255,.22)",
          borderRadius: 12,
          padding: "12px 15px",
          fontFamily: SANS,
          fontSize: 14.5,
          color: "#fff",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          userSelect: "all",
        }}
      >
        {url}
      </div>

      <Ghost onClick={() => copy(url, "Link copied")} label="Copy link" done={copied === "Link copied"} />
      <Ghost onClick={() => copy(code, "Code copied")} label={code || "Copy code"} done={copied === "Code copied"} mono />

      <a
        href={telegram}
        target="_blank"
        rel="noreferrer noopener"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          color: BRAND_DARK,
          borderRadius: 999,
          padding: "12px 22px",
          fontFamily: SANS,
          fontSize: 14.5,
          fontWeight: 700,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        <Send size={15} strokeWidth={2.2} />
        Share on Telegram
      </a>

      <span
        role="status"
        aria-live="polite"
        style={{ fontFamily: SANS, fontSize: 13.5, color: "rgba(255,255,255,.75)", minWidth: 1 }}
      >
        {copied}
      </span>
    </div>
  );
}

function Ghost({
  onClick,
  label,
  done,
  mono,
}: {
  onClick: () => void;
  label: string;
  done: boolean;
  mono?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flex: "none",
        background: "rgba(255,255,255,.16)",
        border: "1px solid rgba(255,255,255,.16)",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 18px",
        fontFamily: mono ? MONO : SANS,
        fontSize: mono ? 14.5 : 14.5,
        fontWeight: 700,
        letterSpacing: mono ? ".05em" : 0,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {done ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.2} />}
      {label}
    </button>
  );
}
