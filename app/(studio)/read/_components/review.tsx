"use client";

import { useState } from "react";

import type { GradedItem } from "@/lib/reading/grade";
import { READING_QUESTION_LABELS, type ReadingQuestionType } from "@/lib/reading/constants";

import { INK, SANS } from "@/shared/components/reading/tokens";
import {
  BRAND,
  BRAND_LINE,
  PANEL,
  SLATE_BODY,
  SLATE_LINE,
  SLATE_MUTED,
  SLATE_STRONG,
  WARM_GREEN,
  WELL_LINE,
} from "@/lib/theme/tokens";

export type { GradedItem };
export type TypeBreakdown = Partial<Record<ReadingQuestionType, { attempted: number; correct: number }>>;

/** Green ≥75% · amber ≥50% · red below — shared by the type + passage bars. Tokens, so
 *  keep them in `style` — they are also the bar FILLS, never an SVG attribute. */
export function perfColor(pct: number): string {
  if (pct >= 75) return "var(--ex-ok-edge)";
  if (pct >= 50) return "var(--ex-warn)";
  return "var(--ex-red)";
}

const STATUS = {
  correct: { border: "var(--ex-ok-edge)", bg: "var(--ex-ok-card)", ring: "var(--ex-ok-ring)", pillBg: "var(--ex-ok-pill)", pillTxt: WARM_GREEN, icon: "✓", label: "Correct" },
  incorrect: { border: "var(--ex-red)", bg: "var(--ex-bad-card)", ring: "var(--ex-bad-ring)", pillBg: "var(--ex-bad-pill)", pillTxt: "var(--ex-err)", icon: "✕", label: "Incorrect" },
  skipped: { border: SLATE_MUTED, bg: WELL_LINE, ring: SLATE_LINE, pillBg: SLATE_LINE, pillTxt: SLATE_BODY, icon: "–", label: "Skipped" },
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
    <section style={{ border: `1px solid ${WELL_LINE}`, borderRadius: 16, padding: "22px 24px", background: PANEL }}>
      <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: SLATE_MUTED, margin: "0 0 18px" }}>Performance by question type</p>
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" }}>
        {rows.map((r) => {
          const c = perfColor(r.pct);
          return (
            <div key={r.type}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: SLATE_STRONG }}>{READING_QUESTION_LABELS[r.type]}</span>
                <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{r.correct}/{r.attempted}</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: WELL_LINE, overflow: "hidden" }}>
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
      ? { color: WARM_GREEN, fontWeight: 700 }
      : status === "incorrect"
        ? { color: "var(--ex-red)", fontWeight: 700, textDecoration: "line-through" }
        : { color: SLATE_MUTED, fontWeight: 600, textDecoration: "line-through" };
  const shownStudent = status === "skipped" ? "no answer" : display(item.student_answer.trim() || "no answer");

  return (
    <article style={{ border: `1px solid ${s.ring}`, borderLeft: `4px solid ${s.border}`, background: s.bg, borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
        <div style={{ fontFamily: SANS, fontSize: 16.5, fontWeight: 600, lineHeight: 1.45, color: INK }}>
          <span style={{ color: SLATE_MUTED, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>Q{item.order_index}. </span>
          <span style={{ whiteSpace: "pre-wrap" }}>{item.prompt}</span>
          {flagged ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ex-amber-ink)", fontWeight: 600, marginLeft: 8, verticalAlign: "middle" }}>⚑ flagged</span>
          ) : null}
        </div>
        <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: s.pillBg, color: s.pillTxt, fontFamily: SANS, fontSize: 12.5, fontWeight: 700 }}>{s.icon} {s.label}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 7, background: WELL_LINE, color: SLATE_BODY, fontFamily: SANS, fontSize: 13, fontWeight: 600 }}>{READING_QUESTION_LABELS[item.question_type]}</span>
      </div>

      <div style={{ display: "flex", gap: 26, flexWrap: "wrap", fontFamily: SANS, fontSize: 15, marginBottom: 14 }}>
        <span style={{ color: SLATE_BODY }}>Your answer: <span style={yourAnswerStyle}>{shownStudent}</span></span>
        <span style={{ color: SLATE_BODY }}>Correct: <span style={{ color: WARM_GREEN, fontWeight: 700 }}>{display(item.correct_answer)}</span></span>
      </div>

      {item.supporting_sentence?.trim() ? (
        <blockquote style={{ borderLeft: `3px solid ${BRAND_LINE}`, padding: "2px 0 2px 15px", margin: "0 0 13px", fontStyle: "italic", color: SLATE_BODY, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55 }}>
          “{item.supporting_sentence.trim()}”
        </blockquote>
      ) : isNotGiven ? (
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: SLATE_BODY, margin: "0 0 13px" }}>
          Nothing in the passage states this — which is exactly why the answer is <em>Not Given</em>. Don&apos;t let outside knowledge or a plausible guess fill the gap.
        </p>
      ) : null}

      {item.explanation?.trim() ? (
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: SLATE_STRONG, margin: 0 }}>
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
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 13, padding: "7px 0", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: BRAND, textDecoration: "underline", textUnderlineOffset: 3 }}
      >
        {open ? "Hide passage ▴" : "Find it in the passage ▾"}
      </button>
      {open ? (
        <p style={{ marginTop: 12, padding: "15px 18px", background: PANEL, border: `1px solid ${SLATE_LINE}`, borderRadius: 11, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.7, color: SLATE_STRONG }}>
          {before}
          <mark style={{ background: "var(--tk-tint-amber-bg)", color: INK, borderRadius: 3, padding: "1px 3px" }}>{body.slice(idx, idx + trimmed.length)}</mark>
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
