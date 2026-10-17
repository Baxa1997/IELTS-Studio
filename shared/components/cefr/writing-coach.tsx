"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Typewriter } from "@/shared/components/typewriter";
import {
  BRAND_LINE as D_ABORDER2,
  BRAND_SOFT as W_SOFT,
  HERO_B,
  HERO_MID,
  PANEL,
  SLATE_STRONG,
  WHITE,
} from "@/lib/theme/tokens";

import { JAKARTA } from "./design";
import type { CoachMsg } from "./reading-coach";
import {
  WRITING_COACH_CHIPS,
  W_ACCENT,
  W_BODY,
  W_CANVAS,
  W_FAINT,
  W_FILL,
  W_INK,
  W_LINE,
  W_SOFT2,
  W_SOFTLINE,
} from "./writing-design";

export function WritingCoach({
  promptText,
  tutorType,
  phase,
  draftRef,
  onClose,
}: {
  promptText: string;
  tutorType: string;
  phase: "writing" | "results";
  draftRef: React.MutableRefObject<string>;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef({ promptText, tutorType, phase });
  useEffect(() => {
    ctxRef.current = { promptText, tutorType, phase };
  }, [promptText, tutorType, phase]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  function markAnimated(idx: number) {
    setMessages((m) =>
      m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m,
    );
  }

  async function send(raw?: string) {
    const q = (raw ?? input).trim();
    if (!q || sending) return;
    setInput("");
    const prior = messages;
    setMessages([...prior, { role: "student", content: q }]);
    setSending(true);
    try {
      const ctx = ctxRef.current;
      const res = await fetch("/api/writing/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          taskType: ctx.tutorType,
          promptText: ctx.promptText,
          draft: draftRef.current,
          phase: ctx.phase === "results" ? "results" : "writing",
          history: prior.slice(-6),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
      const reply =
        res.ok && body.reply
          ? body.reply
          : (body.message ?? "The coach is busy — try again in a moment.");
      setMessages((m) => [...m, { role: "assistant", content: reply, animate: true }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again.", animate: true },
      ]);
    } finally {
      setSending(false);
    }
  }

  const empty =
    phase === "results"
      ? "Marked. Ask me to explain any part of the feedback, or how to push this answer to the next level."
      : "I can help you understand the task, plan ideas, and find sharper words — but you write the answer.";
  const subtitle =
    phase === "results" ? "Feedback unlocked · ask anything" : "Ideas & vocabulary · not answers";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: PANEL,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "15px 16px",
          borderBottom: `1px solid ${W_SOFTLINE}`,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `linear-gradient(135deg,${HERO_B} 0%,${HERO_MID} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: WHITE,
          }}
        >
          <Sparkles size={18} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: JAKARTA, fontWeight: 700, fontSize: 14.5, color: W_INK }}>
            Writing coach
          </div>
          <div style={{ fontFamily: JAKARTA, fontSize: 12, color: W_FAINT }}>{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse coach"
          style={{
            flexShrink: 0,
            width: 30,
            height: 30,
            border: "none",
            background: "transparent",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: W_FAINT,
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              background: W_SOFT2,
              border: `1px solid ${D_ABORDER2}`,
              borderRadius: 13,
              borderTopLeftRadius: 4,
              padding: "13px 14px",
              fontFamily: JAKARTA,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: SLATE_STRONG,
            }}
          >
            {empty}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "student" ? "flex-end" : "flex-start",
                maxWidth: "86%",
                padding: "10px 13px",
                borderRadius: 12,
                borderTopRightRadius: m.role === "student" ? 3 : 12,
                borderTopLeftRadius: m.role === "student" ? 12 : 3,
                fontFamily: JAKARTA,
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                background: m.role === "student" ? W_FILL : W_CANVAS,
                color: m.role === "student" ? WHITE : W_BODY,
                border: m.role === "student" ? "none" : `1px solid ${W_LINE}`,
              }}
            >
              {m.role === "assistant" ? (
                <Typewriter
                  text={m.content}
                  animate={!!m.animate}
                  onReveal={() =>
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
                  }
                  onDone={() => markAnimated(i)}
                  caretColor={W_FAINT}
                />
              ) : (
                m.content
              )}
            </div>
          ))
        )}
        {sending ? (
          <span
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              gap: 5,
              padding: "10px 13px",
            }}
            aria-label="Coach is writing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: W_FAINT,
                  animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out`,
                }}
              />
            ))}
          </span>
        ) : null}
      </div>
      <div
        style={{ flexShrink: 0, padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 7 }}
      >
        {WRITING_COACH_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => void send(c)}
            disabled={sending}
            style={{
              fontFamily: JAKARTA,
              fontSize: 12.5,
              fontWeight: 600,
              color: W_ACCENT,
              background: W_SOFT,
              border: `1px solid ${D_ABORDER2}`,
              borderRadius: 999,
              padding: "6px 12px",
              cursor: sending ? "default" : "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: "12px 14px", borderTop: `1px solid ${W_SOFTLINE}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: W_CANVAS,
            border: `1px solid ${W_LINE}`,
            borderRadius: 11,
            padding: "5px 6px 5px 13px",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask in any language…"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "transparent",
              outline: "none",
              fontFamily: JAKARTA,
              fontSize: 13.5,
              color: W_INK,
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            aria-label="Send"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              border: "none",
              borderRadius: 9,
              background: W_FILL,
              cursor: sending || !input.trim() ? "default" : "pointer",
              opacity: sending || !input.trim() ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: WHITE,
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
