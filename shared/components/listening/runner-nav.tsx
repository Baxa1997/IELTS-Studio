"use client";

import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { RUN } from "./theme";
import type { Grade, Source } from "./types";
import { ON_INK, PANEL, SLATE_INK, WHITE, withAlpha } from "@/lib/theme/tokens";

/** Chevron glyph matching the handoff (2.4 stroke Lucide path). */
export function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/** Segmented part tab (1–4). Active = white pill; locked = greyed, not-allowed. */
export function PartTab({
  n,
  active,
  unlocked,
  onClick,
}: {
  n: number;
  active: boolean;
  unlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      title={unlocked ? `Part ${n}` : `Part ${n} — locked until it plays`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 28,
        borderRadius: 7,
        border: "none",
        fontFamily: RUN.sans,
        fontSize: 13,
        fontWeight: 600,
        transition: "all .15s",
        background: active ? PANEL : "transparent",
        color: active ? RUN.vDeep : unlocked ? RUN.t3 : RUN.t5,
        boxShadow: active ? "0 1px 3px rgba(20,20,40,0.12)" : "none",
        cursor: unlocked ? "pointer" : "not-allowed",
      }}
    >
      {n}
    </button>
  );
}

/** Per-question navigation chip (current / flagged / answered / default). */
export function JumpChip({
  n,
  current,
  flagged,
  answered,
  onClick,
}: {
  n: number;
  current: boolean;
  flagged: boolean;
  answered: boolean;
  onClick: () => void;
}) {
  let bg: string = PANEL;
  let color: string = RUN.t3;
  let border: string = RUN.bField;
  let title = `Question ${n}`;
  if (current) {
    bg = RUN.vFill;
    color = WHITE;
    border = RUN.vFill;
    title = `Question ${n} (current)`;
  } else if (flagged) {
    bg = RUN.flagBg;
    color = RUN.flagText;
    border = RUN.flagBorder;
    title = `Question ${n} (flagged)`;
  } else if (answered) {
    bg = RUN.okBg;
    color = RUN.ok;
    border = RUN.okBorder;
    title = `Question ${n} (answered)`;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 8,
        fontFamily: RUN.sans,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .12s",
        border: `1.5px solid ${border}`,
        background: bg,
        color,
      }}
    >
      {n}
    </button>
  );
}

/** Footer: hint + Back + Next part / Submit, switching to the score row after
 *  grading (score + Practice again + Exit). */
export function RunnerFooter({
  isTest,
  grade,
  grading,
  answered,
  totalQ,
  flagCount,
  canBack,
  isLastPart,
  source,
  onBack,
  onNext,
  onSubmit,
  onPracticeAgain,
  onExit,
}: {
  isTest: boolean;
  grade: Grade | null;
  grading: boolean;
  answered: number;
  totalQ: number;
  flagCount: number;
  canBack: boolean;
  isLastPart: boolean;
  source: Source;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onPracticeAgain: () => void;
  onExit: () => void;
}) {
  const good = grade ? grade.score / grade.max_score >= 0.7 : false;
  const primary: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    background: RUN.vFill,
    border: "none",
    color: WHITE,
    fontFamily: RUN.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "0 18px",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: `0 4px 12px ${withAlpha(RUN.vFill, 30)}`,
  };
  const ghost: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    background: PANEL,
    border: `1px solid ${RUN.bBar}`,
    color: RUN.t2,
    fontFamily: RUN.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "0 16px",
    borderRadius: 10,
    cursor: "pointer",
  };
  const showNextPart = isTest && !isLastPart;
  return (
    <footer
      style={{
        flexShrink: 0,
        minHeight: 56,
        background: PANEL,
        borderTop: `1px solid ${RUN.bBar}`,
        padding: "9px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {grade ? (
        <>
          <span style={{ fontSize: 15, fontWeight: 800, color: good ? RUN.ok : RUN.t1 }}>
            {grade.score}
            <span style={{ color: RUN.t4, fontWeight: 600 }}>/{grade.max_score}</span> correct
          </span>
          {grade.band != null ? (
            <span
              style={{
                padding: "5px 12px",
                borderRadius: 9,
                background: RUN.vBg,
                border: `1px solid ${RUN.vBorder}`,
                color: RUN.vDeep,
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              Band {grade.band.toFixed(1)}
            </span>
          ) : null}
          <div style={{ flex: 1 }} />
          {grade.attempt_id ? (
            <a
              href={`/listen/results/${grade.attempt_id}`}
              style={{ ...ghost, textDecoration: "none" }}
            >
              Full report
              <ArrowRight size={15} />
            </a>
          ) : null}
          {/* One free practice a day: "again" would be a second one. */}
          {source === "public" ? null : (
            <button type="button" onClick={onPracticeAgain} style={ghost}>
              <RotateCcw size={15} /> Practice again
            </button>
          )}
          <button type="button" onClick={onExit} style={primary}>
            {source === "library" ? "Back to library" : source === "public" ? "All free practice" : "Back to Listening"}
            <Chevron dir="right" />
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              background: SLATE_INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: ON_INK,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t3 }}>
            {answered} of {totalQ} answered
            {flagCount ? ` · ${flagCount} flagged for review` : ""}
            {isTest ? " · Switch parts with the tabs above" : ""}
          </span>
          <div style={{ flex: 1 }} />
          {isTest ? (
            <button
              type="button"
              onClick={onBack}
              disabled={!canBack}
              style={{
                ...ghost,
                color: canBack ? RUN.t2 : RUN.t5,
                cursor: canBack ? "pointer" : "not-allowed",
              }}
            >
              <Chevron dir="left" /> Back
            </button>
          ) : null}
          {/* Submit is always reachable — on a test you can grade from any part,
              not only the last one. Next part stays the primary "keep going". */}
          {showNextPart ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={grading}
              style={{
                ...ghost,
                background: RUN.vBg,
                borderColor: "transparent",
                color: RUN.vDeep,
                opacity: grading ? 0.75 : 1,
                cursor: grading ? "default" : "pointer",
              }}
            >
              {grading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Checking…
                </>
              ) : (
                "Submit & finish"
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={showNextPart ? onNext : onSubmit}
            disabled={grading && !showNextPart}
            style={{
              ...primary,
              opacity: grading && !showNextPart ? 0.75 : 1,
              cursor: grading && !showNextPart ? "default" : "pointer",
            }}
          >
            {showNextPart ? (
              <>
                Next part <Chevron dir="right" />
              </>
            ) : grading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Checking…
              </>
            ) : (
              <>
                Submit answers <Chevron dir="right" />
              </>
            )}
          </button>
        </>
      )}
    </footer>
  );
}
