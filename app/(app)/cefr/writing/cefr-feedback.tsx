"use client";

import { ArrowRight, Check } from "lucide-react";

import { CEFR } from "@/lib/cefr/levels";
import { CEFR_SUBSCALES } from "@/lib/cefr/descriptors";
import { CEFR_SUBSCALE_KEYS, type CefrGradeResult } from "@/lib/cefr/schema";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const GREEN = "#15803D";
const AMBER = "#B5852A";
const RED = "#C5503C";

const SUBSCALE_NAME: Record<string, string> = Object.fromEntries(
  CEFR_SUBSCALES.map((s) => [s.key, s.name]),
);

/** 0–5 subscale mark → colour (5/4 strong, 3 borderline, ≤2 weak). */
function markColor(mark: number): string {
  if (mark >= 4) return GREEN;
  if (mark === 3) return AMBER;
  return RED;
}

/**
 * The CEFR writing feedback view (presentational). Renders the estimated level,
 * the four subscales, strengths/improvements and the next-level path. Shared by the
 * live studio result and the reopened-from-history page; the parent supplies the
 * surrounding chrome (back link) and the `footer` actions.
 */
export function CefrFeedback({
  grade,
  taskTitle,
  footer,
}: {
  grade: CefrGradeResult;
  taskTitle?: string | null;
  footer?: React.ReactNode;
}) {
  const est = CEFR[grade.estimated_level];
  return (
    <>
      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 24px", background: est.bg, border: `1px solid ${est.color}33`, borderRadius: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 60, lineHeight: 0.85, color: est.color, letterSpacing: "-.02em" }}>{grade.estimated_level}</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: MUTED }}>Estimated CEFR level</p>
          <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 700, color: INK }}>{est.name}</p>
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 12.5, fontWeight: 700, color: grade.on_target ? GREEN : AMBER, background: grade.on_target ? "#E9F7EE" : "#F6EAD0", padding: "3px 10px", borderRadius: 999 }}>
            {grade.on_target ? `Meets the ${grade.target_level} target` : `Below the ${grade.target_level} target`}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.6, color: "#3A3F58", margin: "18px 0 0" }}>{grade.summary}</p>

      {/* Subscales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 14, marginTop: 18 }}>
        {CEFR_SUBSCALE_KEYS.map((key) => {
          const s = grade.subscales[key];
          const c = markColor(s.mark);
          return (
            <div key={key} style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: INK }}>{SUBSCALE_NAME[key]}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: c, fontVariantNumeric: "tabular-nums" }}>{s.mark}<span style={{ fontSize: 13, color: "#9097A8", fontWeight: 600 }}>/5</span></span>
              </div>
              <div style={{ marginTop: 9, height: 6, borderRadius: 3, background: "#EFECE0", overflow: "hidden" }}>
                <div style={{ width: `${(s.mark / 5) * 100}%`, height: "100%", borderRadius: 3, background: c }} />
              </div>
              <p style={{ margin: "11px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{s.comment}</p>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#2C3247" }}>
                <strong style={{ color: INDIGO }}>Improve:</strong> {s.improve}
              </p>
            </div>
          );
        })}
      </div>

      {/* Strengths + improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginTop: 14 }}>
        <ListCard title="Strengths" color={GREEN} items={grade.strengths} icon={<Check size={14} />} />
        <ListCard title="Work on next" color={AMBER} items={grade.improvements} icon={<ArrowRight size={14} />} />
      </div>

      {/* Next level */}
      <div style={{ marginTop: 14, padding: "16px 18px", background: "#EFEEFC", border: "1px solid #DEDCF5", borderRadius: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", color: INDIGO }}>To reach {grade.next_level.level}</p>
        <p style={{ margin: "5px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#2C3247" }}>{grade.next_level.focus}</p>
      </div>

      <p style={{ margin: "18px 0 0", fontSize: 12, lineHeight: 1.5, color: "#9A99A8" }}>{grade.disclaimer}</p>

      {footer ? <div style={{ marginTop: 18 }}>{footer}</div> : null}

      {taskTitle ? <p style={{ marginTop: 14, fontSize: 12.5, color: "#9097A8" }}>Task: {taskTitle}</p> : null}
    </>
  );
}

function ListCard({ title, color, items, icon }: { title: string; color: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7E3D5", borderRadius: 14, padding: "16px 18px" }}>
      <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14.5, color: INK }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <span style={{ flex: "none", width: 20, height: 20, borderRadius: 6, background: `${color}1A`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{icon}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "#41496A" }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const cefrBackBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 600,
  color: MUTED,
};

export function cefrPrimaryBtn(busy = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 44,
    padding: "0 20px",
    border: "none",
    borderRadius: 11,
    background: INDIGO,
    color: "#fff",
    fontFamily: SANS,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
    textDecoration: "none",
    boxShadow: "0 10px 22px -10px rgba(59,67,181,.7)",
  };
}
