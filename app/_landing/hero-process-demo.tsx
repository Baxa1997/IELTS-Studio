"use client";

import { useEffect, useState } from "react";

/**
 * The hero's animated product demo (marketing only) — loops two scenes:
 *
 *   1. GRADING    — a scan beam sweeps a Task 2 excerpt, mistakes highlight one
 *                   by one, criterion bars fill, the band lands on 6.0 and the
 *                   verdict ("LR caps it — here's the fix, 7.0 with fixes") drops in.
 *   2. GENERATION — a fresh Cambridge-style practice assembles: passage lines
 *                   draw in, question-type chips pop, a multi-voice waveform plays.
 *
 * Pure theatre: no model is called here (CLAUDE.md: never call AI from the
 * client). Scenes auto-advance; the pills switch them manually. All motion is
 * CSS keyframes restarted by remounting the scene subtree; prefers-reduced-motion
 * shows every end state immediately.
 */

const SANS = "var(--font-manrope), system-ui, sans-serif";
const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace";
const INDIGO = "#7d0132";
const INK = "#121317";
const GOLD = "#B5852A";
const RED = "#C5503C";
const EMERALD = "#1F8A5B";

const GRADE_MS = 12_000;
const GEN_MS = 10_000;

type Scene = "grade" | "gen";

/** One highlighted mistake in the demo essay. */
function Mark({
  children,
  tone,
  tip,
  delay,
}: {
  children: React.ReactNode;
  tone: "grammar" | "spelling" | "vocab";
  tip: string;
  delay: number;
}) {
  const colors = {
    grammar: { bg: "rgba(224,168,46,.16)", line: GOLD },
    spelling: { bg: "rgba(197,80,60,.14)", line: RED },
    vocab: { bg: "rgba(125,1,50,.10)", line: INDIGO },
  }[tone];
  return (
    <span style={{ position: "relative", whiteSpace: "nowrap" }}>
      <span
        className="hpd-mark"
        style={{
          animationDelay: `${delay}s`,
          background: colors.bg,
          boxShadow: `inset 0 -2px 0 ${colors.line}`,
          borderRadius: 3,
          padding: "0 2px",
        }}
      >
        {children}
      </span>
      <span
        className="hpd-tip"
        style={{ animationDelay: `${delay + 0.25}s`, borderColor: colors.line, color: colors.line }}
      >
        {tip}
      </span>
    </span>
  );
}

function GradeScene() {
  return (
    <div className="hpd-grid">
      {/* left — the essay being scanned */}
      <div style={{ position: "relative", minWidth: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".18em",
            color: "#8b919d",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Your essay · Task 2
        </div>
        <div
          style={{
            position: "relative",
            fontSize: 14.5,
            lineHeight: 2,
            color: "#4b493f",
            overflow: "hidden",
            borderRadius: 10,
          }}
        >
          <span className="hpd-scan" aria-hidden />
          In the modern era, working from home has become a{" "}
          <Mark tone="vocab" tip="vague → “a substantial trend”" delay={0.9}>
            very big
          </Mark>{" "}
          trend around the world. Some people{" "}
          <Mark tone="spelling" tip="believe" delay={1.5}>
            beleive
          </Mark>{" "}
          this shift is important for productivity, while others think it is{" "}
          <Mark tone="vocab" tip="repeated → “essential”" delay={2.1}>
            important
          </Mark>{" "}
          for companies to keep offices. Remote work{" "}
          <Mark tone="grammar" tip="gives — subject–verb" delay={2.7}>
            give
          </Mark>{" "}
          employees more freedom to manage{" "}
          <Mark tone="grammar" tip="their" delay={3.3}>
            there
          </Mark>{" "}
          time, which can make a real improvement in motivation.
        </div>
      </div>

      {/* right — bands land, verdict drops */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".18em",
            color: "#8b919d",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Criterion bands
        </div>
        {[
          { label: "Task Response", band: "6.5", pct: 72, color: INDIGO, d: 3.9 },
          { label: "Coherence", band: "6.0", pct: 66, color: INDIGO, d: 4.3 },
          { label: "Lexical Resource", band: "6.0 · caps", pct: 61, color: GOLD, d: 4.7 },
          { label: "Grammar", band: "6.5", pct: 72, color: INDIGO, d: 5.1 },
        ].map((c) => (
          <div key={c.label} style={{ marginBottom: 9 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 12.5,
                marginBottom: 4,
              }}
            >
              <span style={{ fontWeight: 600, color: "#4a505c" }}>{c.label}</span>
              <span
                className="hpd-in"
                style={{ animationDelay: `${c.d + 0.45}s`, fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: c.color }}
              >
                {c.band}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "#EFEDE3", overflow: "hidden" }}>
              <div
                className="hpd-bar"
                style={{ animationDelay: `${c.d}s`, width: `${c.pct}%`, height: "100%", borderRadius: 999, background: c.color }}
              />
            </div>
          </div>
        ))}

        <div
          className="hpd-in"
          style={{
            animationDelay: "5.9s",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14 }}>
            <strong style={{ color: INK, fontWeight: 700 }}>Overall 6.0.</strong>{" "}
            <span style={{ color: "#4a505c" }}>Lexical range caps it — the fixes are named.</span>
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: EMERALD,
              background: "#e9f5ef",
              border: "1px solid #cfe7da",
              borderRadius: 999,
              padding: "5px 12px",
              whiteSpace: "nowrap",
            }}
          >
            7.0 with fixes
          </span>
        </div>
      </div>
    </div>
  );
}

function GenScene() {
  return (
    <div className="hpd-grid">
      {/* left — the passage assembling */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".18em",
            color: "#8b919d",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Reading passage · generated now
        </div>
        <div className="hpd-in" style={{ animationDelay: ".3s", fontWeight: 700, fontSize: 15.5, color: INK, marginBottom: 10 }}>
          The Hidden Logistics of Airport Baggage
        </div>
        {[96, 100, 92, 98, 64].map((w, i) => (
          <div
            key={i}
            className="hpd-line"
            style={{
              animationDelay: `${0.7 + i * 0.28}s`,
              width: `${w}%`,
              height: 9,
              borderRadius: 999,
              background: "#E9E6DA",
              marginBottom: 9,
            }}
          />
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
          {["True / False / Not Given", "Matching headings", "Pick TWO", "Summary completion"].map((q, i) => (
            <span
              key={q}
              className="hpd-pop"
              style={{
                animationDelay: `${2.3 + i * 0.35}s`,
                fontSize: 12,
                fontWeight: 600,
                color: INDIGO,
                background: "#fdf4f7",
                border: "1px solid #f0d3de",
                borderRadius: 999,
                padding: "5px 11px",
              }}
            >
              {q}
            </span>
          ))}
        </div>
      </div>

      {/* right — listening audio + the promise */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".18em",
            color: "#8b919d",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Listening · multi-voice audio
        </div>
        <div
          className="hpd-in"
          style={{
            animationDelay: "1s",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#F7F6EF",
            border: "1px solid #EAE7DE",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 1.5 L10.5 6 L3 10.5 Z" fill="#fff" />
            </svg>
          </span>
          <span aria-hidden style={{ display: "flex", alignItems: "center", gap: 2.5, height: 30, flex: 1, minWidth: 0, overflow: "hidden" }}>
            {Array.from({ length: 30 }, (_, i) => (
              <span
                key={i}
                className="hpd-eq"
                style={{
                  animationDelay: `${1.4 + (i % 6) * 0.13}s`,
                  width: 3,
                  borderRadius: 2,
                  background: i % 5 === 0 ? INDIGO : "#e8b9cb",
                  height: [10, 18, 26, 14, 22, 8][i % 6],
                  flex: "none",
                }}
              />
            ))}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#8b919d", whiteSpace: "nowrap" }}>Part 2 · map</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
          {["4 parts · 40 questions", "Band scored", "Trap explanations"].map((t, i) => (
            <span
              key={t}
              className="hpd-pop"
              style={{
                animationDelay: `${3.4 + i * 0.35}s`,
                fontSize: 12,
                fontWeight: 600,
                color: "#4a505c",
                background: "#fff",
                border: "1px solid #e6e8ec",
                borderRadius: 999,
                padding: "5px 11px",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="hpd-in" style={{ animationDelay: "4.7s", marginTop: 14, fontSize: 14 }}>
          <strong style={{ color: INK, fontWeight: 700 }}>Fresh for every session.</strong>{" "}
          <span style={{ color: "#4a505c" }}>Never a recycled test, never an answer you remember.</span>
        </div>
      </div>
    </div>
  );
}

export function HeroProcessDemo() {
  const [scene, setScene] = useState<Scene>("grade");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => {
        setScene((s) => (s === "grade" ? "gen" : "grade"));
        setCycle((c) => c + 1);
      },
      scene === "grade" ? GRADE_MS : GEN_MS,
    );
    return () => clearTimeout(t);
  }, [scene, cycle]);

  const pick = (s: Scene) => {
    if (s !== scene) {
      setScene(s);
      setCycle((c) => c + 1);
    }
  };

  return (
    <div
      className="hb-rise hb-d6"
      style={{
        maxWidth: 1280,
        margin: "46px auto 0",
        background: "#fff",
        border: "1px solid #EAE7DE",
        borderRadius: 22,
        boxShadow: "0 30px 60px -30px rgba(18,19,23,.18)",
        padding: "20px clamp(18px,3vw,30px) 22px",
        fontFamily: SANS,
      }}
    >
      <style>{HPD_STYLES}</style>

      {/* header: what's happening + scene switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16">
              <path d="M8 0 C8 4.4 4.4 8 0 8 C4.4 8 8 11.6 8 16 C8 11.6 11.6 8 16 8 C11.6 8 8 4.4 8 0 Z" fill="#fff" />
            </svg>
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: INK }}>
            {scene === "grade" ? "AI Examiner" : "Practice generator"}
          </span>
          <span style={{ fontSize: 14, color: "#908d80" }}>
            {scene === "grade" ? "grading a Task 2 essay" : "composing a Cambridge-style test"}
          </span>
          <span style={{ display: "inline-flex", gap: 4, marginLeft: 2, alignItems: "center" }}>
            {[0, 0.2, 0.4].map((d) => (
              <span
                key={d}
                style={{ width: 5, height: 5, borderRadius: "50%", background: INDIGO, animation: `hb-dots 1.2s infinite ${d}s` }}
              />
            ))}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(
            [
              ["grade", "Grading"],
              ["gen", "Generating"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              aria-pressed={scene === key}
              style={{
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                color: scene === key ? "#fff" : "#4a505c",
                background: scene === key ? INDIGO : "#F3F1E5",
                border: "1px solid " + (scene === key ? INDIGO : "#e6e8ec"),
                borderRadius: 999,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* the scene — keyed so every switch restarts its animations */}
      <div key={`${scene}-${cycle}`} className="hpd-scene" style={{ marginTop: 18 }}>
        {scene === "grade" ? <GradeScene /> : <GenScene />}
      </div>
    </div>
  );
}

const HPD_STYLES = `
.hpd-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:clamp(20px,3.5vw,44px)}
@media (max-width:820px){.hpd-grid{grid-template-columns:1fr;gap:22px}}
.hpd-scene{animation:hpd-fade .5s ease both}
@keyframes hpd-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.hpd-scan{position:absolute;left:0;right:0;top:-30%;height:26%;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(125,1,50,.10) 45%,rgba(125,1,50,.16) 50%,rgba(125,1,50,.10) 55%,transparent);
  animation:hpd-scan 3.4s cubic-bezier(.4,.2,.5,.9) .3s both}
@keyframes hpd-scan{from{top:-30%}to{top:110%}}
.hpd-mark{animation:hpd-mark .34s ease both}
@keyframes hpd-mark{from{background:transparent;box-shadow:none}to{}}
.hpd-tip{position:absolute;left:50%;bottom:calc(100% + 2px);transform:translateX(-50%);
  font-size:10px;font-weight:700;letter-spacing:.01em;white-space:nowrap;background:#fff;
  border:1px solid;border-radius:6px;padding:2px 7px;box-shadow:0 8px 16px -8px rgba(18,19,23,.3);
  animation:hpd-pop .3s cubic-bezier(.3,1.4,.5,1) both;z-index:2}
@media (max-width:600px){.hpd-tip{display:none}}
.hpd-in{animation:hpd-pop .45s cubic-bezier(.3,1.2,.4,1) both}
.hpd-pop{animation:hpd-pop .38s cubic-bezier(.3,1.4,.5,1) both}
@keyframes hpd-pop{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:none}}
.hpd-bar{transform-origin:left;animation:hpd-bar .9s cubic-bezier(.4,.7,.2,1) both}
@keyframes hpd-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.hpd-line{transform-origin:left;animation:hpd-bar .6s cubic-bezier(.4,.7,.2,1) both}
.hpd-eq{animation:hpd-eq 1s ease-in-out infinite alternate,hpd-pop .3s ease both}
@keyframes hpd-eq{from{transform:scaleY(.45)}to{transform:scaleY(1.15)}}
@media (prefers-reduced-motion:reduce){
  .hpd-scan{display:none}
  .hpd-scene,.hpd-mark,.hpd-tip,.hpd-in,.hpd-pop,.hpd-bar,.hpd-line,.hpd-eq{animation:none!important;opacity:1}
}
`;
