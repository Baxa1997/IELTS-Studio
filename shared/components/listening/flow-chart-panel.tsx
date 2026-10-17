"use client";

import { Fragment } from "react";
import { Check, X } from "lucide-react";
import { FlagButton, NumChip } from "./question-ui";
import { BAD, RUN } from "./theme";
import type { FlowChartView, QCtx } from "./types";
import { PANEL } from "@/lib/theme/tokens";

import { QuestionsHeading } from "./choice-panels";
import { gapNums, rangeLabel, templateParts } from "./completion-panels";

/** One flow-chart gap — a letter `<select>` drawn from the shared word bank,
 *  with the same graded border / correct-letter reveal as the matching run. */
function FlowGapSelect({ n, letters, ctx }: { n: number; letters: string[]; ctx: QCtx }) {
  const r = ctx.results?.get(n) ?? null;
  const graded = ctx.results != null;
  const border = r ? (r.is_correct ? RUN.ok : BAD) : ctx.focusedQ === n ? RUN.v : RUN.bField;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "middle" }}>
      <select
        value={ctx.answers[n] ?? ""}
        disabled={graded}
        aria-label={`Answer ${n}`}
        onChange={(e) => {
          ctx.setFocus(n);
          ctx.setAnswers((prev) => ({ ...prev, [n]: e.target.value }));
        }}
        style={{
          width: 70,
          height: 36,
          padding: "0 10px",
          borderRadius: 9,
          border: `1.5px solid ${border}`,
          background: r ? (r.is_correct ? RUN.okTint : RUN.badTint) : PANEL,
          fontFamily: RUN.sans,
          fontSize: 14,
          fontWeight: 700,
          color: RUN.t1,
        }}
      >
        <option value="">–</option>
        {letters.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      {r ? (
        r.is_correct ? (
          <Check size={16} style={{ color: RUN.ok }} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <X size={16} style={{ color: BAD }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: RUN.ok, whiteSpace: "nowrap" }}>
              → {r.correct_answer}
            </span>
          </span>
        )
      ) : null}
    </span>
  );
}

/** Flow-chart completion (P3 flow variant) — an ordered process whose gaps are
 *  filled from a shared A–H word bank (letter answers, like the matching run). */
export function FlowChartPanel({ flow, ctx, bare }: { flow: FlowChartView; ctx: QCtx; bare?: boolean }) {
  const letters = Object.keys(flow.options).sort();
  const range = rangeLabel(flow.steps.flatMap(gapNums));
  return (
    <div>
      {bare ? null : (
        <QuestionsHeading
          text={`Questions ${range}`}
          instruction={`Choose your answers from the box — write the correct letter, ${letters[0]}–${letters[letters.length - 1]}.`}
        />
      )}
      {flow.title ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontWeight: 600,
            fontSize: 15,
            color: RUN.t1,
            margin: "2px 0 12px",
          }}
        >
          {flow.title}
        </div>
      ) : null}

      {/* The word bank */}
      <div
        style={{
          border: `1.5px solid ${RUN.bField}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          background: RUN.field,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "7px 18px",
        }}
      >
        {letters.map((letter) => (
          <div
            key={letter}
            style={{ fontFamily: RUN.sans, fontSize: 14, color: RUN.t1, display: "flex", gap: 10 }}
          >
            <strong style={{ width: 16, flex: "none", color: RUN.vHover }}>{letter}</strong>
            <span>{flow.options[letter]}</span>
          </div>
        ))}
      </div>

      {/* The ordered steps, top to bottom */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {flow.steps.map((step, si) => {
          const n = gapNums(step)[0] ?? null;
          const r = n != null ? (ctx.results?.get(n) ?? null) : null;
          const last = si === flow.steps.length - 1;
          return (
            <Fragment key={si}>
              <div
                id={n != null ? `q-${n}` : undefined}
                style={{
                  border: `1.5px solid ${r ? (r.is_correct ? RUN.ok : BAD) : RUN.bField}`,
                  borderRadius: 12,
                  background: r ? (r.is_correct ? RUN.okTint : RUN.badTint) : PANEL,
                  padding: "13px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  fontFamily: RUN.sans,
                  fontSize: 15,
                  color: RUN.t1,
                  lineHeight: 1.9,
                }}
              >
                {n != null ? (
                  <NumChip n={n} answered={(ctx.answers[n] ?? "").trim() !== ""} />
                ) : null}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {templateParts(step).map((part, i) =>
                    "text" in part ? (
                      part.text.trim() ? (
                        <span key={i}>{part.text}</span>
                      ) : null
                    ) : (
                      <FlowGapSelect key={i} n={part.gap} letters={letters} ctx={ctx} />
                    ),
                  )}
                </span>
                {n != null ? (
                  <FlagButton flagged={ctx.flags.has(n)} onClick={() => ctx.toggleFlag(n)} />
                ) : null}
              </div>
              {!last ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    color: RUN.t4,
                    padding: "5px 0",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="6 13 12 19 18 13" />
                  </svg>
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
