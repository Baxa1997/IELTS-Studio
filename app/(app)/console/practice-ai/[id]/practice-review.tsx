"use client";

import { useState } from "react";

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
 * Grouped by stage, because whether a lesson reaches production or stops at
 * recognition is the single most useful thing to see at a glance.
 */

const INK = "#15171C";
const BODY = "#2A2D34";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#C5C4BE";
const GREEN = "#16794C";

const STAGES = [
  {
    key: "controlled",
    label: "Warm up",
    note: "Spot and produce the form with support.",
  },
  {
    key: "semi_controlled",
    label: "Now change it",
    note: "Transform and correct — where understanding shows.",
  },
  {
    key: "freer",
    label: "Now write your own",
    note: "Their own language. The only proof they can use it.",
  },
] as const;

/** Ordering and matching answer with a sequence — see the note in Row. */
function isSequenceType(type: string): boolean {
  return type === "ordering" || type === "matching";
}

export function PracticeReview({ exercises }: { exercises: Exercise[] }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <section style={{ marginTop: 34 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          paddingBottom: 14,
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif4), Georgia, serif",
            fontSize: 24,
            fontWeight: 700,
            color: INK,
            letterSpacing: "-.015em",
            margin: 0,
          }}
        >
          Practice
        </h2>
        <span style={{ fontSize: 13.5, color: MUTED, flex: 1, minWidth: 160 }}>
          {exercises.length} question{exercises.length === 1 ? "" : "s"}, in the order students see
          them.
        </span>
        {/* Printing follows the toggle, which is the whole trick: the same page
            is a worksheet with answers off and an answer key with them on, so a
            teacher gets both documents from one screen and neither can drift
            from the lesson students actually sit. */}
        <button
          type="button"
          className="pa-noprint"
          onClick={() => window.print()}
          title={
            showAnswers
              ? "Print or save as PDF — with the answer key"
              : "Print or save as PDF — the worksheet, no answers"
          }
          style={{
            border: `1px solid ${LINE}`,
            background: "#fff",
            color: MUTED,
            borderRadius: 999,
            padding: "7px 14px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showAnswers ? "PDF (with answers)" : "PDF (worksheet)"}
        </button>
        <button
          type="button"
          className="pa-noprint"
          onClick={() => setShowAnswers((v) => !v)}
          aria-pressed={showAnswers}
          style={{
            border: `1px solid ${showAnswers ? "#B6D9C4" : LINE}`,
            background: showAnswers ? "#EAF4EE" : "#fff",
            color: showAnswers ? GREEN : MUTED,
            borderRadius: 999,
            padding: "7px 14px",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showAnswers ? "Hide answers" : "Show answers"}
        </button>
      </div>

      {STAGES.map((stage) => {
        const items = exercises.filter((e) => e.stage === stage.key);
        if (items.length === 0) return null;
        return (
          <div key={stage.key} style={{ marginTop: 26 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14.5, fontWeight: 650, color: INK }}>{stage.label}</div>
              <div style={{ fontSize: 12.5, color: FAINT }}>{stage.note}</div>
            </div>
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
    <div className="pa-q" style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: "1px solid #F4F2ED" }}>
      <span
        style={{
          flex: "none",
          width: 22,
          fontSize: 12.5,
          color: FAINT,
          fontVariantNumeric: "tabular-nums",
          paddingTop: 2,
        }}
      >
        {n}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15.5, color: BODY, lineHeight: 1.55 }}>{exercise.prompt}</div>

        {/* An ordering or matching answer is a SEQUENCE, so highlighting "the
            correct options" says nothing — every option is in the answer, and
            the key came out as a wall of green with the actual order invisible.
            The order is the answer, so the order is what gets shown. */}
        {closedEx?.options && isSequenceType(closedEx.type) ? (
          <div style={{ marginTop: 8 }}>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, color: BODY, lineHeight: 1.55 }}>
              {(showAnswers ? closedEx.answers : closedEx.options.map((_, i) => String(i))).map(
                (a, pos) => (
                  <li key={`${a}-${pos}`} style={{ marginBottom: 3 }}>
                    {closedEx.options?.[Number(a)] ?? a}
                  </li>
                ),
              )}
            </ol>
            <div style={{ fontSize: 12, color: FAINT, marginTop: 5 }}>
              {showAnswers ? "The correct order." : "Students put these in order."}
            </div>
          </div>
        ) : closedEx?.options ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {closedEx.options.map((opt, i) => {
              const key = showAnswers && closedEx.answers.includes(String(i));
              return (
                <span
                  key={opt}
                  style={{
                    border: `1px solid ${key ? "#B6D9C4" : LINE}`,
                    background: key ? "#EAF4EE" : "#FAFAF8",
                    color: key ? GREEN : MUTED,
                    borderRadius: 999,
                    padding: "4px 11px",
                    fontSize: 13,
                    fontWeight: key ? 600 : 400,
                  }}
                >
                  {opt}
                </span>
              );
            })}
          </div>
        ) : null}

        {showAnswers && closedEx && !closedEx.options ? (
          <div style={{ marginTop: 7, fontSize: 14, color: GREEN }}>
            <strong style={{ fontWeight: 600 }}>Answer:</strong> {closedEx.answers.join("  /  ")}
          </div>
        ) : null}

        {/* An open item has no key — it has the checklist the marker will use.
            Shown with the answers, because "is this marking fair?" is the same
            question as "is this key right?". */}
        {showAnswers && openEx ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12.5, color: FAINT }}>Marked against:</div>
            <ul style={{ margin: "3px 0 0", paddingLeft: 18, fontSize: 14, color: BODY }}>
              {openEx.criteria.map((c) => (
                <li key={c} style={{ marginBottom: 2 }}>
                  {c}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 6, fontSize: 14, color: GREEN }}>
              <strong style={{ fontWeight: 600 }}>Model answer:</strong> {openEx.model_answer}
            </div>
          </div>
        ) : null}

        {showAnswers && exercise.why ? (
          <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>{exercise.why}</div>
        ) : null}

        <span
          style={{
            display: "inline-block",
            marginTop: 7,
            fontSize: 10.5,
            letterSpacing: ".07em",
            textTransform: "uppercase",
            color: "#B9B5AC",
          }}
        >
          {exercise.tag.replaceAll("-", " ")}
          {openEx ? " · written" : ""}
        </span>
      </div>
    </div>
  );
}
