"use client";

import { AlertTriangle, ArrowUp, Lightbulb } from "lucide-react";
import type React from "react";

import { BODY, DISPLAY, INK, LINE, MUTED, PANEL, RADIUS, SANS, STRONG, WELL } from "@/app/_landing/_lib/design";
import { useT } from "@/shared/components/i18n/locale-provider";
import type { PublicTeaser, TeaserCriterion } from "@/lib/public-grader/teaser";
import { TINT, TONE_LINE, TRACK } from "@/lib/theme/tokens";
import { bandColor } from "@/lib/ui/band";

/**
 * An IELTS grade on the free checker: the overall band, a band per criterion,
 * the one criterion holding the rest back, and for each criterion the evidence,
 * what caps it and the fix — the same feedback the signed-in studio gives
 * (lib/public-grader/teaser.ts says what stays behind an account).
 *
 * The criterion NAMES come from the server, already right for the task — Task
 * Achievement on Task 1, Task Response on Task 2 — so nothing here may
 * hardcode them.
 */
export function IeltsResult({ teaser }: { teaser: PublicTeaser }) {
  const t = useT();
  const bc = bandColor(teaser.overallBand);
  const lift = teaser.bandWithFixes > teaser.overallBand ? teaser.bandWithFixes - teaser.overallBand : null;
  const blocker = teaser.criteria.find((c) => c.key === teaser.blocker.criterion);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: SANS }}>
      {/* ---- the summary: overall band beside the four criteria ---- */}
      <section
        style={{
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: RADIUS.card,
          padding: "clamp(18px,2.4vw,26px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "18px 28px",
        }}
      >
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: DISPLAY,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              color: bc.fg,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {teaser.overallBand.toFixed(1)}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>
              {t("grade.overall")}
            </span>
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: 12.5,
                fontWeight: 700,
                color: bc.fg,
                background: bc.bg,
                padding: "3px 10px",
                borderRadius: RADIUS.pill,
                whiteSpace: "nowrap",
              }}
            >
              {bc.label}
            </span>
            {lift ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: TINT.green.fg,
                  background: TINT.green.bg,
                  border: `1px solid ${TONE_LINE.green}`,
                  padding: "3px 10px",
                  borderRadius: RADIUS.pill,
                  whiteSpace: "nowrap",
                }}
              >
                <ArrowUp size={13} strokeWidth={2.6} aria-hidden />
                {t("grade.withFixes", { band: teaser.bandWithFixes.toFixed(1) })}
              </span>
            ) : null}
          </div>
        </div>

        <div
          style={{
            flex: "1 1 420px",
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(140px,100%),1fr))",
            gap: 10,
          }}
        >
          {teaser.criteria.map((c) => (
            <CriterionTile key={c.key} c={c} capping={c.key === teaser.blocker.criterion} />
          ))}
        </div>
      </section>

      {/* ---- the one criterion holding the band back ---- */}
      <section
        style={{
          background: TINT.red.bg,
          border: `1px solid ${TONE_LINE.red}`,
          borderRadius: 18,
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span aria-hidden style={{ display: "inline-flex", color: TINT.red.fg }}>
            <AlertTriangle size={16} strokeWidth={2.4} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: TINT.red.fg }}>
            {t("grade.fixFirst")}
          </span>
          {lift ? (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                fontWeight: 700,
                color: TINT.green.fg,
                background: TINT.green.bg,
                border: `1px solid ${TONE_LINE.green}`,
                padding: "2px 9px",
                borderRadius: RADIUS.pill,
              }}
            >
              {t("grade.plusBand", { n: lift.toFixed(1) })}
            </span>
          ) : null}
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: STRONG }}>
          <strong style={{ color: INK }}>{blocker?.label ?? teaser.blocker.criterion}</strong> — {teaser.blocker.why}
        </p>
      </section>

      {/* ---- per criterion: the evidence, what caps it, the fix ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(420px,100%),1fr))",
          gap: 14,
        }}
      >
        {teaser.criteria.map((c) => (
          <CriterionCard key={c.key} c={c} capping={c.key === teaser.blocker.criterion} />
        ))}
      </div>

      <p style={{ margin: "2px 2px 0", fontSize: 12, lineHeight: 1.55, color: MUTED }}>{teaser.disclaimer}</p>
    </div>
  );
}

/** The verdict a band earns on the tiles and cards — the capping criterion
 *  first, whatever its band, because that is the one to work on. */
function verdict(c: TeaserCriterion, capping: boolean): { key: "grade.tagCapping" | "grade.tagStrong" | "grade.tagSolid" | "grade.tagWork"; tone: "red" | "green" | "neutral" | "amber" } {
  if (capping) return { key: "grade.tagCapping", tone: "red" };
  if (c.band >= 7) return { key: "grade.tagStrong", tone: "green" };
  if (c.band >= 6) return { key: "grade.tagSolid", tone: "neutral" };
  return { key: "grade.tagWork", tone: "amber" };
}

function CriterionTile({ c, capping }: { c: TeaserCriterion; capping: boolean }) {
  const t = useT();
  const v = verdict(c, capping);
  const ink = TINT[v.tone].fg;
  return (
    <div
      style={{
        background: capping ? TINT.red.bg : WELL,
        border: `1px solid ${capping ? TONE_LINE.red : LINE}`,
        borderRadius: 14,
        padding: "11px 13px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: BODY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {c.label}
        </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {c.band.toFixed(1)}
        </span>
      </div>
      <div style={{ marginTop: 9, height: 5, borderRadius: 3, background: TRACK, overflow: "hidden" }}>
        <div style={{ width: `${Math.round((Math.min(9, c.band) / 9) * 100)}%`, height: "100%", borderRadius: 3, background: ink }} />
      </div>
      <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 700, color: ink }}>{t(v.key)}</div>
    </div>
  );
}

function CriterionCard({ c, capping }: { c: TeaserCriterion; capping: boolean }) {
  const t = useT();
  const v = verdict(c, capping);
  return (
    <article
      style={{
        background: PANEL,
        border: `1px solid ${capping ? TONE_LINE.red : LINE}`,
        borderRadius: 18,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 16.5, fontWeight: 600, letterSpacing: "-0.01em", color: INK }}>{c.label}</h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: TINT[v.tone].fg,
              background: TINT[v.tone].bg,
              padding: "2px 9px",
              borderRadius: RADIUS.pill,
            }}
          >
            {t(v.key)}
          </span>
          <span style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
            {c.band.toFixed(1)}
          </span>
        </span>
      </header>
      {c.evidence ? <Detail label={t("grade.evidence")}>{c.evidence}</Detail> : null}
      {c.whatCapsIt ? <Detail label={t("grade.caps")}>{c.whatCapsIt}</Detail> : null}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: "auto",
          padding: "11px 13px",
          background: WELL,
          border: `1px solid ${LINE}`,
          borderRadius: 12,
        }}
      >
        <span aria-hidden style={{ display: "inline-flex", color: TINT.brand.fg, flex: "none", marginTop: 1 }}>
          <Lightbulb size={16} strokeWidth={2} />
        </span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: STRONG }}>
          <strong style={{ color: TINT.brand.fg }}>{t("grade.fix")}:</strong> {c.fix}
        </p>
      </div>
    </article>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>{label}</div>
      <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.6, color: STRONG }}>{children}</p>
    </div>
  );
}
