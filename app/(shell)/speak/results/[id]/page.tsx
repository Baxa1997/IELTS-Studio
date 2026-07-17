import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { SpeakingReport, type SpeakMetrics, type SpeakResult } from "../../report";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

/**
 * One speaking attempt's full report. Ownership is enforced by RLS (the
 * user-scoped select returns nothing for foreign rows); only after that does
 * the admin client sign the private audio for playback.
 */
export default async function SpeakResultPage({ params }: PageProps) {
  const { id } = await params;
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("speaking_attempts")
    .select("id, created_at, library_id, audio_path, transcript, metrics, result")
    .eq("id", id)
    .maybeSingle();
  if (!attempt) notFound();

  // REVISION LOOP: the previous graded attempt on the SAME card (RLS keeps it
  // to this student). If it exists, the report opens with a delivery-vs-
  // delivery comparison — the coached-redo experience score-and-move-on tools
  // don't have.
  type PrevAttempt = { created_at: string; result: SpeakResult; metrics: SpeakMetrics };
  let prev: PrevAttempt | null = null;
  if (attempt.library_id) {
    const { data } = await supabase
      .from("speaking_attempts")
      .select("created_at, result, metrics")
      .eq("library_id", attempt.library_id)
      .neq("id", id)
      .not("result", "is", null)
      .lt("created_at", attempt.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    prev = (data as PrevAttempt | null) ?? null;
  }

  let audioUrl: string | null = null;
  if (attempt.audio_path) {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("speaking-audio")
      .createSignedUrl(attempt.audio_path, 6 * 3600);
    audioUrl = data?.signedUrl ?? null;
  }

  const when = new Date(attempt.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const result = attempt.result as SpeakResult;
  const metrics = attempt.metrics as SpeakMetrics;

  return (
    <div style={{ fontFamily: SANS, maxWidth: 860, margin: "0 auto", padding: "26px 18px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 26, fontWeight: 600 }}>
          Speaking report <span style={{ fontSize: 14, color: "#56556A", fontFamily: SANS }}>· {when}</span>
        </h1>
        <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
          {attempt.library_id ? (
            <Link
              href={`/speak?card=${attempt.library_id}`}
              style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", background: "#4338CA", borderRadius: 999, padding: "8px 16px", textDecoration: "none" }}
            >
              Practise this card again →
            </Link>
          ) : null}
          <Link href="/speak" style={{ fontSize: 13.5, fontWeight: 700, color: "#4338CA", textDecoration: "none" }}>
            ← Speaking practice
          </Link>
        </div>
      </div>

      {prev?.result ? <RevisionStrip now={result} nowM={metrics} prev={prev.result} prevM={prev.metrics} prevWhen={prev.created_at} /> : null}

      <SpeakingReport result={result} metrics={metrics} transcript={attempt.transcript ?? ""} audioUrl={audioUrl} />
    </div>
  );
}

/** The revision loop's payoff: this delivery vs the previous one on the same card. */
function RevisionStrip({
  now,
  nowM,
  prev,
  prevM,
  prevWhen,
}: {
  now: SpeakResult;
  nowM: SpeakMetrics;
  prev: SpeakResult;
  prevM: SpeakMetrics;
  prevWhen: string;
}) {
  const d = now.overall_band - prev.overall_band;
  const up = d > 0;
  const same = d === 0;
  const when = new Date(prevWhen).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const crits = (["FC", "LR", "GRA"] as const).filter((k) => now.criteria?.[k] && prev.criteria?.[k]);
  const chip = (label: string, delta: number, suffix = "") => (
    <span
      key={label}
      style={{
        fontSize: 12.5,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 11px",
        background: delta > 0 ? "#E7F7EE" : delta < 0 ? "#FCEEEA" : "#F2F1F8",
        color: delta > 0 ? "#15803D" : delta < 0 ? "#C2410C" : "#56556A",
        border: `1px solid ${delta > 0 ? "#CFE7DA" : delta < 0 ? "#F3CFC6" : "#E4E2EF"}`,
      }}
    >
      {label} {delta > 0 ? "+" : ""}{delta.toFixed(1).replace(/\.0$/, "")}{suffix}
    </span>
  );
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #E8E6F0",
        borderRadius: 16,
        padding: "15px 18px",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", color: "#4338CA" }}>
          SECOND DELIVERY · vs {when}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: up ? "#15803D" : same ? "#56556A" : "#C2410C" }}>
          {prev.overall_band.toFixed(1)} → {now.overall_band.toFixed(1)}
          {up ? " — better" : same ? " — level" : " — lower this time"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {crits.map((k) => chip(k, now.criteria[k].band - prev.criteria[k].band))}
        {typeof nowM.wpm === "number" && typeof prevM.wpm === "number"
          ? chip("pace", nowM.wpm - prevM.wpm, " wpm")
          : null}
        {typeof nowM.fillers === "number" && typeof prevM.fillers === "number"
          ? chip("fillers", -(prevM.fillers - nowM.fillers) === 0 ? 0 : nowM.fillers - prevM.fillers)
          : null}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#56556A" }}>
        Same cue card, two deliveries — this is how examiners hear progress. Fewer fillers and a
        steadier pace matter as much as the band itself.
      </p>
    </section>
  );
}
