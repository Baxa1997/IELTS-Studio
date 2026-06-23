"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { CEFR, CEFR_LEVELS, type CefrLevel } from "@/lib/cefr/levels";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";

/**
 * CEFR Reading launcher — choose a level, generate one short level-graded passage,
 * then drop into the shared reader. Generation is two model calls on a short text,
 * so it's ~30–50s — shown explicitly.
 */
export function CefrReading({ initialLevel }: { initialLevel: CefrLevel }) {
  const router = useRouter();
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const info = CEFR[level];

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cefr/reading/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (res.ok && body.id) {
        router.push(`/read/${body.id}`); // keep the spinner until navigation
        return;
      }
      setError(body.message ?? "Couldn't generate a CEFR reading. Please try again.");
      setLoading(false);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 760 }}>
      <Link href="/cefr" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 14, fontWeight: 600, color: MUTED }}>
        <ArrowLeft size={15} /> CEFR practice
      </Link>

      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,2.6vw,32px)", margin: "14px 0 0", letterSpacing: "-.01em" }}>CEFR Reading</h1>
      <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 0", maxWidth: 600, lineHeight: 1.55 }}>
        Pick your level and generate a short, level-graded passage with comprehension questions — marked instantly and reported as a CEFR level.
      </p>

      {/* Level tabs */}
      <div style={{ display: "flex", gap: 7, marginTop: 22, flexWrap: "wrap" }}>
        {CEFR_LEVELS.map((l) => {
          const on = l === level;
          const li = CEFR[l];
          return (
            <button key={l} type="button" onClick={() => setLevel(l)} disabled={loading} aria-pressed={on} style={{ padding: "9px 16px", borderRadius: 10, cursor: loading ? "default" : "pointer", fontFamily: SANS, fontWeight: 700, fontSize: 14.5, background: on ? li.bg : "#fff", color: on ? li.color : "#6E7388", border: `1.5px solid ${on ? li.color : "#E7E3D5"}` }}>
              {l}
            </button>
          );
        })}
      </div>

      {/* Selected level card */}
      <div style={{ marginTop: 18, padding: "18px 20px", background: "#fff", border: "1px solid #E7E3D5", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, color: info.color, lineHeight: 1 }}>{info.code}</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15.5, color: INK }}>{info.name} <span style={{ fontWeight: 600, color: MUTED }}>· {info.ieltsApprox}</span></p>
            <p style={{ margin: "3px 0 0", fontSize: 13.5, color: MUTED }}>~{info.readingWords}-word passage · 6 questions</p>
          </div>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55, color: "#41496A" }}>{info.readingCan}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
        <button type="button" onClick={() => void generate()} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 9, height: 48, padding: "0 22px", border: "none", borderRadius: 12, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 15.5, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.75 : 1, boxShadow: "0 12px 24px -12px rgba(59,67,181,.8)" }}>
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Generating… ~40s
            </>
          ) : (
            <>
              <Sparkles size={17} /> Generate a CEFR reading
            </>
          )}
        </button>
        {loading ? <span style={{ fontSize: 13, color: MUTED }}>Writing an original {info.code} passage — hang tight, don&rsquo;t close this tab.</span> : null}
      </div>

      {error ? <p role="alert" style={{ marginTop: 14, fontSize: 13.5, color: "#c2410c" }}>{error}</p> : null}

      <p style={{ margin: "28px 0 0", fontSize: 12, lineHeight: 1.5, color: "#9A99A8", maxWidth: 640 }}>
        Original passages in CEFR style. An indicative CEFR level from one passage, not an official certificate or IELTS® score. Not affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}
