"use client";

import React from "react";
import {
  BRAND,
  BRAND as INDIGO,
  BRAND_LINE,
  BRAND_SOFT,
  CANVAS,
  INDIGO_FILL,
  ON_INDIGO,
  PANEL,
  RED,
  SLATE_BODY as MUTED,
  SLATE_GREEN,
  SLATE_INK,
  SLATE_INK as INK,
  SLATE_LINE as LINE,
  SLATE_AMBER,
  SLATE_AMBER_BG,
  SLATE_MUTED,
  SLATE_MUTED as FAINT,
  SLATE_RED,
  SLATE_RED_BG,
  SLATE_STRONG,
  WARM_WELL,
  WARM_AMBER as AMBER,
  WARM_LINE_SOFT,
  WELL,
  WELL as SOFT,
  WELL_LINE as SOFTLINE,
  withAlpha,
} from "@/lib/theme/tokens";

import { Arrow, EMERALD, SANS, SERIF, TaskPill, bandColor } from "./demo-kit";

// ============================================================================
// 1. WRITING FEEDBACK
// ============================================================================

const MARK = {
  spelling: { bg: SLATE_AMBER_BG, fg: SLATE_AMBER },
  vocab: { bg: BRAND_SOFT, fg: BRAND },
  grammar: { bg: SLATE_RED_BG, fg: SLATE_RED },
};
function Mk({
  kind,
  n,
  children,
}: {
  kind: keyof typeof MARK;
  n: number;
  children: React.ReactNode;
}) {
  const st = MARK[kind];
  return (
    <span
      style={{
        background: st.bg,
        color: st.fg,
        border: `1px solid ${withAlpha(st.fg, 20)}`,
        borderRadius: 5,
        padding: "1px 5px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
      <sup style={{ fontSize: 10, fontWeight: 800, marginLeft: 1 }}>{n}</sup>
    </span>
  );
}

export function WritingFeedbackScreen() {
  const overall = 6.5;
  const bc = bandColor(overall);
  const tiles = [
    { label: "Task Response", band: 6.0, tag: "Needs work", color: AMBER, blk: true },
    { label: "Coherence", band: 6.5, tag: "Solid", color: SLATE_INK, blk: false },
    { label: "Lexical Resource", band: 6.0, tag: "Needs work", color: AMBER, blk: false },
    { label: "Grammar", band: 7.0, tag: "Strong", color: SLATE_INK, blk: false },
  ];
  return (
    <div
      style={{
        width: 1200,
        height: 750,
        background: CANVAS,
        fontFamily: SANS,
        color: INK,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div
        style={{
          height: 60,
          flex: "none",
          background: PANEL,
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 13px 0 11px",
              border: `1px solid ${WARM_LINE_SOFT}`,
              background: SOFT,
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 600,
              color: SLATE_STRONG,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              style={{ stroke: SLATE_STRONG }}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Activities
          </span>
          <span style={{ width: 1, height: 24, background: LINE }} />
          <TaskPill>TASK 2</TaskPill>
          <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>Essay feedback</span>
          <span style={{ color: SLATE_MUTED }}>·</span>
          <span style={{ fontSize: 14, color: SLATE_MUTED }}>Living alone</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 38,
              padding: "0 14px",
              border: `1px solid ${WARM_LINE_SOFT}`,
              background: SOFT,
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 600,
              color: SLATE_STRONG,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              style={{ stroke: SLATE_STRONG }}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export PDF
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              background: INDIGO_FILL,
              color: ON_INDIGO,
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 6px 16px -6px rgba(125,1,50,.7)",
            }}
          >
            Revise with these fixes <Arrow />
          </span>
        </div>
      </div>

      {/* score strip */}
      <div
        style={{
          flex: "none",
          background: PANEL,
          borderBottom: `1px solid ${LINE}`,
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingRight: 26,
            borderRight: "1px solid #EEE9DA",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 0.82,
                color: bc.fg,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-.03em",
              }}
            >
              {overall.toFixed(1)}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  color: FAINT,
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                Overall
                <br />
                band
              </span>
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: bc.fg,
                  background: bc.bg,
                  padding: "2px 9px",
                  borderRadius: 999,
                }}
              >
                {bc.label}
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 13px",
              background: "var(--tk-slate-green-bg)",
              border: "1px solid #CDE9D8",
              borderRadius: 11,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              style={{ stroke: EMERALD }}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span style={{ fontSize: 13.5, color: "var(--tk-slate-green)", fontWeight: 600 }}>
              Up to <strong style={{ fontWeight: 800, color: SLATE_GREEN }}>7.0</strong> with the
              fixes
            </span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 12 }}>
          {tiles.map((t) => (
            <div
              key={t.label}
              style={{
                flex: 1,
                background: t.blk ? SLATE_RED_BG : SOFT,
                border: `1px solid ${t.blk ? BRAND_LINE : SOFTLINE}`,
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED }}>{t.label}</span>
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 800,
                    color: t.blk ? RED : t.color,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {t.band.toFixed(1)}
                </span>
              </div>
              <div
                style={{
                  marginTop: 9,
                  height: 5,
                  borderRadius: 3,
                  background: t.blk ? SLATE_RED_BG : WARM_WELL,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.round((t.band / 9) * 100)}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: t.blk ? RED : t.color,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: t.blk ? RED : t.color === AMBER ? AMBER : SLATE_MUTED,
                }}
              >
                {t.tag}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* workspace */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 16, padding: 16 }}>
        {/* essay */}
        <div
          style={{
            flex: 1,
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: "none",
              padding: "15px 24px",
              borderBottom: `1px solid ${SOFTLINE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>
                Your essay, marked up
              </span>
              <span style={{ fontSize: 13, color: SLATE_MUTED }}>tap a highlight for the fix</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {[
                ["Spelling", MARK.spelling, 1],
                ["Vocabulary", MARK.vocab, 1],
                ["Grammar", MARK.grammar, 1],
              ].map(([lbl, st, n]) => (
                <span key={lbl as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 3,
                      background: (st as { bg: string }).bg,
                      border: `1px solid ${withAlpha((st as { fg: string }).fg, 33)}`,
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: MUTED }}>
                    {lbl as string} <strong style={{ color: INK }}>{n as number}</strong>
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: "30px 40px", overflow: "hidden" }}>
            <div
              style={{
                maxWidth: 720,
                fontFamily: SERIF,
                fontSize: 18,
                lineHeight: 2.0,
                color: SLATE_INK,
              }}
            >
              In recent decades, the number of people choosing to live alone has risen sharply.
              While some regard this as a sign of social breakdown, I believe it{" "}
              <Mk kind="vocab" n={1}>
                primarily reflects
              </Mk>{" "}
              greater{" "}
              <Mk kind="spelling" n={2}>
                independance
              </Mk>{" "}
              and should be seen as a positive development.
              {"\n\n"}
              Firstly, living alone allows individuals to develop essential life skills. When a
              person is solely responsible for cooking, budgeting and cleaning, they inevitably
              become more self-reliant. For example, a young graduate who rents their own flat must
              learn to manage money carefully, which{" "}
              <Mk kind="grammar" n={3}>
                builds a discipline that benefits them later in life
              </Mk>
              .
            </div>
            <p
              style={{
                maxWidth: 720,
                margin: "26px 0 0",
                fontFamily: SANS,
                fontSize: 11.5,
                color: SLATE_MUTED,
              }}
            >
              AI-estimated bands — not affiliated with or endorsed by IELTS®.
            </p>
          </div>
        </div>

        {/* detail panel */}
        <div
          style={{
            width: 480,
            flex: "none",
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{ flex: "none", padding: "14px 16px", borderBottom: `1px solid ${SOFTLINE}` }}
          >
            <div
              style={{ display: "flex", gap: 4, background: WELL, borderRadius: 11, padding: 4 }}
            >
              {["Bands", "Fixes · 3", "Insights", "Write it better"].map((t, i) => (
                <span
                  key={t}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    height: 34,
                    lineHeight: "34px",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 700,
                    background: i === 0 ? PANEL : "transparent",
                    color: i === 0 ? INK : SLATE_MUTED,
                    boxShadow: i === 0 ? "0 1px 3px rgba(26,33,56,.14)" : "none",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, overflow: "hidden" }}>
            <div
              style={{
                background: "var(--tk-tint-red-bg)",
                border: "1px solid #F3CFC6",
                borderRadius: 13,
                padding: "15px 16px",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <svg
                  style={{ stroke: RED }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: RED }}>
                  FIX THIS FIRST
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    fontWeight: 700,
                    color: SLATE_GREEN,
                    background: "var(--tk-slate-green-bg)",
                    border: "1px solid #CDE9D8",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  +0.5 band
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: SLATE_STRONG }}>
                <strong style={{ color: INK }}>Task Response</strong> — you state a clear position,
                but the counter-view is only mentioned, not developed. Give both sides equal,
                specific support to clear Band 7.
              </p>
            </div>
            <div
              style={{
                background: PANEL,
                border: "1px solid #F3CFC6",
                borderRadius: 13,
                padding: "15px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 11,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>Task Response</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: RED,
                      background: "var(--tk-tint-red-bg)",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    Capping
                  </span>
                  <span
                    style={{
                      fontSize: 19,
                      fontWeight: 800,
                      color: RED,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    6.0
                  </span>
                </span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    color: SLATE_MUTED,
                    textTransform: "uppercase",
                  }}
                >
                  In your essay
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: SLATE_STRONG,
                  }}
                >
                  You argue living alone builds independence with a clear graduate example, but
                  never address why others see it as “social breakdown”.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "11px 12px",
                  background: SOFT,
                  border: `1px solid ${SOFTLINE}`,
                  borderRadius: 10,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ stroke: INDIGO, flex: "none", marginTop: 1 }}
                >
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
                </svg>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: SLATE_INK }}>
                  <strong style={{ color: INDIGO }}>Fix:</strong> add one body paragraph that fairly
                  develops the opposing view, then rebut it — that balance is what separates Band 6
                  from Band 7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
