"use client";

import { isReadingGapType, READING_INSTRUCTIONS } from "@/lib/reading/types";

import { GapSentence, QuestionInput, type DeliveredQuestion } from "./question-inputs";
import { INDIGO, INK, MUTED, SANS } from "./tokens";

/** Each question sits in its own card; the border is brand-indigo (not faint grey)
 *  so the box around the question + its options is clearly visible. */
const QUESTION_BORDER = "#C5C9F1";

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
        return (
          <section key={gi} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Cambridge instruction header */}
            <div style={{ borderLeft: `3px solid ${INDIGO}`, paddingLeft: 14 }}>
              <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: 15, color: INK, margin: 0, fontVariantNumeric: "tabular-nums" }}>{range}</p>
              <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "5px 0 0" }}>
                {READING_INSTRUCTIONS[group[0].question_type]}
              </p>
            </div>

            {group.map((q) => {
              const n = number(q);
              const gap = isReadingGapType(q.question_type);
              const flagged = !!flags?.[q.id];
              return (
                <div key={q.id} id={`q-${q.id}`} role="group" style={{ border: `1.5px solid ${QUESTION_BORDER}`, borderRadius: 14, padding: "16px 18px", background: "#fff", scrollMarginTop: 16 }}>
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
