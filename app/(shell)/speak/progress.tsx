"use client";

/**
 * SpeakProgress — the speaking hub's trajectory block: overall-band sparkline
 * across graded mocks + practices, latest band with trend, and per-criterion
 * averages (last 3 graded) with the weakest called out. Pure presentation —
 * the RLS-scoped series is computed server-side in page.tsx.
 */

import { bandColor } from "@/lib/ui/band";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const MUTED = "#56556A";
const LINE = "#E8E6F0";
const INDIGO = "#4338CA";
const AMBER = "#B5852A";

export interface SpeakProgressItem {
  t: string;
  band: number;
  kind: "mock" | "practice";
  crit?: { FC?: number; LR?: number; GRA?: number; P?: number };
}

const CRIT_LABEL: Record<string, string> = {
  FC: "Fluency",
  LR: "Vocabulary",
  GRA: "Grammar",
  P: "Pronunciation",
};

export function SpeakProgress({ items }: { items: SpeakProgressItem[] }) {
  if (items.length < 2) return null;

  const latest = items[items.length - 1];
  const previous = items[items.length - 2];
  const delta = latest.band - previous.band;
  const bc = bandColor(latest.band);

  // sparkline geometry
  const W = 560;
  const H = 110;
  const PAD = 10;
  const yOf = (b: number) => {
    const lo = 3.5;
    const hi = 9;
    const clamped = Math.min(hi, Math.max(lo, b));
    return PAD + (H - 2 * PAD) * (1 - (clamped - lo) / (hi - lo));
  };
  const xOf = (i: number) =>
    items.length === 1 ? W / 2 : PAD + ((W - 2 * PAD) * i) / (items.length - 1);
  const pts = items.map((it, i) => `${xOf(i).toFixed(1)},${yOf(it.band).toFixed(1)}`).join(" ");

  // criterion averages over the last 3 graded results that carry criteria
  const withCrit = items.filter((i) => i.crit).slice(-3);
  const avgs: { key: string; avg: number }[] = [];
  for (const key of ["FC", "LR", "GRA", "P"] as const) {
    const vals = withCrit
      .map((i) => i.crit?.[key])
      .filter((v): v is number => typeof v === "number");
    if (vals.length) avgs.push({ key, avg: vals.reduce((a, b) => a + b, 0) / vals.length });
  }
  const weakest = avgs.length
    ? avgs.reduce((min, a) => (a.avg < min.avg ? a : min), avgs[0])
    : null;

  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        padding: "16px 18px",
        marginTop: 14,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: INDIGO }}>
          YOUR PROGRESS
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: bc.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {latest.band.toFixed(1)}
          <span style={{ fontWeight: 600, color: MUTED }}> latest</span>
        </span>
        {delta !== 0 ? (
          <span
            style={{ fontSize: 12.5, fontWeight: 700, color: delta > 0 ? "#15803D" : "#C2410C" }}
          >
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} vs previous
          </span>
        ) : (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED }}>level with previous</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: MUTED }}>
          <span style={{ color: INDIGO }}>●</span> full mock&nbsp;&nbsp;
          <span style={{ color: INDIGO }}>○</span> quick practice
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", marginTop: 10 }}
        role="img"
        aria-label="Band scores over your recent speaking attempts"
      >
        {[5, 6, 7, 8].map((g) => (
          <g key={g}>
            <line
              x1={PAD}
              x2={W - PAD}
              y1={yOf(g)}
              y2={yOf(g)}
              stroke="#EFEDF6"
              strokeDasharray="3 4"
            />
            <text x={W - PAD + 1} y={yOf(g) + 3} fontSize="8.5" fill="#B9B6CC" textAnchor="start">
              {g}
            </text>
          </g>
        ))}
        <polyline
          points={pts}
          fill="none"
          stroke={INDIGO}
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.85"
        />
        {items.map((it, i) => (
          <circle
            key={i}
            cx={xOf(i)}
            cy={yOf(it.band)}
            r={it.kind === "mock" ? 4.4 : 3.4}
            fill={it.kind === "mock" ? INDIGO : "#fff"}
            stroke={INDIGO}
            strokeWidth="2"
          />
        ))}
      </svg>

      {avgs.length ? (
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          }}
        >
          {avgs.map(({ key, avg }) => {
            const isWeak = weakest?.key === key && avgs.length > 1;
            return (
              <div key={key} style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: isWeak ? AMBER : MUTED,
                  }}
                >
                  <span>{CRIT_LABEL[key]}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{avg.toFixed(1)}</span>
                </div>
                <div
                  style={{
                    marginTop: 5,
                    height: 5,
                    borderRadius: 3,
                    background: "#EFEDF6",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((Math.min(9, avg) / 9) * 100)}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: isWeak ? "#D9A23C" : INDIGO,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {weakest && avgs.length > 1 ? (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: MUTED }}>
          <strong style={{ color: AMBER }}>{CRIT_LABEL[weakest.key]}</strong> is your weakest
          criterion right now (avg {weakest.avg.toFixed(1)} over your last {withCrit.length} graded
          attempts) — the report&rsquo;s &ldquo;Fix&rdquo; lines for it are where the next half band
          lives.
        </p>
      ) : null}
    </section>
  );
}
