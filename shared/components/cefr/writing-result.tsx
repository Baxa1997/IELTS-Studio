"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BRAND_LINE as D_ABORDER2,
  BRAND_SOFT as W_SOFT,
  HERO_B,
  HERO_MID,
  PANEL,
  SLATE_STRONG,
  WARM_GREEN as GOOD,
  WARM_RED as BAD,
  WHITE,
} from "@/lib/theme/tokens";

import { JAKARTA, PLEX } from "./design";
import type { WritingGrade } from "./types";
import { Alert } from "./ui";
import {
  W_ACCENT,
  W_BODY,
  W_CANVAS,
  W_FAINT,
  W_INK,
  W_LINE,
  W_MUTED,
  W_SOFT2,
} from "./writing-design";

const CEFR_GRADING_STEPS = [
  "Reading your response, line by line…",
  "Checking grammar, vocabulary & cohesion…",
  "Weighing it against the CEFR descriptors…",
  "Calibrating a fair, conservative level…",
];

export function CefrGradingOverlay() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % CEFR_GRADING_STEPS.length), 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div
      role="alertdialog"
      aria-label="Grading your writing"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "var(--ex-scrim-cw)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "min(420px,94vw)",
          background: PANEL,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 40px 90px -30px rgba(15,23,42,.7), 0 0 0 1px var(--ex-ring)",
        }}
      >
        <div
          style={{
            padding: "30px 26px 26px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            borderBottom: `1px solid ${D_ABORDER2}`,
            background: W_SOFT2,
          }}
        >
          <span
            style={{
              width: 60,
              height: 60,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: `linear-gradient(135deg,${HERO_B} 0%,${HERO_MID} 100%)`,
              color: WHITE,
            }}
          >
            <Loader2 size={26} className="animate-spin" />
          </span>
          <h2
            style={{
              margin: "18px 0 0",
              fontFamily: JAKARTA,
              fontSize: 19,
              fontWeight: 800,
              color: W_INK,
            }}
          >
            Grading your writing
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: JAKARTA,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: W_MUTED,
              maxWidth: 320,
            }}
          >
            Hang tight — we read every line and weigh it against the CEFR descriptors so your level
            is accurate.
          </p>
        </div>
        <div style={{ padding: "20px 26px 24px" }}>
          <div
            style={{
              minHeight: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              key={step}
              style={{
                fontFamily: JAKARTA,
                fontSize: 13.5,
                fontWeight: 600,
                color: W_ACCENT,
                textAlign: "center",
              }}
            >
              {CEFR_GRADING_STEPS[step]}
            </span>
          </div>
          <div
            style={{
              marginTop: 16,
              height: 6,
              borderRadius: 999,
              background: W_SOFT,
              overflow: "hidden",
            }}
          >
            <div
              className="lp-grade-bar"
              style={{ height: "100%", width: "100%", borderRadius: 999, background: W_ACCENT }}
            />
          </div>
          <p
            style={{
              margin: "14px 0 0",
              fontFamily: JAKARTA,
              fontSize: 12,
              color: W_FAINT,
              textAlign: "center",
            }}
          >
            This usually takes about 20–30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

export function WritingResult({ g }: { g: WritingGrade }) {
  if (!g.gradable) return <Alert>{g.message ?? "Not gradable yet."}</Alert>;
  const s = g.scores;
  return (
    <div>
      {/* level hero */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 22px",
          borderRadius: 14,
          background: `linear-gradient(135deg,${HERO_B} 0%,${HERO_MID} 100%)`,
          color: WHITE,
          marginBottom: 18,
        }}
      >
        <div style={{ fontFamily: PLEX, fontSize: 38, fontWeight: 600, lineHeight: 1 }}>
          {g.estimated_cefr}
        </div>
        <div style={{ height: 38, width: 1, background: "rgba(255,255,255,.3)" }} />
        <div>
          <div style={{ fontFamily: JAKARTA, fontSize: 20, fontWeight: 700 }}>
            {g.overall_0_100}
            <span style={{ opacity: 0.7, fontSize: 14 }}>/100</span>
          </div>
          <div style={{ fontFamily: JAKARTA, fontSize: 12.5, opacity: 0.85 }}>
            {g.word_count} words · {g.in_range ? "in range" : "out of range"}
          </div>
        </div>
      </div>
      {s ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {(
            [
              ["Task", s.task_achievement],
              ["Coherence", s.coherence],
              ["Lexis", s.lexical],
              ["Grammar", s.grammar],
              ["Register", s.register],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              style={{
                border: `1px solid ${W_LINE}`,
                borderRadius: 10,
                padding: "10px",
                textAlign: "center",
                background: W_CANVAS,
              }}
            >
              <div style={{ fontFamily: PLEX, fontSize: 22, fontWeight: 700, color: W_ACCENT }}>
                {v}
                <span style={{ fontSize: 12, color: W_FAINT }}>/5</span>
              </div>
              <div style={{ fontFamily: JAKARTA, fontSize: 11, color: W_MUTED, marginTop: 2 }}>
                {k}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {g.examiner_comment ? (
        <p
          style={{
            fontFamily: JAKARTA,
            fontSize: 14,
            color: W_BODY,
            lineHeight: 1.65,
            margin: "0 0 16px",
            padding: "12px 14px",
            background: W_SOFT2,
            border: `1px solid ${D_ABORDER2}`,
            borderRadius: 10,
          }}
        >
          {g.examiner_comment}
        </p>
      ) : null}
      <ResultBullets title="Strengths" items={g.strengths} color={GOOD} />
      <ResultBullets title="Improve" items={g.improvements} color="var(--ex-cf-improve)" />
      {g.corrected_sentences?.length ? (
        <div style={{ marginTop: 14 }}>
          <ResultLabel>Suggested fixes</ResultLabel>
          {g.corrected_sentences.map((c, i) => (
            <div
              key={i}
              style={{
                fontFamily: JAKARTA,
                fontSize: 13.5,
                lineHeight: 1.55,
                marginBottom: 9,
                padding: "10px 12px",
                border: `1px solid ${W_LINE}`,
                borderRadius: 10,
              }}
            >
              <div style={{ color: BAD, textDecoration: "line-through" }}>{c.original}</div>
              <div style={{ color: GOOD, marginTop: 3 }}>{c.improved}</div>
            </div>
          ))}
        </div>
      ) : null}
      {g.model_answer ? (
        <details style={{ marginTop: 16 }}>
          <summary
            style={{
              fontFamily: JAKARTA,
              fontSize: 13.5,
              fontWeight: 700,
              color: W_ACCENT,
              cursor: "pointer",
            }}
          >
            Show a model answer
          </summary>
          <p
            style={{
              fontFamily: PLEX,
              fontSize: 15,
              lineHeight: 1.8,
              color: SLATE_STRONG,
              margin: "10px 0 0",
              whiteSpace: "pre-wrap",
            }}
          >
            {g.model_answer}
          </p>
        </details>
      ) : null}
    </div>
  );
}

function ResultBullets({
  title,
  items,
  color,
}: {
  title: string;
  items?: string[];
  color: string;
}) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <ResultLabel>{title}</ResultLabel>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{ fontFamily: JAKARTA, fontSize: 13.5, color: W_BODY, lineHeight: 1.65 }}
          >
            <span style={{ color }}>•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: JAKARTA,
        fontWeight: 700,
        fontSize: 11,
        color: W_FAINT,
        textTransform: "uppercase",
        letterSpacing: ".06em",
      }}
    >
      {children}
    </div>
  );
}
