"use client";

import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { bandColor } from "@/lib/ui/band";

/**
 * Live, coded replicas of the real product screens — rendered with the SAME
 * design tokens, fonts and layouts as the app itself (writing feedback, writing
 * studio, reading, listening, coach, dashboard), filled with representative
 * sample data. Each screen is laid out at a fixed "design size" and scaled to
 * fit its container by <Stage>, so the demo shows the actual UI (crisp at any
 * width) instead of uploaded screenshots.
 *
 * These are static, non-interactive replicas — no API calls, no data, no
 * "use client" behaviour beyond the resize-to-fit scaler — safe to render on a
 * public marketing page. Sample bands are deliberately conservative (a real 6.5,
 * never inflated), matching the grader's philosophy.
 */

const SANS = "var(--font-manrope), system-ui, sans-serif";
const SERIF = "var(--font-sora), system-ui, sans-serif";
const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace";
// The listening runner uses DM Sans; fall back to the marketing sans if the var
// isn't loaded on a given page.
const LSANS = "var(--font-manrope), system-ui, sans-serif";

const INDIGO = "#7d0132";
const INK = "#121317";
const MUTED = "#4a505c";
const FAINT = "#8b919d";
const EMERALD = "#2f8f5b";
const RED = "#C5503C";
const AMBER = "#B5852A";

// cream studio palette
const CANVAS = "#f6f7f9";
const LINE = "#e6e8ec";
const SOFT = "#FBFAF4";
const SOFTLINE = "#F0EDE1";
const ACC_SOFT = "#ECEBFB";
const ACC_LINE = "#E1DFF7";

// listening violet palette (from the real runner)
const V = "#7c5cfc";
const V_BG = "#f3f0ff";
const V_SOFT = "#f5f2ff";
const V_BORDER = "#e4defb";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Scales a fixed design-size screen down to fit the container width, keeping
 *  the app's real pixel metrics so the replica looks exactly like the product. */
function Stage({ w = 1200, h = 750, children }: { w?: number; h?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useIso(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / w);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", aspectRatio: `${w} / ${h}`, overflow: "hidden", background: "#fff" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w,
          height: h,
          transformOrigin: "top left",
          transform: `scale(${scale ?? 1})`,
          visibility: scale == null ? "hidden" : "visible",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** macOS-style browser chrome around a screen (matches the old screenshot frame). */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid #E5E2D2",
        background: "#fff",
        overflow: "hidden",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(18,19,23,.06), 0 24px 48px -24px rgba(18,19,23,.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid #EEECE0",
          background: "#FBFAF5",
        }}
      >
        <span style={{ display: "flex", gap: 6, flex: "none" }}>
          <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
          <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
          <i style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
        </span>
        <span
          style={{
            flex: 1,
            maxWidth: 340,
            margin: "0 auto",
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 11.5,
            color: "#8a8da6",
            background: "#F1EFE4",
            borderRadius: 8,
            padding: "4px 12px",
          }}
        >
          engprogress.com
        </span>
        <span style={{ width: 51, flex: "none" }} />
      </div>
      {children}
    </div>
  );
}

// ---- tiny inline icons -----------------------------------------------------

function Arrow({ c = "#fff", s = 16 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function Check({ c = EMERALD, s = 13 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function Spark({ c = "#fff", s = 16 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" />
    </svg>
  );
}
function Flame({ c = "#fff", s = 14 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c === "#fff" ? "none" : c} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A4.5 4.5 0 1 0 16 11c-1.5 2-3 2.5-3 2.5s2-4-3-8c0 0 .5 4-2 6.5" />
    </svg>
  );
}

// ============================================================================
// 1. WRITING FEEDBACK
// ============================================================================

function TaskPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 9px", borderRadius: 6, background: INK, color: "#fff", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", flex: "none" }}>
      {children}
    </span>
  );
}

const MARK = {
  spelling: { bg: "#FCEFC7", fg: "#9A6A12" },
  vocab: { bg: "#E6ECFD", fg: "#3350B5" },
  grammar: { bg: "#FBE0DC", fg: "#C5503C" },
};
function Mk({ kind, n, children }: { kind: keyof typeof MARK; n: number; children: React.ReactNode }) {
  const st = MARK[kind];
  return (
    <span style={{ background: st.bg, color: st.fg, border: `1px solid ${st.fg}33`, borderRadius: 5, padding: "1px 5px", whiteSpace: "nowrap" }}>
      {children}
      <sup style={{ fontSize: 10, fontWeight: 800, marginLeft: 1 }}>{n}</sup>
    </span>
  );
}

function WritingFeedbackScreen() {
  const overall = 6.5;
  const bc = bandColor(overall);
  const tiles = [
    { label: "Task Response", band: 6.0, tag: "Needs work", color: AMBER, blk: true },
    { label: "Coherence", band: 6.5, tag: "Solid", color: "#121317", blk: false },
    { label: "Lexical Resource", band: 6.0, tag: "Needs work", color: AMBER, blk: false },
    { label: "Grammar", band: 7.0, tag: "Strong", color: "#121317", blk: false },
  ];
  return (
    <div style={{ width: 1200, height: 750, background: CANVAS, fontFamily: SANS, color: INK, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header */}
      <div style={{ height: 60, flex: "none", background: "#fff", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 13px 0 11px", border: "1px solid #E2DED0", background: SOFT, borderRadius: 9, fontSize: 14, fontWeight: 600, color: "#3b4150" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b4150" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Activities
          </span>
          <span style={{ width: 1, height: 24, background: LINE }} />
          <TaskPill>TASK 2</TaskPill>
          <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>Essay feedback</span>
          <span style={{ color: "#C7C3B4" }}>·</span>
          <span style={{ fontSize: 14, color: "#8b919d" }}>Living alone</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", border: "1px solid #E2DED0", background: SOFT, borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: "#3b4150" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b4150" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export PDF
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 10, background: INDIGO, color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 6px 16px -6px rgba(125,1,50,.7)" }}>
            Revise with these fixes <Arrow />
          </span>
        </div>
      </div>

      {/* score strip */}
      <div style={{ flex: "none", background: "#fff", borderBottom: `1px solid ${LINE}`, padding: "16px 22px", display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16, paddingRight: 26, borderRight: "1px solid #EEE9DA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 62, fontWeight: 800, lineHeight: 0.82, color: bc.fg, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em" }}>{overall.toFixed(1)}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: FAINT, textTransform: "uppercase", lineHeight: 1.1 }}>Overall<br />band</span>
              <span style={{ alignSelf: "flex-start", fontSize: 11.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "2px 9px", borderRadius: 999 }}>{bc.label}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: "#E9F5EE", border: "1px solid #CDE9D8", borderRadius: 11 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            <span style={{ fontSize: 13.5, color: "#2C7A52", fontWeight: 600 }}>Up to <strong style={{ fontWeight: 800, color: "#1A7A48" }}>7.0</strong> with the fixes</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 12 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ flex: 1, background: t.blk ? "#FCEEEA" : SOFT, border: `1px solid ${t.blk ? "#F3CFC6" : "#eceef2"}`, borderRadius: 12, padding: "11px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED }}>{t.label}</span>
                <span style={{ fontSize: 21, fontWeight: 800, color: t.blk ? RED : t.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{t.band.toFixed(1)}</span>
              </div>
              <div style={{ marginTop: 9, height: 5, borderRadius: 3, background: t.blk ? "#F3DAD3" : "#EEEAE0", overflow: "hidden" }}>
                <div style={{ width: `${Math.round((t.band / 9) * 100)}%`, height: "100%", borderRadius: 3, background: t.blk ? RED : t.color }} />
              </div>
              <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 600, color: t.blk ? RED : t.color === AMBER ? AMBER : "#9A8F77" }}>{t.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* workspace */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 16, padding: 16 }}>
        {/* essay */}
        <div style={{ flex: 1, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: "none", padding: "15px 24px", borderBottom: `1px solid ${SOFTLINE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>Your essay, marked up</span>
              <span style={{ fontSize: 13, color: "#8b919d" }}>tap a highlight for the fix</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {[["Spelling", MARK.spelling, 1], ["Vocabulary", MARK.vocab, 1], ["Grammar", MARK.grammar, 1]].map(([lbl, st, n]) => (
                <span key={lbl as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: (st as { bg: string }).bg, border: `1px solid ${(st as { fg: string }).fg}55` }} />
                  <span style={{ fontSize: 12.5, color: MUTED }}>{lbl as string} <strong style={{ color: INK }}>{n as number}</strong></span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: "30px 40px", overflow: "hidden" }}>
            <div style={{ maxWidth: 720, fontFamily: SERIF, fontSize: 18, lineHeight: 2.0, color: "#262B3D" }}>
              In recent decades, the number of people choosing to live alone has risen sharply. While some regard this as a sign of social breakdown, I believe it <Mk kind="vocab" n={1}>primarily reflects</Mk> greater <Mk kind="spelling" n={2}>independance</Mk> and should be seen as a positive development.
              {"\n\n"}
              Firstly, living alone allows individuals to develop essential life skills. When a person is solely responsible for cooking, budgeting and cleaning, they inevitably become more self-reliant. For example, a young graduate who rents their own flat must learn to manage money carefully, which <Mk kind="grammar" n={3}>builds a discipline that benefits them later in life</Mk>.
            </div>
            <p style={{ maxWidth: 720, margin: "26px 0 0", fontFamily: SANS, fontSize: 11.5, color: "#A7ABBA" }}>AI-estimated bands — not affiliated with or endorsed by IELTS®.</p>
          </div>
        </div>

        {/* detail panel */}
        <div style={{ width: 480, flex: "none", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: "none", padding: "14px 16px", borderBottom: `1px solid ${SOFTLINE}` }}>
            <div style={{ display: "flex", gap: 4, background: "#F1EFE4", borderRadius: 11, padding: 4 }}>
              {["Bands", "Fixes · 3", "Insights", "Write it better"].map((t, i) => (
                <span key={t} style={{ flex: 1, textAlign: "center", height: 34, lineHeight: "34px", borderRadius: 8, fontSize: 13.5, fontWeight: 700, background: i === 0 ? "#fff" : "transparent", color: i === 0 ? INK : "#8b919d", boxShadow: i === 0 ? "0 1px 3px rgba(26,33,56,.14)" : "none" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, overflow: "hidden" }}>
            <div style={{ background: "#FCEEEA", border: "1px solid #F3CFC6", borderRadius: 13, padding: "15px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: RED }}>FIX THIS FIRST</span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#1A7A48", background: "#E9F5EE", border: "1px solid #CDE9D8", padding: "2px 8px", borderRadius: 999 }}>+0.5 band</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#3A3F58" }}>
                <strong style={{ color: INK }}>Task Response</strong> — you state a clear position, but the counter-view is only mentioned, not developed. Give both sides equal, specific support to clear Band 7.
              </p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #F3CFC6", borderRadius: 13, padding: "15px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>Task Response</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: RED, background: "#FCEEEA", padding: "2px 8px", borderRadius: 999 }}>Capping</span>
                  <span style={{ fontSize: 19, fontWeight: 800, color: RED, fontVariantNumeric: "tabular-nums" }}>6.0</span>
                </span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", color: "#8b919d", textTransform: "uppercase" }}>In your essay</span>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#3b4150" }}>You argue living alone builds independence with a clear graduate example, but never address why others see it as “social breakdown”.</p>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "11px 12px", background: SOFT, border: `1px solid ${SOFTLINE}`, borderRadius: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#121317" }}><strong style={{ color: INDIGO }}>Fix:</strong> add one body paragraph that fairly develops the opposing view, then rebut it — that balance is what separates Band 6 from Band 7.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. WRITING STUDIO
// ============================================================================

function WritingStudioScreen() {
  const words = 268;
  const minWords = 250;
  const pct = Math.min(100, Math.round((words / minWords) * 100));
  return (
    <div style={{ width: 1200, height: 750, background: CANVAS, fontFamily: SANS, color: INK, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header */}
      <div style={{ height: 62, flex: "none", background: "#fff", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 13px 0 11px", border: `1px solid ${LINE}`, background: SOFT, borderRadius: 9, fontSize: 14, fontWeight: 600, color: "#3b4150" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b4150" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Library
          </span>
          <span style={{ width: 1, height: 24, background: LINE }} />
          <TaskPill>TASK 2</TaskPill>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#3b4150" }}>Academic Writing</span>
          <span style={{ color: "#C7C3B4" }}>·</span>
          <span style={{ fontSize: 14, color: "#8b919d" }}>Education</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 12px", border: `1px solid ${LINE}`, borderRadius: 9, background: SOFT, fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 15, color: INK }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M12 2h0" /></svg>
            34:12
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: EMERALD }}><Check c={EMERALD} s={13} /> Saved</span>
          <span style={{ width: 1, height: 24, background: LINE }} />
          <span style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 10, background: INDIGO, color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 6px 16px -6px rgba(125,1,50,.7)" }}>
            Submit for grading <Arrow />
          </span>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 16, padding: 16 }}>
        {/* prompt */}
        <div style={{ width: 356, flex: "none", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${SOFTLINE}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".13em", color: "#9A9684" }}>THE TASK</span>
              <span style={{ display: "inline-flex", alignItems: "center", height: 26, padding: "0 11px", borderRadius: 7, background: ACC_SOFT, color: INDIGO, fontSize: 12.5, fontWeight: 700 }}>Agree / Disagree</span>
            </div>
            <p style={{ margin: 0, fontFamily: SERIF, fontSize: 19.5, lineHeight: 1.4, fontWeight: 600, color: INK }}>Some people believe unpaid community service should be a compulsory part of high-school programmes.</p>
            <p style={{ margin: "9px 0 0", fontFamily: SERIF, fontSize: 14.5, fontStyle: "italic", lineHeight: 1.4, color: "#4a505c" }}>To what extent do you agree or disagree?</p>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: "#8b919d" }}>REQUIREMENTS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {["Give reasons & examples", "~40 minutes"].map((c) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: SOFT, border: `1px solid ${SOFTLINE}`, borderRadius: 10 }}>
                  <span style={{ flex: "none", width: 22, height: 22, borderRadius: 6, background: "#E5F3EA", display: "flex", alignItems: "center", justifyContent: "center" }}><Check /></span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#121317" }}>{c}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: ACC_SOFT, border: `1px solid ${ACC_LINE}`, borderRadius: 10 }}>
                <span style={{ flex: "none", width: 22, height: 22, borderRadius: 6, background: "#E5F3EA", display: "flex", alignItems: "center", justifyContent: "center" }}><Check /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#121317" }}>At least {minWords} words</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{words}</span>
                  </div>
                  <div style={{ marginTop: 7, height: 5, borderRadius: 3, background: ACC_SOFT, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: INDIGO }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* answer */}
        <div style={{ flex: 1, minWidth: 0, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: 60, flex: "none", padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${SOFTLINE}` }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>Your answer</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: "#8b919d", fontWeight: 500 }}>Target reached</span>
              <div style={{ position: "relative", width: 46, height: 46 }}>
                <svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="19" fill="none" stroke={ACC_SOFT} strokeWidth="4.5" /><circle cx="23" cy="23" r="19" fill="none" stroke={INDIGO} strokeWidth="4.5" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset="0" transform="rotate(-90 23 23)" /></svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>{words}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: "26px 30px", overflow: "hidden" }}>
            <div style={{ maxWidth: 640, fontFamily: SERIF, fontSize: 16.5, lineHeight: 1.85, color: "#272C3E" }}>
              I strongly agree that a period of unpaid community service should be built into high-school education. Requiring young people to contribute to their communities develops empathy and practical skills that classroom study alone cannot provide.
              {"\n\n"}
              The most compelling argument is that community service exposes students to lives very different from their own. A teenager who spends a term helping at a care home, for instance, learns patience and responsibility while seeing first-hand the challenges older people face…
            </div>
          </div>
          <div style={{ height: 48, flex: "none", padding: "0 22px", borderTop: `1px solid ${SOFTLINE}`, display: "flex", alignItems: "center", gap: 18, background: SOFT }}>
            <span style={{ fontSize: 13, color: "#8b919d", fontVariantNumeric: "tabular-nums" }}><strong style={{ color: INK, fontWeight: 700 }}>{words}</strong> words</span>
            <span style={{ fontSize: 13, color: "#8b919d", fontVariantNumeric: "tabular-nums" }}>1,432 characters</span>
            <span style={{ fontSize: 13, color: "#8b919d" }}>3 paragraphs</span>
          </div>
        </div>

        {/* coach */}
        <div style={{ width: 320, flex: "none", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 14px", borderBottom: `1px solid ${SOFTLINE}` }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#5B55D6,#7d0132)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Spark s={16} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>Writing coach</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Ideas · vocabulary · structure</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "9px 12px", borderRadius: 12, background: INDIGO, color: "#fff", fontSize: 13.5, lineHeight: 1.5 }}>Any better linking words for my second paragraph?</div>
            <div style={{ alignSelf: "flex-start", maxWidth: "88%", padding: "9px 12px", borderRadius: 12, background: "#fdf4f7", border: "1px solid #E6E4F8", color: "#3a3d52", fontSize: 13.5, lineHeight: 1.55 }}>Try opening with <em>“The most compelling argument is…”</em>, then signpost the next idea with <em>“Beyond this,”</em> or <em>“A further benefit is that…”</em>. Vary them — repeating “also” caps Coherence.</div>
          </div>
          <div style={{ padding: 10, borderTop: `1px solid ${SOFTLINE}` }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ flex: 1, padding: "9px 11px", border: "1px solid #DDDAEE", borderRadius: 10, fontSize: 13.5, color: "#8b919d" }}>Ask your coach…</span>
              <span style={{ width: 40, borderRadius: 10, background: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. READING
// ============================================================================

function ReadingScreen() {
  const answered = 7;
  const total = 13;
  return (
    <div style={{ width: 1200, height: 750, background: "#fff", fontFamily: SANS, color: INK, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", flex: "none", borderBottom: "1px solid #EEEDF4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#4a505c", fontSize: 14.5, fontWeight: 600 }}><span style={{ fontSize: 16 }}>‹</span> Exit</span>
          <span style={{ width: 1, height: 22, background: "#ECEBF2" }} />
          <span style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>Academic Reading · Passage practice</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12.5, color: "#8b919d", fontWeight: 500 }}>Text size</span>
            <span style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #f4e9ee", background: "#fff", color: "#4a505c", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center" }}>A−</span>
            <span style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #f4e9ee", background: "#fff", color: "#4a505c", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>A+</span>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: "#fdf4f7", border: "1px solid #E4E2F4" }}>
            <span style={{ fontSize: 13, color: INDIGO }}>◷</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 15.5, color: INDIGO }}>18:24</span>
          </span>
          <span style={{ padding: "6px 12px", borderRadius: 10, border: "1.5px solid #f4e9ee", fontSize: 13.5, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{answered} / {total}</span>
          <span style={{ padding: "9px 18px", borderRadius: 10, background: INDIGO, color: "#fff", fontWeight: 600, fontSize: 14, boxShadow: `0 4px 14px ${INDIGO}47` }}>Submit answers</span>
        </div>
      </div>

      {/* split */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* passage */}
        <div style={{ flex: 1, padding: "32px 44px", borderRight: "1px solid #F0EFF5", overflow: "hidden" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "#EEF0FC", color: INDIGO, fontWeight: 700, fontSize: 12.5, padding: "5px 12px", borderRadius: 8 }}>Reading Passage</span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "#9a96a8" }}>Urban design</span>
            </div>
            <p style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#8b919d", margin: "12px 0 0" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b919d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h3l6-6M13 7l4 4M18 2l4 4-9 9H9v-4l9-9Z" /></svg>
              Select a word to see its meaning — or pick a pen above to highlight.
            </p>
            <p style={{ fontSize: 14, fontStyle: "italic", color: MUTED, margin: "14px 0 0", lineHeight: 1.5 }}>
              You should spend about 20 minutes on <strong style={{ fontStyle: "normal", color: INK }}>Questions 1–{total}</strong>, which are based on the reading passage below.
            </p>
            <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 29, letterSpacing: "-.01em", color: INK, margin: "10px 0 20px" }}>The Rise of the Urban Park</h1>
            <div style={{ lineHeight: 1.75, color: "#3A3650", fontSize: 16 }}>
              For most of human history, cities were dense, walled and almost entirely paved. The idea that a metropolis should set aside large tracts of land purely for recreation would have struck a medieval planner as absurd — space inside the walls was far too valuable to leave unbuilt.
              {"\n\n"}
              The change came in the nineteenth century, as industrial cities swelled and their air grew thick with smoke. Reformers began to argue that access to greenery was not a luxury but a public-health necessity, and that a walk among trees could restore workers exhausted by the factory floor…
            </div>
          </div>
        </div>

        {/* questions */}
        <div style={{ width: "44%", flex: "none", padding: "28px 40px", overflow: "hidden" }}>
          <div style={{ background: "#F7F7FC", border: "1px solid #ECEBF4", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".04em", color: INDIGO }}>QUESTIONS 1–5</div>
            <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: "#3b4150" }}>Do the following statements agree with the information in the passage? Choose <strong>TRUE</strong>, <strong>FALSE</strong> or <strong>NOT GIVEN</strong>.</p>
          </div>
          {[
            { n: 1, t: "Medieval cities commonly reserved land for public recreation.", pick: "FALSE" },
            { n: 2, t: "Nineteenth-century reformers linked green space to public health.", pick: "TRUE" },
            { n: 3, t: "The first public parks were funded entirely by private donors.", pick: null },
          ].map((q) => (
            <div key={q.n} style={{ padding: "12px 0", borderBottom: "1px solid #F1F0F7" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ flex: "none", width: 24, height: 24, borderRadius: 999, border: `1.5px solid ${q.pick ? INDIGO : "#ece0e5"}`, background: q.pick ? INDIGO : "#fff", color: q.pick ? "#fff" : "#9B98AD", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{q.n}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#121317" }}>{q.t}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, marginLeft: 34 }}>
                {["TRUE", "FALSE", "NOT GIVEN"].map((o) => {
                  const on = q.pick === o;
                  return (
                    <span key={o} style={{ fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${on ? INDIGO : "#ece0e5"}`, background: on ? "#EEF0FF" : "#fff", color: on ? INDIGO : "#8b919d" }}>{o}</span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* bottom nav */}
      <div style={{ flex: "none", borderTop: "1px solid #F0EFF5", background: "#fff", padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const isAnswered = n <= answered;
          const isCur = n === 8;
          const style: React.CSSProperties = { width: 30, height: 30, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, border: "1.5px solid", fontVariantNumeric: "tabular-nums" };
          if (isCur) return <span key={n} style={{ ...style, borderColor: INDIGO, background: "#fff", color: INDIGO, boxShadow: "0 0 0 3px rgba(79,70,229,.16)" }}>{n}</span>;
          if (isAnswered) return <span key={n} style={{ ...style, borderColor: INDIGO, background: INDIGO, color: "#fff" }}>{n}</span>;
          return <span key={n} style={{ ...style, borderColor: "#ece0e5", background: "#fff", color: "#9B98AD" }}>{n}</span>;
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. LISTENING
// ============================================================================

function ListeningScreen() {
  const gap = (val?: string) => (
    <span style={{ display: "inline-flex", minWidth: 96, height: 30, padding: "0 10px", margin: "0 2px", alignItems: "center", borderRadius: 8, border: `1.5px solid ${val ? "#c4b6f5" : "#e6e6ed"}`, background: val ? V_SOFT : "#fff", color: val ? "#4a3fb0" : "transparent", fontSize: 14.5, fontWeight: 600, verticalAlign: "middle" }}>
      {val ?? " "}
    </span>
  );
  return (
    <div style={{ width: 1200, height: 750, background: "#f4f4f7", fontFamily: LSANS, color: "#121317", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* navy audio strip */}
      <div style={{ flex: "none", height: 62, background: "#102347", borderBottom: "1px solid #1b3766", padding: "0 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 9999, background: "#6f82ff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.24)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.3" /><rect x="14" y="5" width="4" height="14" rx="1.3" /></svg>
        </div>
        <div style={{ width: 200, flex: "none", minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fbff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Part 2 · Community radio</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#b8c8df", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Now playing — plays once</div>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 13, color: "#b8c8df", width: 42, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>01:12</span>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#2a4574", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: "36%", background: "#7ea7ff", borderRadius: 999 }} />
          <div style={{ position: "absolute", left: "36%", top: "50%", width: 13, height: 13, marginLeft: -6, marginTop: -6, borderRadius: 999, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.3)" }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 13, color: "#b8c8df", width: 42, fontVariantNumeric: "tabular-nums" }}>03:20</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#dbe6f7", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "5px 10px" }}>1.0×</span>
      </div>

      {/* part tabs */}
      <div style={{ flex: "none", display: "flex", gap: 6, padding: "12px 24px", background: "#faf9ff", borderBottom: "1px solid #ececf1" }}>
        {[1, 2, 3, 4].map((p) => {
          const active = p === 2;
          const done = p === 1;
          return (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, border: `1px solid ${active ? V_BORDER : "#ececf1"}`, background: active ? V_BG : "#fff", color: active ? "#5a4ec4" : "#6b6f7e" }}>
              {done ? <Check c="#1b9e54" s={13} /> : null}
              Part {p}
            </span>
          );
        })}
      </div>

      {/* questions */}
      <div style={{ flex: 1, padding: "26px 40px", overflow: "hidden" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: V }}>QUESTIONS 11–15</span>
            <span style={{ fontSize: 13, color: "#9497a4" }}>Complete the notes · Write <strong style={{ color: "#121317" }}>ONE WORD ONLY</strong> for each answer</span>
          </div>
          <h2 style={{ fontFamily: LSANS, fontSize: 21, fontWeight: 700, color: "#121317", margin: "8px 0 4px" }}>Riverside Community Centre</h2>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#121317", padding: "14px 0 6px" }}>Facilities</div>
            {[
              { pre: "The main hall can be hired for ", val: "weddings", post: " and other private events." },
              { pre: "A new ", val: undefined, post: " studio opens on the first floor in March.", n: true },
            ].map((l, i) => (
              <div key={i} style={{ padding: "6px 0", paddingLeft: 14, fontSize: 15, lineHeight: 2, color: "#121317", display: "flex", gap: 8 }}>
                <span style={{ color: "#c7cad6" }}>•</span>
                <span>{l.pre}{gap(l.val)}{l.post}</span>
              </div>
            ))}
            <div style={{ fontSize: 14, fontWeight: 600, color: "#121317", padding: "14px 0 6px" }}>Membership</div>
            {[
              { pre: "Annual membership costs £", val: undefined, post: " for adults.", n: true },
              { pre: "Members receive a monthly ", val: undefined, post: " with the class timetable.", n: true },
            ].map((l, i) => (
              <div key={i} style={{ padding: "6px 0", paddingLeft: 14, fontSize: 15, lineHeight: 2, color: "#121317", display: "flex", gap: 8 }}>
                <span style={{ color: "#c7cad6" }}>•</span>
                <span>{l.pre}{gap(l.val)}{l.post}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. STUDY COACH
// ============================================================================

function CoachScreen() {
  return (
    <div style={{ width: 1200, height: 750, background: "#fbfbfc", fontFamily: SANS, color: INK, position: "relative", overflow: "hidden" }}>
      {/* faint dashboard backdrop */}
      <div style={{ padding: "34px 44px", opacity: 0.5, filter: "saturate(.9)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>Your dashboard</div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 30, color: INK, margin: "6px 0 0" }}>Welcome back, Aziz</div>
        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          {[["Reading", "6.5", INDIGO], ["Writing", "6.0", INDIGO]].map(([s, b, c]) => (
            <div key={s} style={{ flex: 1, background: "#fff", border: "1px solid #e6e8ec", borderRadius: 16, padding: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>{s}</span>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, color: c as string, marginTop: 12 }}>{b}</div>
              <div style={{ height: 7, background: "#f0d3de", borderRadius: 999, marginTop: 12, overflow: "hidden" }}><div style={{ width: "70%", height: "100%", background: c as string }} /></div>
            </div>
          ))}
          <div style={{ flex: 1, background: "#fff", border: "1px solid #e6e8ec", borderRadius: 16, padding: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>This week</span>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>{Array.from({ length: 7 }, (_, i) => <span key={i} style={{ flex: 1, height: 28, borderRadius: 8, background: i < 5 ? INDIGO : "#fbfbfc", border: `1.5px solid ${i < 5 ? INDIGO : "#e6e8ec"}` }} />)}</div>
          </div>
        </div>
      </div>

      {/* coach card */}
      <div style={{ position: "absolute", right: 40, bottom: 34, width: 400, height: 560, display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #E7E4F2", borderRadius: 18, boxShadow: "0 30px 70px -28px rgba(26,33,56,.55)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", borderBottom: "1px solid #E7E4F2", background: "linear-gradient(135deg,#F5F4FE,#EFEEFC)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#5B55D6,#7d0132)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Spark s={16} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>Study coach</div>
              <div style={{ fontSize: 11.5, color: MUTED }}>Planning · strategy · what&rsquo;s next</div>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </div>
        <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "9px 12px", borderRadius: 12, background: INDIGO, color: "#fff", fontSize: 13.5, lineHeight: 1.5 }}>What should I practise next?</div>
          <div style={{ alignSelf: "flex-start", maxWidth: "88%", padding: "10px 12px", borderRadius: 12, background: "#fdf4f7", border: "1px solid #E6E4F8", color: "#3a3d52", fontSize: 13.5, lineHeight: 1.6 }}>
            Your Reading sits at <strong>6.5</strong> and Writing at <strong>6.0</strong>, so Writing is the gap to your 7.0 target. This week I&rsquo;d do <strong>two Task 2 essays</strong> focused on Task Response — that&rsquo;s your weakest criterion across your last 3 submissions. Want me to pick the prompts?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
            {["Plan my week", "How do I reach my target?"].map((s) => (
              <span key={s} style={{ fontSize: 12.5, fontWeight: 600, color: INDIGO, background: "#ECEBFB", border: "1px solid #E1DFF7", borderRadius: 999, padding: "7px 12px" }}>{s}</span>
            ))}
          </div>
        </div>
        <div style={{ padding: 10, borderTop: "1px solid #EFEDF8" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ flex: 1, padding: "9px 11px", border: "1px solid #DDDAEE", borderRadius: 10, fontSize: 13.5, color: "#8b919d" }}>Ask your coach…</span>
            <span style={{ width: 40, borderRadius: 10, background: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. PROGRESS & STATS (dashboard)
// ============================================================================

function BandMini({ skill, cur, target, base, delta }: { skill: string; cur: number; target: number; base: number; delta: number }) {
  const fill = Math.max(0.08, Math.min(1, (cur - base) / (target - base)));
  return (
    <div style={{ background: "#fff", border: "1px solid #e6e8ec", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: 16, color: INK }}>{skill}</span>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: 13, color: FAINT }}>target <span style={{ fontWeight: 700, fontSize: 14, color: INK, background: "#F4F4FB", border: "1px solid #E0E1F4", padding: "4px 10px", borderRadius: 8 }}>{target.toFixed(1)}</span></span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 12 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, lineHeight: 1, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{cur.toFixed(1)}</span>
        <span style={{ fontWeight: 500, fontSize: 14, color: FAINT, paddingBottom: 6 }}>→ target {target.toFixed(1)}</span>
      </div>
      <div style={{ height: 7, background: "#f0d3de", borderRadius: 999, overflow: "hidden", marginTop: 12 }}><div style={{ width: `${Math.round(fill * 100)}%`, height: "100%", background: INDIGO, borderRadius: 999 }} /></div>
      <div style={{ fontSize: 13, color: FAINT, marginTop: 10 }}>From {base.toFixed(1)} baseline <span style={{ color: EMERALD }}>· +{delta.toFixed(1)}</span> · 4 submissions</div>
    </div>
  );
}

function ProgressScreen() {
  return (
    <div style={{ width: 1200, height: 750, background: "#fbfbfc", fontFamily: SANS, color: INK, padding: "30px 40px", overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>Your dashboard</div>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 32, color: INK, margin: "6px 0 0" }}>Welcome back, Aziz</div>
      <div style={{ fontSize: 15, color: MUTED, margin: "6px 0 0" }}>Target Band 7.0 · <span style={{ color: INDIGO, fontWeight: 600 }}>24 days</span> to your test</div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16, marginTop: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* next task */}
          <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(120deg,#23264D 0%,#7d0132 62%,#5158C8 100%)", borderRadius: 18, padding: "24px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div style={{ position: "absolute", top: -90, right: -40, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.14),transparent 62%)" }} />
            <div style={{ position: "relative", flex: "1 1 380px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 11, letterSpacing: ".11em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}><Spark s={13} /> Next task · picked for you</div>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: "#fff", marginTop: 9 }}>Task 2 — Opinion essay</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "rgba(255,255,255,.84)", margin: "7px 0 0", maxWidth: 480 }}>Task Response is your weakest criterion. A focused opinion essay is the fastest way to close the gap to Band 7.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", color: INK, fontWeight: 700, fontSize: 14.5, padding: "12px 22px", borderRadius: 11, marginTop: 18, boxShadow: "0 14px 30px -14px rgba(0,0,0,.55)" }}>Start writing <Arrow c={INK} /></span>
            </div>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, flex: "none" }}>
              {["Task 2 · ~40 min", "Per-criterion grade"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,.88)", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 10, padding: "9px 13px" }}>{t}</div>
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
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: INK, marginBottom: 12 }}>Recent results</div>
            <div style={{ background: "#fff", border: "1px solid #e6e8ec", borderRadius: 16, overflow: "hidden" }}>
              {[
                { d: "Jul 6", s: "Writing", band: "6.0", delta: "+0.5", up: true },
                { d: "Jul 4", s: "Reading", band: "6.5", delta: "baseline", up: null },
                { d: "Jul 1", s: "Reading", band: "6.0", delta: "+0.5", up: true },
              ].map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", alignItems: "center", gap: 14, padding: "13px 18px", borderTop: i === 0 ? "none" : "1px solid #e6e8ec" }}>
                  <span style={{ fontWeight: 500, fontSize: 13.5, color: FAINT }}>{h.d}</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: INK }}>{h.s}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 999, color: h.up == null ? FAINT : EMERALD, background: h.up == null ? "#fbfbfc" : "#E5F2EB" }}>{h.delta}</span>
                    <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, color: INK, fontVariantNumeric: "tabular-nums" }}>{h.band}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1px solid #e6e8ec", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>This week</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: AMBER }}><Flame c={AMBER} s={17} /><span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: INK }}>5</span></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 13 }}>
              {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d, i) => (
                <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <span style={{ width: "100%", maxWidth: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: i < 5 ? INDIGO : "#fbfbfc", border: `1.5px solid ${i === 4 ? INDIGO : i < 5 ? INDIGO : "#e6e8ec"}` }}>
                    <Flame c={i < 5 ? "#fff" : "#C7C9D4"} s={14} />
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: i === 4 ? INDIGO : FAINT }}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED }}>Weekly goal</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>3 / 5 tasks</span>
            </div>
            <div style={{ height: 7, background: "#f0d3de", borderRadius: 999, overflow: "hidden", marginTop: 8 }}><div style={{ width: "60%", height: "100%", background: INDIGO, borderRadius: 999 }} /></div>
            <p style={{ fontSize: 12.5, color: MUTED, margin: "10px 0 0" }}>2 more to go — keep the streak alive.</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e6e8ec", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>Focus areas</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: FAINT }}>Writing</div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 1 }}>Task Response</div>
              <div style={{ fontSize: 12.5, color: MUTED }}>avg band 6.0</div>
              <div style={{ height: 1, background: "#e6e8ec", margin: "12px 0" }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: FAINT }}>Reading</div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 1 }}>True / False / Not Given</div>
              <div style={{ fontSize: 12.5, color: MUTED }}>68% correct · 17/25</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- speaking: the live 3-part mock ----------------------------------------
// A replica of the real exam room (app/(shell)/speak/live-mock.tsx) at the
// moment that best explains the product: Part 2, cue card on screen, the
// examiner mid-question. Tokens are copied from that file rather than
// re-invented — the dark ORB (the examiner is deliberately not a face; an exam
// room should feel impersonal), the breathing rings, the mono clock.
function SpeakingScreen() {
  const SP_INK = "#1A1520";
  const SP_FAINT = "#8C7F8A";
  const SP_LINE = "#E7E3E0";
  const SP_ORB = "radial-gradient(circle at 32% 28%, rgba(60,52,72,0.85) 0%, #2C2535 46%, #1A1520 100%)";
  const parts: { n: number; label: string }[] = [
    { n: 1, label: "Interview" },
    { n: 2, label: "Long turn" },
    { n: 3, label: "Discussion" },
  ];
  return (
    <div style={{ width: 1200, height: 750, background: "#FBF9F8", fontFamily: SANS, color: SP_INK, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* top bar */}
      <div style={{ flex: "none", height: 54, borderBottom: `1px solid ${SP_LINE}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E0574A" }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: SP_INK }}>Live mock · recording</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: 13, color: SP_FAINT }}>
          <span>08:24</span><span style={{ color: "#D6CFCB" }}>/</span><span>16:00</span>
        </div>
      </div>
      {/* whole-test progress */}
      <div style={{ flex: "none", height: 3, background: "#EFEBE8" }}>
        <div style={{ height: "100%", width: "52%", background: SP_INK }} />
      </div>
      {/* the three parts stay visible: a timer alone is pressure */}
      <div style={{ flex: "none", display: "flex", justifyContent: "center", gap: 22, padding: "14px 18px 0" }}>
        {parts.map((p) => {
          const active = p.n === 2;
          const done = p.n < 2;
          return (
            <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: active ? "#6C4BD8" : done ? "#2E9E6B" : "#B5ACA8" }}>
              <span style={{ width: 21, height: 21, borderRadius: "50%", display: "grid", placeItems: "center", background: active ? "#6C4BD8" : done ? "#E4F5EC" : "#F1EEEC", color: active ? "#fff" : done ? "#2E9E6B" : "#9C938F", fontSize: 10.5 }}>{done ? "✓" : p.n}</span>
              {p.label}
            </div>
          );
        })}
      </div>

      {/* centre stage */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 24px 0" }}>
        <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center" }}>
          <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1px solid rgba(26,21,32,0.16)" }} />
          <div style={{ position: "absolute", inset: -30, borderRadius: "50%", border: "1px solid rgba(26,21,32,0.08)" }} />
          <div style={{ width: 118, height: 118, borderRadius: "50%", background: SP_ORB, boxShadow: "0 18px 40px rgba(26,21,32,0.28)" }} />
        </div>
        <div style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: 11, letterSpacing: ".14em", color: SP_FAINT, marginTop: 20, textTransform: "uppercase" }}>
          Examiner is asking
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 600, marginTop: 12, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.3 }}>
          Describe a skill you would like to learn
        </div>
        {/* wave bars — the examiner's voice */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 26, marginTop: 16 }}>
          {[10, 18, 26, 15, 22, 12, 20, 9, 16, 24, 13, 19].map((h, i) => (
            <span key={i} style={{ width: 3.5, height: h, borderRadius: 2, background: SP_INK, opacity: 0.55 }} />
          ))}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 16, padding: "8px 18px", borderRadius: 999, background: "#FDF3E4", border: "1px solid rgba(217,119,6,0.28)" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#B45309" }}>Prep time</span>
          <span style={{ fontFamily: "var(--font-jetbrains), ui-monospace, monospace", fontSize: 17, fontWeight: 600, color: "#B45309", fontVariantNumeric: "tabular-nums" }}>0:47</span>
        </div>

        {/* the cue card — the paper slip on exam day */}
        <div style={{ width: 660, marginTop: 18, textAlign: "left", background: "#fff", border: `1px solid ${SP_LINE}`, borderRadius: 16, padding: "16px 20px 18px", boxShadow: "0 14px 34px -20px rgba(26,21,32,.4)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 7, background: "rgba(218,119,86,0.12)", color: "#B45309", fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            Cue card
          </span>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: SP_FAINT, margin: "12px 0 4px" }}>You should say:</div>
          <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 14, lineHeight: 1.75, color: "#3A333F" }}>
            <li>what the skill is and why it interests you</li>
            <li>how you would go about learning it</li>
            <li>how long you think it would take</li>
          </ul>
          <div style={{ fontSize: 12.5, color: SP_FAINT, marginTop: 8 }}>
            You will have 1–2 minutes to talk about this.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// registry
// ============================================================================

export const SCREENS: Record<string, React.ReactNode> = {
  "writing-feedback": <WritingFeedbackScreen />,
  "writing-studio": <WritingStudioScreen />,
  reading: <ReadingScreen />,
  listening: <ListeningScreen />,
  speaking: <SpeakingScreen />,
  coach: <CoachScreen />,
  progress: <ProgressScreen />,
};

/** A screen wrapped in browser chrome + resize-to-fit scaler — the unit both the
 *  tabbed demo and the reports strip render. */
export function DemoScreen({ slug, w, h }: { slug: string; w?: number; h?: number }) {
  return (
    <Frame>
      <Stage w={w} h={h}>{SCREENS[slug] ?? null}</Stage>
    </Frame>
  );
}

// ---- report cards (the "real reports" proof strip) -------------------------

function ReportWriting() {
  const bc = bandColor(6.5);
  return (
    <div style={{ width: 640, height: 480, background: "#fff", fontFamily: SANS, color: INK, padding: 28, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <TaskPill>TASK 2</TaskPill>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Essay report</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 0", borderBottom: `1px solid ${SOFTLINE}` }}>
        <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 0.82, color: bc.fg, fontVariantNumeric: "tabular-nums" }}>6.5</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".04em", color: FAINT, textTransform: "uppercase" }}>Overall band</div>
          <span style={{ display: "inline-block", marginTop: 5, fontSize: 12.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "3px 10px", borderRadius: 999 }}>{bc.label}</span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 15, color: "#2C7A52", fontWeight: 600, background: "#E9F5EE", border: "1px solid #CDE9D8", borderRadius: 11, padding: "8px 14px" }}>Up to <strong style={{ color: "#1A7A48" }}>7.0</strong> with fixes</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {[["Task Response", "6.0", true], ["Coherence", "6.5", false], ["Lexical Resource", "6.0", false], ["Grammar", "7.0", false]].map(([l, b, blk]) => (
          <div key={l as string} style={{ background: blk ? "#FCEEEA" : SOFT, border: `1px solid ${blk ? "#F3CFC6" : "#eceef2"}`, borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: MUTED }}>{l as string}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: blk ? RED : "#121317", fontVariantNumeric: "tabular-nums" }}>{b as string}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".06em", color: RED }}>FIX THIS FIRST</span>
        <span style={{ fontSize: 14, color: "#3A3F58" }}>Task Response — develop the opposing view, don&rsquo;t just mention it.</span>
      </div>
    </div>
  );
}

function ReportReading() {
  const bc = bandColor(6.5);
  return (
    <div style={{ width: 640, height: 480, background: "#fff", fontFamily: SANS, color: INK, padding: 28, overflow: "hidden" }}>
      <span style={{ fontSize: 16, fontWeight: 700 }}>Reading result · Academic</span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 12, paddingBottom: 18, borderBottom: `1px solid ${SOFTLINE}` }}>
        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, lineHeight: 0.9, color: bc.fg, fontVariantNumeric: "tabular-nums" }}>6.5</span>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED }}>Indicative band</div>
          <span style={{ display: "inline-block", marginTop: 5, fontSize: 12.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "3px 10px", borderRadius: 999 }}>{bc.label}</span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 15, color: MUTED, paddingBottom: 6 }}><strong style={{ color: INK }}>9/13</strong> correct · 69%</span>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 10 }}>Where you lost marks</div>
        {[["True / False / Not Given", "2 / 5", true], ["Matching headings", "3 / 4", false], ["Sentence completion", "4 / 4", false]].map(([t, s, weak]) => (
          <div key={t as string} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: weak ? "#FDF1EE" : SOFT, border: `1px solid ${weak ? "#F3CFC6" : "#eceef2"}`, marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: weak ? RED : "#121317" }}>{t as string}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: weak ? RED : "#121317", fontVariantNumeric: "tabular-nums" }}>{s as string}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: MUTED, display: "flex", gap: 7 }}>
        <span style={{ color: INDIGO, fontWeight: 700 }}>Why the trap worked:</span>
        <span>the passage says parks were “argued for”, not built — that&rsquo;s NOT GIVEN, not TRUE.</span>
      </div>
    </div>
  );
}

function ReportListening() {
  const bc = bandColor(6.5);
  return (
    <div style={{ width: 640, height: 480, background: "#fff", fontFamily: SANS, color: INK, padding: 28, overflow: "hidden" }}>
      <span style={{ fontSize: 16, fontWeight: 700 }}>Listening result · Full test</span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 12, paddingBottom: 18, borderBottom: `1px solid ${SOFTLINE}` }}>
        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 64, lineHeight: 0.9, color: bc.fg, fontVariantNumeric: "tabular-nums" }}>6.5</span>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED }}>Indicative band</div>
          <span style={{ display: "inline-block", marginTop: 5, fontSize: 12.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "3px 10px", borderRadius: 999 }}>{bc.label}</span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 15, color: MUTED, paddingBottom: 6 }}><strong style={{ color: INK }}>26/40</strong> correct</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
        {[["Part 1", "8/10"], ["Part 2", "7/10"], ["Part 3", "6/10"], ["Part 4", "5/10"]].map(([p, s]) => (
          <div key={p as string} style={{ background: SOFT, border: `1px solid ${SOFTLINE}`, borderRadius: 11, padding: "13px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: FAINT }}>{p as string}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#121317", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{s as string}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10, background: V_SOFT, border: `1px solid ${V_BORDER}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#5a4ec4", marginBottom: 4 }}>Q31 · you wrote “Tuesday”, answer was “Thursday”</div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>The speaker corrects herself — “…on Tuesday, sorry, I mean Thursday.” The transcript link jumps you to the exact line.</div>
      </div>
    </div>
  );
}

const REPORT_NODES: Record<string, React.ReactNode> = {
  "report-writing": <ReportWriting />,
  "report-reading": <ReportReading />,
  "report-listening": <ReportListening />,
};

export type ReportCard = { slug: string; caption: string };

export const REPORT_CARDS: ReportCard[] = [
  {
    slug: "report-writing",
    caption: "A Task 2 essay report — per-criterion bands with evidence from the essay and the one fix that moves the score.",
  },
  {
    slug: "report-reading",
    caption: "A Reading result — band, question-type breakdown, and exactly why each trap worked.",
  },
  {
    slug: "report-listening",
    caption: "A Listening result — section-by-section scores with transcript-linked explanations.",
  },
];

/** The three real grader reports, framed, for the landing + /demo proof section. */
export function ReportShowcase() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, marginTop: 44 }}>
      {REPORT_CARDS.map((c) => (
        <figure key={c.slug} style={{ margin: 0 }}>
          <Frame>
            <Stage w={640} h={480}>{REPORT_NODES[c.slug]}</Stage>
          </Frame>
          <figcaption style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14.5, lineHeight: 1.55, color: "#6b6e84", margin: "14px 4px 0" }}>{c.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
