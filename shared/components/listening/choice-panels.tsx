"use client";

import { Check, X } from "lucide-react";
import { FlagButton, NumChip } from "./question-ui";
import { BAD, RUN } from "./theme";
import type { ClusterView, MatchingView, McqView, QCtx } from "./types";
import { PANEL, WHITE } from "@/lib/theme/tokens";

// ---- Letter-answer panels (Parts 2 & 3) -----------------------------------------

export function QuestionsHeading({ text, instruction }: { text: string; instruction: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: RUN.sans,
          fontSize: 11.5,
          fontWeight: 700,
          color: RUN.t6,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          marginBottom: 7,
        }}
      >
        {text}
      </div>
      <div
        style={{
          display: "inline-flex",
          background: RUN.vBg,
          color: RUN.vDeep,
          border: `1px solid ${RUN.vBorder}`,
          borderRadius: 9999,
          padding: "6px 12px",
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        {instruction}
      </div>
    </div>
  );
}

/** "Choose TWO letters" — a pair of questions answered by one 5-option set. */
export function ChooseTwoPanel({ cluster, ctx }: { cluster: ClusterView; ctx: QCtx }) {
  const [qa, qb] = cluster.questions;
  const graded = ctx.results != null;
  const selected = [ctx.answers[qa], ctx.answers[qb]].filter(Boolean) as string[];
  const correctLetters = graded
    ? (ctx.results?.get(qa)?.correct_answer ?? "").split(" or ").filter(Boolean)
    : [];

  const toggle = (letter: string) => {
    if (graded) return;
    ctx.setFocus(qa);
    ctx.setAnswers((prev) => {
      const cur = [prev[qa], prev[qb]].filter(Boolean) as string[];
      let next: string[];
      if (cur.includes(letter)) next = cur.filter((l) => l !== letter);
      else if (cur.length >= 2)
        return prev; // already two picked — deselect one first
      else next = [...cur, letter];
      next.sort();
      return { ...prev, [qa]: next[0] ?? "", [qb]: next[1] ?? "" };
    });
  };

  return (
    <div id={`q-${qa}`}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <QuestionsHeading text={`Questions ${qa} and ${qb}`} instruction="Choose TWO letters." />
        <FlagButton flagged={ctx.flags.has(qa)} onClick={() => ctx.toggleFlag(qa)} />
      </div>
      <div
        style={{
          fontFamily: RUN.sans,
          fontWeight: 400,
          fontSize: 15,
          color: RUN.t1,
          margin: "2px 0 10px",
        }}
      >
        {cluster.stem}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {Object.entries(cluster.options)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, text]) => {
            const on = selected.includes(letter);
            const isCorrect = correctLetters.includes(letter);
            const border = graded
              ? isCorrect
                ? RUN.ok
                : on
                  ? BAD
                  : RUN.bField
              : on
                ? RUN.v
                : RUN.bField;
            const bg = graded
              ? isCorrect
                ? RUN.okTint
                : on
                  ? RUN.badTint
                  : PANEL
              : on
                ? RUN.vBg
                : PANEL;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => toggle(letter)}
                disabled={graded}
                aria-pressed={on}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 13px",
                  borderRadius: 11,
                  border: `1.5px solid ${border}`,
                  background: bg,
                  fontFamily: RUN.sans,
                  fontSize: 14.5,
                  color: RUN.t1,
                  cursor: graded ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1.5px solid ${on || (graded && isCorrect) ? border : RUN.bIdle}`,
                    background: on && !graded ? RUN.vFill : "transparent",
                    color: WHITE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {on && !graded ? (
                    <Check size={14} />
                  ) : graded && isCorrect ? (
                    <Check size={14} style={{ color: RUN.ok }} />
                  ) : graded && on ? (
                    <X size={14} style={{ color: BAD }} />
                  ) : null}
                </span>
                <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
                <span style={{ flex: 1 }}>{text}</span>
              </button>
            );
          })}
      </div>
      {graded && selected.length < 2 ? (
        <div style={{ marginTop: 8, fontSize: 13, color: BAD }}>
          You needed to choose two letters.
        </div>
      ) : null}
    </div>
  );
}

/** Single-answer multiple choice (Part 3, Q21–23). */
export function McqPanel({
  mcqs,
  context,
  ctx,
  bare,
}: {
  mcqs: McqView[];
  context?: string;
  ctx: QCtx;
  bare?: boolean;
}) {
  const graded = ctx.results != null;
  return (
    <div>
      {bare ? null : (
        <QuestionsHeading
          text={`Questions ${mcqs[0].q}–${mcqs[mcqs.length - 1].q}`}
          instruction="Choose the correct letter, A, B or C."
        />
      )}
      {context ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 14.5,
            color: RUN.t2,
            margin: "4px 0 8px",
          }}
        >
          {context}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {mcqs.map((m) => {
          const r = ctx.results?.get(m.q) ?? null;
          return (
            <div key={m.q} id={`q-${m.q}`}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: RUN.sans,
                    fontSize: 12,
                    fontWeight: 700,
                    color: RUN.vHover,
                    background: RUN.vBg,
                    borderRadius: 6,
                    padding: "2px 7px",
                    flex: "none",
                    marginTop: 1,
                  }}
                >
                  {m.q}
                </span>
                <div
                  style={{
                    flex: 1,
                    fontFamily: RUN.sans,
                    fontWeight: 600,
                    fontSize: 14.5,
                    color: RUN.t1,
                  }}
                >
                  {m.stem}
                </div>
                <FlagButton flagged={ctx.flags.has(m.q)} onClick={() => ctx.toggleFlag(m.q)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(m.options)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([letter, text]) => {
                    const on = ctx.answers[m.q] === letter;
                    const isCorrect = graded && r?.correct_answer === letter;
                    const border = graded
                      ? isCorrect
                        ? RUN.ok
                        : on
                          ? BAD
                          : RUN.bField
                      : on
                        ? RUN.v
                        : RUN.bField;
                    const bg = graded
                      ? isCorrect
                        ? RUN.okTint
                        : on
                          ? RUN.badTint
                          : PANEL
                      : on
                        ? RUN.vBg
                        : PANEL;
                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={graded}
                        aria-pressed={on}
                        onClick={() => {
                          ctx.setFocus(m.q);
                          ctx.setAnswers((prev) => ({
                            ...prev,
                            [m.q]: prev[m.q] === letter ? "" : letter,
                          }));
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          padding: "10px 13px",
                          borderRadius: 11,
                          border: `1.5px solid ${border}`,
                          background: bg,
                          fontFamily: RUN.sans,
                          fontSize: 14.5,
                          color: RUN.t1,
                          cursor: graded ? "default" : "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `1.5px solid ${on || isCorrect ? border : RUN.bIdle}`,
                            background: on && !graded ? RUN.vFill : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "none",
                          }}
                        >
                          {on && !graded ? (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: WHITE,
                              }}
                            />
                          ) : isCorrect ? (
                            <Check size={12} style={{ color: RUN.ok }} />
                          ) : graded && on ? (
                            <X size={12} style={{ color: BAD }} />
                          ) : null}
                        </span>
                        <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
                        <span style={{ flex: 1 }}>{text}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Matching run — items matched to a boxed option list by letter. */
export function MatchingPanel({
  matching,
  ctx,
  bare,
}: {
  matching: MatchingView;
  ctx: QCtx;
  bare?: boolean;
}) {
  const graded = ctx.results != null;
  const qs = matching.items.map((it) => it.q);
  const letters = Object.keys(matching.options).sort();
  return (
    <div>
      {bare ? null : (
        <QuestionsHeading
          text={`Questions ${qs[0]}–${qs[qs.length - 1]}`}
          instruction={`Choose your answers from the box — write the correct letter, ${letters[0]}–${letters[letters.length - 1]}.`}
        />
      )}
      {matching.heading ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontWeight: 600,
            fontSize: 15,
            color: RUN.t1,
            margin: "2px 0 10px",
          }}
        >
          {matching.heading}
        </div>
      ) : null}

      {/* The option box */}
      <div
        style={{
          border: `1.5px solid ${RUN.bField}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: RUN.field,
        }}
      >
        {letters.map((letter) => (
          <div
            key={letter}
            style={{ fontFamily: RUN.sans, fontSize: 14, color: RUN.t1, display: "flex", gap: 10 }}
          >
            <strong style={{ width: 16, flex: "none", color: RUN.vHover }}>{letter}</strong>
            <span>{matching.options[letter]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {matching.items.map((it) => {
          const r = ctx.results?.get(it.q) ?? null;
          const border = r ? (r.is_correct ? RUN.ok : BAD) : RUN.bField;
          return (
            <div
              key={it.q}
              id={`q-${it.q}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderTop: `1px solid ${RUN.bRow}`,
                fontFamily: RUN.sans,
                fontSize: 14.5,
              }}
            >
              <NumChip n={it.q} answered={(ctx.answers[it.q] ?? "").trim() !== ""} />
              <span style={{ flex: 1, color: RUN.t2, fontWeight: 600 }}>{it.label}</span>
              <select
                value={ctx.answers[it.q] ?? ""}
                disabled={graded}
                aria-label={`Answer ${it.q}`}
                onChange={(e) => {
                  ctx.setFocus(it.q);
                  ctx.setAnswers((prev) => ({ ...prev, [it.q]: e.target.value }));
                }}
                style={{
                  width: 70,
                  height: 38,
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
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <X size={16} style={{ color: BAD }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: RUN.ok }}>
                      → {r.correct_answer}
                    </span>
                  </span>
                )
              ) : null}
              <FlagButton flagged={ctx.flags.has(it.q)} onClick={() => ctx.toggleFlag(it.q)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
