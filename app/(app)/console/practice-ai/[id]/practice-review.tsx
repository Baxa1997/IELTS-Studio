"use client";

import { useState } from "react";

import {
  FAINT,
  GHOST,
  GOOD_BG,
  GOOD_INK,
  INK,
  LIFT_PANEL,
  MUTED,
  READING,
  SERIF,
  SOFT,
  STAGE_META,
  TROUGH,
  WASH_WARM,
} from "@/lib/lessons/theme";
import { isOpen, type Exercise } from "@/lib/lessons/types";

/**
 * The practice half, for a teacher checking it before they set it.
 *
 * ANSWERS ARE BEHIND A TOGGLE, off by default. Showing every key inline roughly
 * doubles the length of the practice and buries the questions in green text —
 * and the first thing a teacher does is read the QUESTIONS, to see whether they
 * are worth setting. Checking the key is the second pass, and it deserves its
 * own gesture rather than being forced on the first.
 *
 * This is deliberately NOT how a student meets the practice. They get one item
 * at a time in the runner, with a navigator; this is the whole worksheet at
 * once, which is what you want when the question is "is this any good?" and
 * exactly what you do not want when the question is "can you do this?".
 *
 * Grouped by stage, because whether a lesson reaches production or stops at
 * recognition is the single most useful thing to see at a glance.
 */

/** Ordering and matching answer with a sequence — see the note in Row. */
function isSequenceType(type: string): boolean {
  return type === "ordering" || type === "matching";
}

export function PracticeReview({ exercises }: { exercises: Exercise[] }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <section
      style={{
        marginTop: 22,
        borderRadius: 28,
        background: "#fff",
        padding: "30px 32px",
        boxShadow: LIFT_PANEL,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: "-.02em",
            color: INK,
            margin: 0,
          }}
        >
          The answer key
        </h2>

        <div className="pa-noprint" style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Printing follows the toggle, which is the whole trick: the same
              page is a worksheet with answers off and an answer key with them
              on, so a teacher gets both documents from one screen and neither
              can drift from the lesson students actually sit. */}
          <button
            type="button"
            onClick={() => window.print()}
            title={
              showAnswers
                ? "Print or save as PDF — with the answer key"
                : "Print or save as PDF — the worksheet, no answers"
            }
            className="pa-lift"
            style={pill(false)}
          >
            {showAnswers ? "PDF (with answers)" : "PDF (worksheet)"}
          </button>
          <button
            type="button"
            onClick={() => setShowAnswers((v) => !v)}
            aria-pressed={showAnswers}
            className="pa-lift"
            style={pill(showAnswers)}
          >
            {showAnswers ? "Hide answers" : "Show answers"}
          </button>
        </div>
      </div>

      <p style={{ margin: "10px 0 0", fontSize: 15.5, lineHeight: 1.6, color: MUTED, maxWidth: "62ch" }}>
        All {exercises.length} question{exercises.length === 1 ? "" : "s"} at once, in the order
        students meet them — the worksheet view, for checking and for printing.
      </p>

      {STAGE_META.map((stage) => {
        const items = exercises.filter((e) => e.stage === stage.key);
        if (items.length === 0) return null;
        return (
          <div key={stage.key} style={{ marginTop: 26 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 10,
                padding: "7px 14px",
                borderRadius: 999,
                background: stage.bg,
                color: stage.ink,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>{stage.label}</span>
              <span style={{ fontSize: 13, opacity: 0.75 }}>{items.length}</span>
            </div>
            <div style={{ fontSize: 13, color: FAINT, margin: "8px 0 4px" }}>{stage.note}</div>

            {items.map((exercise) => (
              <Row
                key={exercise.id}
                exercise={exercise}
                n={exercises.indexOf(exercise) + 1}
                showAnswers={showAnswers}
              />
            ))}
          </div>
        );
      })}
    </section>
  );
}

function Row({
  exercise,
  n,
  showAnswers,
}: {
  exercise: Exercise;
  n: number;
  showAnswers: boolean;
}) {
  const openEx = isOpen(exercise) ? exercise : null;
  const closedEx = isOpen(exercise) ? null : exercise;

  return (
    <div
      className="pa-q"
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 18px",
        marginTop: 10,
        borderRadius: 20,
        background: WASH_WARM,
      }}
    >
      <span
        style={{
          flex: "none",
          width: 24,
          fontSize: 14,
          fontWeight: 700,
          color: GHOST,
          fontVariantNumeric: "tabular-nums",
          paddingTop: 2,
        }}
      >
        {n}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 16, color: READING, lineHeight: 1.55 }}>{exercise.prompt}</div>

        {/* An ordering or matching answer is a SEQUENCE, so highlighting "the
            correct options" says nothing — every option is in the answer, and
            the key came out as a wall of green with the actual order invisible.
            The order is the answer, so the order is what gets shown. */}
        {closedEx?.options && isSequenceType(closedEx.type) ? (
          <div style={{ marginTop: 10 }}>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 15, color: READING, lineHeight: 1.6 }}>
              {(showAnswers ? closedEx.answers : closedEx.options.map((_, i) => String(i))).map(
                (a, pos) => (
                  <li key={`${a}-${pos}`} style={{ marginBottom: 3 }}>
                    {closedEx.options?.[Number(a)] ?? a}
                  </li>
                ),
              )}
            </ol>
            <div style={{ fontSize: 12.5, color: FAINT, marginTop: 6 }}>
              {showAnswers ? "The correct order." : "Students put these in order."}
            </div>
          </div>
        ) : closedEx?.options ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
            {closedEx.options.map((opt, i) => {
              const key = showAnswers && closedEx.answers.includes(String(i));
              return (
                <span
                  key={opt}
                  style={{
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13.5,
                    background: key ? GOOD_BG : "#fff",
                    color: key ? GOOD_INK : SOFT,
                    fontWeight: key ? 700 : 400,
                    boxShadow: key ? "none" : "inset 0 0 0 1px #e4e0d6",
                  }}
                >
                  {opt}
                </span>
              );
            })}
          </div>
        ) : null}

        {showAnswers && closedEx && !closedEx.options ? (
          <div style={{ marginTop: 9, fontSize: 15, color: GOOD_INK }}>
            <strong style={{ fontWeight: 700 }}>Answer:</strong> {closedEx.answers.join("  /  ")}
          </div>
        ) : null}

        {/* An open item has no key — it has the checklist the marker will use.
            Shown with the answers, because "is this marking fair?" is the same
            question as "is this key right?". */}
        {showAnswers && openEx ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12.5, color: FAINT }}>Marked against:</div>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 15, color: READING }}>
              {openEx.criteria.map((c) => (
                <li key={c} style={{ marginBottom: 2 }}>
                  {c}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 8, fontSize: 15, color: GOOD_INK }}>
              <strong style={{ fontWeight: 700 }}>Model answer:</strong> {openEx.model_answer}
            </div>
          </div>
        ) : null}

        {showAnswers && exercise.why ? (
          <div style={{ marginTop: 8, fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
            {exercise.why}
          </div>
        ) : null}

        <span
          style={{
            display: "inline-block",
            marginTop: 10,
            fontSize: 11,
            letterSpacing: ".07em",
            textTransform: "uppercase",
            color: "#b9b5ac",
          }}
        >
          {exercise.tag.replaceAll("-", " ")}
          {openEx ? " · written" : ""}
        </span>
      </div>
    </div>
  );
}

const pill = (on: boolean): React.CSSProperties => ({
  padding: "10px 18px",
  borderRadius: 999,
  border: 0,
  background: on ? GOOD_BG : TROUGH,
  color: on ? GOOD_INK : MUTED,
  fontFamily: "inherit",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
});
