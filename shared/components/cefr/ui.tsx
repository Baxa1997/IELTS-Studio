"use client";

import {
  BRAND as D_ACCENT,
  BRAND_DEEP,
  BRAND_DEEP as D_ATEXT,
  BRAND_LINE,
  BRAND_LINE as D_ABORDER2,
  BRAND_SOFT as D_ATINT2,
  BRAND_WASH as D_ATINT,
  FIELD_LINE,
  HERO_B,
  HERO_MID,
  LINE as D_LINE,
  PANEL,
  WARM_GREEN as GOOD,
  WARM_RED as BAD,
  WHITE,
} from "@/lib/theme/tokens";

import { D_ABORDER, D_DARK, D_INK, D_SLATE2, D_SLATE3, JAKARTA, PLEX, SANS } from "./design";
import { splitGaps } from "./helpers";
import type { Options, QResult, ReadingPart } from "./types";

// ---- Shared UI -------------------------------------------------------------

export function ScoreBanner({ score, max, level }: { score: number; max: number; level?: string | null }) {
  const pct = max ? Math.round((score / max) * 100) : 0;
  return (
    <div
      style={{
        background: `linear-gradient(135deg,${HERO_B} 0%,${HERO_MID} 100%)`,
        color: WHITE,
        borderRadius: 12,
        padding: "18px 24px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      <div>
        <div style={{ fontFamily: JAKARTA, fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>
          Your score
        </div>
        <div style={{ fontFamily: PLEX, fontSize: 32, fontWeight: 600 }}>
          {score}
          <span style={{ opacity: 0.7, fontSize: 20 }}> / {max}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {level ? (
          <span
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.25)",
            }}
          >
            <span style={{ fontFamily: PLEX, fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
              ≈ {level}
            </span>
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                opacity: 0.8,
              }}
            >
              indicative
            </span>
          </span>
        ) : null}
        <div style={{ fontFamily: PLEX, fontSize: 28, fontWeight: 600 }}>{pct}%</div>
      </div>
    </div>
  );
}

export function PartHeading({ n, cefr, count }: { n: number; cefr: string; count: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: JAKARTA,
            fontWeight: 700,
            fontSize: 12,
            color: D_SLATE3,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          Part {n}
        </span>
        <span
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: FIELD_LINE,
            display: "inline-block",
          }}
        />
        <span
          style={{
            padding: "4px 11px",
            borderRadius: 100,
            background: D_ATINT,
            color: D_ACCENT,
            fontFamily: JAKARTA,
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {cefr}
        </span>
      </div>
      <span style={{ fontFamily: JAKARTA, fontWeight: 400, fontSize: 12, color: D_SLATE2 }}>
        {count}
      </span>
    </div>
  );
}

/** Short count label for a part's heading ("6 gaps", "9 questions"). */
export function partCountLabel(part: ReadingPart): string {
  if (part.part === 1)
    return `${splitGaps(part.text_with_gaps).filter((s) => s.type === "gap").length} gaps`;
  if (part.part === 2) return `${part.statements.length} questions`;
  if (part.part === 3) return `${part.paragraphs.length} questions`;
  if (part.part === 4) return `${part.mcq.length + part.tfn.length} questions`;
  return `${part.gaps.length + part.mcq.length} questions`;
}

export function Passage({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2
        style={{
          fontFamily: PLEX,
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1.3,
          color: D_DARK,
          margin: "0 0 14px",
        }}
      >
        {title}
      </h2>
      {text
        .split(/\n+/)
        .filter(Boolean)
        .map((para, i) => (
          <p
            key={i}
            style={
              {
                fontFamily: PLEX,
                fontWeight: 400,
                fontSize: 17,
                lineHeight: 2,
                color: D_INK,
                margin: "0 0 12px",
                textWrap: "pretty",
              } as React.CSSProperties
            }
          >
            {para}
          </p>
        ))}
    </div>
  );
}

export function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: D_ATINT2,
        borderRadius: 8,
        margin: "0 0 24px",
        border: `1px solid ${D_ABORDER2}`,
      }}
    >
      <p
        style={{
          fontFamily: JAKARTA,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 14,
          lineHeight: 1.6,
          color: BRAND_DEEP,
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

export function Row({
  n,
  text,
  results,
  graded,
  children,
}: {
  n: number;
  text: string;
  results: Map<number, QResult>;
  graded: boolean;
  children: React.ReactNode;
}) {
  const r = graded ? results.get(n) : undefined;
  return (
    <div
      id={`cefr-q-${n}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderTop: `1px solid ${D_LINE}`,
      }}
    >
      <span
        style={{
          fontFamily: JAKARTA,
          fontWeight: 700,
          fontSize: 13,
          color: D_ACCENT,
          minWidth: 22,
        }}
      >
        {n}.
      </span>
      <div style={{ flex: 1, fontFamily: JAKARTA, fontSize: 14, color: D_INK, lineHeight: 1.5 }}>
        {text}
        {r ? <Verdict r={r} /> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export function McqRow({
  number,
  stem,
  options,
  answers,
  set,
  results,
  graded,
}: {
  number: number;
  stem: string;
  options: Options;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const r = graded ? results.get(number) : undefined;
  const chosen = answers[String(number)] ?? "";
  return (
    <div id={`cefr-q-${number}`} style={{ padding: "14px 0", borderTop: `1px solid ${D_LINE}` }}>
      <div
        style={{
          fontFamily: JAKARTA,
          fontSize: 14,
          fontWeight: 600,
          color: D_DARK,
          marginBottom: 9,
          lineHeight: 1.5,
        }}
      >
        {number}. {stem}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(options).map(([letter, label]) => {
          const isChosen = chosen === letter;
          const isAnswer = r?.correct_answer === letter;
          const border =
            graded && isAnswer ? GOOD : graded && isChosen ? BAD : isChosen ? D_ACCENT : D_LINE;
          return (
            <label
              key={letter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontFamily: JAKARTA,
                fontSize: 13.5,
                color: D_INK,
                padding: "8px 12px",
                borderRadius: 9,
                border: `1px solid ${border}`,
                background: graded && isAnswer ? "var(--ex-cf-ok-tint)" : isChosen ? D_ATINT2 : PANEL,
                cursor: graded ? "default" : "pointer",
              }}
            >
              <input
                type="radio"
                name={`q${number}`}
                value={letter}
                checked={isChosen}
                disabled={graded}
                onChange={() => set(number, letter)}
                style={{ accentColor: D_ACCENT }}
              />
              <b style={{ color: D_ACCENT }}>{letter})</b> {label}
            </label>
          );
        })}
      </div>
      {r ? <Verdict r={r} /> : null}
    </div>
  );
}

export function GapInput({
  n,
  answers,
  set,
  results,
  graded,
  width,
}: {
  n: number;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
  width: number;
}) {
  const r = graded ? results.get(n) : undefined;
  const underline = r ? (r.is_correct ? GOOD : BAD) : D_ABORDER;
  return (
    <span
      id={`cefr-q-${n}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        gap: 3,
        margin: "0 3px",
      }}
    >
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "stretch" }}>
        <input
          value={answers[String(n)] ?? ""}
          onChange={(e) => set(n, e.target.value)}
          disabled={graded}
          aria-label={`Gap ${n}`}
          style={{
            height: 26,
            width,
            border: 0,
            borderBottom: `2px solid ${underline}`,
            background: D_ATINT2,
            fontFamily: PLEX,
            fontWeight: 400,
            fontSize: 17,
            padding: "0 8px 2px",
            borderRadius: "3px 3px 0 0",
            color: D_ATEXT,
            outline: "none",
          }}
        />
        {r && !r.is_correct ? (
          <span
            style={{
              fontFamily: JAKARTA,
              fontSize: 10.5,
              fontWeight: 600,
              color: GOOD,
              textAlign: "center",
              marginTop: 2,
            }}
          >
            {r.correct_answer}
          </span>
        ) : null}
      </span>
      <span
        style={{
          fontFamily: JAKARTA,
          fontWeight: 700,
          fontSize: 9,
          lineHeight: 1.4,
          color: D_ACCENT,
          padding: "2px 5px",
          background: D_ATINT,
          borderRadius: 100,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {n}
      </span>
    </span>
  );
}

export function LetterSelect({
  n,
  letters,
  answers,
  set,
  disabled,
}: {
  n: number;
  letters: string[];
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  disabled: boolean;
}) {
  return (
    <select
      value={answers[String(n)] ?? ""}
      onChange={(e) => set(n, e.target.value)}
      disabled={disabled}
      aria-label={`Answer ${n}`}
      style={{
        fontFamily: JAKARTA,
        fontWeight: 700,
        fontSize: 14,
        color: D_ACCENT,
        background: D_ATINT2,
        border: `1px solid ${D_ABORDER}`,
        padding: "6px 10px",
        borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <option value="">—</option>
      {letters.map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}

function Verdict({ r }: { r: QResult }) {
  return (
    <div
      style={{
        marginTop: 6,
        fontFamily: JAKARTA,
        fontSize: 12.5,
        color: r.is_correct ? GOOD : BAD,
      }}
    >
      {r.is_correct
        ? "✓ Correct"
        : `✗ Your answer: ${r.user_answer || "—"} · Correct: ${r.correct_answer}`}
      {!r.is_correct && r.evidence ? (
        <span style={{ color: D_SLATE2 }}> — {r.evidence}</span>
      ) : null}
    </div>
  );
}

export function Feedback({ nums, results }: { nums: number[]; results: Map<number, QResult> }) {
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${D_LINE}`, paddingTop: 12 }}>
      {nums.map((n) => {
        const r = results.get(n);
        if (!r) return null;
        return (
          <div
            key={n}
            style={{
              fontFamily: JAKARTA,
              fontSize: 12.5,
              color: r.is_correct ? GOOD : BAD,
              lineHeight: 1.7,
            }}
          >
            <b>{n}.</b>{" "}
            {r.is_correct
              ? `✓ ${r.correct_answer}`
              : `✗ ${r.user_answer || "—"} → ${r.correct_answer}`}
          </div>
        );
      })}
    </div>
  );
}

export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      style={{
        fontFamily: SANS,
        fontSize: 13,
        color: BAD,
        background: "var(--tk-tint-red-bg)",
        border: `1px solid ${BRAND_LINE}`,
        borderRadius: 10,
        padding: "10px 12px",
        margin: "14px 0 0",
      }}
    >
      {children}
    </p>
  );
}
