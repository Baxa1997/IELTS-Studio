"use client";

import { useEffect, useState } from "react";

/**
 * The hero's "live AI examiner" panel (marketing only). It mimics a grade in
 * progress: the essay is scanned, the band ring + criterion bars fill once on
 * mount, then the panel cycles criterion-by-criterion — highlighting the matching
 * mistakes in the essay and swapping in that criterion's evidence + fix. Pure
 * theatre: no real grading happens here (CLAUDE.md: never grade on the client).
 */

const INDIGO = "#3B43B5";
const GOLD = "#C28A1A";

interface Criterion {
  key: "TR" | "CC" | "LR" | "GRA";
  label: string;
  band: string;
  pct: number;
  /** This criterion caps the overall band — flagged gold instead of indigo. */
  caps?: boolean;
  reason: string;
  why: string;
  evidence: string;
  fix: string;
  delta: string;
}

const CRITERIA: Criterion[] = [
  {
    key: "LR",
    label: "Lexical Resource",
    band: "6.0",
    pct: 60,
    caps: true,
    reason: "Scanning vocabulary range, precision and spelling…",
    why: "Vocabulary repeats (“important” twice) and stays vague (“very big”), with a spelling slip. This is the single score holding your overall band down.",
    evidence: "“a very big improvement … comunicate”",
    fix: "Swap 6 vague words for precise collocations, e.g. “a substantial shift”, and correct “communicate”.",
    delta: "+0.5",
  },
  {
    key: "GRA",
    label: "Grammar Range",
    band: "6.0",
    pct: 60,
    reason: "Checking agreement and sentence variety…",
    why: "Subject–verb agreement slips and sentence forms stay simple, so accuracy and range both hold the band at 6.",
    evidence: "“technology have changed”",
    fix: "Fix the agreement and add two complex sentences with subordinate clauses.",
    delta: "+0.5",
  },
  {
    key: "TR",
    label: "Task Response",
    band: "6.5",
    pct: 72,
    reason: "Checking how fully both views are answered…",
    why: "Both views are addressed, but your own position is implied rather than stated and examples stay general.",
    evidence: "“others argue it has problems”",
    fix: "State your opinion in the intro and back each body paragraph with one specific example.",
    delta: "+0.5",
  },
  {
    key: "CC",
    label: "Coherence & Cohesion",
    band: "6.5",
    pct: 72,
    reason: "Tracing paragraphing and linking…",
    why: "Ideas connect, but linking leans on “and also” and paragraphing is uneven.",
    evidence: "“And also it is important…”",
    fix: "Open each paragraph with a topic sentence and vary your linkers.",
    delta: "+0.5",
  },
];

const SERIF = "var(--font-newsreader), Georgia, serif";
const SANS = "var(--font-hanken), system-ui, sans-serif";

/** One underlined mistake in the essay. `crit` ties it to a criterion; it lights
 *  up when that criterion is the one being explained. */
function Flag({ crit, active, children }: { crit: Criterion["key"]; active: boolean; children: React.ReactNode }) {
  const gold = crit === "LR";
  const tint = gold ? "#FBEFCF" : "#EBECFA";
  const line = gold ? "rgba(194,138,26,.55)" : "rgba(59,67,181,.5)";
  return (
    <span
      style={{
        borderRadius: 4,
        padding: "0 1px",
        textDecoration: `underline dotted ${line}`,
        textUnderlineOffset: 4,
        transition: "background .4s ease, box-shadow .4s ease",
        background: active ? tint : "transparent",
        boxShadow: active ? `0 0 0 3px ${tint}` : "none",
      }}
    >
      {children}
    </span>
  );
}

export function LiveGradingPanel() {
  // Start on the capping criterion (LR) — that's the story the design leads with.
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // hold on LR; don't cycle for reduced-motion users
    }
    const id = window.setInterval(() => setI((n) => (n + 1) % CRITERIA.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  const current = CRITERIA[i];
  const accent = current.caps ? GOLD : INDIGO;
  const accentText = current.caps ? "#b4881a" : INDIGO;
  const accentTint = current.caps ? "#FBEFCF" : "#EBECFA";
  const isActive = (k: Criterion["key"]) => k === current.key;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8E6D8",
        borderRadius: 20,
        boxShadow: "0 40px 90px -48px rgba(26,28,51,.55)",
        overflow: "hidden",
        animation: "lp-fadeup .6s ease both",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 22px",
          borderBottom: "1px solid #F0EEE3",
          background: "linear-gradient(90deg,#F6F6FC,#FBFAF4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3" />
              <rect x="5" y="6" width="14" height="12" rx="3" />
              <path d="M9 12h.01M15 12h.01M2 12h1M21 12h1" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: "#1A1C33", lineHeight: 1.1 }}>AI Examiner</div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 11, color: "#8a897c" }}>calibrated ±0.5 to human raters</div>
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 12,
            color: INDIGO,
            background: "#EBECFA",
            padding: "5px 11px",
            borderRadius: 999,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO, animation: "lp-dotpulse 1.4s ease-in-out infinite" }} />
          {current.label} · graded
        </div>
      </div>

      {/* essay with scan + flagged spans */}
      <div style={{ position: "relative", padding: "18px 22px 14px" }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#9a998c", marginBottom: 8 }}>
          Task 2 · your essay
        </div>
        <div style={{ position: "absolute", left: 22, right: 22, top: 42, bottom: 14, overflow: "hidden", borderRadius: 8, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 30,
              background: "linear-gradient(180deg,rgba(59,67,181,0),rgba(59,67,181,.13),rgba(59,67,181,0))",
              animation: "lp-scanmove 2.6s ease-in-out 1",
            }}
          />
        </div>
        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, lineHeight: 1.8, color: "#3a3d52", margin: 0 }}>
          In today’s world, <Flag crit="GRA" active={isActive("GRA")}>technology have changed</Flag> how we{" "}
          <Flag crit="LR" active={isActive("LR")}>comunicate</Flag>. Some think it is a{" "}
          <Flag crit="LR" active={isActive("LR")}>very big</Flag> improvement, while{" "}
          <Flag crit="TR" active={isActive("TR")}>others argue it has problems</Flag>.{" "}
          <Flag crit="CC" active={isActive("CC")}>And also</Flag> it is{" "}
          <Flag crit="LR" active={isActive("LR")}>important</Flag> for education and{" "}
          <Flag crit="LR" active={isActive("LR")}>important</Flag> for work.
        </p>
        {/* reasoning ticker */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontFamily: SANS, fontWeight: 500, fontSize: 12, color: "#7a7c92" }}>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "flex-end" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: INDIGO, animation: "lp-think 1s ease-in-out infinite" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: INDIGO, animation: "lp-think 1s ease-in-out .15s infinite" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: INDIGO, animation: "lp-think 1s ease-in-out .3s infinite" }} />
          </span>
          <span>{current.reason}</span>
        </div>
      </div>

      {/* gauge + criteria */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, padding: "6px 22px 14px", borderTop: "1px solid #F0EEE3", alignItems: "center" }}>
        {/* band ring */}
        <div style={{ position: "relative", width: 118, height: 118, flex: "none" }}>
          <svg width="118" height="118" viewBox="0 0 118 118">
            <circle cx="59" cy="59" r="54" fill="none" stroke="#EFEEE2" strokeWidth="9" />
            <circle
              cx="59"
              cy="59"
              r="54"
              fill="none"
              stroke={INDIGO}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="339"
              style={
                {
                  strokeDashoffset: 339,
                  transform: "rotate(-90deg)",
                  transformOrigin: "59px 59px",
                  animation: "lp-ringfill 1.4s .3s cubic-bezier(.2,.7,.2,1) forwards",
                  ["--off" as string]: 94, // consumed by the keyframe
                } as React.CSSProperties
              }
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, lineHeight: 1, color: INDIGO }}>6.5</div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a998c", marginTop: 2 }}>Overall</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#565a72", marginBottom: 8 }}>
            Projected <b style={{ color: "#1A1C33" }}>7.0</b> once the highlighted fixes are applied.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CRITERIA.map((c, idx) => {
              const on = c.key === current.key;
              const barColor = c.caps ? "#D8A93A" : INDIGO;
              return (
                <div
                  key={c.key}
                  style={{
                    border: `1px solid ${on ? (c.caps ? "#E7C977" : "#C8CBF0") : "#ECEADC"}`,
                    borderRadius: 10,
                    padding: "9px 11px",
                    background: on ? (c.caps ? "#FFFDF6" : "#F7F7FD") : "#fff",
                    transform: on ? "translateY(-1px)" : "none",
                    transition: "background .35s ease, border-color .35s ease, transform .35s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontWeight: 600, fontSize: 12, color: "#565a72" }}>
                    <span>{c.key === "CC" ? "Coherence" : c.key === "LR" ? "Lexical" : c.key === "GRA" ? "Grammar" : "Task Response"}</span>
                    <span style={{ color: c.caps ? "#b4881a" : "#1A1C33" }}>{c.band}</span>
                  </div>
                  <div style={{ height: 5, background: "#EFEEE2", borderRadius: 999, overflow: "hidden", marginTop: 7 }}>
                    <div
                      style={
                        {
                          height: "100%",
                          background: barColor,
                          borderRadius: 999,
                          animation: `lp-fillbar 1s ${0.15 + idx * 0.13}s cubic-bezier(.2,.7,.2,1) both`,
                          ["--w" as string]: `${c.pct}%`, // consumed by the keyframe
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* detailed explanation (swaps per active criterion) */}
      <div
        style={{
          margin: "0 22px 22px",
          background: "#FAF9F1",
          border: "1px solid #ECEADC",
          borderRadius: 13,
          padding: 15,
          borderLeft: `3px solid ${accent}`,
          transition: "border-color .35s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: "#1A1C33" }}>{current.label}</span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, color: accentText, background: accentTint, padding: "3px 8px", borderRadius: 6 }}>
            Band {current.band}
          </span>
          {current.caps ? (
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10, color: "#b4881a", background: "#FBEFCF", padding: "3px 8px", borderRadius: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>
              Caps your band
            </span>
          ) : null}
        </div>
        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, lineHeight: 1.55, color: "#565a72", margin: "9px 0 0" }}>{current.why}</p>
        <div style={{ marginTop: 10, background: "#fff", border: "1px solid #ECEADC", borderRadius: 9, padding: "9px 11px" }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a998c", marginBottom: 2 }}>
            Evidence from your essay
          </div>
          <span style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 13, lineHeight: 1.5, fontStyle: "italic", color: "#3a3d52" }}>{current.evidence}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f8f5b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 2 }}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, lineHeight: 1.5, color: "#1A1C33" }}>
            <b>Fix:</b> {current.fix}
            <span style={{ display: "inline-block", marginLeft: 6, fontFamily: SANS, fontWeight: 700, fontSize: 11, color: "#2f8f5b", background: "#E5F2EB", padding: "2px 8px", borderRadius: 6, verticalAlign: 1 }}>
              {current.delta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
