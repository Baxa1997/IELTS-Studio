"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";

import { MONO, SANS } from "@/lib/theme/tokens";

/**
 * The link and the code, with the one interaction this page needs.
 *
 * THE LINK IS THE PRODUCT HERE. Everything else on the page reports on it, so it
 * gets the hero and a copy button rather than sitting in a field somebody has to
 * select by hand on a phone. The code is shown underneath because the link is
 * useless in the places people actually share — read aloud in a class, or typed
 * from a story — and the two resolve to the same attribution.
 */
export function ShareCard({ url, code }: { url: string; code: string }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Copyable label="Your link" value={url} mono={false} />
      <Copyable label="Or just the code" value={code} mono />

      <a
        href={telegram}
        target="_blank"
        rel="noreferrer noopener"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          alignSelf: "flex-start",
          background: "#fff",
          color: "#43001D",
          borderRadius: 999,
          padding: "12px 22px",
          fontFamily: SANS,
          fontSize: 14.5,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <Send size={16} strokeWidth={2.2} />
        Share on Telegram
      </a>
    </div>
  );
}

function Copyable({ label, value, mono }: { label: string; value: string; mono: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is refused in some embedded browsers and over plain http.
      // Selecting the text is the fallback, so the value stays visible and
      // selectable rather than being hidden behind a button that did nothing.
      setCopied(false);
    }
  }

  return (
    <div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.62)",
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexWrap: "wrap" }}>
        <div
          style={{
            flex: "1 1 260px",
            minWidth: 0,
            background: "rgba(255,255,255,.10)",
            border: "1px solid rgba(255,255,255,.22)",
            borderRadius: 11,
            padding: "12px 14px",
            fontFamily: mono ? MONO : SANS,
            fontSize: mono ? 17 : 14.5,
            fontWeight: mono ? 700 : 500,
            letterSpacing: mono ? ".05em" : 0,
            color: "#fff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            userSelect: "all",
          }}
        >
          {value}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          style={{
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#fff",
            color: "#43001D",
            border: 0,
            borderRadius: 11,
            padding: "12px 18px",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.2} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
