"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { Typewriter } from "@/components/typewriter";

import { INDIGO, INK, MUTED, SANS } from "./tokens";

interface ChatMessage {
  role: "student" | "assistant";
  content: string;
  /** A freshly-arrived coach reply animates in like live writing; replayed
   *  history (and the student's own messages) renders instantly. */
  animate?: boolean;
}

/**
 * The in-test reading coach — a floating chat panel. It POSTs to
 * /api/reading/tutor with the ACTIVE passage as context; the server prompt
 * withholds any specific answer while `phase === "reading"` (strategy only) and
 * opens up after submit. The parent passes the current passage + phase so the
 * coach always reasons about what the learner is looking at.
 */
export function CoachPanel({
  passageTitle,
  passageBody,
  currentQuestion,
  questions,
  phase,
}: {
  passageTitle: string;
  passageBody: string;
  currentQuestion?: string;
  /** The answer-free questions the student can currently see, with their numbers —
   *  so the coach knows what "the first question", "Q5", etc. refer to. */
  questions?: string;
  phase: "reading" | "results";
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep latest context in a ref so the in-flight send always uses current values.
  const ctxRef = useRef({ passageTitle, passageBody, currentQuestion, questions, phase });
  useEffect(() => {
    ctxRef.current = { passageTitle, passageBody, currentQuestion, questions, phase };
  }, [passageTitle, passageBody, currentQuestion, questions, phase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // Once a reply finishes typing, drop its animate flag so reopening the coach (which
  // remounts the transcript) replays it instantly rather than re-typing every reply.
  function markAnimated(idx: number) {
    setMessages((m) => (m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m));
  }

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    const next = [...messages, { role: "student" as const, content: q }];
    setMessages(next);
    setSending(true);
    try {
      const ctx = ctxRef.current;
      const res = await fetch("/api/reading/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          passageTitle: ctx.passageTitle,
          passageBody: ctx.passageBody,
          currentQuestion: ctx.currentQuestion ?? "",
          questions: ctx.questions ?? "",
          phase: ctx.phase,
          history: messages.slice(-6),
        }),
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
        aria-label="Open the reading coach"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 40,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 16px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          background: INDIGO,
          color: "#fff",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 14px 30px -12px rgba(59,67,181,.7)",
        }}
      >
        <MessageCircle size={17} /> Coach
      </button>
    );
  }

  const hint = phase === "reading" ? "Strategy help only — answers unlock after you submit." : "Ask about any question, trap, or how to improve.";

  return (
    <div
      role="dialog"
      aria-label="Reading coach"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 40,
        width: "min(380px, calc(100vw - 40px))",
        height: "min(560px, calc(100dvh - 40px))",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "1px solid #E7E4D6",
        borderRadius: 16,
        boxShadow: "0 24px 60px -24px rgba(26,33,56,.5)",
        overflow: "hidden",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", borderBottom: "1px solid #EEECDF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#5B55D6,#3B43B5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={15} />
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: INK }}>Reading coach</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close coach" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}>
          <X size={18} />
        </button>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: MUTED, margin: 0 }}>
            {phase === "reading"
              ? "Stuck on a question type or a word? Ask me how to approach it — e.g. “How do I tell False from Not Given?” I won’t give answers while the test is live."
              : "The test is marked. Ask me to explain any question, why a trap worked, or how to get better at a question type."}
          </p>
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
                background: m.role === "student" ? INDIGO : "#F4F2E8",
                color: m.role === "student" ? "#fff" : INK,
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
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: MUTED,
                  animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out`,
                }}
              />
            ))}
          </span>
        ) : null}
      </div>

      <div style={{ borderTop: "1px solid #EEECDF", padding: 10 }}>
        <p style={{ fontFamily: SANS, fontSize: 11, color: "#9a998c", margin: "0 0 8px" }}>{hint}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder="Ask the coach…"
            className="lp-input"
            style={{ flex: 1, padding: "9px 11px", border: "1px solid #DAD8C9", borderRadius: 10, background: "#fff", fontFamily: SANS, fontSize: 13.5, color: INK }}
          />
          <button type="button" onClick={() => void send()} disabled={sending || !input.trim()} aria-label="Send" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, borderRadius: 10, border: "none", cursor: sending || !input.trim() ? "default" : "pointer", background: INDIGO, color: "#fff", opacity: sending || !input.trim() ? 0.5 : 1 }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
