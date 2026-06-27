"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { setTargetBand } from "@/app/(app)/dashboard/actions";
import {
  MAX_TARGET_BAND,
  MIN_TARGET_BAND,
  SKILL_LABELS,
  type SkillEstimateView,
} from "@/lib/estimates/compute";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const TRACK = "#E7E7F2";

const TARGET_OPTIONS: number[] = [];
for (let b = MIN_TARGET_BAND; b <= MAX_TARGET_BAND; b += 0.5) TARGET_OPTIONS.push(b);

interface Accent {
  /** ring + number + bar fill */
  color: string;
  /** icon chip background */
  soft: string;
  /** icon chip + button border */
  softBorder: string;
  /** faint target arc + target bar fill */
  track: string;
  /** Where "Start diagnostic" sends an unmeasured skill — doing a task IS the diagnostic. */
  href: string;
}

const ACCENTS: Record<string, Accent> = {
  reading: { color: "#3B43B5", soft: "#EBECFA", softBorder: "#E0E1F4", track: "#C7CBF0", href: "/read" },
  writing: { color: "#B9791A", soft: "#FFF3E0", softBorder: "#F6E0B8", track: "#EBCF9E", href: "/write" },
};

/**
 * "Current band → target" card for the study-plan page: a dual-arc progress ring
 * (current + target), two comparison bars and the baseline trend — or a dashed
 * "no data" ring with a diagnostic CTA when the skill isn't measured yet. The
 * target is learner-editable (server-owned bands are read-only); changing it saves
 * through setTargetBand, optimistically. Light-mode, matching the app shell.
 */
export function PlanBandCard({ estimate }: { estimate: SkillEstimateView }) {
  const { skill, currentBand, baselineBand, sampleCount } = estimate;
  const a = ACCENTS[skill] ?? ACCENTS.reading;
  const [target, setTarget] = useState(estimate.targetBand);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onTargetChange(value: number) {
    const prev = target;
    setTarget(value); // optimistic
    setError(null);
    startTransition(async () => {
      const res = await setTargetBand(skill, value);
      if (res.error) {
        setTarget(prev);
        setError(res.error);
      }
    });
  }

  const measured = currentBand != null;
  const base = baselineBand ?? currentBand;
  const delta = measured && base != null ? Math.round((currentBand - base) * 10) / 10 : 0;

  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "clamp(20px,2.4vw,26px)" }}>
      {/* header: skill + editable target */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: a.soft, border: `1px solid ${a.softBorder}`, color: a.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SkillIcon skill={skill} />
          </span>
          <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: INK }}>{SKILL_LABELS[skill]}</span>
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

      {/* body: ring + detail */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {measured ? <BandRing current={currentBand} target={target} accent={a} /> : <EmptyRing accent={a} />}

        <div style={{ flex: 1, minWidth: 0 }}>
          {measured ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: INK, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{currentBand.toFixed(1)}</span>
                <Arrow />
                <span style={{ fontFamily: SANS, fontSize: 13.5, color: a.color, fontWeight: 700 }}>target {target.toFixed(1)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <Bar pct={currentBand / 9} fill={a.color} />
                <Bar pct={target / 9} fill={a.track} />
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>
                From {base?.toFixed(1)} baseline
                {delta > 0 ? <span style={{ color: "#2f8f5b" }}> · +{delta.toFixed(1)}</span> : null}
                {` · ${sampleCount} ${sampleCount === 1 ? "submission" : "submissions"}`}
              </div>
            </>
          ) : (
            <>
              <p style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, margin: "0 0 14px", lineHeight: 1.6 }}>
                Not yet measured — do a {SKILL_LABELS[skill].toLowerCase()} task to unlock your baseline.
              </p>
              <div style={{ height: 6, borderRadius: 999, background: TRACK, marginBottom: 16 }} aria-hidden />
              <Link
                href={a.href}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: `1px solid ${a.softBorder}`, background: a.soft, color: a.color, fontFamily: SANS, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
              >
                Start diagnostic
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                  <path d="M1 6.5H12M12 6.5L7.5 2M12 6.5L7.5 11" stroke={a.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p style={{ fontFamily: SANS, fontSize: 12, color: "#c2410c", margin: "12px 0 0" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function BandRing({ current, target, accent }: { current: number; target: number; accent: Accent }) {
  const C = 2 * Math.PI * 42; // r=42
  const off = (f: number) => C * (1 - Math.max(0, Math.min(1, f)));
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden>
        <circle cx="54" cy="54" r="42" fill="none" stroke={TRACK} strokeWidth="8" />
        <circle cx="54" cy="54" r="42" fill="none" stroke={accent.track} strokeWidth="8" strokeDasharray={C} strokeDashoffset={off(target / 9)} strokeLinecap="round" transform="rotate(-90 54 54)" />
        <circle cx="54" cy="54" r="42" fill="none" stroke={accent.color} strokeWidth="8" strokeDasharray={C} strokeDashoffset={off(current / 9)} strokeLinecap="round" transform="rotate(-90 54 54)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: accent.color, lineHeight: 1 }}>{current.toFixed(1)}</span>
        <span style={{ fontFamily: SANS, fontSize: 10, color: FAINT, fontWeight: 600 }}>/ 9.0</span>
      </div>
    </div>
  );
}

function EmptyRing({ accent }: { accent: Accent }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden>
        <circle cx="54" cy="54" r="42" fill="none" stroke={TRACK} strokeWidth="8" />
        <circle cx="54" cy="54" r="42" fill="none" stroke={accent.track} strokeWidth="8" strokeDasharray="9 11" strokeLinecap="round" transform="rotate(-90 54 54)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M11 5v7M11 15v2" stroke="#C7C9D4" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: SANS, fontSize: 9, color: FAINT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>No data</span>
      </div>
    </div>
  );
}

function Bar({ pct, fill }: { pct: number; fill: string }) {
  return (
    <div style={{ height: 6, borderRadius: 999, background: TRACK, overflow: "hidden" }} aria-hidden>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, pct)) * 100}%`, borderRadius: 999, background: fill }} />
    </div>
  );
}

function Arrow() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
      <path d="M1 5.5H15M15 5.5L10 1M15 5.5L10 10" stroke={FAINT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkillIcon({ skill }: { skill: string }) {
  if (skill === "reading") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
