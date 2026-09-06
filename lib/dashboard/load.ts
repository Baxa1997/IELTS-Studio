import "server-only";

import { loadStudentEstimates, type StudentEstimates } from "@/lib/estimates/load";
import { createClient } from "@/lib/supabase/server";

import {
  buildHistory,
  computeStreak,
  computeWeakestCriterion,
  computeWeakestReadingType,
  recommend,
  type AttemptRow,
  type GradingRow,
  type HistoryEvent,
  type RawHistoryEvent,
  type Recommendation,
  type WeakCriterion,
  type WeakReadingType,
} from "./compute";

export interface DashboardData {
  estimates: StudentEstimates;
  weakestCriterion: WeakCriterion | null;
  weakestReadingType: WeakReadingType | null;
  streakDays: number;
  history: HistoryEvent[];
  recommendation: Recommendation;
}

/**
 * Everything the student dashboard renders, read through the RLS client (the
 * student sees only their own essays/gradings/attempts/estimates). Writing pulls
 * ONE grading per essay (its latest) so a heavily-revised essay doesn't skew the
 * weakest-criterion or history; reading uses each graded attempt.
 */
export async function loadDashboard(
  studentId: string,
): Promise<DashboardData> {
  const supabase = await createClient();

  // These reads are independent. Keep the dashboard's critical path at the
  // slowest source query instead of paying for estimates, essays, reading,
  // listening, and speaking serially.
  const [estimates, essaysRes, attemptsRes, listenRes, speakRes] = await Promise.all([
    loadStudentEstimates(studentId),
    supabase.from("essays").select("id").eq("student_id", studentId),
    supabase
      .from("reading_attempts")
      .select("band, type_breakdown, submitted_at, created_at")
      .eq("student_id", studentId)
      .eq("status", "graded")
      .order("created_at", { ascending: true }),
    supabase
      .from("listening_attempts")
      .select("result, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true }),
    supabase
      .from("speaking_sessions")
      .select("result, started_at")
      .eq("student_id", studentId)
      .eq("mode", "full")
      .eq("state", "graded")
      .order("started_at", { ascending: true }),
  ]);

  // Writing: the student's essays → their latest grading each.
  const essays = essaysRes.data;
  const essayIds = (essays ?? []).map((e) => e.id as string);

  let gradings: GradingRow[] = [];
  if (essayIds.length > 0) {
    const { data } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, criteria, score_blocker, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    const latest = new Map<string, GradingRow>();
    for (const g of data ?? []) latest.set(g.essay_id as string, g as unknown as GradingRow);
    gradings = [...latest.values()];
  }

  // Reading: each graded attempt.
  const attempts = (attemptsRes.data ?? []) as unknown as AttemptRow[];

  // Listening: each attempt (auto-graded on submit; band in result.band).
  // Speaking: each graded FULL mock (band in result.overall_band).
  const listenData = listenRes.data;
  const speakData = speakRes.data;

  // Merge into a single chronological history feed.
  const events: RawHistoryEvent[] = [];
  for (const g of gradings) {
    if (g.overall_band != null) events.push({ date: g.created_at, skill: "writing", band: Number(g.overall_band) });
  }
  for (const a of attempts) {
    if (a.band != null) events.push({ date: a.submitted_at ?? a.created_at, skill: "reading", band: Number(a.band) });
  }
  for (const l of listenData ?? []) {
    const band = Number((l.result as { band?: unknown } | null)?.band);
    if (Number.isFinite(band) && band > 0) events.push({ date: l.created_at as string, skill: "listening", band });
  }
  for (const s of speakData ?? []) {
    const r = s.result as { overall_band?: unknown; non_attempt?: unknown } | null;
    const band = r?.non_attempt ? NaN : Number(r?.overall_band);
    if (Number.isFinite(band) && band > 0) events.push({ date: s.started_at as string, skill: "speaking", band });
  }

  const weakestCriterion = computeWeakestCriterion(gradings);
  const weakestReadingType = computeWeakestReadingType(attempts);

  return {
    estimates,
    weakestCriterion,
    weakestReadingType,
    streakDays: computeStreak(events.map((e) => e.date)),
    history: buildHistory(events),
    recommendation: recommend({ estimates, weakestCriterion, weakestReadingType }),
  };
}
