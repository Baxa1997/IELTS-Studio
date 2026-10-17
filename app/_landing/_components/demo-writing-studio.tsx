"use client";

import {
  BRAND,
  BRAND as INDIGO,
  BRAND_LINE,
  BRAND_LINE as ACC_LINE,
  BRAND_SOFT,
  BRAND_SOFT as ACC_SOFT,
  CANVAS,
  INDIGO_FILL,
  ON_INDIGO,
  PANEL,
  SLATE_BODY,
  SLATE_BODY as MUTED,
  SLATE_INK,
  SLATE_INK as INK,
  SLATE_LINE as LINE,
  SLATE_GREEN_BG,
  SLATE_MUTED,
  SLATE_STRONG,
  WELL as SOFT,
  WELL_LINE as SOFTLINE,
  WHITE,
} from "@/lib/theme/tokens";

import { Arrow, Check, EMERALD, SANS, SERIF, Spark, TaskPill } from "./demo-kit";

// ============================================================================
// 2. WRITING STUDIO
// ============================================================================

export function WritingStudioScreen() {
  const words = 268;
  const minWords = 250;
  const pct = Math.min(100, Math.round((words / minWords) * 100));
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
          height: 62,
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
              display: "flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 13px 0 11px",
              border: `1px solid ${LINE}`,
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
            Library
          </span>
          <span style={{ width: 1, height: 24, background: LINE }} />
          <TaskPill>TASK 2</TaskPill>
          <span style={{ fontSize: 14, fontWeight: 500, color: SLATE_STRONG }}>
            Academic Writing
          </span>
          <span style={{ color: SLATE_MUTED }}>·</span>
          <span style={{ fontSize: 14, color: SLATE_MUTED }}>Education</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 12px",
              border: `1px solid ${LINE}`,
              borderRadius: 9,
              background: SOFT,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 700,
              fontSize: 15,
              color: INK,
            }}
          >
            <svg
              style={{ stroke: INDIGO }}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2 2M12 2h0" />
            </svg>
            34:12
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: EMERALD,
            }}
          >
            <Check c={EMERALD} s={13} /> Saved
          </span>
          <span style={{ width: 1, height: 24, background: LINE }} />
          <span
            style={{
              display: "flex",
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
            Submit for grading <Arrow />
          </span>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 16, padding: 16 }}>
        {/* prompt */}
        <div
          style={{
            width: 356,
            flex: "none",
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${SOFTLINE}` }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 13,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: ".13em",
                  color: SLATE_MUTED,
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
                  background: ACC_SOFT,
                  color: INDIGO,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                Agree / Disagree
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: 19.5,
                lineHeight: 1.4,
                fontWeight: 600,
                color: INK,
              }}
            >
              Some people believe unpaid community service should be a compulsory part of
              high-school programmes.
            </p>
            <p
              style={{
                margin: "9px 0 0",
                fontFamily: SERIF,
                fontSize: 14.5,
                fontStyle: "italic",
                lineHeight: 1.4,
                color: SLATE_BODY,
              }}
            >
              To what extent do you agree or disagree?
            </p>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: ".04em",
                color: SLATE_MUTED,
              }}
            >
              REQUIREMENTS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {["Give reasons & examples", "~40 minutes"].map((c) => (
                <div
                  key={c}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "11px 13px",
                    background: SOFT,
                    border: `1px solid ${SOFTLINE}`,
                    borderRadius: 10,
                  }}
                >
                  <span
                    style={{
                      flex: "none",
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: SLATE_GREEN_BG,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: SLATE_INK }}>{c}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 13px",
                  background: ACC_SOFT,
                  border: `1px solid ${ACC_LINE}`,
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: SLATE_GREEN_BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check />
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: SLATE_INK }}>
                      At least {minWords} words
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: INDIGO,
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
                      background: ACC_SOFT,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: INDIGO,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* answer */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
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
              height: 60,
              flex: "none",
              padding: "0 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${SOFTLINE}`,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>Your answer</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: SLATE_MUTED, fontWeight: 500 }}>
                Target reached
              </span>
              <div style={{ position: "relative", width: 46, height: 46 }}>
                <svg width="46" height="46" viewBox="0 0 46 46">
                  <circle
                    cx="23"
                    cy="23"
                    r="19"
                    fill="none"
                    style={{ stroke: ACC_SOFT }}
                    strokeWidth="4.5"
                  />
                  <circle
                    cx="23"
                    cy="23"
                    r="19"
                    fill="none"
                    style={{ stroke: INDIGO }}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray="119.4"
                    strokeDashoffset="0"
                    transform="rotate(-90 23 23)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: INK,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {words}
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: "26px 30px", overflow: "hidden" }}>
            <div
              style={{
                maxWidth: 640,
                fontFamily: SERIF,
                fontSize: 16.5,
                lineHeight: 1.85,
                color: SLATE_INK,
              }}
            >
              I strongly agree that a period of unpaid community service should be built into
              high-school education. Requiring young people to contribute to their communities
              develops empathy and practical skills that classroom study alone cannot provide.
              {"\n\n"}
              The most compelling argument is that community service exposes students to lives very
              different from their own. A teenager who spends a term helping at a care home, for
              instance, learns patience and responsibility while seeing first-hand the challenges
              older people face…
            </div>
          </div>
          <div
            style={{
              height: 48,
              flex: "none",
              padding: "0 22px",
              borderTop: `1px solid ${SOFTLINE}`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: SOFT,
            }}
          >
            <span style={{ fontSize: 13, color: SLATE_MUTED, fontVariantNumeric: "tabular-nums" }}>
              <strong style={{ color: INK, fontWeight: 700 }}>{words}</strong> words
            </span>
            <span style={{ fontSize: 13, color: SLATE_MUTED, fontVariantNumeric: "tabular-nums" }}>
              1,432 characters
            </span>
            <span style={{ fontSize: 13, color: SLATE_MUTED }}>3 paragraphs</span>
          </div>
        </div>

        {/* coach */}
        <div
          style={{
            width: 320,
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "13px 14px",
              borderBottom: `1px solid ${SOFTLINE}`,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: "linear-gradient(135deg,#7d0132,#7d0132)",
                color: WHITE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spark s={16} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>Writing coach</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Ideas · vocabulary · structure</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                padding: "9px 12px",
                borderRadius: 12,
                background: INDIGO_FILL,
                color: ON_INDIGO,
                fontSize: 13.5,
                lineHeight: 1.5,
              }}
            >
              Any better linking words for my second paragraph?
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "88%",
                padding: "9px 12px",
                borderRadius: 12,
                background: BRAND_SOFT,
                border: `1px solid ${BRAND_SOFT}`,
                color: BRAND,
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
            >
              Try opening with <em>“The most compelling argument is…”</em>, then signpost the next
              idea with <em>“Beyond this,”</em> or <em>“A further benefit is that…”</em>. Vary them
              — repeating “also” caps Coherence.
            </div>
          </div>
          <div style={{ padding: 10, borderTop: `1px solid ${SOFTLINE}` }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  padding: "9px 11px",
                  border: `1px solid ${BRAND_LINE}`,
                  borderRadius: 10,
                  fontSize: 13.5,
                  color: SLATE_MUTED,
                }}
              >
                Ask your coach…
              </span>
              <span
                style={{
                  width: 40,
                  borderRadius: 10,
                  background: INDIGO,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ stroke: WHITE }}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
