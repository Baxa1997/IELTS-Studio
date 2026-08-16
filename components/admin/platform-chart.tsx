import type { Point } from "./charts";
import { FAINT, INDIGO, SOFT } from "./ui";

/**
 * Practice per day, with sign-ups underneath on the same days.
 *
 * Two series on one set of axes because the interesting thing is the RELATION:
 * a spike in sign-ups that never becomes a spike in practice is the platform's
 * central problem, and two charts side by side hide it.
 *
 * Each series is scaled to its OWN maximum. That is a real distortion and it is
 * the right one here — sign-ups run about a fifth of practice volume, so a
 * shared axis flattens them into a straight line at the bottom and says
 * nothing. The two y-axes are never labelled with numbers for exactly that
 * reason: shape is what this chart is for, and the totals are printed above it
 * in figures anyone can read.
 *
 * Plain SVG, no chart library — two paths and a gradient do not justify a
 * dependency, and this renders on the server with no client JS at all.
 */

const W = 900;
const H = 170;

function line(values: number[], close = false): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1) * 1.12;
  const pts = values.map<[number, number]>((v, i) => [
    (i / Math.max(1, values.length - 1)) * W,
    H - (v / max) * H,
  ]);
  let d = "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
  if (close) d += ` L${W} ${H} L0 ${H} Z`;
  return d;
}

export function PlatformChart({
  practice,
  signups,
}: {
  practice: Point[];
  signups: Point[];
}) {
  const p = practice.map((x) => x.value);
  const s = signups.map((x) => x.value);
  const first = practice[0]?.day;
  const mid = practice[Math.floor(practice.length / 2)]?.day;
  const last = practice[practice.length - 1]?.day;

  const day = (iso: string | undefined) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 180, display: "block" }}
        role="img"
        aria-label={`Practice and sign-ups per day. ${p.reduce((a, b) => a + b, 0)} practices and ${s.reduce((a, b) => a + b, 0)} sign-ups over ${p.length} days.`}
      >
        <defs>
          <linearGradient id="ad-practice-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INDIGO} stopOpacity={0.22} />
            <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`M0 ${H * 0.33} L${W} ${H * 0.33}`} stroke="#EFEEE9" strokeWidth={1} />
        <path d={`M0 ${H * 0.66} L${W} ${H * 0.66}`} stroke="#EFEEE9" strokeWidth={1} />
        <path d={line(p, true)} fill="url(#ad-practice-fill)" />
        <path d={line(s)} fill="none" stroke="#B9B7EC" strokeWidth={2} strokeLinejoin="round" />
        <path d={line(p)} fill="none" stroke={INDIGO} strokeWidth={2.2} strokeLinejoin="round" />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11.5,
          color: FAINT,
          marginTop: 8,
        }}
      >
        <span>{day(first)}</span>
        <span>{day(mid)}</span>
        <span>{day(last)}</span>
      </div>
    </>
  );
}

export function ChartLegend() {
  return (
    <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: SOFT }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i style={{ width: 10, height: 3, borderRadius: 2, background: INDIGO }} />
        Practice
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <i style={{ width: 10, height: 3, borderRadius: 2, background: "#B9B7EC" }} />
        Sign-ups
      </span>
    </div>
  );
}
