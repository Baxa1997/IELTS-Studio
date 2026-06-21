"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AxisFigure, Figure, PieFigure, TableFigure } from "@/lib/writing/figure";

/**
 * Renders an Academic Task 1 figure (chart/graph/table) from structured data.
 * Dependency-free SVG/HTML, brand-styled to match the studio. The SAME data is
 * flattened (figureToText) for the grader, so what the student describes and what
 * the examiner checks are guaranteed identical.
 *
 * Interactive: hover any bar / point / slice to read its exact value, and expand
 * the figure to a full-screen modal. v1 kinds: bar, grouped_bar, line, pie, table.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#1A2138";
const MUTED = "#5A6076";
const GRID = "#ECE9DD";
const AXIS = "#C7C3B4";

/** Up to 8 distinct series/slice colours (brand indigo first). */
const PALETTE = ["#3B43B5", "#2F8F5B", "#C7853A", "#5B55D6", "#2C7A9A", "#9A4F8E", "#B5852A", "#6E7388"];

export function FigureView({ figure, expandable = true }: { figure: Figure; expandable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close the modal on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const unit = "unit" in figure && figure.unit ? figure.unit : "";

  return (
    <figure style={{ margin: 0, fontFamily: SANS }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <figcaption style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.4 }}>
          {figure.title}
          {unit ? <span style={{ fontWeight: 600, color: MUTED }}> ({unit})</span> : null}
        </figcaption>
        {expandable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            title="View full screen"
            aria-label="View figure full screen"
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", border: "1px solid #E2DED0", background: "#fff", borderRadius: 8, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "#41496A", cursor: "pointer" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E7388" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Expand
          </button>
        ) : null}
      </div>

      <FigureBody figure={figure} />

      {open && mounted
        ? createPortal(<FigureModal figure={figure} onClose={() => setOpen(false)} />, document.body)
        : null}
    </figure>
  );
}

function FigureBody({ figure, big = false }: { figure: Figure; big?: boolean }) {
  if (figure.kind === "table") return <TableFigureView figure={figure} />;
  if (figure.kind === "pie") return <PieFigureView figure={figure} big={big} />;
  return <AxisFigureView figure={figure} big={big} />;
}

// ---- Full-screen modal -----------------------------------------------------

function FigureModal({ figure, onClose }: { figure: Figure; onClose: () => void }) {
  const unit = "unit" in figure && figure.unit ? figure.unit : "";
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,24,40,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px,4vw,48px)", fontFamily: SANS }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={figure.title}
        style={{ background: "#fff", borderRadius: 16, border: "1px solid #E7E3D5", padding: "22px 26px 28px", width: "min(960px, 100%)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 30px 80px -30px rgba(20,24,40,.55)" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontFamily: SANS, fontSize: 18, fontWeight: 700, color: INK, lineHeight: 1.35 }}>
            {figure.title}
            {unit ? <span style={{ fontWeight: 600, color: MUTED }}> ({unit})</span> : null}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ flexShrink: 0, width: 34, height: 34, border: "1px solid #E2DED0", background: "#FBFAF4", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#41496A" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <FigureBody figure={figure} big />
      </div>
    </div>
  );
}

// ---- Hover tooltip ---------------------------------------------------------

interface Hover {
  x: number;
  y: number;
  label: string;
  value: string;
}

/** Shared hover-tooltip plumbing: a positioned wrapper + a floating chip. The
 *  chart shapes call `report` on mouse move with their datum. */
function useHoverTooltip() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const report = (e: React.MouseEvent, label: string, value: string) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setHover({ x: e.clientX - r.left, y: e.clientY - r.top, label, value });
  };
  const clear = () => setHover(null);

  const tip = hover ? (
    <div
      style={{
        position: "absolute",
        left: hover.x,
        top: hover.y,
        transform: "translate(-50%, calc(-100% - 12px))",
        pointerEvents: "none",
        background: INK,
        color: "#fff",
        borderRadius: 8,
        padding: "6px 9px",
        fontSize: 12,
        lineHeight: 1.35,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 20px -8px rgba(20,24,40,.6)",
        zIndex: 5,
      }}
    >
      <span style={{ opacity: 0.8 }}>{hover.label}</span>
      <strong style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>{hover.value}</strong>
    </div>
  ) : null;

  return { wrapRef, report, clear, tip };
}

// ---- Legend ----------------------------------------------------------------

function Legend({ items }: { items: { label: string; color: string }[] }) {
  if (items.length <= 1) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10, justifyContent: "center" }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: MUTED }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: it.color, flexShrink: 0 }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ---- Axis charts: bar / grouped_bar / line ---------------------------------

function AxisFigureView({ figure, big = false }: { figure: AxisFigure; big?: boolean }) {
  const { wrapRef, report, clear, tip } = useHoverTooltip();
  const W = 560;
  const H = 320;
  const ML = 46;
  const MR = 14;
  const MT = 10;
  const MB = 44;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;
  const yBase = MT + plotH;

  const u = figure.unit ?? "";
  const single = figure.series.length === 1;
  const maxVal = Math.max(0, ...figure.series.flatMap((s) => s.values));
  const yMax = niceCeil(maxVal);
  const ticks = [0, 1, 2, 3, 4].map((t) => (yMax * t) / 4);
  const yFor = (v: number) => yBase - (yMax ? v / yMax : 0) * plotH;
  const band = plotW / figure.categories.length;
  const bandCenter = (i: number) => ML + band * (i + 0.5);

  const isLine = figure.kind === "line";
  const nSeries = figure.series.length;
  const groupW = band * 0.7;
  const barW = isLine ? 0 : groupW / nSeries;
  const labelOf = (sName: string, cat: string) => (single ? cat : `${sName} · ${cat}`);

  return (
    <div ref={wrapRef} style={{ position: "relative" }} onMouseLeave={clear}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label={figure.title} style={{ display: "block", maxWidth: "100%" }}>
        {/* y gridlines + labels */}
        {ticks.map((t, i) => {
          const y = yFor(t);
          return (
            <g key={i}>
              <line x1={ML} y1={y} x2={W - MR} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={ML - 7} y={y + 3.5} textAnchor="end" fontSize={11} fill={MUTED} fontFamily={SANS}>
                {fmt(t)}
              </text>
            </g>
          );
        })}
        <line x1={ML} y1={yBase} x2={W - MR} y2={yBase} stroke={AXIS} strokeWidth={1.4} />

        {/* bars or lines */}
        {isLine
          ? figure.series.map((s, si) => {
              const color = PALETTE[si % PALETTE.length];
              const pts = s.values.map((v, i) => `${bandCenter(i)},${yFor(v)}`).join(" ");
              return (
                <g key={si}>
                  <polyline points={pts} fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                  {s.values.map((v, i) => (
                    <circle
                      key={i}
                      cx={bandCenter(i)}
                      cy={yFor(v)}
                      r={5}
                      fill="#fff"
                      stroke={color}
                      strokeWidth={2}
                      style={{ cursor: "pointer" }}
                      onMouseMove={(e) => report(e, labelOf(s.name, figure.categories[i]), `${fmt(v)}${u}`)}
                    />
                  ))}
                </g>
              );
            })
          : figure.categories.map((c, i) =>
              figure.series.map((s, si) => {
                const color = PALETTE[si % PALETTE.length];
                const v = s.values[i];
                const x = bandCenter(i) - groupW / 2 + barW * si;
                const y = yFor(v);
                return (
                  <rect
                    key={`${i}-${si}`}
                    x={x}
                    y={y}
                    width={Math.max(1, barW - 2)}
                    height={Math.max(0, yBase - y)}
                    rx={2}
                    fill={color}
                    style={{ cursor: "pointer" }}
                    onMouseMove={(e) => report(e, labelOf(s.name, c), `${fmt(v)}${u}`)}
                  />
                );
              }),
            )}

        {/* x category labels */}
        {figure.categories.map((c, i) => (
          <text key={i} x={bandCenter(i)} y={yBase + 16} textAnchor="middle" fontSize={11} fill={INK} fontFamily={SANS}>
            {trunc(c, big ? 18 : 12)}
          </text>
        ))}

        {figure.x_label ? (
          <text x={ML + plotW / 2} y={H - 4} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={MUTED} fontFamily={SANS}>
            {figure.x_label}
          </text>
        ) : null}
        {figure.y_label ? (
          <text x={12} y={MT + plotH / 2} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={MUTED} fontFamily={SANS} transform={`rotate(-90 12 ${MT + plotH / 2})`}>
            {figure.y_label}
          </text>
        ) : null}
      </svg>
      <Legend items={figure.series.map((s, si) => ({ label: s.name, color: PALETTE[si % PALETTE.length] }))} />
      {tip}
    </div>
  );
}

// ---- Pie -------------------------------------------------------------------

function PieFigureView({ figure, big = false }: { figure: PieFigure; big?: boolean }) {
  const { wrapRef, report, clear, tip } = useHoverTooltip();
  const total = figure.slices.reduce((a, s) => a + s.value, 0) || 1;
  const cx = 110;
  const cy = 110;
  const r = 100;
  const u = figure.unit ?? "";
  let acc = -Math.PI / 2; // start at 12 o'clock

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }} onMouseLeave={clear}>
      <svg viewBox="0 0 220 220" width={big ? 300 : 210} height={big ? 300 : 210} role="img" aria-label={figure.title} style={{ flexShrink: 0, maxWidth: "100%" }}>
        {figure.slices.map((s, i) => {
          const frac = s.value / total;
          const start = acc;
          const end = acc + frac * Math.PI * 2;
          acc = end;
          const color = PALETTE[i % PALETTE.length];
          const pct = `${Math.round(frac * 100)}%`;
          const onMove = (e: React.MouseEvent) => report(e, s.label, `${fmt(s.value)}${u} · ${pct}`);
          if (frac >= 0.9999) return <circle key={i} cx={cx} cy={cy} r={r} fill={color} style={{ cursor: "pointer" }} onMouseMove={onMove} />;
          return <path key={i} d={arc(cx, cy, r, start, end)} fill={color} style={{ cursor: "pointer" }} onMouseMove={onMove} />;
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
        {figure.slices.map((s, i) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: INK }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
            <span style={{ color: MUTED }}>{s.label}</span>
            <strong style={{ marginLeft: "auto", paddingLeft: 14, fontVariantNumeric: "tabular-nums" }}>
              {fmt(s.value)}
              {u}
            </strong>
          </span>
        ))}
      </div>
      {tip}
    </div>
  );
}

/** SVG path for a pie wedge from `start` to `end` radians. */
function arc(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

// ---- Table -----------------------------------------------------------------

function TableFigureView({ figure }: { figure: TableFigure }) {
  const cell: React.CSSProperties = {
    padding: "8px 11px",
    fontSize: 13,
    textAlign: "left",
    borderBottom: "1px solid #EEEAE0",
    color: INK,
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: SANS }}>
        <thead>
          <tr>
            {figure.columns.map((c, i) => (
              <th key={i} style={{ ...cell, fontWeight: 700, color: MUTED, background: "#FBFAF4", whiteSpace: "nowrap" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {figure.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci} style={{ ...cell, fontVariantNumeric: typeof c === "number" ? "tabular-nums" : "normal", fontWeight: ci === 0 ? 600 : 400 }}>
                  {typeof c === "number" ? `${fmt(c)}${figure.unit ?? ""}` : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------------

/** Round an axis maximum up to a clean 1/2/2.5/5/10 × 10ⁿ value. */
function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(x));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= x) return m * pow;
  }
  return 10 * pow;
}

/** Compact number: drop trailing .0, keep one decimal otherwise. */
function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(1)).toString();
}

function trunc(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
