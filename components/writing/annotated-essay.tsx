"use client";

import type React from "react";
import { useState } from "react";

import { ANN_ORDER, ANN_STYLE, matchRanges, type AnnRange, type Annotation } from "./annotations";

/**
 * The marked-up essay (Option A brand) — shared by the writing studio's Results
 * screen and the Activities essay-feedback page so a fresh grade and a reopened
 * one look identical. Each annotation's verbatim `text` is highlighted by type
 * AND numbered, with a matching "Why these are marked" list below that spells out
 * the reason + fix for every highlight. Hovering a highlight or a list row
 * cross-emphasises the pair. Renders plain text when there are no annotations.
 *
 * Pure helpers (cleanAnnotations, the type, the colors) live in ./annotations so
 * server components can use them without importing this client module.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#1A1C33";
const MUTED = "#565a72";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16 };

export function AnnotatedEssay({
  essayText,
  annotations,
}: {
  essayText: string;
  annotations: Annotation[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const ranges = matchRanges(essayText, annotations);

  const counts: Record<Annotation["type"], number> = { spelling: 0, grammar: 0, vocabulary: 0, cohesion: 0 };
  for (const r of ranges) counts[r.ann.type] += 1;
  const present = ANN_ORDER.filter((t) => counts[t] > 0);

  return (
    <div style={{ ...cardStyle, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #F0EEE3" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}>Your essay, marked up</div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: "#8a897c" }}>{ranges.length ? "Each highlight is explained below" : ""}</div>
      </div>

      {present.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "12px 22px", borderBottom: "1px solid #F0EEE3", background: "#FBFAF4" }}>
          {present.map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 600, fontSize: 12, color: MUTED }}>
              <span style={{ width: 14, height: 7, borderRadius: 3, background: ANN_STYLE[t].bg, boxShadow: `inset 0 0 0 1px ${ANN_STYLE[t].fg}55` }} />
              {ANN_STYLE[t].label} <b style={{ color: INK }}>{counts[t]}</b>
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ padding: 22, fontFamily: SANS, fontSize: 16.5, lineHeight: 2.05, color: "#23263b", whiteSpace: "pre-wrap" }}>
        {ranges.length ? renderMarked(essayText, ranges, active, setActive) : essayText}
      </div>

      {ranges.length ? (
        <div style={{ borderTop: "1px solid #F0EEE3", background: "#FCFBF6" }}>
          <div style={{ padding: "14px 22px 6px", fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: ".02em", color: INK }}>
            Why these are marked <span style={{ color: "#9a998c", fontWeight: 600 }}>· {ranges.length}</span>
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: "0 0 8px" }}>
            {ranges.map((r, i) => {
              const st = ANN_STYLE[r.ann.type];
              const on = active === i;
              return (
                <li
                  key={i}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  style={{ display: "flex", gap: 12, padding: "11px 22px", background: on ? "#F4F2E8" : "transparent", transition: "background .15s ease" }}
                >
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, background: st.bg, color: st.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 12, boxShadow: `inset 0 0 0 1px ${st.fg}40` }}>{i + 1}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: st.fg, background: st.bg, borderRadius: 5, padding: "1px 7px" }}>&ldquo;{r.ann.text.trim()}&rdquo;</span>
                      <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#9a998c" }}>{st.label}</span>
                    </div>
                    {r.ann.note ? <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>{r.ann.note}</p> : null}
                    {r.ann.fix ? (
                      <p style={{ margin: "5px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: INK }}>
                        <b style={{ color: st.fg }}>Fix:</b> {r.ann.fix}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: "#9a998c", margin: 0, padding: "0 22px 18px" }}>Per-mistake mark-up appears on essays graded with annotations.</p>
      )}
    </div>
  );
}

/** Render the essay text, wrapping each matched range in a numbered highlight. */
function renderMarked(
  text: string,
  ranges: AnnRange[],
  active: number | null,
  setActive: (i: number | null) => void,
): React.ReactNode {
  const out: React.ReactNode[] = [];
  let cur = 0;
  let key = 0;
  ranges.forEach((r, i) => {
    if (r.start < cur) return;
    if (r.start > cur) out.push(<span key={key++}>{text.slice(cur, r.start)}</span>);
    const st = ANN_STYLE[r.ann.type] ?? ANN_STYLE.grammar;
    const on = active === i;
    const tip = [r.ann.note, r.ann.fix ? `→ ${r.ann.fix}` : ""].filter(Boolean).join("   ");
    out.push(
      <mark
        key={key++}
        tabIndex={0}
        title={tip || undefined}
        onMouseEnter={() => setActive(i)}
        onMouseLeave={() => setActive(null)}
        onFocus={() => setActive(i)}
        onBlur={() => setActive(null)}
        style={{ background: st.bg, color: st.fg, borderRadius: 4, padding: "0 2px", cursor: "help", outline: "none", boxShadow: on ? `0 0 0 2px ${st.fg}` : "none", transition: "box-shadow .15s ease" }}
      >
        {text.slice(r.start, r.end)}
        <sup style={{ fontFamily: SANS, fontWeight: 800, fontSize: "0.62em", marginLeft: 1, color: st.fg, verticalAlign: "super" }}>{i + 1}</sup>
      </mark>,
    );
    cur = r.end;
  });
  if (cur < text.length) out.push(<span key={key++}>{text.slice(cur)}</span>);
  return out;
}
