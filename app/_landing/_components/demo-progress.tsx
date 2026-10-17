"use client";

import {
  BRAND as INDIGO,
  BRAND_LINE,
  BRAND_SOFT,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_INK as INK,
  SLATE_LINE,
  SLATE_GREEN_BG,
  SLATE_MUTED,
  SLATE_MUTED as FAINT,
  WARM_AMBER as AMBER,
  WELL,
  WHITE,
} from "@/lib/theme/tokens";

import { Arrow, EMERALD, Flame, SANS, SERIF, Spark } from "./demo-kit";

// ============================================================================
// 6. PROGRESS & STATS (dashboard)
// ============================================================================

function BandMini({
  skill,
  cur,
  target,
  base,
  delta,
}: {
  skill: string;
  cur: number;
  target: number;
  base: number;
  delta: number;
}) {
  const fill = Math.max(0.08, Math.min(1, (cur - base) / (target - base)));
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${SLATE_LINE}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: BRAND_SOFT,
              color: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: 16, color: INK }}>{skill}</span>
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 500,
            fontSize: 13,
            color: FAINT,
          }}
        >
          target{" "}
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: INK,
              background: WELL,
              border: `1px solid ${BRAND_LINE}`,
              padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            {target.toFixed(1)}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 12 }}>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 34,
            lineHeight: 1,
            color: INDIGO,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {cur.toFixed(1)}
        </span>
        <span style={{ fontWeight: 500, fontSize: 14, color: FAINT, paddingBottom: 6 }}>
          → target {target.toFixed(1)}
        </span>
      </div>
      <div
        style={{
          height: 7,
          background: BRAND_LINE,
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 12,
        }}
      >
        <div
          style={{
            width: `${Math.round(fill * 100)}%`,
            height: "100%",
            background: INDIGO,
            borderRadius: 999,
          }}
        />
      </div>
      <div style={{ fontSize: 13, color: FAINT, marginTop: 10 }}>
        From {base.toFixed(1)} baseline{" "}
        <span style={{ color: EMERALD }}>· +{delta.toFixed(1)}</span> · 4 submissions
      </div>
    </div>
  );
}

export function ProgressScreen() {
  return (
    <div
      style={{
        width: 1200,
        height: 750,
        background: WELL,
        fontFamily: SANS,
        color: INK,
        padding: "30px 40px",
        overflow: "hidden",
      }}
    >
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
        style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, color: INK, margin: "6px 0 0" }}
      >
        Welcome back, Aziz
      </div>
      <div style={{ fontSize: 15, color: MUTED, margin: "6px 0 0" }}>
        Target Band 7.0 · <span style={{ color: INDIGO, fontWeight: 600 }}>24 days</span> to your
        test
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr",
          gap: 16,
          marginTop: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* next task */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(120deg,#241017 0%,#7d0132 62%,#7d0132 100%)",
              borderRadius: 18,
              padding: "24px 26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -90,
                right: -40,
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: "radial-gradient(circle,rgba(255,255,255,.14),transparent 62%)",
              }}
            />
            <div style={{ position: "relative", flex: "1 1 380px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: ".11em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.72)",
                }}
              >
                <Spark s={13} /> Next task · picked for you
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 24,
                  color: WHITE,
                  marginTop: 9,
                }}
              >
                Task 2 — Opinion essay
              </div>
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,.84)",
                  margin: "7px 0 0",
                  maxWidth: 480,
                }}
              >
                Task Response is your weakest criterion. A focused opinion essay is the fastest way
                to close the gap to Band 7.
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  background: PANEL,
                  color: INK,
                  fontWeight: 700,
                  fontSize: 14.5,
                  padding: "12px 22px",
                  borderRadius: 11,
                  marginTop: 18,
                  boxShadow: "0 14px 30px -14px rgba(0,0,0,.55)",
                }}
              >
                Start writing <Arrow c={INK} />
              </span>
            </div>
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: "none",
              }}
            >
              {["Task 2 · ~40 min", "Per-criterion grade"].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    fontWeight: 500,
                    fontSize: 13,
                    color: "rgba(255,255,255,.88)",
                    background: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.22)",
                    borderRadius: 10,
                    padding: "9px 13px",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* band cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <BandMini skill="Reading" cur={6.5} target={7.0} base={6.0} delta={0.5} />
            <BandMini skill="Writing" cur={6.0} target={7.0} base={5.5} delta={0.5} />
          </div>

          {/* recent results */}
          <div>
            <div
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 20,
                color: INK,
                marginBottom: 12,
              }}
            >
              Recent results
            </div>
            <div
              style={{
                background: PANEL,
                border: `1px solid ${SLATE_LINE}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {[
                { d: "Jul 6", s: "Writing", band: "6.0", delta: "+0.5", up: true },
                { d: "Jul 4", s: "Reading", band: "6.5", delta: "baseline", up: null },
                { d: "Jul 1", s: "Reading", band: "6.0", delta: "+0.5", up: true },
              ].map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr auto",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 18px",
                    borderTop: i === 0 ? "none" : `1px solid ${SLATE_LINE}`,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 13.5, color: FAINT }}>{h.d}</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: INK }}>{h.s}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 999,
                        color: h.up == null ? FAINT : EMERALD,
                        background: h.up == null ? WELL : SLATE_GREEN_BG,
                      }}
                    >
                      {h.delta}
                    </span>
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 700,
                        fontSize: 18,
                        color: INK,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {h.band}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: PANEL,
              border: `1px solid ${SLATE_LINE}`,
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: AMBER }}>
                <Flame c={AMBER} s={17} />
                <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: INK }}>
                  5
                </span>
              </span>
            </div>
            <div
              style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 13 }}
            >
              {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d, i) => (
                <div
                  key={d}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      width: "100%",
                      maxWidth: 30,
                      height: 30,
                      borderRadius: 9,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: i < 5 ? INDIGO : WELL,
                      border: `1.5px solid ${i === 4 ? INDIGO : i < 5 ? INDIGO : SLATE_LINE}`,
                    }}
                  >
                    <Flame c={i < 5 ? WHITE : SLATE_MUTED} filled={i < 5} s={14} />
                  </span>
                  <span
                    style={{ fontSize: 10.5, fontWeight: 700, color: i === 4 ? INDIGO : FAINT }}
                  >
                    {d}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED }}>Weekly goal</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>3 / 5 tasks</span>
            </div>
            <div
              style={{
                height: 7,
                background: BRAND_LINE,
                borderRadius: 999,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <div
                style={{ width: "60%", height: "100%", background: INDIGO, borderRadius: 999 }}
              />
            </div>
            <p style={{ fontSize: 12.5, color: MUTED, margin: "10px 0 0" }}>
              2 more to go — keep the streak alive.
            </p>
          </div>

          <div
            style={{
              background: PANEL,
              border: `1px solid ${SLATE_LINE}`,
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg
                style={{ stroke: AMBER }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".09em",
                  textTransform: "uppercase",
                  color: FAINT,
                }}
              >
                Focus areas
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: FAINT,
                }}
              >
                Writing
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 1 }}>
                Task Response
              </div>
              <div style={{ fontSize: 12.5, color: MUTED }}>avg band 6.0</div>
              <div style={{ height: 1, background: SLATE_LINE, margin: "12px 0" }} />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: FAINT,
                }}
              >
                Reading
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 1 }}>
                True / False / Not Given
              </div>
              <div style={{ fontSize: 12.5, color: MUTED }}>68% correct · 17/25</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
