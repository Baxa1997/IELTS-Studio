"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Highlighter } from "lucide-react";
import {
  BRAND as D_ACCENT,
  BRAND_SOFT as D_ATINT2,
  LINE as D_LINE,
  PANEL,
} from "@/lib/theme/tokens";

import { D_DARK, D_SLATE2, D_SLATE3, JAKARTA } from "./design";

// ---- Text highlighter (marker) ---------------------------------------------

// A real-exam-style highlighter for the reading text: pick a transparent pen,
// drag across words to mark them. Painted with the CSS Custom Highlight API
// (CSS.highlights + ::highlight()) so nothing is written into React's DOM —
// highlights survive scrolling and can't desync the rendered passage. Stored as
// live Ranges; stale ones (after a re-render) are pruned on the next rebuild.
type PenColor = "yellow" | "green" | "pink" | "blue";
type MarkTool = PenColor | "eraser" | null;
const PEN_NAMES: Record<PenColor, string> = {
  yellow: "cefr-hl-yellow",
  green: "cefr-hl-green",
  pink: "cefr-hl-pink",
  blue: "cefr-hl-blue",
};
const PENS: { key: PenColor; label: string; solid: string }[] = [
  { key: "yellow", label: "Yellow", solid: "#fde047" },
  { key: "green", label: "Green", solid: "#86efac" },
  { key: "pink", label: "Pink", solid: "#f9a8d4" },
  { key: "blue", label: "Blue", solid: "#93c5fd" },
];

function rangesOverlap(a: Range, b: Range): boolean {
  try {
    return (
      a.compareBoundaryPoints(Range.START_TO_END, b) > 0 &&
      a.compareBoundaryPoints(Range.END_TO_START, b) < 0
    );
  } catch {
    return false;
  }
}

export function useHighlighter(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [tool, setTool] = useState<MarkTool>(null);
  const [marks, setMarks] = useState(0);
  const storeRef = useRef<Map<PenColor, Range[]>>(new Map());

  const rebuild = useCallback(() => {
    const HL =
      typeof CSS !== "undefined"
        ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights
        : undefined;
    const HC =
      typeof window !== "undefined"
        ? (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight
        : undefined;
    if (!HL || !HC) return;
    let count = 0;
    (Object.keys(PEN_NAMES) as PenColor[]).forEach((c) => {
      const ranges = (storeRef.current.get(c) ?? []).filter(
        (r) => r.startContainer.isConnected && r.endContainer.isConnected,
      );
      storeRef.current.set(c, ranges);
      if (ranges.length) {
        HL.set(PEN_NAMES[c], new HC(...ranges));
        count += ranges.length;
      } else HL.delete(PEN_NAMES[c]);
    });
    setMarks(count);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!tool) return;
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !container) return;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer))
      return;
    if (tool === "eraser") {
      (Object.keys(PEN_NAMES) as PenColor[]).forEach((c) => {
        storeRef.current.set(
          c,
          (storeRef.current.get(c) ?? []).filter((r) => !rangesOverlap(r, range)),
        );
      });
    } else {
      storeRef.current.set(tool, [...(storeRef.current.get(tool) ?? []), range.cloneRange()]);
    }
    sel.removeAllRanges();
    rebuild();
  }, [tool, containerRef, rebuild]);

  const clearAll = useCallback(() => {
    const HL =
      typeof CSS !== "undefined"
        ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights
        : undefined;
    storeRef.current.clear();
    if (HL) Object.values(PEN_NAMES).forEach((n) => HL.delete(n));
    setMarks(0);
  }, []);

  useEffect(() => clearAll, [clearAll]); // drop our highlights when the runner unmounts
  return { tool, setTool, onMouseUp, clearAll, marks };
}

export function MarkerToolbar({
  tool,
  setTool,
  onClear,
  marks,
}: {
  tool: MarkTool;
  setTool: (t: MarkTool) => void;
  onClear: () => void;
  marks: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        paddingLeft: 14,
        borderLeft: `1px solid ${D_LINE}`,
      }}
    >
      <Highlighter size={15} style={{ color: D_SLATE2, flexShrink: 0 }} />
      {PENS.map((p) => {
        const on = tool === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setTool(on ? null : p.key)}
            title={`${p.label} highlighter`}
            aria-pressed={on}
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              cursor: "pointer",
              background: p.solid,
              border: "1px solid rgba(0,0,0,.14)",
              outline: on ? `2px solid ${D_DARK}` : "none",
              outlineOffset: 1,
              flexShrink: 0,
            }}
          />
        );
      })}
      <button
        type="button"
        onClick={() => setTool(tool === "eraser" ? null : "eraser")}
        title="Eraser"
        aria-pressed={tool === "eraser"}
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: tool === "eraser" ? D_ATINT2 : PANEL,
          border: `1px solid ${tool === "eraser" ? D_ACCENT : D_LINE}`,
          color: tool === "eraser" ? D_ACCENT : D_SLATE2,
          flexShrink: 0,
        }}
      >
        <Eraser size={13} />
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={!marks}
        title="Clear all highlights"
        style={{
          height: 26,
          padding: "0 10px",
          borderRadius: 7,
          fontFamily: JAKARTA,
          fontSize: 12,
          fontWeight: 600,
          cursor: marks ? "pointer" : "default",
          background: PANEL,
          border: `1px solid ${D_LINE}`,
          color: marks ? D_SLATE3 : D_SLATE2,
          opacity: marks ? 1 : 0.55,
          flexShrink: 0,
        }}
      >
        Clear
      </button>
    </div>
  );
}
