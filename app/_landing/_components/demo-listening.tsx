"use client";

import {
  BRAND,
  BRAND_LINE as V_BORDER,
  BRAND_SOFT as V_BG,
  PANEL,
  SLATE_BODY,
  SLATE_GREEN,
  SLATE_INK,
  SLATE_LINE as LINE,
  SLATE_MUTED,
  WELL,
  WELL_LINE as SOFTLINE,
  WHITE,
} from "@/lib/theme/tokens";

import { Check, LSANS, MONO, V, V_SOFT } from "./demo-kit";

// ============================================================================
// 4. LISTENING
// ============================================================================

export function ListeningScreen() {
  const gap = (val?: string) => (
    <span
      style={{
        display: "inline-flex",
        minWidth: 96,
        height: 30,
        padding: "0 10px",
        margin: "0 2px",
        alignItems: "center",
        borderRadius: 8,
        border: `1.5px solid ${val ? V_BORDER : LINE}`,
        background: val ? V_SOFT : PANEL,
        color: val ? BRAND : "transparent",
        fontSize: 14.5,
        fontWeight: 600,
        verticalAlign: "middle",
      }}
    >
      {val ?? " "}
    </span>
  );
  return (
    <div
      style={{
        width: 1200,
        height: 750,
        background: WELL,
        fontFamily: LSANS,
        color: SLATE_INK,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* navy audio strip */}
      <div
        style={{
          flex: "none",
          height: 62,
          background: "#2a0f19",
          borderBottom: "1px solid #3d1526",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            background: "#c25b83",
            color: WHITE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.24)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1.3" />
            <rect x="14" y="5" width="4" height="14" rx="1.3" />
          </svg>
        </div>
        <div style={{ width: 200, flex: "none", minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#f8fbff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Part 2 · Community radio
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#dcc3ce",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Now playing — plays once
          </div>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: "#dcc3ce",
            width: 42,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          01:12
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: "#4d1c30",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "36%",
              background: "#d18ba6",
              borderRadius: 999,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "36%",
              top: "50%",
              width: 13,
              height: 13,
              marginLeft: -6,
              marginTop: -6,
              borderRadius: 999,
              background: PANEL,
              boxShadow: "0 2px 6px rgba(0,0,0,.3)",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: "#dcc3ce",
            width: 42,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          03:20
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "#f6e2e9",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 8,
            padding: "5px 10px",
          }}
        >
          1.0×
        </span>
      </div>

      {/* part tabs */}
      <div
        style={{
          flex: "none",
          display: "flex",
          gap: 6,
          padding: "12px 24px",
          background: WELL,
          borderBottom: "1px solid #ececf1",
        }}
      >
        {[1, 2, 3, 4].map((p) => {
          const active = p === 2;
          const done = p === 1;
          return (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 600,
                border: `1px solid ${active ? V_BORDER : SOFTLINE}`,
                background: active ? V_BG : PANEL,
                color: active ? BRAND : SLATE_BODY,
              }}
            >
              {done ? <Check c={SLATE_GREEN} s={13} /> : null}
              Part {p}
            </span>
          );
        })}
      </div>

      {/* questions */}
      <div style={{ flex: 1, padding: "26px 40px", overflow: "hidden" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: V }}>QUESTIONS 11–15</span>
            <span style={{ fontSize: 13, color: SLATE_MUTED }}>
              Complete the notes · Write <strong style={{ color: SLATE_INK }}>ONE WORD ONLY</strong>{" "}
              for each answer
            </span>
          </div>
          <h2
            style={{
              fontFamily: LSANS,
              fontSize: 21,
              fontWeight: 700,
              color: SLATE_INK,
              margin: "8px 0 4px",
            }}
          >
            Riverside Community Centre
          </h2>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: SLATE_INK, padding: "14px 0 6px" }}>
              Facilities
            </div>
            {[
              {
                pre: "The main hall can be hired for ",
                val: "weddings",
                post: " and other private events.",
              },
              {
                pre: "A new ",
                val: undefined,
                post: " studio opens on the first floor in March.",
                n: true,
              },
            ].map((l, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 0",
                  paddingLeft: 14,
                  fontSize: 15,
                  lineHeight: 2,
                  color: SLATE_INK,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: SLATE_MUTED }}>•</span>
                <span>
                  {l.pre}
                  {gap(l.val)}
                  {l.post}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 14, fontWeight: 600, color: SLATE_INK, padding: "14px 0 6px" }}>
              Membership
            </div>
            {[
              { pre: "Annual membership costs £", val: undefined, post: " for adults.", n: true },
              {
                pre: "Members receive a monthly ",
                val: undefined,
                post: " with the class timetable.",
                n: true,
              },
            ].map((l, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 0",
                  paddingLeft: 14,
                  fontSize: 15,
                  lineHeight: 2,
                  color: SLATE_INK,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: SLATE_MUTED }}>•</span>
                <span>
                  {l.pre}
                  {gap(l.val)}
                  {l.post}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
