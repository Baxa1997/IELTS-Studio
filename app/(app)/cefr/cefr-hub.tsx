"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, PenLine } from "lucide-react";

import { CEFR, CEFR_LEVEL_LIST, type CefrLevel } from "@/lib/cefr/levels";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";

/**
 * The CEFR hub — a level ladder (A1→C2) plus the two distinct CEFR practice modes
 * (Reading, Writing). Picking a level updates the can-do targets and the task each
 * mode will set. The dedicated CEFR engine (shorter level-graded texts + CEFR
 * scoring) is the next build; until then each mode shows the level's IELTS-band
 * bridge so the learner can practise at the equivalent level today.
 */
export function CefrHub() {
  const [level, setLevel] = useState<CefrLevel>("B1");
  const info = CEFR[level];

  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 1040 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.05, letterSpacing: "-.01em", margin: 0 }}>CEFR practice</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: MUTED, margin: "8px 0 0", maxWidth: 640 }}>
          A separate, level-graded track on the Common European Framework (A1–C2). Shorter texts and tasks than the full IELTS exam, reported as a CEFR level rather than a band — pick your level to see what each skill practises.
        </p>
      </div>

      {/* Level ladder */}
      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
        {CEFR_LEVEL_LIST.map((l) => {
          const on = l.code === level;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLevel(l.code)}
              aria-pressed={on}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 3,
                padding: "11px 16px",
                borderRadius: 12,
                cursor: "pointer",
                minWidth: 92,
                textAlign: "left",
                background: on ? l.bg : "#fff",
                border: `1.5px solid ${on ? l.color : "#E7E3D5"}`,
                boxShadow: on ? "0 4px 14px -8px rgba(26,33,56,.4)" : "none",
              }}
            >
              <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 18, color: on ? l.color : INK }}>{l.code}</span>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: on ? l.color : "#8A8FA0" }}>{l.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected level summary */}
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: info.bg, border: `1px solid ${info.color}33`, borderRadius: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: info.color, lineHeight: 1 }}>{info.code}</span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15.5, color: INK }}>{info.name} <span style={{ fontWeight: 600, color: MUTED }}>· {info.ieltsApprox}</span></p>
          <p style={{ margin: "3px 0 0", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{info.blurb}</p>
        </div>
      </div>

      {/* Two modes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
        <ModeCard
          icon={<PenLine size={20} />}
          title="CEFR Writing"
          can={info.writingCan}
          meta={`${info.writingTask} · ~${info.writingWords} words`}
          startHref={`/cefr/writing?level=${info.code}`}
          startLabel="Start writing"
        />
        <ModeCard
          icon={<BookOpen size={20} />}
          title="CEFR Reading"
          can={info.readingCan}
          meta={`~${info.readingWords}-word passage · level ${info.code}`}
          bridgeHref="/read"
          bridgeLabel="Practise reading now"
        />
      </div>

      <p style={{ margin: "30px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "#9A99A8", maxWidth: 720 }}>
        CEFR levels and their IELTS overlap follow the public Council of Europe framework. A CEFR result is an indicative level, not an official IELTS® score, and this product is not affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  can,
  meta,
  startHref,
  startLabel,
  bridgeHref,
  bridgeLabel,
}: {
  icon: React.ReactNode;
  title: string;
  can: string;
  meta: string;
  /** When set, the card is LIVE: a primary Start CTA, no "soon" badge. */
  startHref?: string;
  startLabel?: string;
  /** Staged mode: a SOON badge + a bridge to the equivalent IELTS practice. */
  bridgeHref?: string;
  bridgeLabel?: string;
}) {
  const live = Boolean(startHref);
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 16, padding: "20px 20px 18px", display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: SANS, fontWeight: 700, fontSize: 17, color: INK }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "#EFEEFC", color: INDIGO, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
          {title}
        </span>
        {live ? (
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: ".05em", color: "#1A7A48", background: "#E9F7EE", padding: "3px 8px", borderRadius: 6 }}>LIVE</span>
        ) : (
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: ".05em", color: "#9A8F77", background: "#ECE8DA", padding: "3px 8px", borderRadius: 6 }}>SOON</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#41496A" }}>{can}</p>
      <span style={{ fontSize: 13, color: "#9097A8", fontWeight: 600 }}>{meta}</span>
      <div style={{ height: 1, background: "#F0EDE1", marginTop: 2 }} />
      {live ? (
        <Link href={startHref!} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 18px", borderRadius: 11, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 8px 18px -10px rgba(59,67,181,.7)" }}>
          {startLabel ?? "Start"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12.5, color: MUTED }}>Dedicated CEFR scoring is on the way.</span>
          {bridgeHref ? (
            <Link href={bridgeHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INDIGO, textDecoration: "none" }}>
              {bridgeLabel}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INDIGO} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
