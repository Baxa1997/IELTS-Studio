import { FAINT, INDIGO, INK, LINE, MUTED, SANS } from "@/components/console/page-ui";

/**
 * Charts for the platform console, drawn as plain SVG.
 *
 * No charting library: the app has never had one (see components/writing/figure.tsx,
 * which does the same by hand), and pulling one in for four shapes would add a
 * client bundle to pages that are otherwise pure server components. Everything
 * here renders on the server and ships zero JavaScript.
 *
 * The y-axis always starts at zero. A chart that crops the baseline to fill the
 * frame turns a quiet week into a dramatic one, which is the opposite of what a
 * dashboard is for.
 */

export interface Point {
  day: string;
  value: number;
}

const shortDay = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/**
 * Area + line over time. Fixed viewBox, scaled by CSS, so it stays sharp at any
 * width without measuring anything on the client.
 */
export function TrendChart({
  points,
  height = 132,
  color = INDIGO,
  label,
}: {
  points: Point[];
  height?: number;
  color?: string;
  label?: string;
}) {
  const W = 720;
  const H = height;
  const padY = 10;

  if (points.length === 0) {
    return <Empty>Nothing to chart yet.</Empty>;
  }

  const peak = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? W / (points.length - 1) : W;
  const y = (v: number) => H - padY - (v / peak) * (H - padY * 2);
  const xy = points.map((p, i) => [i * stepX, y(p.value)] as const);

  const line = xy.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const gradientId = `g-${label?.replace(/\W/g, "") ?? "trend"}`;

  // Only a handful of date labels, or they collide at narrow widths.
  const ticks = [0, Math.floor(points.length / 2), points.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
        role="img"
        aria-label={
          label
            ? `${label}: ${points[points.length - 1]?.value ?? 0} on the most recent day, peak ${peak}`
            : undefined
        }
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baseline and midline, so the eye has something to measure against. */}
        <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke={LINE} strokeWidth="1" />
        <line
          x1="0"
          y1={y(peak / 2)}
          x2={W}
          y2={y(peak / 2)}
          stroke={LINE}
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: SANS,
          fontSize: 11.5,
          color: FAINT,
          marginTop: 6,
        }}
      >
        {ticks.map((i) => (
          <span key={i}>{shortDay(points[i].day)}</span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars — a distribution where the labels matter more than the curve. */
export function BarList({
  rows,
  color = INDIGO,
}: {
  rows: { label: string; value: number; hint?: string }[];
  color?: string;
}) {
  if (rows.length === 0) return <Empty>No data yet.</Empty>;
  const peak = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              fontFamily: SANS,
              fontSize: 13.5,
              color: INK,
              marginBottom: 5,
            }}
          >
            <span style={{ fontWeight: 500 }}>{r.label}</span>
            <span style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}>
              {r.hint ? <span style={{ color: FAINT, marginRight: 8 }}>{r.hint}</span> : null}
              {r.value}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "#F2F1F7", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(2, (r.value / peak) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Headline number with its change against the preceding period. */
export function DeltaStat({
  value,
  label,
  previous,
}: {
  value: number;
  label: string;
  previous: number;
}) {
  const diff = value - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const tone = diff > 0 ? "#15803d" : diff < 0 ? "#b91c1c" : FAINT;

  return (
    <div>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1.05,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontFamily: SANS,
          fontSize: 12.5,
          marginTop: 5,
        }}
      >
        <span style={{ color: FAINT }}>{label}</span>
        <span style={{ color: tone, fontWeight: 600 }}>
          {diff === 0
            ? "no change"
            : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}${pct === null ? "" : ` (${Math.abs(pct)}%)`}`}
        </span>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: SANS, fontSize: 13.5, color: FAINT, margin: 0, padding: "18px 0" }}>
      {children}
    </p>
  );
}
