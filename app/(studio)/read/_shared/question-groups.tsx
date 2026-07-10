"use client";

import { Fragment } from "react";

import { isReadingGapType, READING_GAP_MARKER, readingGroupInstruction } from "@/lib/reading/types";

import { GapSelectSentence, GapSentence, InlineBlank, QuestionInput, type DeliveredQuestion } from "./question-inputs";
import { INDIGO, INK, MUTED, SANS } from "./tokens";

/** Indigo-tinted border for the boxes that stay boxed (flow-chart gap stages);
 *  ordinary questions render as flat rows with an indigo number, no card. */
const QUESTION_BORDER = "#C5C9F1";

const ENDING_LETTERS = "ABCDEFGHIJ".split("");

/**
 * Renders a passage's questions the way the real Cambridge exam frames them:
 * consecutive questions of the same TYPE are grouped under one instruction header
 * ("Questions 1–6 · Do the following statements agree with the information…",
 * "Complete the sentences below. Choose NO MORE THAN TWO WORDS…"). Completion
 * questions show a bordered blank INSIDE the sentence rather than a separate box.
 *
 * Shared by the single-passage runner and the full-test runner so both read
 * identically; the optional flag button is only wired in the full test.
 */
export function QuestionGroups({
  questions,
  number,
  answers,
  onAnswer,
  flags,
  onToggleFlag,
}: {
  questions: DeliveredQuestion[];
  /** Global question number for a question (1..N across the whole test). */
  number: (q: DeliveredQuestion) => number;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  flags?: Record<string, boolean>;
  onToggleFlag?: (id: string) => void;
}) {
  const groups = toRenderGroups(questions);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {groups.map((rg, gi) => {
        const group = rg.questions;
        const first = number(group[0]);
        const last = number(group[group.length - 1]);
        const range = first === last ? `Question ${first}` : `Questions ${first}–${last}`;
        const type = group[0].question_type;
        // Cambridge variants that ride on a base type: a summary answered from an
        // A–J word bank (options present), a notes box drawn as a flow-chart, and
        // a "Choose TWO letters" multiple-choice pair (one stem, one option set).
        const wordBank =
          type === "summary_completion" && group[0].options?.length ? group[0].options : null;
        const flowchart =
          type === "note_completion" && group.some((q) => q.note_meta?.layout === "flowchart");
        const instruction = readingGroupInstruction(type, group[0].word_limit, {
          wordBank: !!wordBank,
          layout: flowchart ? "flowchart" : undefined,
          pickTwo: rg.pickTwo,
        });
        // The shared lettered bank shown once under the instruction — sentence
        // endings, the people of a matching-features block, or a word-bank
        // summary's A–J list — same on every question.
        const letteredBank =
          type === "matching_sentence_endings" || type === "matching_features"
            ? group[0].options ?? null
            : wordBank;
        const bankTitle = type === "matching_features" && letteredBank ? "List of People" : null;
        // Note completion renders as the structured Cambridge notes box (or, when the
        // block is flagged, a flow-chart) — not one card per line like other types.
        const isNote = type === "note_completion";
        let lastSection: string | null = null;
        return (
          <section key={gi} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Cambridge instruction header — a quiet grey box, like the exam paper */}
            <div style={{ background: "#F6F7FA", border: "1px solid #EEEFF4", borderRadius: 12, padding: "13px 16px" }}>
              <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: 14.5, color: INK, margin: 0, fontVariantNumeric: "tabular-nums" }}>{range}</p>
              <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "4px 0 0" }}>
                {instruction}
              </p>
            </div>

            {letteredBank ? (
              <div style={{ border: "1px solid #E5E3EF", borderRadius: 12, background: "#FAFAFD", padding: "14px 18px" }}>
                {bankTitle ? (
                  <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: 13.5, color: INK, margin: "0 0 9px" }}>{bankTitle}</p>
                ) : null}
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                  {letteredBank.map((opt, i) => (
                    <li key={i} style={{ display: "flex", gap: 9, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: INK }}>
                      <span style={{ flex: "none", fontWeight: 700, color: INDIGO }}>{ENDING_LETTERS[i] ?? i + 1}</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {rg.pickTwo ? (
              <PickTwoPanel
                qa={group[0]}
                qb={group[1]}
                answers={answers}
                onAnswer={onAnswer}
                flags={flags}
                onToggleFlag={onToggleFlag}
              />
            ) : null}

            {!rg.pickTwo && isNote ? (
              flowchart ? (
                <FlowChartBlock
                  group={group}
                  number={number}
                  answers={answers}
                  onAnswer={onAnswer}
                  flags={flags}
                  onToggleFlag={onToggleFlag}
                />
              ) : (
                <NoteBlock
                  group={group}
                  number={number}
                  answers={answers}
                  onAnswer={onAnswer}
                  flags={flags}
                  onToggleFlag={onToggleFlag}
                />
              )
            ) : null}

            {!rg.pickTwo && !isNote && group.map((q) => {
              const n = number(q);
              const gap = isReadingGapType(q.question_type);
              const flagged = !!flags?.[q.id];
              // Note-completion sub-heading (e.g. "Adaptations") — render once, when
              // it first appears, exactly like the Cambridge notes layout.
              const sectionHeading =
                q.section && q.section.trim() && q.section !== lastSection ? q.section.trim() : null;
              if (sectionHeading) lastSection = q.section!;
              return (
                <div key={q.id} style={{ display: "contents" }}>
                  {sectionHeading ? (
                    <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: 14.5, color: INK, margin: "4px 0 -4px" }}>{sectionHeading}</p>
                  ) : null}
                  {/* Flat exam row — indigo number, no card border */}
                  <div id={`q-${q.id}`} role="group" style={{ scrollMarginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%" }}>
                      <span style={{ flex: "none", minWidth: 22, fontWeight: 700, color: INDIGO, fontSize: 15.5, lineHeight: 1.55, fontVariantNumeric: "tabular-nums" }}>{n}.</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {gap ? (
                          wordBank ? (
                            <GapSelectSentence
                              prompt={q.prompt}
                              options={wordBank}
                              value={answers[q.id] ?? ""}
                              onChange={(v) => onAnswer(q.id, v)}
                              questionNumber={n}
                            />
                          ) : (
                            <GapSentence
                              prompt={q.prompt}
                              value={answers[q.id] ?? ""}
                              onChange={(v) => onAnswer(q.id, v)}
                              questionNumber={n}
                            />
                          )
                        ) : (
                          <span style={{ display: "block", fontFamily: SANS, fontSize: 15.5, lineHeight: 1.55, color: INK, whiteSpace: "pre-wrap" }}>{q.prompt}</span>
                        )}
                      </span>
                      {onToggleFlag ? (
                        <button type="button" onClick={() => onToggleFlag(q.id)} aria-pressed={flagged} title="Flag for review" style={flagStyle(flagged)}>⚑</button>
                      ) : null}
                    </div>

                    {gap ? null : (
                      <div style={{ paddingLeft: 34, marginTop: 10 }}>
                        <QuestionInput question={q} value={answers[q.id] ?? ""} onChange={(v) => onAnswer(q.id, v)} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

/** Split into runs of consecutive same-type questions (preserving order). */
function groupByType(questions: DeliveredQuestion[]): DeliveredQuestion[][] {
  const out: DeliveredQuestion[][] = [];
  for (const q of questions) {
    const last = out[out.length - 1];
    if (last && last[0].question_type === q.question_type) last.push(q);
    else out.push([q]);
  }
  return out;
}

/** One renderable group: a run of same-type questions, or a "Choose TWO letters"
 *  pair pulled out of a multiple-choice run into its own headed block. */
interface RenderGroup {
  questions: DeliveredQuestion[];
  pickTwo: boolean;
}

/** Two consecutive multiple-choice questions sharing one stem AND one option set
 *  are a choose-two pair — the generator forces that shape server-side, so the
 *  match is deterministic (ordinary MCQs always have distinct stems). */
function isPickTwoPair(a?: DeliveredQuestion, b?: DeliveredQuestion): boolean {
  return (
    !!a &&
    !!b &&
    a.question_type === "multiple_choice" &&
    b.question_type === "multiple_choice" &&
    !!a.options?.length &&
    a.prompt === b.prompt &&
    JSON.stringify(a.options) === JSON.stringify(b.options)
  );
}

/** Type-grouping plus pair extraction, so a pick-two pair gets its own Cambridge
 *  header ("Questions 20–21 · Choose TWO letters.") instead of melting into a
 *  neighbouring single-answer MCQ block. */
function toRenderGroups(questions: DeliveredQuestion[]): RenderGroup[] {
  const out: RenderGroup[] = [];
  for (const typeGroup of groupByType(questions)) {
    if (typeGroup[0].question_type !== "multiple_choice") {
      out.push({ questions: typeGroup, pickTwo: false });
      continue;
    }
    let buf: DeliveredQuestion[] = [];
    const flush = () => {
      if (buf.length) {
        out.push({ questions: buf, pickTwo: false });
        buf = [];
      }
    };
    for (let i = 0; i < typeGroup.length; i++) {
      if (isPickTwoPair(typeGroup[i], typeGroup[i + 1])) {
        flush();
        out.push({ questions: [typeGroup[i], typeGroup[i + 1]], pickTwo: true });
        i++;
      } else {
        buf.push(typeGroup[i]);
      }
    }
    flush();
  }
  return out;
}

/**
 * "Choose TWO letters" — one stem and one shared option set answered by exactly
 * two picks. The two selections are stored (sorted by letter) into the pair's two
 * answer slots, so the existing answers map, autosave, progress count, and grading
 * all work unchanged; the grader credits each correct letter once.
 */
function PickTwoPanel({
  qa,
  qb,
  answers,
  onAnswer,
  flags,
  onToggleFlag,
}: {
  qa: DeliveredQuestion;
  qb: DeliveredQuestion;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  flags?: Record<string, boolean>;
  onToggleFlag?: (id: string) => void;
}) {
  const options = qa.options ?? [];
  const selected = [answers[qa.id], answers[qb.id]].filter(Boolean) as string[];
  const flagged = !!flags?.[qa.id];

  const toggle = (letter: string) => {
    let next: string[];
    if (selected.includes(letter)) next = selected.filter((l) => l !== letter);
    else if (selected.length >= 2) return; // two picked — deselect one first
    else next = [...selected, letter].sort();
    onAnswer(qa.id, next[0] ?? "");
    onAnswer(qb.id, next[1] ?? "");
  };

  return (
    <div id={`q-${qa.id}`} role="group" style={{ scrollMarginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: 15.5, lineHeight: 1.55, color: INK, whiteSpace: "pre-wrap" }}>
          {qa.prompt}
        </span>
        {onToggleFlag ? (
          <button type="button" onClick={() => onToggleFlag(qa.id)} aria-pressed={flagged} title="Flag for review" style={flagStyle(flagged)}>⚑</button>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
        {options.map((opt, i) => {
          const letter = ENDING_LETTERS[i] ?? String(i + 1);
          const on = selected.includes(letter);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(letter)}
              aria-pressed={on}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 11, border: `1.5px solid ${on ? INDIGO : "#EAE8F2"}`, background: on ? "#F6F5FE" : "#fff", fontFamily: SANS, fontSize: 14.5, color: INK, cursor: "pointer", textAlign: "left" }}
            >
              <span aria-hidden style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${on ? INDIGO : "#C9C7D6"}`, background: on ? INDIGO : "#fff", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 13, fontWeight: 800, lineHeight: 1 }}>
                {on ? "✓" : ""}
              </span>
              <strong style={{ width: 16, flex: "none", color: INDIGO }}>{letter}</strong>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function flagStyle(on: boolean): React.CSSProperties {
  return {
    flex: "none",
    width: 30,
    height: 30,
    borderRadius: 9,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: SANS,
    transition: "all .14s ease",
    background: on ? "#FEF6E7" : "#fff",
    border: `1.5px solid ${on ? "#F6D58A" : "#EAE8F2"}`,
    color: on ? "#C77C09" : "#B6B2C8",
  };
}

// ---- Note completion: the structured Cambridge notes box -------------------

const NOTE_INDENT_PX = 22;

/**
 * Renders a note-completion group as ONE notes box, like the real exam: a title,
 * bold section sub-headings, top-level bullets, nested sub-dashes, plain context
 * lines with no blank, and the answerable lines with a numbered inline gap. The
 * layout comes from each question's `note_meta` (title/indent/before); the gap is
 * still wired to the same answers map the per-card renderer uses.
 */
function NoteBlock({
  group,
  number,
  answers,
  onAnswer,
  flags,
  onToggleFlag,
}: {
  group: DeliveredQuestion[];
  number: (q: DeliveredQuestion) => number;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  flags?: Record<string, boolean>;
  onToggleFlag?: (id: string) => void;
}) {
  const title = group.find((q) => q.note_meta?.title?.trim())?.note_meta?.title?.trim() || null;

  return (
    <div style={{ border: "1px solid #E5E3EF", borderRadius: 14, background: "#fff", padding: "18px 20px" }}>
      {title ? (
        <h3 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 16.5, color: INK, margin: "0 0 12px" }}>{title}</h3>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {group.map((q, i) => {
          const n = number(q);
          // Show a section heading only when it differs from the previous note
          // line's (pure — no mutable cursor across the render).
          const sec = q.section?.trim() || null;
          const prevSec = i > 0 ? group[i - 1].section?.trim() || null : null;
          const section = sec && sec !== prevSec ? sec : null;
          const before = q.note_meta?.before ?? [];
          const indent = q.note_meta?.indent ?? 0;
          return (
            <div key={q.id} style={{ display: "contents" }}>
              {section ? (
                <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: 14.5, color: INK, margin: "6px 0 0" }}>{section}</p>
              ) : null}
              {before.map((line, i) => (
                <NoteContextRow key={`${q.id}-b${i}`} text={line.text} indent={line.indent ?? 0} />
              ))}
              <NoteGapRow
                q={q}
                n={n}
                indent={indent}
                value={answers[q.id] ?? ""}
                onChange={(v) => onAnswer(q.id, v)}
                flagged={!!flags?.[q.id]}
                onToggleFlag={onToggleFlag ? () => onToggleFlag(q.id) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A note line with no blank — a lead-in bullet or a plain note between gaps. */
function NoteContextRow({ text, indent }: { text: string; indent: number }) {
  return (
    <div style={{ display: "flex", gap: 9, paddingLeft: indent * NOTE_INDENT_PX, fontFamily: SANS, fontSize: 15.5, lineHeight: 1.6, color: INK }}>
      <span aria-hidden style={{ flex: "none", color: MUTED }}>{indent >= 1 ? "–" : "•"}</span>
      <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
    </div>
  );
}

/** An answerable note line: bullet/dash · text · numbered inline gap · text. */
function NoteGapRow({
  q,
  n,
  indent,
  value,
  onChange,
  flagged,
  onToggleFlag,
}: {
  q: DeliveredQuestion;
  n: number;
  indent: number;
  value: string;
  onChange: (v: string) => void;
  flagged: boolean;
  onToggleFlag?: () => void;
}) {
  const match = q.prompt.match(READING_GAP_MARKER);
  let before = q.prompt;
  let after = "";
  if (match && match.index != null) {
    before = q.prompt.slice(0, match.index);
    after = q.prompt.slice(match.index + match[0].length);
  }
  return (
    <div id={`q-${q.id}`} role="group" style={{ display: "flex", alignItems: "baseline", gap: 9, paddingLeft: indent * NOTE_INDENT_PX, scrollMarginTop: 80 }}>
      <span aria-hidden style={{ flex: "none", color: MUTED, fontFamily: SANS, fontSize: 15.5 }}>{indent >= 1 ? "–" : "•"}</span>
      <span style={{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: 15.5, lineHeight: 2, color: INK }}>
        {before}
        <NumberBadge n={n} />
        <InlineBlank value={value} onChange={onChange} label={`Answer for question ${n}`} />
        {after}
      </span>
      {onToggleFlag ? (
        <button type="button" onClick={onToggleFlag} aria-pressed={flagged} title="Flag for review" style={flagStyle(flagged)}>⚑</button>
      ) : null}
    </div>
  );
}

/** The small boxed question number that sits inline just before a note's blank. */
function NumberBadge({ n }: { n: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, padding: "0 5px", margin: "0 5px", borderRadius: 6, border: `1.5px solid ${INDIGO}`, background: "#F4F3FC", color: INDIGO, fontWeight: 700, fontSize: 12.5, lineHeight: 1, fontVariantNumeric: "tabular-nums", verticalAlign: "middle" }}>
      {n}
    </span>
  );
}

// ---- Flow-chart completion: stages connected by arrows ---------------------

const FLOW_BOX_MAX = 460;

/**
 * Renders a flow-chart-completion group like the real exam: the note lines become a
 * vertical sequence of stage BOXES joined by ↓ arrows, some boxes carrying a
 * numbered inline gap. Same data as a notes box (each question's prompt + gap +
 * note_meta), only drawn as a process flow when the block is flagged
 * `note_meta.layout === "flowchart"`. Gap-less `before` lines become their own
 * stages, so a lead-in step shows ahead of the gapped step.
 */
function FlowChartBlock({
  group,
  number,
  answers,
  onAnswer,
  flags,
  onToggleFlag,
}: {
  group: DeliveredQuestion[];
  number: (q: DeliveredQuestion) => number;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  flags?: Record<string, boolean>;
  onToggleFlag?: (id: string) => void;
}) {
  const title = group.find((q) => q.note_meta?.title?.trim())?.note_meta?.title?.trim() || null;

  // Flatten to an ordered list of stages (gap-less context, then the gapped step)
  // so the arrows can sit cleanly between every consecutive pair.
  const stages: { key: string; node: React.ReactNode }[] = [];
  for (const q of group) {
    const n = number(q);
    for (const [i, line] of (q.note_meta?.before ?? []).entries()) {
      stages.push({ key: `${q.id}-b${i}`, node: <FlowStage text={line.text} /> });
    }
    stages.push({
      key: q.id,
      node: (
        <FlowGapStage
          q={q}
          n={n}
          value={answers[q.id] ?? ""}
          onChange={(v) => onAnswer(q.id, v)}
          flagged={!!flags?.[q.id]}
          onToggleFlag={onToggleFlag ? () => onToggleFlag(q.id) : undefined}
        />
      ),
    });
  }

  return (
    <div style={{ border: "1px solid #E5E3EF", borderRadius: 14, background: "#fff", padding: "18px 20px" }}>
      {title ? (
        <h3 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 16.5, color: INK, margin: "0 0 14px", textAlign: "center" }}>{title}</h3>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {stages.map((s, i) => (
          <Fragment key={s.key}>
            {i > 0 ? (
              <span aria-hidden style={{ color: MUTED, fontSize: 20, lineHeight: 1, padding: "7px 0" }}>↓</span>
            ) : null}
            {s.node}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** A gap-less flow-chart stage (a lead-in or fixed step). */
function FlowStage({ text }: { text: string }) {
  return (
    <div style={{ width: "100%", maxWidth: FLOW_BOX_MAX, border: "1.5px solid #E5E3EF", borderRadius: 12, background: "#FAFAFD", padding: "12px 16px", textAlign: "center", fontFamily: SANS, fontSize: 15, lineHeight: 1.55, color: INK }}>
      {text}
    </div>
  );
}

/** An answerable flow-chart stage: stage text with a numbered inline gap. */
function FlowGapStage({
  q,
  n,
  value,
  onChange,
  flagged,
  onToggleFlag,
}: {
  q: DeliveredQuestion;
  n: number;
  value: string;
  onChange: (v: string) => void;
  flagged: boolean;
  onToggleFlag?: () => void;
}) {
  const match = q.prompt.match(READING_GAP_MARKER);
  let before = q.prompt;
  let after = "";
  if (match && match.index != null) {
    before = q.prompt.slice(0, match.index);
    after = q.prompt.slice(match.index + match[0].length);
  }
  return (
    <div id={`q-${q.id}`} role="group" style={{ position: "relative", width: "100%", maxWidth: FLOW_BOX_MAX, border: `1.5px solid ${QUESTION_BORDER}`, borderRadius: 12, background: "#fff", padding: "14px 16px", textAlign: "center", scrollMarginTop: 80, fontFamily: SANS, fontSize: 15.5, lineHeight: 2, color: INK }}>
      {before}
      <NumberBadge n={n} />
      <InlineBlank value={value} onChange={onChange} label={`Answer for question ${n}`} />
      {after}
      {onToggleFlag ? (
        <button type="button" onClick={onToggleFlag} aria-pressed={flagged} title="Flag for review" style={{ ...flagStyle(flagged), position: "absolute", top: 8, right: 8 }}>⚑</button>
      ) : null}
    </div>
  );
}
