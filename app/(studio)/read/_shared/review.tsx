"use client";

import { useState } from "react";

import type { GradedItem } from "@/lib/reading/grade";
import { READING_QUESTION_LABELS, type ReadingQuestionType } from "@/lib/reading/types";

import { INK, SANS } from "./tokens";

export type { GradedItem };
export type TypeBreakdown = Partial<Record<ReadingQuestionType, { attempted: number; correct: number }>>;

/** Green ≥75% · amber ≥50% · red below — shared by the type + passage bars. */
export function perfColor(pct: number): string {
  if (pct >= 75) return "#16A34A";
  if (pct >= 50) return "#D97706";
  return "#DC2626";
}

const STATUS = {
  correct: { border: "#16A34A", bg: "#F6FBF7", ring: "#E4F0E8", pillBg: "#E6F5EB", pillTxt: "#15803D", icon: "✓", label: "Correct" },
  incorrect: { border: "#DC2626", bg: "#FDF5F3", ring: "#F4DAD2", pillBg: "#FCE4E0", pillTxt: "#C2410C", icon: "✕", label: "Incorrect" },
  skipped: { border: "#9B98AD", bg: "#F9F9FB", ring: "#E7E5EF", pillBg: "#ECEAF2", pillTxt: "#6B6880", icon: "–", label: "Skipped" },
} as const;

export type ReviewStatus = keyof typeof STATUS;

export function statusOf(item: GradedItem): ReviewStatus {
  if (item.is_correct) return "correct";
  return item.student_answer.trim() ? "incorrect" : "skipped";
}

/** Per-type score, weakest first, as labelled progress bars. */
export function WeakTypes({ breakdown }: { breakdown: TypeBreakdown }) {
  const rows = (Object.entries(breakdown) as [ReadingQuestionType, { attempted: number; correct: number }][])
    .map(([type, t]) => ({ type, ...t, pct: t.attempted ? Math.round((t.correct / t.attempted) * 100) : 100 }))
    .sort((a, b) => a.pct - b.pct);
  if (rows.length === 0) return null;

  return (
    <section style={{ border: "1px solid #EFEEF5", borderRadius: 16, padding: "22px 24px", background: "#fff" }}>
      <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#A6A2B8", margin: "0 0 18px" }}>Performance by question type</p>
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" }}>
        {rows.map((r) => {
          const c = perfColor(r.pct);
          return (
            <div key={r.type}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: "#2A2740" }}>{READING_QUESTION_LABELS[r.type]}</span>
                <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{r.correct}/{r.attempted}</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: "#F0EFF6", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, background: c, width: `${r.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** One graded question, post-submit: status, your vs. correct answer, the proving
 *  sentence, the "why" coaching, and a Find-in-passage reveal. `flagged` is optional
 *  — only the full-test runner tracks per-question flags. */
export function ReviewItem({ item, passageBody, flagged }: { item: GradedItem; passageBody: string; flagged?: boolean }) {
  const status = statusOf(item);
  const s = STATUS[status];
  const isNotGiven = /not_given/i.test(item.correct_answer.replace(/\s/g, "_")) || item.correct_answer === "";

  const yourAnswerStyle: React.CSSProperties =
    status === "correct"
      ? { color: "#15803D", fontWeight: 700 }
      : status === "incorrect"
        ? { color: "#DC2626", fontWeight: 700, textDecoration: "line-through" }
        : { color: "#9B98AD", fontWeight: 600, textDecoration: "line-through" };
  const shownStudent = status === "skipped" ? "no answer" : display(item.student_answer.trim() || "no answer");

  return (
    <article style={{ border: `1px solid ${s.ring}`, borderLeft: `4px solid ${s.border}`, background: s.bg, borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
        <div style={{ fontFamily: SANS, fontSize: 16.5, fontWeight: 600, lineHeight: 1.45, color: INK }}>
          <span style={{ color: "#8C88A0", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>Q{item.order_index}. </span>
          <span style={{ whiteSpace: "pre-wrap" }}>{item.prompt}</span>
          {flagged ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#C77C09", fontWeight: 600, marginLeft: 8, verticalAlign: "middle" }}>⚑ flagged</span>
          ) : null}
        </div>
        <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: s.pillBg, color: s.pillTxt, fontFamily: SANS, fontSize: 12.5, fontWeight: 700 }}>{s.icon} {s.label}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 7, background: "#EEF0F6", color: "#5A5670", fontFamily: SANS, fontSize: 13, fontWeight: 600 }}>{READING_QUESTION_LABELS[item.question_type]}</span>
      </div>

      <div style={{ display: "flex", gap: 26, flexWrap: "wrap", fontFamily: SANS, fontSize: 15, marginBottom: 14 }}>
        <span style={{ color: "#5A5670" }}>Your answer: <span style={yourAnswerStyle}>{shownStudent}</span></span>
        <span style={{ color: "#5A5670" }}>Correct: <span style={{ color: "#15803D", fontWeight: 700 }}>{display(item.correct_answer)}</span></span>
      </div>

      {item.supporting_sentence?.trim() ? (
        <blockquote style={{ borderLeft: "3px solid #D8D5EC", padding: "2px 0 2px 15px", margin: "0 0 13px", fontStyle: "italic", color: "#6A6680", fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55 }}>
          “{item.supporting_sentence.trim()}”
        </blockquote>
      ) : isNotGiven ? (
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: "#6A6680", margin: "0 0 13px" }}>
          Nothing in the passage states this — which is exactly why the answer is <em>Not Given</em>. Don&apos;t let outside knowledge or a plausible guess fill the gap.
        </p>
      ) : null}

      {item.explanation?.trim() ? (
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: "#3A3650", margin: 0 }}>
          <span style={{ fontWeight: 700, color: INK }}>{status === "incorrect" ? "Why the trap worked: " : "Why: "}</span>
          {item.explanation.trim()}
        </p>
      ) : null}

      <FindInPassage sentence={item.supporting_sentence} body={passageBody} />
    </article>
  );
}

function FindInPassage({ sentence, body }: { sentence: string; body: string }) {
  const [open, setOpen] = useState(false);
  const trimmed = sentence?.trim();
  if (!trimmed) return null;

  const idx = body.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx < 0) return null;
  const start = Math.max(0, body.lastIndexOf(".", idx - 1) + 1);
  let end = body.indexOf(".", idx + trimmed.length);
  end = end < 0 ? Math.min(body.length, idx + trimmed.length + 200) : end + 1;
  const before = body.slice(start, idx).trimStart();
  const after = body.slice(idx + trimmed.length, end);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 13, padding: "7px 0", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: "#4F46E5", textDecoration: "underline", textUnderlineOffset: 3 }}
      >
        {open ? "Hide passage ▴" : "Find it in the passage ▾"}
      </button>
      {open ? (
        <p style={{ marginTop: 12, padding: "15px 18px", background: "#fff", border: "1px solid #ECEAF6", borderRadius: 11, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.7, color: "#3A3650" }}>
          {before}
          <mark style={{ background: "#FEF3C7", color: INK, borderRadius: 3, padding: "1px 3px" }}>{body.slice(idx, idx + trimmed.length)}</mark>
          {after}
        </p>
      ) : null}
    </div>
  );
}

/** Normalize verdict tokens to a human label; pass other answers through. */
export function display(answer: string): string {
  const map: Record<string, string> = {
    true: "True",
    false: "False",
    yes: "Yes",
    no: "No",
    not_given: "Not Given",
    "not given": "Not Given",
    ng: "Not Given",
  };
  return map[answer.trim().toLowerCase()] ?? answer;
}
