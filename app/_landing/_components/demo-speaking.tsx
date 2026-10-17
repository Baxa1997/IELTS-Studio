"use client";

import {
  BRAND,
  BRAND_FILL,
  PANEL,
  RED,
  SLATE_GREEN,
  SLATE_INK,
  SLATE_AMBER,
  SLATE_AMBER_BG,
  SLATE_FIELD,
  SLATE_GREEN_BG,
  SLATE_MUTED,
  SLATE_STRONG,
  WARM_WELL,
  WARM_EDGE as SP_LINE,
  WELL,
  WHITE,
} from "@/lib/theme/tokens";

import { SANS, SERIF } from "./demo-kit";

// ---- speaking: the live 3-part mock ----------------------------------------
// A replica of the real exam room (app/(studio)/speak/exam/_components/live-mock.tsx) at the
// moment that best explains the product: Part 2, cue card on screen, the
// examiner mid-question. Tokens are copied from that file rather than
// re-invented — the dark ORB (the examiner is deliberately not a face; an exam
// room should feel impersonal), the breathing rings, the mono clock.
export function SpeakingScreen() {
  const SP_INK = SLATE_INK;
  const SP_FAINT = SLATE_MUTED;
  const SP_ORB =
    "radial-gradient(circle at 32% 28%, rgba(60,52,72,0.85) 0%, #2C2535 46%, #1A1520 100%)";
  const parts: { n: number; label: string }[] = [
    { n: 1, label: "Interview" },
    { n: 2, label: "Long turn" },
    { n: 3, label: "Discussion" },
  ];
  return (
    <div
      style={{
        width: 1200,
        height: 750,
        background: WELL,
        fontFamily: SANS,
        color: SP_INK,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* top bar */}
      <div
        style={{
          flex: "none",
          height: 54,
          borderBottom: `1px solid ${SP_LINE}`,
          background: PANEL,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: RED }} />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: SP_INK,
            }}
          >
            Live mock · recording
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: 13,
            color: SP_FAINT,
          }}
        >
          <span>08:24</span>
          <span style={{ color: SLATE_FIELD }}>/</span>
          <span>16:00</span>
        </div>
      </div>
      {/* whole-test progress */}
      <div style={{ flex: "none", height: 3, background: WARM_WELL }}>
        <div style={{ height: "100%", width: "52%", background: SP_INK }} />
      </div>
      {/* the three parts stay visible: a timer alone is pressure */}
      <div
        style={{
          flex: "none",
          display: "flex",
          justifyContent: "center",
          gap: 22,
          padding: "14px 18px 0",
        }}
      >
        {parts.map((p) => {
          const active = p.n === 2;
          const done = p.n < 2;
          return (
            <div
              key={p.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: active ? BRAND : done ? SLATE_GREEN : SLATE_MUTED,
              }}
            >
              <span
                style={{
                  width: 21,
                  height: 21,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: active ? BRAND_FILL : done ? SLATE_GREEN_BG : WARM_WELL,
                  color: active ? WHITE : done ? SLATE_GREEN : SLATE_MUTED,
                  fontSize: 10.5,
                }}
              >
                {done ? "✓" : p.n}
              </span>
              {p.label}
            </div>
          );
        })}
      </div>

      {/* centre stage */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "18px 24px 0",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 150,
            height: 150,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -14,
              borderRadius: "50%",
              border: "1px solid rgba(26,21,32,0.16)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -30,
              borderRadius: "50%",
              border: "1px solid rgba(26,21,32,0.08)",
            }}
          />
          <div
            style={{
              width: 118,
              height: 118,
              borderRadius: "50%",
              background: SP_ORB,
              boxShadow: "0 18px 40px rgba(26,21,32,0.28)",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: ".14em",
            color: SP_FAINT,
            marginTop: 20,
            textTransform: "uppercase",
          }}
        >
          Examiner is asking
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 27,
            fontWeight: 600,
            marginTop: 12,
            letterSpacing: "-0.02em",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Describe a skill you would like to learn
        </div>
        {/* wave bars — the examiner's voice */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 26, marginTop: 16 }}>
          {[10, 18, 26, 15, 22, 12, 20, 9, 16, 24, 13, 19].map((h, i) => (
            <span
              key={i}
              style={{ width: 3.5, height: h, borderRadius: 2, background: SP_INK, opacity: 0.55 }}
            />
          ))}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            marginTop: 16,
            padding: "8px 18px",
            borderRadius: 999,
            background: SLATE_AMBER_BG,
            border: "1px solid rgba(217,119,6,0.28)",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: SLATE_AMBER,
            }}
          >
            Prep time
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
              fontSize: 17,
              fontWeight: 600,
              color: SLATE_AMBER,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            0:47
          </span>
        </div>

        {/* the cue card — the paper slip on exam day */}
        <div
          style={{
            width: 660,
            marginTop: 18,
            textAlign: "left",
            background: PANEL,
            border: `1px solid ${SP_LINE}`,
            borderRadius: 16,
            padding: "16px 20px 18px",
            boxShadow: "0 14px 34px -20px rgba(26,21,32,.4)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 7,
              background: "rgba(218,119,86,0.12)",
              color: SLATE_AMBER,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Cue card
          </span>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: SP_FAINT, margin: "12px 0 4px" }}>
            You should say:
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              listStyle: "disc",
              fontSize: 14,
              lineHeight: 1.75,
              color: SLATE_STRONG,
            }}
          >
            <li>what the skill is and why it interests you</li>
            <li>how you would go about learning it</li>
            <li>how long you think it would take</li>
          </ul>
          <div style={{ fontSize: 12.5, color: SP_FAINT, marginTop: 8 }}>
            You will have 1–2 minutes to talk about this.
          </div>
        </div>
      </div>
    </div>
  );
}
