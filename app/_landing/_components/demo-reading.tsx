"use client";

import React from "react";
import {
  BRAND as INDIGO,
  BRAND_LINE,
  BRAND_SOFT,
  CANVAS,
  INDIGO_FILL,
  INDIGO_SOFT,
  ON_INDIGO,
  PANEL,
  SLATE_BODY,
  SLATE_BODY as MUTED,
  SLATE_INK,
  SLATE_INK as INK,
  SLATE_MUTED,
  SLATE_STRONG,
  WARM_EDGE as SP_LINE,
  WHITE,
  withAlpha,
} from "@/lib/theme/tokens";

import { SANS, SERIF } from "./demo-kit";

// ============================================================================
// 3. READING
// ============================================================================

export function ReadingScreen() {
  const answered = 7;
  const total = 13;
  return (
    <div
      style={{
        width: 1200,
        height: 750,
        background: PANEL,
        fontFamily: SANS,
        color: INK,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* topbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          flex: "none",
          borderBottom: "1px solid #EEEDF4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: SLATE_BODY,
              fontSize: 14.5,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 16 }}>‹</span> Exit
          </span>
          <span style={{ width: 1, height: 22, background: INDIGO_SOFT }} />
          <span style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>
            Academic Reading · Passage practice
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12.5, color: SLATE_MUTED, fontWeight: 500 }}>Text size</span>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1.5px solid #f4e9ee",
                background: PANEL,
                color: SLATE_BODY,
                fontWeight: 700,
                fontSize: 12.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              A−
            </span>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1.5px solid #f4e9ee",
                background: PANEL,
                color: SLATE_BODY,
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              A+
            </span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 10,
              background: BRAND_SOFT,
              border: `1px solid ${BRAND_LINE}`,
            }}
          >
            <span style={{ fontSize: 13, color: INDIGO }}>◷</span>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 700,
                fontSize: 15.5,
                color: INDIGO,
              }}
            >
              18:24
            </span>
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 10,
              border: "1.5px solid #f4e9ee",
              fontSize: 13.5,
              fontWeight: 700,
              color: INK,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {answered} / {total}
          </span>
          <span
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              background: INDIGO_FILL,
              color: ON_INDIGO,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: `0 4px 14px ${withAlpha(INDIGO, 28)}`,
            }}
          >
            Submit answers
          </span>
        </div>
      </div>

      {/* split */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* passage */}
        <div
          style={{
            flex: 1,
            padding: "32px 44px",
            borderRight: "1px solid #F0EFF5",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 620 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  background: BRAND_SOFT,
                  color: INDIGO,
                  fontWeight: 700,
                  fontSize: 12.5,
                  padding: "5px 12px",
                  borderRadius: 8,
                }}
              >
                Reading Passage
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: SLATE_MUTED }}>
                Urban design
              </span>
            </div>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                color: SLATE_MUTED,
                margin: "12px 0 0",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                style={{ stroke: SLATE_MUTED }}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 11-6 6v3h3l6-6M13 7l4 4M18 2l4 4-9 9H9v-4l9-9Z" />
              </svg>
              Select a word to see its meaning — or pick a pen above to highlight.
            </p>
            <p
              style={{
                fontSize: 14,
                fontStyle: "italic",
                color: MUTED,
                margin: "14px 0 0",
                lineHeight: 1.5,
              }}
            >
              You should spend about 20 minutes on{" "}
              <strong style={{ fontStyle: "normal", color: INK }}>Questions 1–{total}</strong>,
              which are based on the reading passage below.
            </p>
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 29,
                letterSpacing: "-.01em",
                color: INK,
                margin: "10px 0 20px",
              }}
            >
              The Rise of the Urban Park
            </h1>
            <div style={{ lineHeight: 1.75, color: SLATE_INK, fontSize: 16 }}>
              For most of human history, cities were dense, walled and almost entirely paved. The
              idea that a metropolis should set aside large tracts of land purely for recreation
              would have struck a medieval planner as absurd — space inside the walls was far too
              valuable to leave unbuilt.
              {"\n\n"}
              The change came in the nineteenth century, as industrial cities swelled and their air
              grew thick with smoke. Reformers began to argue that access to greenery was not a
              luxury but a public-health necessity, and that a walk among trees could restore
              workers exhausted by the factory floor…
            </div>
          </div>
        </div>

        {/* questions */}
        <div style={{ width: "44%", flex: "none", padding: "28px 40px", overflow: "hidden" }}>
          <div
            style={{
              background: CANVAS,
              border: "1px solid #ECEBF4",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".04em", color: INDIGO }}>
              QUESTIONS 1–5
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: SLATE_STRONG }}>
              Do the following statements agree with the information in the passage? Choose{" "}
              <strong>TRUE</strong>, <strong>FALSE</strong> or <strong>NOT GIVEN</strong>.
            </p>
          </div>
          {[
            {
              n: 1,
              t: "Medieval cities commonly reserved land for public recreation.",
              pick: "FALSE",
            },
            {
              n: 2,
              t: "Nineteenth-century reformers linked green space to public health.",
              pick: "TRUE",
            },
            {
              n: 3,
              t: "The first public parks were funded entirely by private donors.",
              pick: null,
            },
          ].map((q) => (
            <div key={q.n} style={{ padding: "12px 0", borderBottom: "1px solid #F1F0F7" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <span
                  style={{
                    flex: "none",
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    border: `1.5px solid ${q.pick ? INDIGO : SP_LINE}`,
                    background: q.pick ? INDIGO : PANEL,
                    color: q.pick ? WHITE : SLATE_MUTED,
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {q.n}
                </span>
                <span style={{ fontSize: 14.5, lineHeight: 1.45, color: SLATE_INK }}>{q.t}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, marginLeft: 34 }}>
                {["TRUE", "FALSE", "NOT GIVEN"].map((o) => {
                  const on = q.pick === o;
                  return (
                    <span
                      key={o}
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${on ? INDIGO : SP_LINE}`,
                        background: on ? INDIGO_SOFT : PANEL,
                        color: on ? INDIGO : SLATE_MUTED,
                      }}
                    >
                      {o}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* bottom nav */}
      <div
        style={{
          flex: "none",
          borderTop: "1px solid #F0EFF5",
          background: PANEL,
          padding: "11px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}
      >
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const isAnswered = n <= answered;
          const isCur = n === 8;
          const style: React.CSSProperties = {
            width: 30,
            height: 30,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            border: "1.5px solid",
            fontVariantNumeric: "tabular-nums",
          };
          if (isCur)
            return (
              <span
                key={n}
                style={{
                  ...style,
                  borderColor: INDIGO,
                  background: PANEL,
                  color: INDIGO,
                  boxShadow: "0 0 0 3px rgba(79,70,229,.16)",
                }}
              >
                {n}
              </span>
            );
          if (isAnswered)
            return (
              <span
                key={n}
                style={{ ...style, borderColor: INDIGO, background: INDIGO, color: WHITE }}
              >
                {n}
              </span>
            );
          return (
            <span
              key={n}
              style={{ ...style, borderColor: SP_LINE, background: PANEL, color: SLATE_MUTED }}
            >
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}
