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
export async function loadDashboard(studentId: string): Promise<DashboardData> {
  const estimates = await loadStudentEstimates(studentId);
  const supabase = await createClient();

  // Writing: the student's essays → their latest grading each.
  const { data: essays } = await supabase.from("essays").select("id").eq("student_id", studentId);
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
  const { data: attemptsData } = await supabase
    .from("reading_attempts")
    .select("band, type_breakdown, submitted_at, created_at")
    .eq("student_id", studentId)
    .eq("status", "graded")
    .order("created_at", { ascending: true });
  const attempts = (attemptsData ?? []) as unknown as AttemptRow[];

  // Merge into a single chronological history feed.
  const events: RawHistoryEvent[] = [];
  for (const g of gradings) {
    if (g.overall_band != null) events.push({ date: g.created_at, skill: "writing", band: Number(g.overall_band) });
  }
  for (const a of attempts) {
    if (a.band != null) events.push({ date: a.submitted_at ?? a.created_at, skill: "reading", band: Number(a.band) });
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
