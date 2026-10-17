"use client";

import {
  BRAND,
  BRAND as INDIGO,
  BRAND_LINE,
  BRAND_SOFT,
  INDIGO_FILL,
  ON_INDIGO,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_INK as INK,
  SLATE_LINE,
  SLATE_MUTED,
  SLATE_MUTED as FAINT,
  WELL,
  WHITE,
} from "@/lib/theme/tokens";

import { SANS, SERIF, Spark } from "./demo-kit";

// ============================================================================
// 5. STUDY COACH
// ============================================================================

export function CoachScreen() {
  return (
    <div
      style={{
        width: 1200,
        height: 750,
        background: WELL,
        fontFamily: SANS,
        color: INK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* faint dashboard backdrop */}
      <div style={{ padding: "34px 44px", opacity: 0.5, filter: "saturate(.9)" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".09em",
            textTransform: "uppercase",
            color: FAINT,
          }}
        >
          Your dashboard
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 30,
            color: INK,
            margin: "6px 0 0",
          }}
        >
          Welcome back, Aziz
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          {[
            ["Reading", "6.5", INDIGO],
            ["Writing", "6.0", INDIGO],
          ].map(([s, b, c]) => (
            <div
              key={s}
              style={{
                flex: 1,
                background: PANEL,
                border: `1px solid ${SLATE_LINE}`,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>{s}</span>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 34,
                  color: c as string,
                  marginTop: 12,
                }}
              >
                {b}
              </div>
              <div
                style={{
                  height: 7,
                  background: BRAND_LINE,
                  borderRadius: 999,
                  marginTop: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: "70%", height: "100%", background: c as string }} />
              </div>
            </div>
          ))}
          <div
            style={{
              flex: 1,
              background: PANEL,
              border: `1px solid ${SLATE_LINE}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".09em",
                textTransform: "uppercase",
                color: FAINT,
              }}
            >
              This week
            </span>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 8,
                    background: i < 5 ? INDIGO : WELL,
                    border: `1.5px solid ${i < 5 ? INDIGO : SLATE_LINE}`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* coach card */}
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: 34,
          width: 400,
          height: 560,
          display: "flex",
          flexDirection: "column",
          background: PANEL,
          border: "1px solid #E7E4F2",
          borderRadius: 18,
          boxShadow: "0 30px 70px -28px rgba(26,33,56,.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 14px",
            borderBottom: "1px solid #E7E4F2",
            background: "linear-gradient(135deg,#F5F4FE,#EFEEFC)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
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
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>Study coach</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>
                Planning · strategy · what&rsquo;s next
              </div>
            </div>
          </div>
          <svg
            style={{ stroke: MUTED }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
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
            What should I practise next?
          </div>
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "88%",
              padding: "10px 12px",
              borderRadius: 12,
              background: BRAND_SOFT,
              border: `1px solid ${BRAND_SOFT}`,
              color: BRAND,
              fontSize: 13.5,
              lineHeight: 1.6,
            }}
          >
            Your Reading sits at <strong>6.5</strong> and Writing at <strong>6.0</strong>, so
            Writing is the gap to your 7.0 target. This week I&rsquo;d do{" "}
            <strong>two Task 2 essays</strong> focused on Task Response — that&rsquo;s your weakest
            criterion across your last 3 submissions. Want me to pick the prompts?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
            {["Plan my week", "How do I reach my target?"].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: INDIGO,
                  background: BRAND_SOFT,
                  border: `1px solid ${BRAND_LINE}`,
                  borderRadius: 999,
                  padding: "7px 12px",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: 10, borderTop: "1px solid #EFEDF8" }}>
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
  );
}
