"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Highlighter } from "lucide-react";

import { INDIGO, MUTED, SANS } from "./tokens";

/**
 * Shared exam-surface reading tools — a real-test text highlighter (marker pens)
 * and an OS-fullscreen toggle. Lifted so the IELTS single/full-test runners get
 * the same marking + focus controls the CEFR (Multilevel) runner already has.
 *
 * The highlighter paints with the CSS Custom Highlight API (CSS.highlights +
 * ::highlight()), so nothing is written into React's DOM — marks survive scrolling
 * and re-renders and can never desync the rendered passage. Ranges are stored live;
 * stale ones (after a re-render) are pruned on the next rebuild.
 */

// ---- Fullscreen ------------------------------------------------------------

/** True OS fullscreen for the runner's own root, so it fills the screen with no
 *  browser chrome, like the real test. webkit-prefixed fallback for Safari. */
export function useFullscreen(ref: React.RefObject<HTMLElement | null>) {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const d = document as Document & { webkitFullscreenElement?: Element };
    const onChange = () => setIsFull(!!(document.fullscreenElement || d.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  const toggle = useCallback(() => {
    const el = ref.current as (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }) | null;
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> };
    const active = document.fullscreenElement || d.webkitFullscreenElement;
    if (!active) void (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.())?.catch?.(() => {});
    else void (document.exitFullscreen?.() ?? d.webkitExitFullscreen?.())?.catch?.(() => {});
  }, [ref]);
  return { isFull, toggle };
}

// ---- Text highlighter (marker) ---------------------------------------------

export type PenColor = "yellow" | "green" | "pink" | "blue";
export type MarkTool = PenColor | "eraser" | null;

// Distinct highlight names from the CEFR runner's (`cefr-hl-*`) so the two never
// clash if both ever register in one document.
const PEN_NAMES: Record<PenColor, string> = {
  yellow: "read-hl-yellow",
  green: "read-hl-green",
  pink: "read-hl-pink",
  blue: "read-hl-blue",
};

export const PENS: { key: PenColor; label: string; solid: string }[] = [
  { key: "yellow", label: "Yellow", solid: "#fde047" },
  { key: "green", label: "Green", solid: "#86efac" },
  { key: "pink", label: "Pink", solid: "#f9a8d4" },
  { key: "blue", label: "Blue", solid: "#93c5fd" },
];

/** Transparent pen fills — inject once per runner via a <style>{HIGHLIGHT_CSS}</style>. */
export const HIGHLIGHT_CSS =
  "::highlight(read-hl-yellow){background-color:rgba(253,224,71,.5)}" +
  "::highlight(read-hl-green){background-color:rgba(134,239,172,.55)}" +
  "::highlight(read-hl-pink){background-color:rgba(249,168,212,.55)}" +
  "::highlight(read-hl-blue){background-color:rgba(147,197,253,.6)}";

function rangesOverlap(a: Range, b: Range): boolean {
  try {
    return a.compareBoundaryPoints(Range.START_TO_END, b) > 0 && a.compareBoundaryPoints(Range.END_TO_START, b) < 0;
  } catch {
    return false;
  }
}

export function useHighlighter(containerRef: React.RefObject<HTMLElement | null>) {
  const [tool, setTool] = useState<MarkTool>(null);
  const [marks, setMarks] = useState(0);
  const storeRef = useRef<Map<PenColor, Range[]>>(new Map());

  const rebuild = useCallback(() => {
    const HL = typeof CSS !== "undefined" ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights : undefined;
    const HC = typeof window !== "undefined" ? (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight : undefined;
    if (!HL || !HC) return;
    let count = 0;
    (Object.keys(PEN_NAMES) as PenColor[]).forEach((c) => {
      const ranges = (storeRef.current.get(c) ?? []).filter((r) => r.startContainer.isConnected && r.endContainer.isConnected);
      storeRef.current.set(c, ranges);
      if (ranges.length) { HL.set(PEN_NAMES[c], new HC(...ranges)); count += ranges.length; }
      else HL.delete(PEN_NAMES[c]);
    });
    setMarks(count);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!tool) return;
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !container) return;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return;
    if (tool === "eraser") {
      (Object.keys(PEN_NAMES) as PenColor[]).forEach((c) => {
        storeRef.current.set(c, (storeRef.current.get(c) ?? []).filter((r) => !rangesOverlap(r, range)));
      });
    } else {
      storeRef.current.set(tool, [...(storeRef.current.get(tool) ?? []), range.cloneRange()]);
    }
    sel.removeAllRanges();
    rebuild();
  }, [tool, containerRef, rebuild]);

  const clearAll = useCallback(() => {
    const HL = typeof CSS !== "undefined" ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights : undefined;
    storeRef.current.clear();
    if (HL) Object.values(PEN_NAMES).forEach((n) => HL.delete(n));
    setMarks(0);
  }, []);

  useEffect(() => clearAll, [clearAll]); // drop our highlights when the runner unmounts
  return { tool, setTool, onMouseUp, clearAll, marks };
}

// ---- Toolbar ---------------------------------------------------------------

/** Compact marker toolbar styled for the light IELTS exam chrome. */
export function MarkerToolbar({ tool, setTool, onClear, marks }: {
  tool: MarkTool; setTool: (t: MarkTool) => void; onClear: () => void; marks: number;
}) {
  const LINE = "#EAE8F2";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, paddingLeft: 14, borderLeft: `1px solid ${LINE}` }}>
      <Highlighter size={15} style={{ color: MUTED, flexShrink: 0 }} />
      {PENS.map((p) => {
        const on = tool === p.key;
        return (
          <button key={p.key} type="button" onClick={() => setTool(on ? null : p.key)} title={`${p.label} highlighter`} aria-pressed={on}
            style={{ width: 20, height: 20, borderRadius: 6, cursor: "pointer", background: p.solid, border: "1px solid rgba(0,0,0,.14)", outline: on ? `2px solid ${INDIGO}` : "none", outlineOffset: 1, flexShrink: 0 }} />
        );
      })}
      <button type="button" onClick={() => setTool(tool === "eraser" ? null : "eraser")} title="Eraser" aria-pressed={tool === "eraser"}
        style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: tool === "eraser" ? "#F4F3FC" : "#fff", border: `1px solid ${tool === "eraser" ? INDIGO : LINE}`, color: tool === "eraser" ? INDIGO : MUTED, flexShrink: 0 }}>
        <Eraser size={13} />
      </button>
      <button type="button" onClick={onClear} disabled={!marks} title="Clear all highlights"
        style={{ height: 26, padding: "0 10px", borderRadius: 7, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: marks ? "pointer" : "default", background: "#fff", border: `1px solid ${LINE}`, color: marks ? "#46435C" : "#A6A2B8", opacity: marks ? 1 : 0.55, flexShrink: 0 }}>Clear</button>
    </div>
  );
}
