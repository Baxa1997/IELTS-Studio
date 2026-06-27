"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";

import { Typewriter } from "@/components/typewriter";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";

interface ChatMessage {
  role: "student" | "assistant";
  content: string;
  /** A freshly-arrived reply types in live; replayed history shows at once. */
  animate?: boolean;
}

const SUGGESTIONS = ["What should I practise next?", "Plan my week", "How do I reach my target?"];

/**
 * The dashboard study coach — a floating chat pinned to the bottom-right of the
 * whole dashboard. It POSTs to /api/coach with the learner's dashboard `context`
 * (target, current bands, weak areas, days to test) so the advice is grounded. A
 * general mentor (planning / strategy / what to practise), distinct from the
 * in-task writing & reading coaches.
 */
export function DashboardCoach({ context, firstName }: { context: string; firstName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctxRef = useRef(context);
  useEffect(() => {
    ctxRef.current = context;
  }, [context]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // Once a reply finishes typing, drop its animate flag so reopening the panel
  // replays it instantly instead of re-typing every old reply.
  function markAnimated(idx: number) {
    setMessages((m) => (m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m));
  }

  async function send(raw?: string) {
    const q = (raw ?? input).trim();
    if (!q || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "student", content: q }]);
    setSending(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: ctxRef.current, history: messages.slice(-6) }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
      const reply = res.ok && body.reply ? body.reply : body.message ?? "The coach is busy — try again in a moment.";
      setMessages((m) => [...m, { role: "assistant", content: reply, animate: true }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — please try again.", animate: true }]);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open your study coach"
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 50,
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          padding: "12px 18px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
          color: "#fff",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 14.5,
          boxShadow: "0 16px 34px -12px rgba(59,67,181,.75)",
        }}
      >
        <Sparkles size={17} className="lp-ai-spark" /> Study coach
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Study coach"
      style={{
        position: "fixed",
        right: 22,
        bottom: 22,
        zIndex: 50,
        width: "min(384px, calc(100vw - 40px))",
        height: "min(580px, calc(100dvh - 40px))",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "1px solid #E7E4F2",
        borderRadius: 18,
        boxShadow: "0 30px 70px -28px rgba(26,33,56,.55)",
        overflow: "hidden",
      }}
    >
      <header
        className="lp-ai-surface"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "13px 14px",
          borderBottom: "1px solid #E7E4F2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} />
          </span>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>Study coach</div>
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: MUTED }}>Planning · strategy · what&rsquo;s next</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close coach"
          style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}
        >
          <X size={18} />
        </button>
      </header>

      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
      >
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: MUTED, margin: 0 }}>
              {firstName ? `Hi ${firstName}! ` : "Hi! "}I&rsquo;m your study coach. Ask me what to practise next, how
              to plan your week, or how to close the gap to your target band.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  style={{
                    fontFamily: SANS,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: INDIGO,
                    background: "#ECEBFB",
                    border: "1px solid #E1DFF7",
                    borderRadius: 999,
                    padding: "7px 12px",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "student" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "9px 12px",
                borderRadius: 12,
                fontFamily: SANS,
                fontSize: 13.5,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                background: m.role === "student" ? INDIGO : "#F4F3FC",
                color: m.role === "student" ? "#fff" : "#3a3d52",
                border: m.role === "student" ? "none" : "1px solid #E6E4F8",
              }}
            >
              {m.role === "assistant" ? (
                <Typewriter
                  text={m.content}
                  animate={!!m.animate}
                  onReveal={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })}
                  onDone={() => markAnimated(i)}
                  caretColor={MUTED}
                />
              ) : (
                m.content
              )}
            </div>
          ))
        )}
        {sending ? (
          <span style={{ alignSelf: "flex-start", display: "inline-flex", gap: 5, padding: "9px 12px" }} aria-label="Coach is writing">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ width: 6, height: 6, borderRadius: 999, background: MUTED, animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out` }}
              />
            ))}
          </span>
        ) : null}
      </div>

      <div style={{ borderTop: "1px solid #EFEDF8", padding: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask your coach…"
            className="lp-input"
            style={{ flex: 1, padding: "9px 11px", border: "1px solid #DDDAEE", borderRadius: 10, background: "#fff", fontFamily: SANS, fontSize: 13.5, color: INK }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            aria-label="Send"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              borderRadius: 10,
              border: "none",
              cursor: sending || !input.trim() ? "default" : "pointer",
              background: INDIGO,
              color: "#fff",
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
