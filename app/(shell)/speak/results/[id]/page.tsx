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
    .select("id, created_at, audio_path, transcript, metrics, result")
    .eq("id", id)
    .maybeSingle();
  if (!attempt) notFound();

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

  return (
    <div style={{ fontFamily: SANS, maxWidth: 860, margin: "0 auto", padding: "26px 18px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 26, fontWeight: 600 }}>
          Speaking report <span style={{ fontSize: 14, color: "#56556A", fontFamily: SANS }}>· {when}</span>
        </h1>
        <Link href="/speak" style={{ fontSize: 13.5, fontWeight: 700, color: "#4338CA", textDecoration: "none" }}>
          ← Speaking practice
        </Link>
      </div>
      <SpeakingReport
        result={attempt.result as SpeakResult}
        metrics={attempt.metrics as SpeakMetrics}
        transcript={attempt.transcript ?? ""}
        audioUrl={audioUrl}
      />
    </div>
  );
}
