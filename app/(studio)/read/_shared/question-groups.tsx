"use client";

import { isReadingGapType, READING_GAP_MARKER, readingGroupInstruction } from "@/lib/reading/types";

import { GapSentence, InlineBlank, QuestionInput, type DeliveredQuestion } from "./question-inputs";
import { INDIGO, INK, MUTED, SANS } from "./tokens";

/** Each question sits in its own card; the border is brand-indigo (not faint grey)
 *  so the box around the question + its options is clearly visible. */
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
  const groups = groupByType(questions);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {groups.map((group, gi) => {
        const first = number(group[0]);
        const last = number(group[group.length - 1]);
        const range = first === last ? `Question ${first}` : `Questions ${first}–${last}`;
        const type = group[0].question_type;
        const instruction = readingGroupInstruction(type, group[0].word_limit);
        // The shared endings bank (A–F) for a matching-sentence-endings block is the
        // same on every question; show it once under the instruction.
        const endingsBank = type === "matching_sentence_endings" ? group[0].options ?? null : null;
        // Note completion renders as the structured Cambridge notes box (title,
        // sub-headings, bullets, nested dashes, gap-less context lines) — not as
        // one card per line like every other type.
        const isNote = type === "note_completion";
        let lastSection: string | null = null;
        return (
          <section key={gi} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Cambridge instruction header */}
            <div style={{ borderLeft: `3px solid ${INDIGO}`, paddingLeft: 14 }}>
              <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: 15, color: INK, margin: 0, fontVariantNumeric: "tabular-nums" }}>{range}</p>
              <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "5px 0 0" }}>
                {instruction}
              </p>
            </div>

            {endingsBank ? (
              <ul style={{ listStyle: "none", margin: 0, padding: "14px 18px", border: "1px solid #E5E3EF", borderRadius: 12, background: "#FAFAFD", display: "flex", flexDirection: "column", gap: 7 }}>
                {endingsBank.map((opt, i) => (
                  <li key={i} style={{ display: "flex", gap: 9, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: INK }}>
                    <span style={{ flex: "none", fontWeight: 700, color: INDIGO }}>{ENDING_LETTERS[i] ?? i + 1}</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {isNote ? (
              <NoteBlock
                group={group}
                number={number}
                answers={answers}
                onAnswer={onAnswer}
                flags={flags}
                onToggleFlag={onToggleFlag}
              />
            ) : null}

            {!isNote && group.map((q) => {
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
                  <div id={`q-${q.id}`} role="group" style={{ border: `1.5px solid ${QUESTION_BORDER}`, borderRadius: 14, padding: "16px 18px", background: "#fff", scrollMarginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 11, width: "100%" }}>
                      <span style={{ flex: "none", fontWeight: 700, color: INK, fontSize: 16.5, lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>{n}.</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {gap ? (
                          <GapSentence
                            prompt={q.prompt}
                            value={answers[q.id] ?? ""}
                            onChange={(v) => onAnswer(q.id, v)}
                            questionNumber={n}
                          />
                        ) : (
                          <span style={{ display: "block", fontFamily: SANS, fontSize: 16, lineHeight: 1.5, color: INK, whiteSpace: "pre-wrap" }}>{q.prompt}</span>
                        )}
                      </span>
                      {onToggleFlag ? (
                        <button type="button" onClick={() => onToggleFlag(q.id)} aria-pressed={flagged} title="Flag for review" style={flagStyle(flagged)}>⚑</button>
                      ) : null}
                    </div>

                    {gap ? null : (
                      <div style={{ paddingLeft: 26, marginTop: 12 }}>
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
