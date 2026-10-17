"use client";

import { useMemo } from "react";
import {
  BRAND as D_ACCENT,
  BRAND_SOFT as D_ATINT2,
  LINE as D_LINE,
  PANEL,
  WARM_GREEN as GOOD,
  WARM_RED as BAD,
} from "@/lib/theme/tokens";

import { D_DARK, D_INK, D_PAGE, D_SLATE, D_SLATE2, JAKARTA, PLEX } from "./design";
import { roman, splitGaps } from "./helpers";
import type { P1, P2, P3, P4, P5, QResult, ReadingPart } from "./types";
import {
  Feedback,
  GapInput,
  Instruction,
  LetterSelect,
  McqRow,
  PartHeading,
  Passage,
  Row,
  partCountLabel,
} from "./ui";

// ---- Passage/reference pane · Questions pane, dispatched per part shape ----
//
// Each of the 5 DTM part types is split into a read/reference half (passage
// text, notices, or the headings list) and an answer half (the actual inputs
// + their instructions) so the runner can show them side by side — Part 1 is
// the exception: its gaps are inline in the passage, so its "questions" pane
// is a jump-to navigator instead of a separate answer list.

export function PartPassage({
  part,
  answers,
  set,
  results,
  graded,
}: {
  part: ReadingPart;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  if (part.part === 1)
    return <Part1Passage p={part} answers={answers} set={set} results={results} graded={graded} />;
  if (part.part === 2) return <Part2Passage p={part} />;
  if (part.part === 3) return <Part3Passage p={part} />;
  if (part.part === 4) return <Part4Passage p={part} />;
  return <Part5Passage p={part} />;
}

export function PartQuestions({
  part,
  answers,
  set,
  results,
  graded,
  onJump,
}: {
  part: ReadingPart;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
  onJump: (n: number) => void;
}) {
  if (part.part === 1)
    return (
      <Part1Questions
        p={part}
        answers={answers}
        results={results}
        graded={graded}
        onJump={onJump}
      />
    );
  if (part.part === 2)
    return (
      <Part2Questions p={part} answers={answers} set={set} results={results} graded={graded} />
    );
  if (part.part === 3)
    return (
      <Part3Questions p={part} answers={answers} set={set} results={results} graded={graded} />
    );
  if (part.part === 4)
    return (
      <Part4Questions p={part} answers={answers} set={set} results={results} graded={graded} />
    );
  return <Part5Questions p={part} answers={answers} set={set} results={results} graded={graded} />;
}

// ---- Part 1 — sentence gap-fill (answers are inline in the passage) -------

function Part1Passage({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P1;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const segments = useMemo(() => splitGaps(p.text_with_gaps), [p.text_with_gaps]);
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Instruction>{p.instruction}</Instruction>
      <h2
        style={{
          fontFamily: PLEX,
          fontWeight: 600,
          fontSize: 26,
          lineHeight: 1.3,
          color: D_DARK,
          margin: "0 0 20px",
        }}
      >
        {p.title}
      </h2>
      <p
        style={
          {
            fontFamily: PLEX,
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 2.4,
            color: D_INK,
            margin: 0,
            textWrap: "pretty",
          } as React.CSSProperties
        }
      >
        {segments.map((s, i) =>
          s.type === "text" ? (
            <span key={i}>{s.value}</span>
          ) : (
            <GapInput
              key={i}
              n={s.number}
              answers={answers}
              set={set}
              results={results}
              graded={graded}
              width={100}
            />
          ),
        )}
      </p>
    </>
  );
}

function Part1Questions({
  p,
  answers,
  results,
  graded,
  onJump,
}: {
  p: P1;
  answers: Record<string, string>;
  results: Map<number, QResult>;
  graded: boolean;
  onJump: (n: number) => void;
}) {
  const nums = useMemo(
    () =>
      splitGaps(p.text_with_gaps)
        .filter((s) => s.type === "gap")
        .map((s) => (s as { number: number }).number),
    [p.text_with_gaps],
  );
  return (
    <>
      <p
        style={{
          fontFamily: JAKARTA,
          fontSize: 13,
          color: D_SLATE,
          margin: "0 0 16px",
          lineHeight: 1.6,
        }}
      >
        {graded
          ? "Tap a gap to jump back to it in the passage."
          : "Fill in the blanks in the passage on the left — tap a gap here to jump to it."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {nums.map((n) => {
          const filled = !!(answers[String(n)] ?? "").trim();
          const r = graded ? results.get(n) : undefined;
          const border = r ? (r.is_correct ? GOOD : BAD) : filled ? D_ACCENT : D_LINE;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onJump(n)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1px solid ${border}`,
                background: r
                  ? r.is_correct
                    ? "var(--ex-cf-ok-tint)"
                    : "var(--ex-cf-bad-tint)"
                  : filled
                    ? D_ATINT2
                    : PANEL,
                cursor: "pointer",
                fontFamily: JAKARTA,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: D_ACCENT }}>Gap {n}</span>
              {r ? (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: r.is_correct ? GOOD : BAD }}>
                  {r.is_correct ? "Correct" : `${r.user_answer || "—"} → ${r.correct_answer}`}
                </span>
              ) : (
                <span style={{ fontSize: 12.5, color: filled ? D_ACCENT : D_SLATE2 }}>
                  {filled ? "Filled" : "Empty"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---- Part 2 — text matching (notices left, statements right) --------------

function Part2Passage({ p }: { p: P2 }) {
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Instruction>{p.instruction}</Instruction>
      <div
        style={{
          fontFamily: JAKARTA,
          fontWeight: 700,
          fontSize: 15,
          color: D_DARK,
          margin: "0 0 12px",
        }}
      >
        {p.theme}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {p.texts.map((t) => (
          <div
            key={t.letter}
            style={{
              border: `1px solid ${D_LINE}`,
              borderRadius: 10,
              padding: "12px 14px",
              background: D_PAGE,
            }}
          >
            <div style={{ fontFamily: JAKARTA, fontWeight: 700, fontSize: 13.5, color: D_DARK }}>
              <span style={{ color: D_ACCENT }}>{t.letter}.</span> {t.title}
            </div>
            <div
              style={{
                fontFamily: JAKARTA,
                fontSize: 13,
                color: D_SLATE,
                lineHeight: 1.6,
                marginTop: 4,
              }}
            >
              {t.body}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Part2Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P2;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const letters = p.texts.map((t) => t.letter);
  return (
    <>
      {p.statements.map((s) => (
        <Row key={s.number} n={s.number} text={s.text} results={results} graded={graded}>
          <LetterSelect
            n={s.number}
            letters={letters}
            answers={answers}
            set={set}
            disabled={graded}
          />
        </Row>
      ))}
    </>
  );
}

// ---- Part 3 — heading matching (headings list left, paragraphs right) -----

function Part3Passage({ p }: { p: P3 }) {
  const letters = Object.keys(p.headings);
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Instruction>{p.instruction}</Instruction>
      <div
        style={{
          border: `1px solid ${D_LINE}`,
          borderRadius: 10,
          padding: "14px 16px",
          background: D_PAGE,
        }}
      >
        <div
          style={{
            fontFamily: JAKARTA,
            fontWeight: 700,
            fontSize: 12,
            color: D_SLATE2,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 8,
          }}
        >
          List of headings
        </div>
        {letters.map((l) => (
          <div
            key={l}
            style={{ fontFamily: JAKARTA, fontSize: 13.5, color: D_INK, lineHeight: 1.75 }}
          >
            <b style={{ color: D_ACCENT }}>{l}.</b> {p.headings[l]}
          </div>
        ))}
      </div>
    </>
  );
}

function Part3Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P3;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  const letters = Object.keys(p.headings);
  return (
    <>
      {p.paragraphs.map((para, i) => (
        <div key={para.question} style={{ marginBottom: 18 }}>
          <Row
            n={para.question}
            text={`Paragraph ${roman(i + 1)}`}
            results={results}
            graded={graded}
          >
            <LetterSelect
              n={para.question}
              letters={letters}
              answers={answers}
              set={set}
              disabled={graded}
            />
          </Row>
          <p
            style={
              {
                fontFamily: PLEX,
                fontSize: 15,
                lineHeight: 1.85,
                color: D_INK,
                margin: "10px 0 0",
              } as React.CSSProperties
            }
          >
            {para.text}
          </p>
        </div>
      ))}
    </>
  );
}

// ---- Part 4 — passage + MCQ/T-F-NI (passage left, questions right) --------

function Part4Passage({ p }: { p: P4 }) {
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Passage title={p.title} text={p.text} />
    </>
  );
}

function Part4Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P4;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  return (
    <>
      <Instruction>{p.instruction_mcq}</Instruction>
      {p.mcq.map((q) => (
        <McqRow
          key={q.number}
          number={q.number}
          stem={q.stem}
          options={q.options}
          answers={answers}
          set={set}
          results={results}
          graded={graded}
        />
      ))}
      <Instruction>{p.instruction_tfn}</Instruction>
      {p.tfn.map((q) => (
        <McqRow
          key={q.number}
          number={q.number}
          stem={q.statement}
          options={{ A: "True", B: "False", C: "No Information" }}
          answers={answers}
          set={set}
          results={results}
          graded={graded}
        />
      ))}
    </>
  );
}

// ---- Part 5 — summary gap-fill + MCQ (passage left, questions right) ------

function Part5Passage({ p }: { p: P5 }) {
  return (
    <>
      <PartHeading n={p.part} cefr={p.cefr} count={partCountLabel(p)} />
      <Passage title={p.title} text={p.text} />
    </>
  );
}

function Part5Questions({
  p,
  answers,
  set,
  results,
  graded,
}: {
  p: P5;
  answers: Record<string, string>;
  set: (n: number | string, v: string) => void;
  results: Map<number, QResult>;
  graded: boolean;
}) {
  return (
    <>
      <Instruction>{p.instruction_gap}</Instruction>
      {p.gaps.map((g) => {
        const segs = splitGaps(
          g.sentence.includes("_")
            ? g.sentence.replace(/_+/, `(${g.number}) ______`)
            : `${g.sentence} (${g.number}) ______`,
        );
        return (
          <p
            key={g.number}
            style={
              {
                fontFamily: PLEX,
                fontSize: 16,
                lineHeight: 2.1,
                color: D_INK,
                margin: "0 0 10px",
              } as React.CSSProperties
            }
          >
            {segs.map((s, i) =>
              s.type === "text" ? (
                <span key={i}>{s.value}</span>
              ) : (
                <GapInput
                  key={i}
                  n={g.number}
                  answers={answers}
                  set={set}
                  results={results}
                  graded={graded}
                  width={100}
                />
              ),
            )}
          </p>
        );
      })}
      {graded ? <Feedback nums={p.gaps.map((g) => g.number)} results={results} /> : null}
      <div style={{ height: 10 }} />
      <Instruction>{p.instruction_mcq}</Instruction>
      {p.mcq.map((q) => (
        <McqRow
          key={q.number}
          number={q.number}
          stem={q.stem}
          options={q.options}
          answers={answers}
          set={set}
          results={results}
          graded={graded}
        />
      ))}
    </>
  );
}
