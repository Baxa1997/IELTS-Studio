"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Typewriter } from "@/shared/components/typewriter";
import {
  BRAND_FILL as D_ACCENT_FILL,
  HERO_B,
  HERO_MID,
  LINE as D_LINE,
  PANEL,
  WHITE,
} from "@/lib/theme/tokens";

import { D_DARK, D_INK, D_PAGE, D_SLATE, D_SLATE2, JAKARTA } from "./design";
import { splitGaps } from "./helpers";
import type { ReadingPart } from "./types";

// ---- Reading coach (inline 30% column, collapsible) ------------------------

export type CoachMsg = { role: "student" | "assistant"; content: string; animate?: boolean };

/** The in-test reading coach as a side column. Reuses the same-origin /api/reading/tutor
 *  route (strategy-only while phase==="reading"; explanations after submit), fed the
 *  CEFR paper's assembled text + answer-free questions. Closeable; reopened from the strip. */
export function CefrCoach({
  passageBody,
  questions,
  phase,
  onClose,
}: {
  passageBody: string;
  questions: string;
  phase: "reading" | "results";
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef({ passageBody, questions, phase });
  useEffect(() => {
    ctxRef.current = { passageBody, questions, phase };
  }, [passageBody, questions, phase]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  function markAnimated(idx: number) {
    setMessages((m) =>
      m[idx]?.animate ? m.map((msg, j) => (j === idx ? { ...msg, animate: false } : msg)) : m,
    );
  }

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    const prior = messages;
    setMessages([...prior, { role: "student", content: q }]);
    setSending(true);
    try {
      const ctx = ctxRef.current;
      const res = await fetch("/api/reading/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          passageTitle: "CEFR Multilevel Reading",
          passageBody: ctx.passageBody,
          currentQuestion: "",
          questions: ctx.questions,
          phase: ctx.phase,
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

  const hint =
    phase === "reading"
      ? "Strategy help only — answers unlock after you submit."
      : "Ask about any question, trap, or how to improve.";
  const empty =
    phase === "reading"
      ? "Stuck on a question type or a word? Ask how to approach it — e.g. how to tell False from Not Given. I won’t give answers while the test is live."
      : "Marked. Ask me to explain any question, why a trap worked, or how to get better at a question type.";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PANEL,
        minWidth: 0,
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${D_LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg,${HERO_B} 0%,${HERO_MID} 100%)`,
              color: WHITE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MessageCircle size={15} />
          </span>
          <span style={{ fontFamily: JAKARTA, fontWeight: 600, fontSize: 15, color: D_DARK }}>
            Reading coach
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close coach"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: `1px solid ${D_LINE}`,
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: D_SLATE2,
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 0,
        }}
      >
        {messages.length === 0 ? (
          <p
            style={{
              fontFamily: JAKARTA,
              fontWeight: 400,
              fontSize: 14,
              lineHeight: 1.75,
              color: D_SLATE,
              margin: 0,
            }}
          >
            {empty}
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "student" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: "9px 13px",
                borderRadius: 12,
                fontFamily: JAKARTA,
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                background: m.role === "student" ? D_ACCENT_FILL : D_PAGE,
                color: m.role === "student" ? WHITE : D_INK,
                border: m.role === "student" ? "none" : `1px solid ${D_LINE}`,
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
                  caretColor={D_SLATE2}
                />
              ) : (
                m.content
              )}
            </div>
          ))
        )}
        {sending ? (
          <span
            style={{ alignSelf: "flex-start", display: "inline-flex", gap: 5, padding: "9px 13px" }}
            aria-label="Coach is writing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: D_SLATE2,
                  animation: `lp-think 1.1s ${i * 0.16}s infinite ease-in-out`,
                }}
              />
            ))}
          </span>
        ) : null}
      </div>

      <div style={{ padding: "16px 20px", borderTop: `1px solid ${D_LINE}`, flexShrink: 0 }}>
        <p
          style={{
            fontFamily: JAKARTA,
            fontWeight: 400,
            fontSize: 12,
            color: D_SLATE2,
            margin: "0 0 12px",
            textAlign: "center",
          }}
        >
          {hint}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1.5px solid ${D_LINE}`,
            borderRadius: 12,
            padding: "10px 10px 10px 14px",
            background: D_PAGE,
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
            placeholder="Ask the coach…"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              background: "transparent",
              outline: "none",
              fontFamily: JAKARTA,
              fontSize: 14,
              color: D_DARK,
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            aria-label="Send"
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 8,
              border: "none",
              cursor: sending || !input.trim() ? "default" : "pointer",
              background: D_ACCENT_FILL,
              color: WHITE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function dsSubmitBtn(busy: boolean): React.CSSProperties {
  return {
    padding: "11px 22px",
    background: D_ACCENT_FILL,
    color: WHITE,
    border: "none",
    borderRadius: 8,
    fontFamily: JAKARTA,
    fontWeight: 600,
    fontSize: 15,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    flexShrink: 0,
  };
}

/** All answerable question numbers across the paper's parts (for progress + timing). */
export function questionNumbers(parts: ReadingPart[]): number[] {
  const out: number[] = [];
  for (const p of parts) {
    if (p.part === 1)
      out.push(
        ...splitGaps(p.text_with_gaps)
          .filter((s) => s.type === "gap")
          .map((s) => (s as { number: number }).number),
      );
    else if (p.part === 2) out.push(...p.statements.map((s) => s.number));
    else if (p.part === 3) out.push(...p.paragraphs.map((x) => x.question));
    else if (p.part === 4) out.push(...p.mcq.map((q) => q.number), ...p.tfn.map((q) => q.number));
    else if (p.part === 5) out.push(...p.gaps.map((g) => g.number), ...p.mcq.map((q) => q.number));
  }
  return out;
}

/** Assemble answer-free passage text + question list for the coach's context. */
export function coachContext(parts: ReadingPart[]): { body: string; questions: string } {
  const body: string[] = [];
  const qs: string[] = [];
  for (const p of parts) {
    if (p.part === 1) {
      body.push(`Part 1 — ${p.title}\n${p.text_with_gaps}`);
    } else if (p.part === 2) {
      body.push(
        `Part 2 — ${p.theme}\n` +
          p.texts.map((t) => `${t.letter}. ${t.title}: ${t.body}`).join("\n"),
      );
      qs.push(...p.statements.map((s) => `Q${s.number}: ${s.text}`));
    } else if (p.part === 3) {
      body.push("Part 3 — Headings\n" + p.paragraphs.map((x) => x.text).join("\n\n"));
      qs.push(
        ...p.paragraphs.map((x) => `Q${x.question}: choose the best heading for this paragraph`),
      );
    } else if (p.part === 4) {
      body.push(`Part 4 — ${p.title}\n${p.text}`);
      qs.push(
        ...p.mcq.map((q) => `Q${q.number}: ${q.stem}`),
        ...p.tfn.map((q) => `Q${q.number}: ${q.statement}`),
      );
    } else if (p.part === 5) {
      body.push(`Part 5 — ${p.title}\n${p.text}`);
      qs.push(
        ...p.gaps.map((g) => `Q${g.number}: ${g.sentence}`),
        ...p.mcq.map((q) => `Q${q.number}: ${q.stem}`),
      );
    }
  }
  return { body: body.join("\n\n"), questions: qs.join("\n") };
}
