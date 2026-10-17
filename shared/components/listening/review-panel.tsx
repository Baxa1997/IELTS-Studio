"use client";

import { TRAP_EXPLAIN } from "./trap-explain";
import { BAD, RUN } from "./theme";
import type { Grade } from "./types";
import { PANEL } from "@/lib/theme/tokens";

// ---- Review -------------------------------------------------------------------

export function ReviewPanel({ grade }: { grade: Grade }) {
  const wrong = grade.results.filter((r) => !r.is_correct);
  const trapped = grade.results.filter((r) => r.trap && TRAP_EXPLAIN[r.trap]);
  const ratio = grade.score / grade.max_score;
  const card: React.CSSProperties = {
    background: PANEL,
    border: `1px solid ${RUN.bCard}`,
    borderRadius: 16,
    padding: "20px 22px",
  };
  const heading: React.CSSProperties = {
    fontFamily: RUN.display,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: "-0.01em",
    margin: "0 0 12px",
    color: RUN.t1,
  };
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score summary */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: RUN.display,
            fontSize: 40,
            fontWeight: 700,
            color: ratio >= 0.7 ? RUN.ok : ratio >= 0.4 ? RUN.t1 : BAD,
            lineHeight: 1,
          }}
        >
          {grade.score}
          <span style={{ fontSize: 20, color: RUN.t4 }}>/{grade.max_score}</span>
        </span>
        {grade.band != null ? (
          <span
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              background: RUN.vBg,
              border: `1px solid ${RUN.vBorder}`,
              color: RUN.vDeep,
              fontWeight: 700,
              fontSize: 17,
              whiteSpace: "nowrap",
            }}
          >
            Band {grade.band.toFixed(1)}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: RUN.sans, fontWeight: 700, fontSize: 15.5, color: RUN.t1 }}>
            {grade.score === grade.max_score
              ? "Perfect — every answer caught."
              : wrong.length <= 3
                ? "Strong listening — review the ones that got away."
                : "Good practice — the traps below are where the marks went."}
          </div>
          <div style={{ fontFamily: RUN.sans, fontSize: 13.5, color: RUN.t3, marginTop: 3 }}>
            Corrections are marked next to each question above. The transcript below shows exactly
            where each answer was said.
          </div>
        </div>
        {(grade.parts ?? []).length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            {(grade.parts ?? []).map((p) => (
              <span
                key={p.part}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: RUN.bRow,
                  border: `1px solid ${RUN.bTab}`,
                  fontFamily: RUN.sans,
                  fontSize: 13,
                  fontWeight: 700,
                  color: p.score / p.max_score >= 0.7 ? RUN.ok : RUN.t2,
                }}
              >
                Part {p.part}: {p.score}/{p.max_score}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Trap explanations */}
      {trapped.length > 0 ? (
        <div style={card}>
          <h3 style={heading}>Why the traps worked</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trapped.map((r) => (
              <div key={r.q} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    flex: "none",
                    width: 30,
                    height: 24,
                    borderRadius: 7,
                    background: r.is_correct ? RUN.okBg : RUN.badBg,
                    color: r.is_correct ? RUN.ok : BAD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: RUN.sans,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  {r.q}
                </span>
                <div
                  style={{ fontFamily: RUN.sans, fontSize: 13.5, lineHeight: 1.55, color: RUN.t2 }}
                >
                  <strong style={{ color: RUN.t1 }}>{r.correct_answer}</strong> —{" "}
                  {TRAP_EXPLAIN[r.trap as string]}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Transcript */}
      <div style={card}>
        <h3 style={heading}>Transcript</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grade.transcript.map((l, i) => (
            <div
              key={i}
              style={{ fontFamily: RUN.sans, fontSize: 14, lineHeight: 1.6, color: RUN.t1 }}
            >
              <span style={{ fontWeight: 700, color: RUN.v }}>{l.speaker}: </span>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
