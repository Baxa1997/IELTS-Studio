"use client";

import { useState, useTransition } from "react";

import { setTargetBand } from "@/app/(app)/dashboard/actions";
import { MAX_TARGET_BAND, MIN_TARGET_BAND, SKILL_LABELS, type SkillEstimateView } from "@/lib/estimates/compute";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";
const MUTED = "#8a897c";

const TARGET_OPTIONS: number[] = [];
for (let b = MIN_TARGET_BAND; b <= MAX_TARGET_BAND; b += 0.5) TARGET_OPTIONS.push(b);

/**
 * "Current band → target" for one skill (Option A, dashboard). Current/baseline
 * bands are read-only (server-owned, conservative); the student edits only the
 * target, which saves through the setTargetBand action.
 */
export function BandCard({ estimate }: { estimate: SkillEstimateView }) {
  const { skill, currentBand, baselineBand, sampleCount } = estimate;
  const [target, setTarget] = useState(estimate.targetBand);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onTargetChange(value: number) {
    const previous = target;
    setTarget(value); // optimistic
    setError(null);
    startTransition(async () => {
      const res = await setTargetBand(skill, value);
      if (res.error) {
        setTarget(previous);
        setError(res.error);
      }
    });
  }

  const measured = currentBand != null;
  const base = baselineBand ?? currentBand;
  const span = base != null ? target - base : 0;
  const fill = !measured ? 0.06 : span <= 0 ? 1 : clamp01((currentBand - (base ?? 0)) / span);
  const delta = measured && base != null ? Math.round((currentBand - base) * 10) / 10 : 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#EBECFA", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SkillIcon skill={skill} />
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: INK }}>{SKILL_LABELS[skill]}</span>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontWeight: 500, fontSize: 13, color: MUTED }}>
          target
          <select
            value={target}
            disabled={pending}
            onChange={(e) => onTargetChange(Number(e.target.value))}
            aria-label={`${SKILL_LABELS[skill]} target band`}
            style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: INK, background: "#F4F4FB", border: "1px solid #E0E1F4", padding: "4px 10px", borderRadius: 8, cursor: pending ? "default" : "pointer", fontVariantNumeric: "tabular-nums" }}
          >
            {TARGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b.toFixed(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 12 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, lineHeight: 1, color: measured ? INDIGO : "#bdbcae", fontVariantNumeric: "tabular-nums" }}>
          {measured ? currentBand.toFixed(1) : "—"}
        </span>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: MUTED, paddingBottom: 6 }}>→ target {target.toFixed(1)}</span>
      </div>

      <div style={{ height: 7, background: "#EFEEE2", borderRadius: 999, overflow: "hidden", marginTop: 12 }} aria-hidden>
        <div style={{ width: `${Math.round(fill * 100)}%`, height: "100%", background: measured ? INDIGO : "#cfcebf", borderRadius: 999 }} />
      </div>

      <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, color: MUTED, marginTop: 10 }}>
        {!measured ? (
          "Not yet measured — take the entry diagnostic."
        ) : (
          <>
            From {base?.toFixed(1)} baseline
            {delta > 0 ? <span style={{ color: "#2f8f5b" }}> · +{delta.toFixed(1)}</span> : null}
            {` · ${sampleCount} ${sampleCount === 1 ? "submission" : "submissions"}`}
          </>
        )}
      </div>

      {error ? (
        <p style={{ fontFamily: SANS, fontSize: 12, color: "#c2410c", margin: "6px 0 0" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SkillIcon({ skill }: { skill: string }) {
  if (skill === "reading") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
