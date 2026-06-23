import Link from "next/link";

import { bandColor } from "@/lib/ui/band";
import type { SkillEstimateView } from "@/lib/estimates/compute";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1A1C33";

/**
 * The encouraging writing hero on the dashboard. Leans on the product's actual
 * moat — an honest, conservative grader — instead of generic "practice now" copy.
 * Shows the learner's real writing band (or invites a first honest read), then two
 * clear CTAs: get graded, or start a fresh AI-generated topic. Server component:
 * the band is read-only and passed down (no model call here).
 */
export function WritingHero({ estimate, firstName }: { estimate: SkillEstimateView; firstName: string | null }) {
  const measured = estimate.currentBand != null && estimate.sampleCount > 0;
  const band = estimate.currentBand ?? 0;
  const tier = bandColor(band);
  const target = estimate.targetBand;
  const gap = measured ? Math.round((target - band) * 10) / 10 : 0;

  const headline = measured
    ? `You're at Band ${band.toFixed(1)} in Writing`
    : firstName
      ? `${firstName}, find out your real writing band`
      : "Find out your real writing band";

  const sub = measured
    ? gap > 0
      ? `That's an honest, conservative read — not an inflated one. The fastest way to ${target.toFixed(1)} is one focused essay graded line by line, with the single fix that lifts you most.`
      : `You're already at your target — keep it sharp. Write one more under timed conditions and we'll mark it exactly like the real exam.`
    : "Most apps hand out a flattering 7.0. We grade like a strict examiner — criterion by criterion, rounding down when it's borderline — so your number actually holds up on test day. Write one essay and see where you really stand.";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: 16,
        background: "linear-gradient(120deg,#23264D 0%,#3B43B5 62%,#5158C8 100%)",
        borderRadius: 18,
        padding: "26px 28px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 26,
      }}
    >
      {/* soft glow */}
      <div aria-hidden style={{ position: "absolute", top: -90, right: -40, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.16),transparent 62%)" }} />

      {/* left: band + copy */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, flex: "1 1 460px", minWidth: 280 }}>
        {/* band chip */}
        <div style={{ flex: "none", width: 96, height: 96, borderRadius: 18, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.22)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: measured ? 40 : 34, lineHeight: 1, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {measured ? band.toFixed(1) : "?"}
          </span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "rgba(255,255,255,.7)", marginTop: 5 }}>
            {measured ? tier.label : "no band yet"}
          </span>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".11em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9FE6BE" }} />
            Honest writing feedback
          </div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(20px,2.3vw,26px)", lineHeight: 1.12, letterSpacing: "-.015em", color: "#fff", margin: "9px 0 0" }}>
            {headline}
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.55, color: "rgba(255,255,255,.84)", margin: "8px 0 0", maxWidth: 540 }}>
            {sub}
          </p>
        </div>
      </div>

      {/* right: CTAs */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10, flex: "none" }}>
        <Link
          href="/write"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "#fff", color: INK, fontFamily: SANS, fontWeight: 700, fontSize: 15, padding: "13px 22px", borderRadius: 12, textDecoration: "none", boxShadow: "0 14px 30px -14px rgba(0,0,0,.55)", whiteSpace: "nowrap" }}
        >
          {measured ? "Check another essay" : "Check my writing"}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
        <Link
          href="/write"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(255,255,255,.08)", color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "12px 22px", borderRadius: 12, border: "1px solid rgba(255,255,255,.28)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5z" /></svg>
          Practice a fresh AI topic
        </Link>
      </div>
    </div>
  );
}
