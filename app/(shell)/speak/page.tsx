import { redirect } from "next/navigation";

import { AssignedHub } from "@/components/assignments/assigned-hub";
import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";
import { type OrgPlan, planTier } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

import type { SpeakProgressItem } from "./progress";
import { SpeakingClient } from "./speaking-client";

export const dynamic = "force-dynamic";

interface GradedResult {
  overall_band?: number;
  non_attempt?: boolean;
  criteria?: Record<string, { band?: number }>;
}

function toItem(
  t: string,
  kind: "mock" | "practice",
  r: GradedResult | null,
): SpeakProgressItem | null {
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
 * Speaking practice hub — Part 2 push-to-talk practice, the full 3-part live
 * mock with an AI examiner, and the tutor lesson (docs/ielts-speaking-plan.md in
 * the engine repo). Browser-direct engine calls like Listening/CEFR. Students only.
 */
export default async function SpeakPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOrgUser();
  // A center student gets this skill's homework here, not a library and
  // not a redirect: "Speaking" in the menu should open Speaking and
  // show what they owe. Generating is a teaching decision for them.
  // Speaking has no assignment kind — `assignments.kind` is writing | reading |
  // listening, so there is literally nothing a teacher can set here yet. The
  // empty state says so rather than the page pretending to be a filter.
  if (isHomeworkOnlyStudent(profile)) return <AssignedHub skill="speaking" assignments={[]} />;
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
      .select("id, started_at, metrics, result")
      .eq("student_id", profile.id)
      .eq("mode", "full")
      .eq("state", "graded")
      .order("started_at", { ascending: false })
      .limit(12),
    supabase
      .from("speaking_attempts")
      .select("created_at, result")
      .eq("student_id", profile.id)
      .not("result", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
    // Tutor lessons: practice that is not scored still deserves to be visible,
    // or the work disappears the moment the lesson ends.
    supabase
      .from("speaking_sessions")
      .select("id, started_at, metrics, result")
      .eq("student_id", profile.id)
      .eq("mode", "tutor")
      .order("started_at", { ascending: false })
      .limit(6),
  ]);
  const progress = [
    ...(mocks ?? []).map((m) =>
      toItem(m.started_at as string, "mock", m.result as GradedResult | null),
    ),
    ...(attempts ?? []).map((a) =>
      toItem(a.created_at as string, "practice", a.result as GradedResult | null),
    ),
  ]
    .filter((x): x is SpeakProgressItem => x !== null)
    .sort((a, b) => a.t.localeCompare(b.t))
    .slice(-10);

  // Finished mocks were unreachable from the hub (report links only lived on
  // the ended screen) — a graded 6.0 sat invisible until the user asked.
  const recentMocks = (mocks ?? [])
    .map((m) => {
      const r = m.result as GradedResult | null;
      // Who examined them, when the engine recorded it (metrics.examiner —
      // added 2026-07-29). Older rows simply show the date.
      const who = (m.metrics as { examiner?: string } | null)?.examiner;
      return r && typeof r.overall_band === "number"
        ? {
            id: m.id as string,
            t: m.started_at as string,
            band: r.overall_band,
            who: typeof who === "string" ? who : null,
          }
        : null;
    })
    .filter((x): x is { id: string; t: string; band: number; who: string | null } => x !== null)
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
    .filter((l) => l.minutes > 0.2); // hide instantly-abandoned connections

  // The mock allowance, mirroring the engine's own gate (quota.py
  // PLAN_FULL_MOCK_LIMITS + ensure_full_mock_quota) so the hub never promises a
  // mock the engine will refuse. Counted the same way: this calendar month,
  // mode=full, anything past `pending` — a session the user backed out of
  // before connecting spent nothing and is not charged.
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const resetsAt = new Date(monthStart);
  resetsAt.setUTCMonth(resetsAt.getUTCMonth() + 1);
  const { count: mocksUsed } = await supabase
    .from("speaking_sessions")
    .select("id", { count: "exact", head: true })
    .eq("mode", "full")
    .neq("state", "pending")
    .gte("started_at", monthStart.toISOString());

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", profile.organization_id)
    .maybeSingle();
  const allowance = {
    used: mocksUsed ?? 0,
    limit: planTier((org?.plan ?? "trial") as OrgPlan).fullMockLimit,
    resetsAt: resetsAt.toISOString(),
  };

  return (
    <SpeakingClient
      initialCardId={card}
      progress={progress}
      recentMocks={recentMocks}
      recentLessons={recentLessons}
      allowance={allowance}
    />
  );
}
