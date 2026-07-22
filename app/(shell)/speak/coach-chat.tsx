"use client";

import { useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * Coach chat (C0) on a graded mock report. The browser calls the engine
 * directly with the user's Supabase token (same trust model as the rest of
 * /speak); the engine grounds every reply in THIS session's stored report and
 * transcript and never re-grades. Stateless server — the conversation lives
 * here and rides along with each request.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const LINE = "#E8E6F0";
const RED = "#b91c1c";

interface Msg {
  role: "user" | "coach";
  content: string;
}

const STARTERS = [
  "Why did I get this band?",
  "What should I fix first?",
  "Nega bu ball? O'zbekcha tushuntiring",
];

export function CoachChat({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const backend = clientEnv.aiBackendUrl;
    if (!backend) {
      setError("The coach isn't available right now.");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session expired — please sign in again.");
      const res = await fetch(`${backend}/speaking/coach/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, messages: next.slice(-12) }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        reply?: string;
        detail?: string | { message?: string };
      };
      if (!res.ok) {
        const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
        throw new Error(detail ?? `The coach couldn't reply (${res.status}).`);
      }
      setMessages([...next, { role: "coach", content: json.reply ?? "" }]);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "The coach couldn't reply.");
      setMessages(messages); // roll the unanswered message back into the input
      setInput(content);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      style={{
        background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14,
        padding: "16px 18px", marginTop: 14, fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: INK }}>
          Ask your coach
        </h2>
        <span
          style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", color: INDIGO,
            background: TINT, borderRadius: 999, padding: "3px 8px",
          }}
        >
          BETA
        </span>
        <span style={{ fontSize: 12.5, color: MUTED }}>
          Grounded in this report — English · Oʻzbekcha · Русский
        </span>
      </div>

      {messages.length ? (
        <div
          ref={scrollRef}
          style={{ maxHeight: 420, overflowY: "auto", margin: "14px 0 4px", display: "grid", gap: 10 }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                justifySelf: m.role === "user" ? "end" : "start",
                maxWidth: "88%",
                background: m.role === "user" ? INDIGO : "#F7F6FB",
                color: m.role === "user" ? "#fff" : INK,
                border: m.role === "user" ? "none" : `1px solid ${LINE}`,
                borderRadius: 12,
                padding: "9px 13px",
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}
          {busy ? (
            <div style={{ justifySelf: "start", color: MUTED, fontSize: 13, padding: "4px 2px" }}>
              Coach is reading your report…
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "13px 0 4px" }}>
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              disabled={busy}
              style={{
                background: TINT, color: INDIGO, border: "none", borderRadius: 999,
                padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: SANS,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: RED }}>{error}</p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        style={{ display: "flex", gap: 8, marginTop: 10 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your bands, mistakes, or how to improve…"
          maxLength={2000}
          style={{
            flex: 1, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 13px",
            fontSize: 13.5, fontFamily: SANS, color: INK, outline: "none", background: "#FDFDFF",
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            background: busy || !input.trim() ? "#B9B6E8" : INDIGO, color: "#fff",
            border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13.5,
            fontWeight: 700, cursor: busy || !input.trim() ? "default" : "pointer",
            fontFamily: SANS,
          }}
        >
          Send
        </button>
      </form>
      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: MUTED }}>
        The coach explains this report — it never changes your bands.
      </p>
    </section>
  );
}
