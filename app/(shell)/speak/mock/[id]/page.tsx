import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { CoachChat } from "../../coach-chat";
import { ListenBack, type LBTurn } from "../../listen-back";
import { SpeakingReport, type SpeakMetrics, type SpeakResult } from "../../report";
import { AwaitingGrade } from "./awaiting-grade";
import { UngradedMock } from "./ungraded";

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
  t_ms?: number;
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
  // The synced player needs timestamps; older sessions may predate t_ms.
  // "The turn-by-turn transcript is already on this page" — which now depends on
  // TIMESTAMPS alone, not on audio. Left tied to audio it would print the whole
  // dialogue a second time underneath the block that just showed it.
  const synced = turns.some((t) => typeof t.t_ms === "number");

  const result = (s.result ?? {}) as SpeakResult & {
    part_notes?: Record<string, string>;
    notes?: string;
  };
  // The exam sends the learner straight here now, so every no-band case is a
  // screen someone actually lands on — and there are two of them, not one.
  //
  //   still working  (live | grading)      → the marking state, which polls
  //   terminal, no band (failed|abandoned| → say so; it will never arrive
  //                      pending)
  //
  // Getting this wrong was live: `failed` fell through to the report and threw
  // on `overall_band.toFixed(1)`, and `abandoned` sat on a spinner forever.
  if (typeof result.overall_band !== "number") {
    const terminal = ["failed", "abandoned", "pending"].includes(String(s.state));
    return terminal
      ? <UngradedMock state={String(s.state)} />
      : <AwaitingGrade sessionId={s.id as string} />;
  }
  const partNotes = result.part_notes ?? {};
  const prepNotes = typeof result.notes === "string" ? result.notes.trim() : "";
  const metrics = (s.metrics ?? {}) as SpeakMetrics & { part_s?: Record<string, number> };

  const when = new Date(s.started_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ fontFamily: SANS, maxWidth: 1280, margin: "0 auto", padding: "26px clamp(18px, 5vw, 64px) 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 26, fontWeight: 600 }}>
          Full mock report <span style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>· {when}</span>
        </h1>
        <Link href="/speak" style={{ fontSize: 13.5, fontWeight: 700, color: INDIGO, textDecoration: "none" }}>
          ← Speaking
        </Link>
      </div>

      {/* THE BAND FIRST. It was below the part notes and the whole Listen Back
          player, so the one number the candidate came for sat under a fold of
          detail they had not asked for yet. */}
      <SpeakingReport
        result={result}
        metrics={metrics}
        transcript={synced ? "" : dialogue}
        audioUrl={synced ? null : audioUrl}
      />

      {Object.keys(partNotes).length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, margin: "14px 0" }}>
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

      {/* Rendered on TIMESTAMPS, not on audio. Session recording is off engine-
          side (live.SAVE_AUDIO) because the saved track could not be played
          back — but the turn-by-turn transcript and its rewrites never depended
          on the audio, and gating them behind it silently dropped both to a
          flat wall of dialogue. With a URL this is a player; without one it is
          the transcript. */}
      {turns.some((t) => typeof t.t_ms === "number") ? (
        <ListenBack
          audioUrl={audioUrl}
          turns={turns as LBTurn[]}
          partS={metrics.part_s}
          upgrades={result.upgrades ?? []}
        />
      ) : null}

      {prepNotes ? (
        <details
          style={{
            background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14,
            padding: "13px 16px", marginBottom: 14, cursor: "pointer",
          }}
        >
          <summary style={{ fontWeight: 700, fontSize: 13.5 }}>
            Your prep-minute notes
            <span style={{ fontWeight: 500, color: MUTED }}> · compare them with what you actually said</span>
          </summary>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.65, color: "#3A3950", whiteSpace: "pre-wrap" }}>
            {prepNotes}
          </p>
        </details>
      ) : null}

      {s.state === "graded" ? <CoachChat sessionId={s.id} /> : null}
    </div>
  );
}
