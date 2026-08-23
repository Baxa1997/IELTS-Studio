"use client";

/**
 * Map labelling: the schematic plan a candidate labels while the audio plays.
 *
 * This is 750 lines of hand-drawn SVG — a printed-plan palette, smoothed paths,
 * water hatching, trees, woodland fills, a compass rose, landmark glyphs — and
 * only some listening tests contain a map at all. It sat inline in
 * `listening-client.tsx`, so EVERY listening practice downloaded and parsed the
 * whole cartography whether or not it had a map in it.
 *
 * It is now imported through `next/dynamic` (see `GroupBody`), which is the
 * first code split in this codebase. Nothing about the drawing changed.
 *
 * Geometry note, carried over: the SVG viewBox has its origin top-left and y
 * grows SOUTH, matching the engine's coordinates, so points map straight on.
 */

import { useId, useState } from "react";
import { Check, X } from "lucide-react";

import { BAD, RUN } from "./theme";
import { FlagButton, NumChip } from "./question-ui";
import type { MapFeature, MapView, QCtx } from "./types";

// ---- IELTS-style schematic map rendering -------------------------------------

/** Printed-plan palette: mostly black/grey on white, with restrained colour only
 *  for non-essential context. The learner should read positions first, decoration second. */
const MAP = {
  ground: "#ffffff",
  ink: "#111111",
  label: "#222222",
  muted: "#333333",
  water: "#ffffff",
  waterEdge: "#222222",
  road: "#ffffff",
  roadEdge: "#111111",
  path: "#111111",
  scenery: "#ffffff",
  sceneryEdge: "#222222",
  card: "#ffffff",
  cardEdge: "#111111",
  site: "#ffffff",
  siteEdge: "#111111",
  accent: "#7c5cfc",
  frame: "#111111",
};

/** A ground-coloured outline painted BEHIND each label's fill (paint-order:stroke)
 *  so text stays readable wherever it crosses a road, river or another label. */
const HALO = {
  stroke: MAP.ground,
  strokeWidth: 0.9,
  strokeLinejoin: "round" as const,
  style: { paintOrder: "stroke" as const },
};

/** Catmull-Rom → cubic-bezier path through points. */
function smoothPath(pts: [number, number][], closed = false): string {
  let p: [number, number][] = pts;
  if (closed && pts.length >= 3) p = [pts[pts.length - 1], ...pts, pts[0], pts[1]];
  if (p.length < 3) return "M " + p.map(([x, y]) => `${x},${y}`).join(" L ");
  let d = closed ? `M ${p[1][0]},${p[1][1]} ` : `M ${p[0][0]},${p[0][1]} `;
  const lo = closed ? 1 : 0;
  const hi = closed ? p.length - 2 : p.length - 1;
  for (let i = lo; i < hi; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]} `;
  }
  return closed ? d + "Z" : d;
}

function mapLabelLines(label: string, maxChars: number): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1 || label.length <= maxChars) return [label.trim()];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function MapTextLines({
  lines,
  x,
  y,
  fontSize,
  fill = MAP.label,
  weight = 650,
  anchor = "middle",
}: {
  lines: string[];
  x: number;
  y: number;
  fontSize: number;
  fill?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y - ((lines.length - 1) * fontSize) / 2}
      fontSize={fontSize}
      fontWeight={weight}
      fill={fill}
      textAnchor={anchor}
      dominantBaseline="central"
      {...HALO}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : fontSize * 1.05}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function MapLineLabel({ label, x, y }: { label: string; x: number; y: number }) {
  const text = label.trim();
  return (
    <text
      x={x}
      y={y}
      fontSize={2.65}
      fontWeight={700}
      fill={MAP.muted}
      textAnchor="middle"
      dominantBaseline="central"
      {...HALO}
    >
      {text}
    </text>
  );
}

function polylineSamples(points: [number, number][], spacing: number): [number, number][] {
  if (points.length < 2) return [];
  let total = 0;
  const segs = points.slice(0, -1).map((a, i) => {
    const b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    total += len;
    return { a, b, len };
  });
  const count = Math.max(1, Math.floor(total / spacing));
  const out: [number, number][] = [];
  for (let n = 1; n <= count; n++) {
    let target = n * spacing - spacing / 2;
    for (const seg of segs) {
      if (target <= seg.len || seg === segs[segs.length - 1]) {
        const t = seg.len ? Math.max(0, Math.min(1, target / seg.len)) : 0;
        out.push([seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t]);
        break;
      }
      target -= seg.len;
    }
  }
  return out;
}

function MapWaterMarks({ points }: { points: [number, number][] }) {
  const marks = polylineSamples(points, 10).slice(0, 14);
  return (
    <g fill="none" stroke={MAP.ink} strokeWidth={0.32} strokeLinecap="round">
      {marks.map(([x, y], i) => (
        <path key={i} d={`M ${x - 1.6} ${y} q 0.8 -0.8 1.6 0 t 1.6 0`} opacity={0.75} />
      ))}
    </g>
  );
}

function MapTree({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={MAP.sceneryEdge} strokeWidth={0.45} fill={MAP.ground}>
      <path
        d={`M ${x} ${y - 2.4} C ${x - 2.1} ${y - 2.2}, ${x - 2.7} ${y - 0.5}, ${x - 1.6} ${y + 0.6} C ${x - 2.7} ${y + 1.2}, ${x - 1.7} ${y + 2.6}, ${x} ${y + 2} C ${x + 1.7} ${y + 2.6}, ${x + 2.7} ${y + 1.2}, ${x + 1.6} ${y + 0.6} C ${x + 2.7} ${y - 0.5}, ${x + 2.1} ${y - 2.2}, ${x} ${y - 2.4} Z`}
      />
      <line x1={x} y1={y + 2} x2={x} y2={y + 4.4} />
      <line x1={x - 0.75} y1={y + 4.4} x2={x + 0.75} y2={y + 4.4} />
    </g>
  );
}

/** Woods/scenery render as printed tree symbols inside the generated footprint. */
function MapWood({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}) {
  const cols = Math.max(2, Math.floor(w / 7));
  const rows = Math.max(1, Math.floor(h / 8));
  const trees: [number, number][] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      trees.push([x + ((col + 0.55 + (row % 2) * 0.25) * w) / cols, y + ((row + 0.45) * h) / rows]);
    }
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      {trees.map(([tx, ty], i) => (
        <MapTree key={i} x={tx} y={ty} />
      ))}
      {label ? (
        <MapTextLines
          lines={mapLabelLines(label, Math.max(7, Math.floor(w / 1.4)))}
          x={cx}
          y={cy + Math.min(3.5, h / 4)}
          fontSize={2.15}
          fill={MAP.label}
          weight={700}
        />
      ) : null}
    </g>
  );
}

/** A compact printed compass. */
function MapCompass({ x, y }: { x: number; y: number }) {
  return (
    <g fill="none" stroke={MAP.ink} strokeWidth={0.55} strokeLinecap="round" strokeLinejoin="round">
      <line x1={x} y1={y + 5.2} x2={x} y2={y - 5.2} />
      <line x1={x - 5.2} y1={y} x2={x + 5.2} y2={y} />
      <path d={`M ${x} ${y - 5.2} l -1.4 1.8 M ${x} ${y - 5.2} l 1.4 1.8`} />
      <path d={`M ${x} ${y + 5.2} l -1.4 -1.8 M ${x} ${y + 5.2} l 1.4 -1.8`} />
      <path d={`M ${x - 5.2} ${y} l 1.8 -1.4 M ${x - 5.2} ${y} l 1.8 1.4`} />
      <path d={`M ${x + 5.2} ${y} l -1.8 -1.4 M ${x + 5.2} ${y} l -1.8 1.4`} />
    </g>
  );
}

function MapLandmark({ f }: { f: Extract<MapFeature, { kind: "landmark" }> }) {
  const bw = f.w ?? 12;
  const bh = f.h ?? 8;
  const x = f.at[0];
  const y = f.at[1];
  const cx = x + bw / 2;
  const cy = y + bh / 2;
  const lines = mapLabelLines(f.label, Math.max(7, Math.floor(bw / 1.35)));
  const fontSize = Math.max(
    1.8,
    Math.min(2.45, bw / Math.max(5.2, Math.max(...lines.map((l) => l.length)) * 0.62)),
  );
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={bw}
        height={bh}
        rx={0}
        fill={MAP.card}
        stroke={MAP.cardEdge}
        strokeWidth={0.55}
      />
      {f.shape === "board" ? (
        <line
          x1={x + 2}
          y1={y + bh - 1.8}
          x2={x + bw - 2}
          y2={y + bh - 1.8}
          stroke={MAP.frame}
          strokeWidth={0.55}
        />
      ) : null}
      <MapTextLines lines={lines} x={cx} y={cy} fontSize={fontSize} fill={MAP.label} weight={700} />
    </g>
  );
}

function MapStartMarker({ x, y, mapH }: { x: number; y: number; mapH: number }) {
  const below = y < mapH - 10;
  const arrowTipY = below ? y + 4.8 : y - 4.8;
  const arrowBaseY = below ? y + 9.5 : y - 9.5;
  const labelY = below ? y + 14.8 : y - 13.8;
  return (
    <g>
      <rect x={x - 1.9} y={y - 1.9} width={3.8} height={3.8} fill={MAP.ink} />
      <line x1={x} y1={arrowBaseY} x2={x} y2={arrowTipY} stroke={MAP.ink} strokeWidth={0.7} />
      <path
        d={`M ${x - 1.4} ${arrowTipY + (below ? 1.9 : -1.9)} L ${x} ${arrowTipY} L ${x + 1.4} ${arrowTipY + (below ? 1.9 : -1.9)}`}
        fill="none"
        stroke={MAP.ink}
        strokeWidth={0.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={x}
        y={labelY}
        fontSize={2.65}
        fontWeight={600}
        fill={MAP.label}
        textAnchor="middle"
        dominantBaseline="central"
        {...HALO}
      >
        YOU ARE HERE
      </text>
    </g>
  );
}

/** midpoint of a polyline's central segment (for a label that never clips). */
function polyMid(points: [number, number][]): [number, number] {
  const n = points.length;
  const a = points[Math.floor((n - 1) / 2)];
  const b = points[Math.floor(n / 2)];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function MapPanel({ map, ctx }: { map: MapView; ctx: QCtx }) {
  const graded = ctx.results != null;
  const { w, h } = map.grid;
  const pad = 4;
  const titleBand = map.title ? 10 : 0;
  const letters = map.letters.slice().sort();
  const feats = map.features;
  const clipId = useId().replace(/:/g, "");
  const markerY = feats.find((f) => f.kind === "marker")?.at?.[1] ?? null;
  const bottomBand = markerY != null && markerY > h - 14 ? 16 : 0;
  const itemQs = new Set(map.items.map((it) => it.q));
  const firstOpenQ =
    map.items.find((it) => !(ctx.answers[it.q] ?? "").trim())?.q ?? map.items[0]?.q ?? 0;
  const [pickedQ, setPickedQ] = useState(firstOpenQ);
  const activeQ = itemQs.has(ctx.focusedQ)
    ? ctx.focusedQ
    : itemQs.has(pickedQ)
      ? pickedQ
      : firstOpenQ;
  const assignedBy = new Map<string, number>();
  const correctByLetter = new Map<string, number>();
  const art: React.ReactNode[] = [];
  const txt: React.ReactNode[] = [];

  map.items.forEach((it) => {
    const answer = (ctx.answers[it.q] ?? "").trim().toUpperCase();
    if (answer) assignedBy.set(answer, it.q);
    const correct = ctx.results?.get(it.q)?.correct_answer.trim().toUpperCase();
    if (correct) correctByLetter.set(correct, it.q);
  });

  const setActiveQuestion = (q: number) => {
    if (!q) return;
    setPickedQ(q);
    ctx.setFocus(q);
  };

  const assignLetter = (q: number, raw: string) => {
    const letter = raw.trim().toUpperCase();
    setActiveQuestion(q);
    if (graded) return;
    ctx.setAnswers((prev) => {
      const next = { ...prev };
      if (!letter) {
        delete next[q];
        return next;
      }
      for (const item of map.items) {
        if (item.q !== q && (next[item.q] ?? "").trim().toUpperCase() === letter)
          delete next[item.q];
      }
      next[q] = letter;
      return next;
    });
  };

  const assignActiveLetter = (letter: string) => {
    if (!activeQ) return;
    assignLetter(activeQ, letter);
  };

  const siteKey = (e: React.KeyboardEvent<SVGGElement>, letter: string) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    assignActiveLetter(letter);
  };

  feats.forEach((f, i) => {
    if (f.kind === "river") {
      const rw = Math.min(f.width ?? 4, 4.2);
      const d = smoothPath(f.points);
      art.push(
        <g key={`rv-${i}`}>
          <path
            d={d}
            fill="none"
            stroke={MAP.waterEdge}
            strokeWidth={rw + 1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={d}
            fill="none"
            stroke={MAP.water}
            strokeWidth={rw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <MapWaterMarks points={f.points} />
        </g>,
      );
      if (f.label) {
        const [mx, my] = polyMid(f.points);
        txt.push(<MapLineLabel key={`rvt-${i}`} label={f.label} x={mx} y={my - rw / 2 - 2.4} />);
      }
    } else if (f.kind === "wall") {
      art.push(
        <path
          key={`wl-${i}`}
          d={smoothPath(f.points)}
          fill="none"
          stroke={MAP.label}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2.2 1.6"
        />,
      );
      if (f.label) {
        const a = f.points[0];
        txt.push(
          <text
            key={`wlt-${i}`}
            x={a[0] + 1.5}
            y={a[1] - 1.5}
            fontSize={2.9}
            fill={MAP.label}
            {...HALO}
          >
            {f.label}
          </text>,
        );
      }
    } else if (f.kind === "road" || f.kind === "path") {
      const d = smoothPath(f.points);
      if (f.kind === "road") {
        art.push(
          <g key={`pt-${i}`}>
            <path
              d={d}
              fill="none"
              stroke={MAP.roadEdge}
              strokeWidth={3.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={d}
              fill="none"
              stroke={MAP.road}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>,
        );
      } else {
        art.push(
          <path
            key={`pt-${i}`}
            d={d}
            fill="none"
            stroke={MAP.path}
            strokeWidth={1.15}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2.3 1.6"
          />,
        );
      }
      if (f.label) {
        const [mx, my] = polyMid(f.points);
        txt.push(<MapLineLabel key={`ptt-${i}`} label={f.label} x={mx} y={my - 2.2} />);
      }
    }
  });

  feats.forEach((f, i) => {
    if (f.kind !== "landmark") return;
    art.push(<MapLandmark key={`lm-${i}`} f={f} />);
  });

  feats.forEach((f, i) => {
    if (f.kind !== "trees") return;
    const bw = f.w ?? 8;
    const bh = f.h ?? 6;
    art.push(<MapWood key={`tr-${i}`} x={f.at[0]} y={f.at[1]} w={bw} h={bh} label={f.label} />);
  });

  feats.forEach((f, i) => {
    if (f.kind !== "site") return;
    const bw = f.w ?? 8;
    const bh = f.h ?? 6;
    const sw = Math.min(Math.max(bw, 6.5), 8.4);
    const sh = Math.min(Math.max(bh, 5.2), 6.8);
    const cx = f.at[0] + bw / 2;
    const cy = f.at[1] + bh / 2;
    const selectedForActive =
      activeQ > 0 && (ctx.answers[activeQ] ?? "").trim().toUpperCase() === f.letter;
    const assignedQ = assignedBy.get(f.letter);
    const correctQ = correctByLetter.get(f.letter);
    const pickedWrong =
      graded && assignedQ != null && ctx.results?.get(assignedQ)?.is_correct === false;
    const ring = graded
      ? correctQ != null
        ? RUN.ok
        : pickedWrong
          ? BAD
          : null
      : selectedForActive
        ? MAP.ink
        : assignedQ != null
          ? MAP.ink
          : null;
    const fill = graded
      ? correctQ != null
        ? RUN.okTint
        : pickedWrong
          ? "#FDF2F2"
          : MAP.site
      : MAP.site;
    const stroke = ring ?? MAP.siteEdge;
    const hit = Math.max(sw + 6, 12.5);
    art.push(
      <g
        key={`si-${i}`}
        role={graded ? undefined : "button"}
        tabIndex={graded ? undefined : 0}
        aria-label={
          assignedQ ? `Site ${f.letter}, selected for question ${assignedQ}` : `Site ${f.letter}`
        }
        onClick={() => assignActiveLetter(f.letter)}
        onKeyDown={(e) => siteKey(e, f.letter)}
        style={{ cursor: graded ? "default" : "pointer", outline: "none" }}
        fontFamily={RUN.sans}
      >
        <rect
          x={cx - hit / 2}
          y={cy - hit / 2}
          width={hit}
          height={hit}
          rx={3}
          fill="transparent"
        />
        {ring ? (
          <rect
            x={cx - sw / 2 - 1.3}
            y={cy - sh / 2 - 1.3}
            width={sw + 2.6}
            height={sh + 2.6}
            rx={0}
            fill="none"
            stroke={ring}
            strokeWidth={graded ? 0.75 : 0.65}
          />
        ) : null}
        <rect
          x={cx - sw / 2}
          y={cy - sh / 2}
          width={sw}
          height={sh}
          rx={0}
          fill={fill}
          stroke={stroke}
          strokeWidth={selectedForActive || assignedQ != null ? 0.9 : 0.65}
        />
        <text
          x={cx}
          y={cy + 0.2}
          fontSize={3.75}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          fill={MAP.ink}
          pointerEvents="none"
        >
          {f.letter}
        </text>
      </g>,
    );
  });

  feats.forEach((f, i) => {
    if (f.kind === "marker") {
      const [x, y] = f.at;
      art.push(<MapStartMarker key={`mk-${i}`} x={x} y={y} mapH={h + bottomBand} />);
    } else if (f.kind === "compass") {
      const [x, y] = f.at;
      art.push(
        <g key={`cp-${i}`}>
          <MapCompass x={x} y={y} />
        </g>,
      );
      const cardinals: [string, number, number][] = [
        ["N", 0, -6.8],
        ["S", 0, 7.4],
        ["W", -7.1, 0.6],
        ["E", 7.1, 0.6],
      ];
      cardinals.forEach(([nm, dx, dy], k) =>
        txt.push(
          <text
            key={`cpt-${i}-${k}`}
            x={x + dx}
            y={y + dy}
            fontSize={2.15}
            fontWeight={700}
            textAnchor="middle"
            fill={MAP.label}
            {...HALO}
          >
            {nm}
          </text>,
        ),
      );
    }
  });

  return (
    <div className="lp-map-panel" style={{ display: "grid", gap: 18, alignItems: "start" }}>
      <div style={{ overflowX: "auto", minWidth: 0 }}>
        <svg
          viewBox={`${-pad} ${-titleBand - pad} ${w + pad * 2} ${h + titleBand + bottomBand + pad * 2}`}
          style={{
            width: "100%",
            maxWidth: 600,
            height: "auto",
            border: "none",
            borderRadius: 0,
            background: MAP.ground,
            display: "block",
          }}
          role="group"
          aria-label={map.title || "Map to label"}
        >
          <defs>
            <clipPath id={`mapClip-${clipId}`}>
              <rect x={0} y={0} width={w} height={h + bottomBand} />
            </clipPath>
          </defs>
          <rect
            x={0}
            y={-titleBand}
            width={w}
            height={h + titleBand + bottomBand}
            fill={MAP.ground}
            stroke={MAP.frame}
            strokeWidth={0.55}
          />
          {map.title ? (
            <text
              x={w / 2}
              y={-titleBand / 2}
              fontSize={4.1}
              fontWeight={800}
              fill={MAP.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {map.title}
            </text>
          ) : null}
          <g clipPath={`url(#mapClip-${clipId})`}>
            <g>{art}</g>
            <g fontFamily={RUN.sans}>{txt}</g>
          </g>
        </svg>
      </div>

      {/* the places to locate — each answered with a site letter */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {map.items.map((it) => {
          const r = ctx.results?.get(it.q) ?? null;
          const isActive = activeQ === it.q;
          const current = (ctx.answers[it.q] ?? "").trim().toUpperCase();
          const border = r ? (r.is_correct ? RUN.ok : BAD) : RUN.bField;
          return (
            <div
              key={it.q}
              id={`q-${it.q}`}
              onClick={() => setActiveQuestion(it.q)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 10px",
                margin: "0 -10px",
                borderTop: `1px solid ${RUN.bRow}`,
                borderRadius: 12,
                background: isActive ? RUN.vSoft : "transparent",
                boxShadow: isActive ? `inset 0 0 0 1px ${RUN.vBorder}` : undefined,
                fontFamily: RUN.sans,
                fontSize: 14.5,
                cursor: graded ? "default" : "pointer",
              }}
            >
              <NumChip n={it.q} answered={(ctx.answers[it.q] ?? "").trim() !== ""} />
              <span style={{ flex: 1, color: RUN.t2, fontWeight: 600 }}>{it.label}</span>
              <select
                value={current}
                disabled={graded}
                aria-label={`Answer ${it.q}`}
                onFocus={() => setActiveQuestion(it.q)}
                onChange={(e) => assignLetter(it.q, e.target.value)}
                style={{
                  width: 70,
                  height: 38,
                  padding: "0 10px",
                  borderRadius: 9,
                  border: `1.5px solid ${border}`,
                  background: r ? (r.is_correct ? RUN.okTint : "#FDF2F2") : "#fff",
                  boxShadow: isActive && !r ? `0 0 0 3px rgba(124,92,252,0.10)` : undefined,
                  fontFamily: RUN.sans,
                  fontSize: 14,
                  fontWeight: 700,
                  color: RUN.t1,
                }}
              >
                <option value="">–</option>
                {letters.map((l) => {
                  const usedElsewhere = map.items.some(
                    (other) =>
                      other.q !== it.q && (ctx.answers[other.q] ?? "").trim().toUpperCase() === l,
                  );
                  return (
                    <option key={l} value={l} disabled={usedElsewhere}>
                      {l}
                    </option>
                  );
                })}
              </select>
              {r ? (
                r.is_correct ? (
                  <Check size={16} color={RUN.ok} />
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <X size={16} color={BAD} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: RUN.ok }}>
                      → {r.correct_answer}
                    </span>
                  </span>
                )
              ) : null}
              <FlagButton flagged={ctx.flags.has(it.q)} onClick={() => ctx.toggleFlag(it.q)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One v2 group's material, reshaped into the existing panel views. When `bare`
 *  the panel skips its own heading (GroupPanels prints the engine instruction). */
