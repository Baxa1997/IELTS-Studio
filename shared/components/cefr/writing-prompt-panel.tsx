"use client";

import { Check, Sparkles } from "lucide-react";
import {
  BRAND_LINE as D_ABORDER2,
  BRAND_SOFT as W_SOFT,
  PANEL,
  WARM_GREEN as GOOD,
} from "@/lib/theme/tokens";

import { JAKARTA, PLEX } from "./design";
import type { WritingTask } from "./types";
import {
  W_ACCENT,
  W_BODY,
  W_CANVAS,
  W_FAINT,
  W_INK,
  W_LINE,
  W_MUTED,
  W_SOFT2,
  W_SOFTLINE,
} from "./writing-design";

export function WritingPromptPanel({
  task,
  words,
  wordPct,
  lengthMet,
  graded,
}: {
  task: WritingTask;
  words: number;
  wordPct: number;
  lengthMet: boolean;
  graded: boolean;
}) {
  const context = task.situation || task.forum_context || task.problem;
  return (
    <aside
      className="ml-wr-prompt"
      style={{
        width: 348,
        flexShrink: 0,
        background: PANEL,
        border: `1px solid ${W_LINE}`,
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${W_SOFTLINE}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 13,
            }}
          >
            <span
              style={{
                fontFamily: JAKARTA,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: ".13em",
                color: W_FAINT,
              }}
            >
              THE TASK
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 26,
                padding: "0 11px",
                borderRadius: 7,
                background: W_SOFT,
                color: W_ACCENT,
                fontFamily: JAKARTA,
                fontSize: 12.5,
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {task.register}
            </span>
          </div>
          {context ? (
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: JAKARTA,
                fontSize: 13,
                lineHeight: 1.6,
                color: W_MUTED,
                padding: "10px 12px",
                background: W_CANVAS,
                border: `1px solid ${W_LINE}`,
                borderRadius: 10,
              }}
            >
              {context}
            </p>
          ) : null}
          <p
            style={{
              margin: 0,
              fontFamily: PLEX,
              fontSize: 18.5,
              lineHeight: 1.5,
              fontWeight: 400,
              color: W_INK,
              whiteSpace: "pre-wrap",
            }}
          >
            {task.question || task.prompt}
          </p>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: JAKARTA,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: W_MUTED,
            }}
          >
            COVER ALL POINTS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {task.required_content_points.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "10px 12px",
                  background: W_CANVAS,
                  border: `1px solid ${W_SOFTLINE}`,
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: W_SOFT,
                    color: W_ACCENT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: JAKARTA,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontFamily: JAKARTA,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: W_BODY,
                    lineHeight: 1.5,
                  }}
                >
                  {c}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 12px",
                background: W_SOFT2,
                border: `1px solid ${D_ABORDER2}`,
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: lengthMet ? "var(--ex-ok-soft)" : PANEL,
                  border: lengthMet ? "none" : `2px solid ${D_ABORDER2}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {lengthMet ? <Check size={13} strokeWidth={3} style={{ color: GOOD }} /> : null}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontFamily: JAKARTA, fontSize: 13.5, fontWeight: 600, color: W_BODY }}
                  >
                    {task.word_range[0]}–{task.word_range[1]} words
                  </span>
                  <span
                    style={{
                      fontFamily: JAKARTA,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: W_ACCENT,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {words}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 7,
                    height: 5,
                    borderRadius: 3,
                    background: W_SOFT,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${wordPct}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: W_ACCENT,
                      transition: "width .3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: "13px 20px",
          borderTop: `1px solid ${W_SOFTLINE}`,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <Sparkles size={15} style={{ color: W_FAINT, flexShrink: 0 }} />
        <span style={{ fontFamily: JAKARTA, fontSize: 12.5, color: W_FAINT, lineHeight: 1.4 }}>
          {graded ? "A model answer is in your result." : "A model answer unlocks after you grade."}
        </span>
      </div>
    </aside>
  );
}
