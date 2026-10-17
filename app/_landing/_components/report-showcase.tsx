"use client";

import React from "react";
import {
  BRAND,
  BRAND as INDIGO,
  BRAND_LINE,
  BRAND_LINE as V_BORDER,
  PANEL,
  RED,
  SLATE_BODY,
  SLATE_BODY as MUTED,
  SLATE_GREEN,
  SLATE_INK,
  SLATE_INK as INK,
  SLATE_MUTED as FAINT,
  SLATE_RED_BG,
  SLATE_STRONG,
  WELL as SOFT,
  WELL_LINE as SOFTLINE,
} from "@/lib/theme/tokens";

import { Frame, SANS, SERIF, Stage, TaskPill, V_SOFT, bandColor } from "./demo-kit";

// ---- report cards (the "real reports" proof strip) -------------------------

function ReportWriting() {
  const bc = bandColor(6.5);
  return (
    <div
      style={{
        width: 640,
        height: 480,
        background: PANEL,
        fontFamily: SANS,
        color: INK,
        padding: 28,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <TaskPill>TASK 2</TaskPill>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Essay report</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 0",
          borderBottom: `1px solid ${SOFTLINE}`,
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 0.82,
            color: bc.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          6.5
        </span>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: FAINT,
              textTransform: "uppercase",
            }}
          >
            Overall band
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: 5,
              fontSize: 12.5,
              fontWeight: 700,
              color: bc.fg,
              background: bc.bg,
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {bc.label}
          </span>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 15,
            color: "var(--tk-slate-green)",
            fontWeight: 600,
            background: "var(--tk-slate-green-bg)",
            border: "1px solid #CDE9D8",
            borderRadius: 11,
            padding: "8px 14px",
          }}
        >
          Up to <strong style={{ color: SLATE_GREEN }}>7.0</strong> with fixes
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {[
          ["Task Response", "6.0", true],
          ["Coherence", "6.5", false],
          ["Lexical Resource", "6.0", false],
          ["Grammar", "7.0", false],
        ].map(([l, b, blk]) => (
          <div
            key={l as string}
            style={{
              background: blk ? SLATE_RED_BG : SOFT,
              border: `1px solid ${blk ? BRAND_LINE : SOFTLINE}`,
              borderRadius: 12,
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 600, color: MUTED }}>{l as string}</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: blk ? RED : SLATE_INK,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {b as string}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".06em", color: RED }}>
          FIX THIS FIRST
        </span>
        <span style={{ fontSize: 14, color: SLATE_STRONG }}>
          Task Response — develop the opposing view, don&rsquo;t just mention it.
        </span>
      </div>
    </div>
  );
}

function ReportReading() {
  const bc = bandColor(6.5);
  return (
    <div
      style={{
        width: 640,
        height: 480,
        background: PANEL,
        fontFamily: SANS,
        color: INK,
        padding: 28,
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700 }}>Reading result · Academic</span>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          marginTop: 12,
          paddingBottom: 18,
          borderBottom: `1px solid ${SOFTLINE}`,
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: 64,
            lineHeight: 0.9,
            color: bc.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          6.5
        </span>
        <div style={{ paddingBottom: 6 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Indicative band
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: 5,
              fontSize: 12.5,
              fontWeight: 700,
              color: bc.fg,
              background: bc.bg,
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {bc.label}
          </span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 15, color: MUTED, paddingBottom: 6 }}>
          <strong style={{ color: INK }}>9/13</strong> correct · 69%
        </span>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 }}>
          Where you lost marks
        </div>
        {[
          ["True / False / Not Given", "2 / 5", true],
          ["Matching headings", "3 / 4", false],
          ["Sentence completion", "4 / 4", false],
        ].map(([t, s, weak]) => (
          <div
            key={t as string}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 10,
              background: weak ? SLATE_RED_BG : SOFT,
              border: `1px solid ${weak ? BRAND_LINE : SOFTLINE}`,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: weak ? RED : SLATE_INK }}>
              {t as string}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: weak ? RED : SLATE_INK,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s as string}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: MUTED, display: "flex", gap: 7 }}>
        <span style={{ color: INDIGO, fontWeight: 700 }}>Why the trap worked:</span>
        <span>
          the passage says parks were “argued for”, not built — that&rsquo;s NOT GIVEN, not TRUE.
        </span>
      </div>
    </div>
  );
}

function ReportListening() {
  const bc = bandColor(6.5);
  return (
    <div
      style={{
        width: 640,
        height: 480,
        background: PANEL,
        fontFamily: SANS,
        color: INK,
        padding: 28,
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700 }}>Listening result · Full test</span>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          marginTop: 12,
          paddingBottom: 18,
          borderBottom: `1px solid ${SOFTLINE}`,
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: 64,
            lineHeight: 0.9,
            color: bc.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          6.5
        </span>
        <div style={{ paddingBottom: 6 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Indicative band
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: 5,
              fontSize: 12.5,
              fontWeight: 700,
              color: bc.fg,
              background: bc.bg,
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {bc.label}
          </span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 15, color: MUTED, paddingBottom: 6 }}>
          <strong style={{ color: INK }}>26/40</strong> correct
        </span>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginTop: 16 }}
      >
        {[
          ["Part 1", "8/10"],
          ["Part 2", "7/10"],
          ["Part 3", "6/10"],
          ["Part 4", "5/10"],
        ].map(([p, s]) => (
          <div
            key={p as string}
            style={{
              background: SOFT,
              border: `1px solid ${SOFTLINE}`,
              borderRadius: 11,
              padding: "13px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: FAINT }}>{p as string}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: SLATE_INK,
                fontVariantNumeric: "tabular-nums",
                marginTop: 4,
              }}
            >
              {s as string}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 18,
          padding: "12px 14px",
          borderRadius: 10,
          background: V_SOFT,
          border: `1px solid ${V_BORDER}`,
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 700, color: BRAND, marginBottom: 4 }}>
          Q31 · you wrote “Tuesday”, answer was “Thursday”
        </div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
          The speaker corrects herself — “…on Tuesday, sorry, I mean Thursday.” The transcript link
          jumps you to the exact line.
        </div>
      </div>
    </div>
  );
}

const REPORT_NODES: Record<string, React.ReactNode> = {
  "report-writing": <ReportWriting />,
  "report-reading": <ReportReading />,
  "report-listening": <ReportListening />,
};

export type ReportCard = { slug: string; caption: string };

export const REPORT_CARDS: ReportCard[] = [
  {
    slug: "report-writing",
    caption:
      "A Task 2 essay report — per-criterion bands with evidence from the essay and the one fix that moves the score.",
  },
  {
    slug: "report-reading",
    caption: "A Reading result — band, question-type breakdown, and exactly why each trap worked.",
  },
  {
    slug: "report-listening",
    caption: "A Listening result — section-by-section scores with transcript-linked explanations.",
  },
];

/** The three real grader reports, framed, for the landing + /demo proof section. */
export function ReportShowcase() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 28,
        marginTop: 44,
      }}
    >
      {REPORT_CARDS.map((c) => (
        <figure key={c.slug} style={{ margin: 0 }}>
          <Frame>
            <Stage w={640} h={480}>
              {REPORT_NODES[c.slug]}
            </Stage>
          </Frame>
          <figcaption
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 14.5,
              lineHeight: 1.55,
              color: SLATE_BODY,
              margin: "14px 4px 0",
            }}
          >
            {c.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
