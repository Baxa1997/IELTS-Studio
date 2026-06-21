"use client";

import { useEffect, useRef, useState } from "react";

import type { ReadingQuestionType } from "@/lib/reading/types";

import { INDIGO, INK, MUTED, RED, SANS } from "./tokens";

/** Answer-free question as delivered to the browser (no key/proof/explanation). */
export interface DeliveredQuestion {
  id: string;
  question_type: ReadingQuestionType;
  order_index: number;
  prompt: string;
  options: string[] | null;
}

const LETTERS = "ABCDEFGHIJKLMNOP".split("");
const VERDICT_OPTIONS: Record<"tfng" | "ynng", [string, string][]> = {
  tfng: [
    ["true", "True"],
    ["false", "False"],
    ["not_given", "Not Given"],
  ],
  ynng: [
    ["yes", "Yes"],
    ["no", "No"],
    ["not_given", "Not Given"],
  ],
};

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv"];
function roman(i: number): string {
  return ROMAN[i] ?? String(i + 1);
}

/** The per-type answer input for one reading question (radio pills, MCQ, select,
 *  or free text). Controlled — the runner owns the answers map. */
export function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: DeliveredQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const { id, question_type, options } = question;

  switch (question_type) {
    case "true_false_not_given":
    case "yes_no_not_given": {
      const choices = VERDICT_OPTIONS[question_type === "true_false_not_given" ? "tfng" : "ynng"];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {choices.map(([val, label]) => (
            <Pill key={val} name={`q-${id}`} value={val} label={label} checked={value === val} onChange={onChange} />
          ))}
        </div>
      );
    }

    case "multiple_choice": {
      if (!options?.length) return <TextAnswer value={value} onChange={onChange} />;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {options.map((opt, i) => (
            <Radio key={i} name={`q-${id}`} value={opt} label={`${LETTERS[i] ?? i + 1}. ${opt}`} checked={value === opt} onChange={onChange} />
          ))}
        </div>
      );
    }

    case "matching_headings":
    case "matching_information": {
      if (!options?.length) return <TextAnswer value={value} onChange={onChange} />;
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="lp-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid #DAD8C9", borderRadius: 10, background: "#fff", fontFamily: SANS, fontSize: 14, color: INK }}>
          <option value="">Choose…</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {question_type === "matching_headings" ? `${roman(i)}. ${opt}` : opt}
            </option>
          ))}
        </select>
      );
    }

    case "sentence_completion":
    case "summary_completion":
    default:
      return <TextAnswer value={value} onChange={onChange} />;
  }
}

function TextAnswer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer…"
      autoComplete="off"
      spellCheck={false}
      className="lp-input"
      style={{ width: "100%", maxWidth: 360, padding: "10px 12px", border: "1px solid #DAD8C9", borderRadius: 10, background: "#fff", fontFamily: SANS, fontSize: 14, color: INK }}
    />
  );
}

const SR_ONLY: React.CSSProperties = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)" };

function Pill({ name, value, label, checked, onChange }: { name: string; value: string; label: string; checked: boolean; onChange: (v: string) => void }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "fit-content",
        cursor: "pointer",
        borderRadius: 10,
        padding: "8px 12px 8px 8px",
        background: checked ? "#F2F1FC" : "transparent",
        transition: "background .14s ease",
      }}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} style={SR_ONLY} />
      <span
        style={{
          flex: "none",
          width: 22,
          height: 22,
          borderRadius: 999,
          border: `2px solid ${checked ? INDIGO : "#C9C7D6"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color .14s ease",
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: 999, background: INDIGO, transform: `scale(${checked ? 1 : 0})`, transition: "transform .14s ease" }} />
      </span>
      <span style={{ fontFamily: SANS, fontSize: 15.5, color: checked ? INK : "#46435C", fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

function Radio({ name, value, label, checked, onChange }: { name: string; value: string; label: string; checked: boolean; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", fontFamily: SANS, fontSize: 14, color: INK }}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} style={{ marginTop: 3, accentColor: INDIGO }} />
      <span style={{ lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

/** Countdown that fires `onExpire` exactly once at zero. Pass `children` to render
 *  your own chrome (e.g. the v2 timer pill) — it receives the `m:ss` text and the
 *  raw seconds left so the caller can style its own warning threshold. */
export function Timer({
  seconds,
  onExpire,
  children,
}: {
  seconds: number;
  onExpire: () => void;
  children?: (text: string, left: number) => React.ReactNode;
}) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!firedRef.current) {
            firedRef.current = true;
            onExpire();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const text = `${mm}:${String(ss).padStart(2, "0")}`;
  if (children) return <>{children(text, left)}</>;

  const urgent = left <= 120;
  return (
    <span style={{ fontFamily: SANS, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: urgent ? RED : MUTED }} aria-label="time remaining">
      {text}
    </span>
  );
}
