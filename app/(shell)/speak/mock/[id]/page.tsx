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
const MUTED = "#56556A";
const LINE = "#E8E6F0";
const INDIGO = "#4338CA";

interface Turn {
  role: "examiner" | "candidate";
  part: number;
  text: string;
}

/**
 * One live full-mock report. Ownership is enforced by RLS (the user-scoped
 * select returns nothing for foreign sessions); only then does the admin client
 * sign the private candidate audio. The turn-by-turn transcript is flattened to
 * dialogue for the shared SpeakingReport, and the per-part examiner notes (a
 * full-mock-only field) render above it.
 */
export default async function MockResultPage({ params }: PageProps) {
  const { id } = await params;
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("speaking_sessions")
    .select("id, started_at, state, candidate_audio_path, transcript, metrics, result")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();

  let audioUrl: string | null = null;
  if (s.candidate_audio_path) {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("speaking-audio")
      .createSignedUrl(s.candidate_audio_path, 6 * 3600);
    audioUrl = data?.signedUrl ?? null;
  }

  const turns = (Array.isArray(s.transcript) ? s.transcript : []) as Turn[];
  const dialogue = turns
    .map((t) => `${t.role === "examiner" ? "Examiner" : "You"}: ${t.text.trim()}`)
    .join("\n\n");

  const result = (s.result ?? {}) as SpeakResult & { part_notes?: Record<string, string> };
  const partNotes = result.part_notes ?? {};

  const when = new Date(s.started_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ fontFamily: SANS, maxWidth: 860, margin: "0 auto", padding: "26px 18px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 26, fontWeight: 600 }}>
          Full mock report <span style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>· {when}</span>
        </h1>
        <Link href="/speak" style={{ fontSize: 13.5, fontWeight: 700, color: INDIGO, textDecoration: "none" }}>
          ← Speaking
        </Link>
      </div>

      {Object.keys(partNotes).length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
          {(["1", "2", "3"] as const).map((p) =>
            partNotes[p] ? (
              <div key={p} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: INDIGO }}>PART {p}</div>
                <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#3A3950" }}>{partNotes[p]}</p>
              </div>
            ) : null,
          )}
        </div>
      ) : null}

      <SpeakingReport
        result={result}
        metrics={(s.metrics ?? {}) as SpeakMetrics}
        transcript={dialogue}
        audioUrl={audioUrl}
      />
    </div>
  );
}
