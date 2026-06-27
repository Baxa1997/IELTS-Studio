"use client";

import { Loader2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

const SANS = "var(--font-hanken), system-ui, sans-serif";

/**
 * The signature "AI generate" section — an aurora-gradient banner with drifting
 * orbs, floating sparkles, a haloed glassmorphism icon, an optional live badge and
 * a white shimmer CTA. Imported from the Claude Design `AI Section.dc.html` and used
 * for every AI-generation surface (writing topic, reading passage/test, …).
 *
 * Robustness note: the dark gradient + clipping are set INLINE (not via the class)
 * so the surface can never render as a transparent/white box if the stylesheet is
 * cascaded over or loads late. The `.aib-card` class only drives the aurora
 * animation; `.aib-*` keyframes + reduced-motion live in globals.css.
 */
export const AI_AURORA_GRADIENT =
  "linear-gradient(130deg,#1e1b4b 0%,#3730a3 18%,#5b21b6 42%,#7c3aed 62%,#4338ca 82%,#1e1b4b 100%)";

function Spark({ size, fill, style }: { size: number; fill: string; style: CSSProperties }) {
  return (
    <svg
      style={{ position: "absolute", pointerEvents: "none", ...style }}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path d="M5 0L6.1 3.9L10 5L6.1 6.1L5 10L3.9 6.1L0 5L3.9 3.9Z" fill={fill} />
    </svg>
  );
}

export function AiGenerateSection({
  title,
  badge,
  description,
  cta,
  gradient = AI_AURORA_GRADIENT,
  icon,
  style,
}: {
  title: string;
  /** Optional pill text shown beside the title with a live green dot. */
  badge?: string;
  description: string;
  /** The action(s) on the right — typically <AiGenerateButton />. */
  cta: ReactNode;
  /** Override the aurora (e.g. a CEFR level colour). Defaults to the design indigo. */
  gradient?: string;
  /** Override the glass-card icon (defaults to a sparkle). */
  icon?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className="aib-card"
      style={{
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        minHeight: 68,
        flexWrap: "wrap",
        // Inline so the dark surface is guaranteed; use backgroundImage (not the
        // `background` shorthand) so backgroundSize sticks for the aurora sweep.
        backgroundImage: gradient,
        backgroundSize: "320% 320%",
        ...style,
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.48) 0%,transparent 58%)", animation: "aib-orb-a 10s ease infinite" }} />
        <div style={{ position: "absolute", bottom: -90, left: "38%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.28) 0%,transparent 58%)", animation: "aib-orb-b 13s ease infinite 2.5s" }} />
        <div style={{ position: "absolute", top: -55, right: 80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.32) 0%,transparent 58%)", animation: "aib-orb-c 7.5s ease infinite 1.2s" }} />
      </div>

      {/* Floating sparkles */}
      <Spark size={11} fill="rgba(255,255,255,0.55)" style={{ top: "22%", left: "26%", animation: "aib-spark-a 3.6s ease infinite" }} />
      <Spark size={7} fill="rgba(255,255,255,0.4)" style={{ top: "58%", left: "50%", animation: "aib-spark-b 4.3s ease infinite 1.2s" }} />
      <Spark size={9} fill="rgba(255,255,255,0.45)" style={{ top: "28%", right: "30%", animation: "aib-spark-c 3.9s ease infinite 0.6s" }} />
      <Spark size={6} fill="rgba(255,255,255,0.38)" style={{ bottom: "22%", left: "17%", animation: "aib-spark-a 5.1s ease infinite 2.1s" }} />
      <Spark size={8} fill="rgba(255,255,255,0.32)" style={{ bottom: "32%", right: "22%", animation: "aib-spark-b 4.7s ease infinite 3.3s" }} />

      {/* Left: haloed icon + text */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 220, position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative", flexShrink: 0, width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: -8, borderRadius: 20, background: "rgba(139,92,246,0.35)", animation: "aib-glow 2.6s ease infinite" }} />
          <div style={{ position: "absolute", inset: -3, borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.22)", animation: "aib-ring-spin 5.5s linear infinite" }}>
            <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 7, height: 7, borderRadius: "50%", background: "white", boxShadow: "0 0 10px 3px rgba(255,255,255,0.85)" }} />
          </div>
          <div style={{ position: "absolute", inset: 2, borderRadius: 13, border: "1px dashed rgba(255,255,255,0.14)", animation: "aib-ring-spin 9s linear infinite reverse" }} />
          <div style={{ position: "relative", width: 48, height: 48, borderRadius: 15, background: "rgba(255,255,255,0.13)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.22)" }}>
            {icon ?? (
              <svg width="22" height="22" viewBox="0 0 30 30" fill="none" aria-hidden>
                <path d="M15 1L17.8 12.2L29 15L17.8 17.8L15 29L12.2 17.8L1 15L12.2 12.2L15 1Z" fill="white" />
              </svg>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SANS, fontSize: 17, fontWeight: 800, color: "white", letterSpacing: "-0.3px", lineHeight: 1.2 }}>{title}</span>
            {badge ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "3px 9px 3px 7px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.85)", animation: "aib-live-dot 2s ease infinite", flexShrink: 0 }} />
                <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>{badge}</span>
              </span>
            ) : null}
          </div>
          <p style={{ fontFamily: SANS, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 400, margin: 0, lineHeight: 1.5, maxWidth: 440 }}>{description}</p>
        </div>
      </div>

      {/* Right: CTA slot */}
      <div style={{ position: "relative", flexShrink: 0, zIndex: 1 }}>{cta}</div>
    </div>
  );
}

/**
 * The white shimmer CTA used inside <AiGenerateSection>. Self-contained presentational
 * button — the caller owns the click + state. Shows a spinner + `busyLabel` while
 * `generating`, and is disabled while `busy`.
 */
export function AiGenerateButton({
  label,
  busyLabel = "Generating…",
  busy = false,
  generating = false,
  onClick,
  color = "#3730a3",
  minWidth,
}: {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  generating?: boolean;
  onClick: () => void;
  /** Icon/text colour on the white pill (defaults to the design indigo). */
  color?: string;
  /** Reserve width so swapping label↔busyLabel doesn't shift the button. */
  minWidth?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="aib-cta"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "10px 18px",
        borderRadius: 12,
        background: "white",
        border: "none",
        cursor: busy ? "default" : "pointer",
        fontFamily: SANS,
        fontSize: 14,
        fontWeight: 700,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        whiteSpace: "nowrap",
        minWidth,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25),0 2px 6px rgba(0,0,0,0.12)",
        opacity: busy ? 0.85 : 1,
      }}
    >
      {generating ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{busyLabel}</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 0L9.6 6.4L16 8L9.6 9.6L8 16L6.4 9.6L0 8L6.4 6.4L8 0Z" fill={color} />
          </svg>
          <span>{label}</span>
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden>
            <path d="M2 7.5H13M13 7.5L8.5 3M13 7.5L8.5 12" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "45%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)", animation: "aib-shimmer 3.8s ease infinite 1s", pointerEvents: "none" }} />
        </>
      )}
    </button>
  );
}
