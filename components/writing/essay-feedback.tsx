"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Figure } from "@/lib/writing/figure";
import { computeWritingInsights, type WritingInsights } from "@/lib/writing/insights";
import { bandColor } from "@/lib/ui/band";

import { ANN_STYLE, matchRanges, type Annotation } from "./annotations";
import { FigureView } from "./figure";

/**
 * Full-page essay feedback (Option A brand) — the dedicated, chrome-free page a
 * student lands on from Activities. Two columns: the marked-up essay (left) and a
 * tabbed detail panel (right) that switches between per-criterion bands and the
 * sentence-level fix list. Clicking a highlight jumps to its fix. All data is
 * read-only and passed in from the server page (no model call here).
 *
 * Implements the imported "Essay Feedback.dc.html" design, with brand indigo kept
 * at #3B43B5 for app-wide consistency.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const EMERALD = "#1F9D5E";
const RED = "#C5503C";
const AMBER = "#B5852A";

export interface CriterionScore {
  band: number;
  evidence: string;
  what_caps_it: string;
  fix: string;
}

const CRIT_KEYS = ["TR", "CC", "LR", "GRA"] as const;
type CritKey = (typeof CRIT_KEYS)[number];

function critName(key: CritKey, taskType: string): string {
  if (key === "TR") return taskType === "task2" ? "Task Response" : "Task Achievement";
  return { CC: "Coherence & Cohesion", LR: "Lexical Resource", GRA: "Grammar Range & Accuracy" }[key];
}
function critShort(key: CritKey, taskType: string): string {
  if (key === "TR") return taskType === "task2" ? "Task Response" : "Task Achievement";
  return { CC: "Coherence", LR: "Lexical Resource", GRA: "Grammar" }[key];
}

const TASK_PILL: Record<string, string> = {
  task2: "TASK 2",
  task1_academic: "TASK 1",
  task1_general: "TASK 1",
};

interface Props {
  taskType: string;
  topicFamily: string | null;
  /** Academic Task 1 only: the figure the essay described, shown for context. */
  figure?: Figure | null;
  overallBand: number;
  bandWithFixes: number | null;
  criteria: Record<string, CriterionScore>;
  blocker: { criterion: string; why: string } | null;
  essayText: string;
  annotations: Annotation[];
  /** Back link target + label (default → the Activities list). */
  backHref?: string;
  backLabel?: string;
  /** "Revise with these fixes": a link target (Activities review) OR an in-place
   *  handler (studio results, which revises the same draft without navigating).
   *  onRevise wins when both are set. */
  reviseHref?: string | null;
  onRevise?: () => void;
  /** Compliance line shown under the essay; falls back to a default. */
  disclaimer?: string;
}

const DEFAULT_DISCLAIMER = "AI-estimated bands — not affiliated with or endorsed by IELTS®.";

const reviseStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", border: "none", borderRadius: 10, background: INDIGO, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, textDecoration: "none", cursor: "pointer", boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)" };

export function EssayFeedback({
  taskType,
  topicFamily,
  figure = null,
  overallBand,
  bandWithFixes,
  criteria,
  blocker,
  essayText,
  annotations,
  backHref = "/activities",
  backLabel = "Activities",
  reviseHref = null,
  onRevise,
  disclaimer,
}: Props) {
  const ranges = matchRanges(essayText, annotations);
  const insights = useMemo(() => computeWritingInsights(essayText), [essayText]);
  const [tab, setTab] = useState<"bands" | "issues" | "insights">("bands");
  const [selected, setSelected] = useState<number | null>(null); // 1-based issue index
  const fixListRef = useRef<HTMLDivElement>(null);

  // When a highlight is picked, reveal the fix list and scroll the row into view.
  useEffect(() => {
    if (tab !== "issues" || selected == null) return;
    const el = fixListRef.current?.querySelector<HTMLElement>(`[data-fix="${selected}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [tab, selected]);

  const pick = (n: number) => {
    setSelected(n);
    setTab("issues");
  };

  const counts: Record<Annotation["type"], number> = { spelling: 0, grammar: 0, vocabulary: 0, cohesion: 0 };
  for (const r of ranges) counts[r.ann.type] += 1;
  const legend = (["spelling", "grammar", "vocabulary"] as const).filter((t) => counts[t] > 0);

  const showLift = bandWithFixes != null && bandWithFixes > overallBand;

  return (
    <div
      className="lp-fb-root"
      style={{ height: "100dvh", background: "#F4F1E7", fontFamily: SANS, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {/* header */}
      <header
        className="lp-fb-noprint"
        style={{ height: 60, flex: "none", background: "#fff", borderBottom: "1px solid #E7E3D5", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Link
            href={backHref}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 13px 0 11px", border: "1px solid #E2DED0", background: "#FBFAF4", borderRadius: 9, fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#41496A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {backLabel}
          </Link>
          <div style={{ width: 1, height: 24, background: "#E7E3D5" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 9px", borderRadius: 6, background: "#1A2138", color: "#fff", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", flex: "none" }}>{TASK_PILL[taskType] ?? "WRITING"}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: INK, flex: "none" }}>Essay feedback</span>
            {topicFamily ? (
              <>
                <span style={{ color: "#C7C3B4" }}>·</span>
                <span style={{ fontSize: 14, color: "#767C90", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topicFamily}</span>
              </>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", border: "1px solid #E2DED0", background: "#FBFAF4", borderRadius: 10, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: "#41496A", cursor: "pointer" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#41496A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export PDF
          </button>
          {onRevise ? (
            <button type="button" onClick={onRevise} style={reviseStyle}>
              Revise with these fixes
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          ) : reviseHref ? (
            <Link href={reviseHref} style={reviseStyle}>
              Revise with these fixes
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          ) : null}
        </div>
      </header>

      {/* score summary strip */}
      <div style={{ flex: "none", background: "#fff", borderBottom: "1px solid #E7E3D5", padding: "16px 22px", display: "flex", alignItems: "center", gap: 26 }} className="lp-fb-strip">
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, paddingRight: 26, borderRight: "1px solid #EEE9DA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 62, fontWeight: 800, lineHeight: 0.82, color: bandColor(overallBand).fg, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em" }}>{overallBand.toFixed(1)}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: "#8A8FA0", textTransform: "uppercase", lineHeight: 1.1 }}>Overall<br />band</span>
              <span style={{ alignSelf: "flex-start", fontSize: 11.5, fontWeight: 700, color: bandColor(overallBand).fg, background: bandColor(overallBand).bg, padding: "2px 9px", borderRadius: 999 }}>{bandColor(overallBand).label}</span>
            </div>
          </div>
          {showLift ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#E9F5EE", border: "1px solid #CDE9D8", borderRadius: 11 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              <span style={{ fontSize: 13.5, color: "#2C7A52", fontWeight: 600 }}>
                Up to <strong style={{ fontWeight: 800, color: "#1A7A48" }}>{bandWithFixes!.toFixed(1)}</strong> with the fixes
              </span>
            </div>
          ) : null}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 12 }} className="lp-fb-tiles">
          {CRIT_KEYS.map((key) => {
            const c = criteria[key];
            if (!c) return null;
            const isBlocker = blocker?.criterion === key;
            const color = isBlocker ? RED : c.band >= 7 ? "#2C3247" : c.band >= 6 ? "#2C3247" : AMBER;
            const tag = isBlocker ? "Fix this first" : c.band >= 7 ? "Strong" : c.band >= 6 ? "Solid" : "Needs work";
            const tagColor = isBlocker ? RED : c.band >= 6 ? "#9A8F77" : AMBER;
            return (
              <div key={key} style={{ flex: 1, minWidth: 0, background: isBlocker ? "#FCEEEA" : "#FBFAF4", border: `1px solid ${isBlocker ? "#F3CFC6" : "#EFECE0"}`, borderRadius: 12, padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{critShort(key, taskType)}</span>
                  <span style={{ fontSize: 21, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.band.toFixed(1)}</span>
                </div>
                <div style={{ marginTop: 9, height: 5, borderRadius: 3, background: isBlocker ? "#F3DAD3" : "#EEEAE0", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((Math.min(9, c.band) / 9) * 100)}%`, height: "100%", borderRadius: 3, background: color }} />
                </div>
                <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 600, color: tagColor }}>{tag}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* workspace */}
      <div className="lp-fb-workspace" style={{ flex: 1, minHeight: 0, display: "flex", gap: 16, padding: 16 }}>
        {/* LEFT: marked-up essay */}
        <main className="lp-fb-main" style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: "none", padding: "15px 24px", borderBottom: "1px solid #F0EDE1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: INK }}>Your essay, marked up</h2>
              {ranges.length ? <span style={{ fontSize: 13, color: "#9A9EAE" }}>tap a highlight for the fix</span> : null}
            </div>
            {legend.length ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {legend.map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: ANN_STYLE[t].bg, border: `1px solid ${ANN_STYLE[t].fg}55` }} />
                    <span style={{ fontSize: 12.5, color: MUTED }}>{ANN_STYLE[t].label} <strong style={{ color: INK }}>{counts[t]}</strong></span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="lp-fb-col" style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "30px 40px 40px" }}>
            {figure ? (
              <div style={{ maxWidth: 760, margin: "0 auto 24px", padding: "18px 20px", background: "#FBFAF4", border: "1px solid #EFECE0", borderRadius: 12 }}>
                <FigureView figure={figure} />
              </div>
            ) : null}
            <div style={{ maxWidth: 760, margin: "0 auto", fontFamily: SERIF, fontSize: 18, lineHeight: 2.0, color: "#262B3D", whiteSpace: "pre-wrap" }}>
              {ranges.length ? renderEssay(essayText, ranges, selected, pick) : essayText}
            </div>
            <p style={{ maxWidth: 760, margin: "26px auto 0", fontFamily: SANS, fontSize: 11.5, lineHeight: 1.5, color: "#A7ABBA" }}>{disclaimer ?? DEFAULT_DISCLAIMER}</p>
          </div>
        </main>

        {/* RIGHT: detail panel */}
        <aside className="lp-fb-aside" style={{ width: 480, flex: "none", background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="lp-fb-noprint" style={{ flex: "none", padding: "14px 16px", borderBottom: "1px solid #F0EDE1" }}>
            <div style={{ display: "flex", gap: 4, background: "#F1EFE4", borderRadius: 11, padding: 4 }}>
              <button type="button" onClick={() => setTab("bands")} style={tabStyle(tab === "bands")}>Bands</button>
              <button type="button" onClick={() => setTab("issues")} style={tabStyle(tab === "issues")}>Fixes · {ranges.length}</button>
              <button type="button" onClick={() => setTab("insights")} style={tabStyle(tab === "insights")}>Insights</button>
            </div>
          </div>

          <div ref={fixListRef} className="lp-fb-col" style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16 }}>
            {tab === "bands" ? (
              <BandsView taskType={taskType} criteria={criteria} blocker={blocker} bandWithFixes={bandWithFixes} overallBand={overallBand} />
            ) : tab === "issues" ? (
              <IssuesView ranges={ranges} selected={selected} />
            ) : (
              <InsightsView insights={insights} taskType={taskType} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    height: 34,
    border: "none",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    background: active ? "#fff" : "transparent",
    color: active ? INK : "#767C90",
    boxShadow: active ? "0 1px 3px rgba(26,33,56,.14)" : "none",
  };
}

function BandsView({
  taskType,
  criteria,
  blocker,
  bandWithFixes,
  overallBand,
}: {
  taskType: string;
  criteria: Record<string, CriterionScore>;
  blocker: { criterion: string; why: string } | null;
  bandWithFixes: number | null;
  overallBand: number;
}) {
  const lift = bandWithFixes != null && bandWithFixes > overallBand ? bandWithFixes - overallBand : null;
  return (
    <div>
      {blocker ? (
        <div style={{ background: "#FCEEEA", border: "1px solid #F3CFC6", borderRadius: 13, padding: "15px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: RED }}>FIX THIS FIRST</span>
            {lift ? (
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#1A7A48", background: "#E9F5EE", border: "1px solid #CDE9D8", padding: "2px 8px", borderRadius: 999 }}>+{lift.toFixed(1)} band</span>
            ) : null}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#3A3F58" }}>
            <strong style={{ color: INK }}>{critName(blocker.criterion as CritKey, taskType)}</strong> — {blocker.why}
          </p>
        </div>
      ) : null}

      {CRIT_KEYS.map((key) => {
        const c = criteria[key];
        if (!c) return null;
        const isBlocker = blocker?.criterion === key;
        const badge = isBlocker
          ? { label: "Capping", text: RED, bg: "#FCEEEA" }
          : c.band >= 7
            ? { label: "Strong", text: "#2C7A52", bg: "#E9F5EE" }
            : c.band >= 6
              ? { label: "Solid", text: "#2C7A52", bg: "#E9F5EE" }
              : { label: "Developing", text: AMBER, bg: "#F6EAD0" };
        return (
          <div key={key} style={{ background: "#fff", border: `1px solid ${isBlocker ? "#F3CFC6" : "#EAE6D8"}`, borderRadius: 13, padding: "15px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11, gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{critName(key, taskType)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, flex: "none" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: badge.text, background: badge.bg, padding: "2px 8px", borderRadius: 999 }}>{badge.label}</span>
                <span style={{ fontSize: 19, fontWeight: 800, color: isBlocker ? RED : "#2C3247", fontVariantNumeric: "tabular-nums" }}>{c.band.toFixed(1)}</span>
              </span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", color: "#9A9EAE", textTransform: "uppercase" }}>In your essay</span>
              <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{c.evidence}</p>
            </div>
            {c.what_caps_it ? (
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", color: "#9A9EAE", textTransform: "uppercase" }}>What&rsquo;s capping it</span>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{c.what_caps_it}</p>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 10, padding: "11px 12px", background: "#FBFAF4", border: "1px solid #EFECE0", borderRadius: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#2C3247" }}><strong style={{ color: INDIGO }}>Fix:</strong> {c.fix}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IssuesView({ ranges, selected }: { ranges: ReturnType<typeof matchRanges>; selected: number | null }) {
  if (!ranges.length) {
    return <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#8A8FA0" }}>No sentence-level mark-up on this essay. The per-criterion bands and fixes are on the &ldquo;Bands &amp; feedback&rdquo; tab.</p>;
  }
  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8A8FA0" }}>{ranges.length} sentence-level {ranges.length === 1 ? "fix" : "fixes"}, mapped to the highlights in your essay.</p>
      {ranges.map((r, i) => {
        const n = i + 1;
        const st = ANN_STYLE[r.ann.type];
        const on = selected === n;
        return (
          <div key={n} data-fix={n} style={{ display: "flex", gap: 12, padding: "13px 13px", borderRadius: 12, background: on ? "#FBFAF4" : "transparent", boxShadow: on ? `0 0 0 2px ${st.fg}66` : "none", marginBottom: 6, transition: "background .15s ease, box-shadow .15s ease" }}>
            <span style={{ flex: "none", width: 26, height: 26, borderRadius: 8, background: st.bg, border: `1px solid ${st.fg}40`, color: st.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{n}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: st.fg, background: st.bg, border: `1px solid ${st.fg}40`, padding: "1px 8px", borderRadius: 6 }}>&ldquo;{r.ann.text.trim()}&rdquo;</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "#9A9EAE", textTransform: "uppercase" }}>{st.label}</span>
              </div>
              {r.ann.note ? <p style={{ margin: "7px 0 8px", fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{r.ann.note}</p> : <div style={{ height: 8 }} />}
              {r.ann.fix ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                  <span style={{ color: "#9A9EAE", textDecoration: "line-through" }}>{r.ann.text.trim()}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <span style={{ fontWeight: 700, color: "#1A7A48", background: "#E9F5EE", border: "1px solid #CDE9D8", padding: "1px 9px", borderRadius: 6 }}>{r.ann.fix}</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Structural "at a glance" panel — the surface metrics the big public graders show
 * (word count, sentences, paragraphs, linking words, repeated words), computed
 * deterministically from the essay (no model, no band judgement). Helps the writer
 * see range/cohesion habits the per-criterion feedback then explains.
 */
function InsightsView({ insights, taskType }: { insights: WritingInsights; taskType: string }) {
  const minWords = taskType === "task2" ? 250 : 150;
  const wordsOk = insights.wordCount >= minWords;
  const linkOk = insights.linkingUnique >= 5;
  const runOn = insights.longestSentence > 40;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* word count, headline */}
      <div style={{ background: "#fff", border: "1px solid #EAE6D8", borderRadius: 13, padding: "15px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>Word count</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: wordsOk ? "#1A7A48" : AMBER, fontVariantNumeric: "tabular-nums" }}>{insights.wordCount}</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: wordsOk ? "#2C7A52" : "#9A7B2A" }}>
          {wordsOk ? `Above the ${minWords}-word minimum.` : `Aim for at least ${minWords} words — short answers cap Task Response.`}
        </p>
      </div>

      {/* mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Stat label="Sentences" value={insights.sentenceCount} />
        <Stat label="Avg length" value={insights.avgSentenceLength} suffix=" w" />
        <Stat label="Paragraphs" value={insights.paragraphCount} />
      </div>

      {/* linking words */}
      <div style={{ background: "#fff", border: "1px solid #EAE6D8", borderRadius: 13, padding: "15px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>Linking words</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: linkOk ? "#2C7A52" : AMBER, background: linkOk ? "#E9F5EE" : "#F6EAD0", padding: "2px 9px", borderRadius: 999 }}>
            {insights.linkingUnique} distinct · {insights.linkingTotal} total
          </span>
        </div>
        {insights.linkingUsed.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {insights.linkingUsed.slice(0, 12).map((w) => (
              <span key={w} style={chip("#EEF0F6", "#41496A")}>{w}</span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#9A7B2A" }}>No connectives detected — cohesion will suffer. Use markers like <em>however</em>, <em>for example</em>, <em>as a result</em>.</p>
        )}
        {insights.linkingUsed.length && !linkOk ? (
          <p style={{ margin: "9px 0 0", fontSize: 12.5, color: "#9A7B2A" }}>Aim for 5+ different connectives across the essay.</p>
        ) : null}
      </div>

      {/* repeated words */}
      <div style={{ background: "#fff", border: "1px solid #EAE6D8", borderRadius: 13, padding: "15px 16px" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>Most repeated words</span>
        {insights.repeated.length ? (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {insights.repeated.map((r) => (
                <span key={r.word} style={chip("#F6EAD0", "#9A6A12")}>{r.word} <strong>×{r.count}</strong></span>
              ))}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 12.5, color: MUTED }}>Vary these with synonyms — repetition narrows Lexical Resource.</p>
          </>
        ) : (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#2C7A52" }}>Good — no word is over-repeated.</p>
        )}
      </div>

      {runOn ? (
        <div style={{ background: "#FBFAF4", border: "1px solid #EFECE0", borderRadius: 13, padding: "13px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#9A7B2A" }}>Longest sentence is <strong>{insights.longestSentence} words</strong> — check it isn&rsquo;t a run-on; splitting it can lift Grammar.</p>
        </div>
      ) : null}

      <p style={{ margin: "2px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "#A7ABBA" }}>
        These are objective surface stats, not a band — your band and the reasons behind it are on the Bands tab.
      </p>
    </div>
  );
}

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div style={{ background: "#FBFAF4", border: "1px solid #EFECE0", borderRadius: 11, padding: "11px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: "#2C3247", fontVariantNumeric: "tabular-nums" }}>{value}{suffix}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#9A9EAE", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function chip(bg: string, fg: string): React.CSSProperties {
  return { fontSize: 12.5, fontWeight: 600, color: fg, background: bg, padding: "3px 9px", borderRadius: 7 };
}

/** Render the essay, wrapping each matched range in a numbered, clickable highlight. */
function renderEssay(
  text: string,
  ranges: ReturnType<typeof matchRanges>,
  selected: number | null,
  pick: (n: number) => void,
): React.ReactNode {
  const out: React.ReactNode[] = [];
  let cur = 0;
  let key = 0;
  ranges.forEach((r, i) => {
    if (r.start < cur) return;
    if (r.start > cur) out.push(<span key={key++}>{text.slice(cur, r.start)}</span>);
    const st = ANN_STYLE[r.ann.type] ?? ANN_STYLE.grammar;
    const n = i + 1;
    const on = selected === n;
    out.push(
      <span
        key={key++}
        className="lp-mk"
        onClick={() => pick(n)}
        title={[r.ann.note, r.ann.fix ? `→ ${r.ann.fix}` : ""].filter(Boolean).join("   ") || undefined}
        style={{ background: st.bg, color: st.fg, border: `1px solid ${st.fg}40`, borderRadius: 5, padding: "1px 5px", whiteSpace: "nowrap", boxShadow: on ? `0 0 0 2px ${st.fg}` : "none" }}
      >
        {text.slice(r.start, r.end)}
        <sup style={{ fontSize: 10, fontWeight: 800, marginLeft: 1 }}>{n}</sup>
      </span>,
    );
    cur = r.end;
  });
  if (cur < text.length) out.push(<span key={key++}>{text.slice(cur)}</span>);
  return out;
}
