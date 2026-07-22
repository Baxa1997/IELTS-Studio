import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import type { SpeakProgressItem } from "./progress";
import { SpeakingClient } from "./speaking-client";

export const dynamic = "force-dynamic";

interface GradedResult {
  overall_band?: number;
  non_attempt?: boolean;
  criteria?: Record<string, { band?: number }>;
}

function toItem(t: string, kind: "mock" | "practice", r: GradedResult | null): SpeakProgressItem | null {
  if (!r || typeof r.overall_band !== "number" || r.non_attempt) return null;
  const pick = (k: string) => {
    const b = r.criteria?.[k]?.band;
    return typeof b === "number" ? b : undefined;
  };
  return {
    t,
    band: r.overall_band,
    kind,
    crit: { FC: pick("FC"), LR: pick("LR"), GRA: pick("GRA"), P: pick("P") },
  };
}

/**
 * Speaking practice hub (BETA) — Part 2 push-to-talk live; Parts 1 & 3 with a
 * live AI examiner are phase 2 (docs/ielts-speaking-plan.md in the engine
 * repo). Browser-direct engine calls like Listening/CEFR. Students only.
 */
export default async function SpeakPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  // ?card=<library_id> — the revision loop: "practise this card again" from a
  // report deep-links straight into quick practice with that exact cue card.
  const sp = await searchParams;
  const card = typeof sp.card === "string" ? sp.card : null;

  // Progress series: graded mocks + practices, RLS-scoped, oldest→newest.
  const supabase = await createClient();
  const [{ data: mocks }, { data: attempts }, { data: lessons }] = await Promise.all([
    supabase
      .from("speaking_sessions")
      .select("id, started_at, result")
      .eq("mode", "full")
      .eq("state", "graded")
      .order("started_at", { ascending: false })
      .limit(12),
    supabase
      .from("speaking_attempts")
      .select("created_at, result")
      .not("result", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
    // Tutor lessons: practice that is not scored still deserves to be visible,
    // or the work disappears the moment the lesson ends.
    supabase
      .from("speaking_sessions")
      .select("id, started_at, metrics, result")
      .eq("mode", "tutor")
      .order("started_at", { ascending: false })
      .limit(6),
  ]);
  const progress = [
    ...(mocks ?? []).map((m) => toItem(m.started_at as string, "mock", m.result as GradedResult | null)),
    ...(attempts ?? []).map((a) => toItem(a.created_at as string, "practice", a.result as GradedResult | null)),
  ]
    .filter((x): x is SpeakProgressItem => x !== null)
    .sort((a, b) => a.t.localeCompare(b.t))
    .slice(-10);

  // Finished mocks were unreachable from the hub (report links only lived on
  // the ended screen) — a graded 6.0 sat invisible until the user asked.
  const recentMocks = (mocks ?? [])
    .map((m) => {
      const r = m.result as GradedResult | null;
      return r && typeof r.overall_band === "number"
        ? { id: m.id as string, t: m.started_at as string, band: r.overall_band }
        : null;
    })
    .filter((x): x is { id: string; t: string; band: number } => x !== null)
    .slice(0, 5);

  const recentLessons = (lessons ?? [])
    .map((l) => {
      const m = (l.metrics ?? {}) as { minutes?: number; corrections?: number };
      const r = (l.result ?? {}) as { headline?: string };
      return {
        id: l.id as string,
        t: l.started_at as string,
        minutes: typeof m.minutes === "number" ? m.minutes : 0,
        corrections: typeof m.corrections === "number" ? m.corrections : 0,
        headline: typeof r.headline === "string" ? r.headline : "",
      };
    })
    .filter((l) => l.minutes > 0.2);   // hide instantly-abandoned connections

  return (
    <SpeakingClient
      initialCardId={card}
      progress={progress}
      recentMocks={recentMocks}
      recentLessons={recentLessons}
    />
  );
}
