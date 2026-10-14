"use client";

import { Check, CircleAlert, MessageSquareQuote } from "lucide-react";
import type React from "react";

import {
  BODY,
  BRAND_PANEL,
  DISPLAY,
  HERO_B,
  HERO_MID,
  INK,
  LINE,
  MUTED,
  PANEL,
  RADIUS,
  SANS,
  STRONG,
  WELL,
  WHITE,
} from "@/app/_landing/_lib/design";
import { useT } from "@/shared/components/i18n/locale-provider";
import { CEFR_SCORES, cefrTask, type CefrTaskId, type CefrWritingGrade } from "@/lib/public-grader/cefr";
import { TINT, TONE_LINE } from "@/lib/theme/tokens";

/**
 * A CEFR (Multilevel) grade on the free checker — what the engine's grader
 * returned for the visitor's own task: an indicative level, a score out of 100,
 * five sub-scores out of 5, and the examiner's notes. No model answer: there is
 * none to a task the engine has never seen.
 *
 * The target and word range shown are the ENGINE'S, from the grade itself
 * (`cefr`, `word_range`), falling back to the picker's mirror only if absent —
 * the grade is the authority on what it graded against.
 */
export function CefrResult({ grade, task }: { grade: CefrWritingGrade; task: CefrTaskId }) {
  const t = useT();

  if (!grade.gradable) {
    return (
      <p
        role="status"
        style={{
          margin: 0,
          padding: "16px 18px",
          borderRadius: 16,
          background: TINT.amber.bg,
          border: `1px solid ${TONE_LINE.amber}`,
          color: TINT.amber.fg,
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {grade.message || t("grade.notGradable")}
      </p>
    );
  }

  const meta = cefrTask(task);
  const target = grade.cefr ?? meta.level;
  const [lo, hi] = grade.word_range ?? meta.words;
  const words = grade.word_count ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: SANS }}>
      {/* ---- the level ---- */}
      <section
        style={{
          background: BRAND_PANEL,
          backgroundImage: `linear-gradient(135deg,${HERO_B} 0%,${HERO_MID} 100%)`,
          color: WHITE,
          borderRadius: RADIUS.card,
          padding: "clamp(20px,2.6vw,28px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px 26px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 54, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
            {grade.estimated_cefr ?? "—"}
          </span>
          <span aria-hidden style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,.28)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.82 }}>
              {t("grade.cefrLevel")}
            </span>
            {typeof grade.overall_0_100 === "number" ? (
              <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600 }}>
                {grade.overall_0_100}
                <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.75 }}> {t("grade.cefrOutOf")}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <HeroChip>{t("grade.cefrTarget", { task, level: target })}</HeroChip>
          <HeroChip>
            {grade.in_range ? t("grade.inRange", { n: words }) : t("grade.outOfRange", { n: words, lo, hi })}
          </HeroChip>
        </div>
      </section>

      {/* ---- the five sub-scores ---- */}
      {grade.scores ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(140px,100%),1fr))",
            gap: 10,
          }}
        >
          {CEFR_SCORES.map((s) => {
            const v = grade.scores?.[s.key] ?? 0;
            return (
              <div key={s.key} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: "14px 14px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {v}
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>/5</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: BODY }}>{s.label}</div>
              </div>
            );
          })}
        </section>
      ) : null}

      {grade.examiner_comment ? (
        <section style={{ display: "flex", gap: 12, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: "16px 18px" }}>
          <span aria-hidden style={{ display: "inline-flex", color: TINT.brand.fg, flex: "none", marginTop: 2 }}>
            <MessageSquareQuote size={18} strokeWidth={2} />
          </span>
          <div>
            <Label>{t("grade.examiner")}</Label>
            <p style={{ margin: "5px 0 0", fontSize: 15, lineHeight: 1.65, color: STRONG }}>{grade.examiner_comment}</p>
          </div>
        </section>
      ) : null}

      {grade.strengths?.length || grade.improvements?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))", gap: 14 }}>
          {grade.strengths?.length ? (
            <Bullets title={t("grade.strengths")} items={grade.strengths} tone="green" icon={<Check size={15} strokeWidth={2.6} />} />
          ) : null}
          {grade.improvements?.length ? (
            <Bullets title={t("grade.improve")} items={grade.improvements} tone="amber" icon={<CircleAlert size={15} strokeWidth={2.4} />} />
          ) : null}
        </div>
      ) : null}

      {grade.corrected_sentences?.length ? (
        <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: "16px 18px" }}>
          <Label>{t("grade.suggested")}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
            {grade.corrected_sentences.map((c, i) => (
              <div key={i} style={{ background: WELL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 13px", fontSize: 14.5, lineHeight: 1.55 }}>
                <div style={{ color: TINT.red.fg, textDecoration: "line-through", textDecorationThickness: 1 }}>{c.original}</div>
                <div style={{ color: TINT.green.fg, marginTop: 4, fontWeight: 600 }}>{c.improved}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p style={{ margin: "2px 2px 0", fontSize: 12, lineHeight: 1.55, color: MUTED }}>{t("grade.cefrNote")}</p>
    </div>
  );
}

/** A chip ON the level panel — white on the brand gradient, in both themes. */
function HeroChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: RADIUS.pill,
        border: "1px solid rgba(255,255,255,.3)",
        background: "rgba(255,255,255,.12)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>{children}</div>;
}

function Bullets({ title, items, tone, icon }: { title: string; items: string[]; tone: "green" | "amber"; icon: React.ReactNode }) {
  return (
    <section style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: "16px 18px" }}>
      <Label>{title}</Label>
      <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 9, fontSize: 14.5, lineHeight: 1.55, color: STRONG }}>
            <span aria-hidden style={{ display: "inline-flex", color: TINT[tone].fg, flex: "none", marginTop: 3 }}>
              {icon}
            </span>
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
