import "server-only";

import { type Skill } from "@/lib/estimates/compute";
import { getGradingQuota, PLAN_SEAT_LIMITS, type OrgPlan } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

import {
  buildStudentRow,
  summarizeCohort,
  weeklyTrend,
  type CohortSummary,
  type EstimateInput,
  type StudentRow,
  type SubmissionInput,
  type TrendPoint,
} from "./compute";

export interface CohortDashboard {
  orgName: string;
  plan: OrgPlan;
  rows: StudentRow[];
  summary: CohortSummary;
  trend: TrendPoint[];
  seats: { used: number; limit: number | null };
  gradingThisMonth: { used: number; limit: number | null; resetAt: string };
  aiCalls: { total: number; grade: number; generate: number };
}

/**
 * Everything the center-admin cohort dashboard renders. Read through the RLS
 * client — a center_admin can read their org's profiles, estimates, essays,
 * gradings, reading_attempts and ai_usage, and Postgres guarantees they see ONLY
 * their org. Writing is attributed via essays (gradings carry no student_id), one
 * grading per essay (its latest) so revisions don't inflate the counts.
 */
export async function loadCohortDashboard(
  organizationId: string,
  now: Date = new Date(),
): Promise<CohortDashboard> {
  const supabase = await createClient();

  const [orgRes, studentsRes, estimatesRes, essaysRes, attemptsRes] = await Promise.all([
    supabase.from("organizations").select("name, plan").eq("id", organizationId).maybeSingle(),
    supabase.from("profiles").select("id, full_name").eq("role", "student"),
    supabase
      .from("skill_estimates")
      .select("student_id, skill, current_band, baseline_band, target_band, sample_count"),
    supabase.from("essays").select("id, student_id"),
    supabase
      .from("reading_attempts")
      .select("student_id, band, submitted_at, created_at")
      .eq("status", "graded"),
  ]);

  const plan = (orgRes.data?.plan ?? "trial") as OrgPlan;
  const orgName = orgRes.data?.name ?? "Your center";
  const students = studentsRes.data ?? [];

  // Writing submissions: latest grading per essay, attributed to its owner.
  const essayOwner = new Map((essaysRes.data ?? []).map((e) => [e.id as string, e.student_id as string]));
  const essayIds = [...essayOwner.keys()];
  const writingSubs: SubmissionInput[] = [];
  if (essayIds.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    const latest = new Map<string, { band: number; date: string; student: string }>();
    for (const g of gradings ?? []) {
      const student = essayOwner.get(g.essay_id as string);
      if (!student || g.overall_band == null) continue;
      latest.set(g.essay_id as string, {
        band: Number(g.overall_band),
        date: g.created_at as string,
        student,
      });
    }
    for (const v of latest.values()) writingSubs.push({ studentId: v.student, date: v.date, band: v.band });
  }

  // Reading submissions: each graded attempt.
  const readingSubs: SubmissionInput[] = (attemptsRes.data ?? [])
    .filter((a) => a.band != null)
    .map((a) => ({
      studentId: a.student_id as string,
      date: (a.submitted_at as string | null) ?? (a.created_at as string),
      band: Number(a.band),
    }));

  const allSubs = [...writingSubs, ...readingSubs];

  // Group estimates + submissions by student.
  const estBy = new Map<string, EstimateInput[]>();
  for (const e of estimatesRes.data ?? []) {
    const list = estBy.get(e.student_id as string) ?? [];
    list.push({
      skill: e.skill as Skill,
      currentBand: e.current_band != null ? Number(e.current_band) : null,
      baselineBand: e.baseline_band != null ? Number(e.baseline_band) : null,
      targetBand: e.target_band != null ? Number(e.target_band) : 7,
      sampleCount: e.sample_count ?? 0,
    });
    estBy.set(e.student_id as string, list);
  }
  const subsBy = new Map<string, SubmissionInput[]>();
  for (const s of allSubs) {
    const list = subsBy.get(s.studentId) ?? [];
    list.push(s);
    subsBy.set(s.studentId, list);
  }

  const rows = students
    .map((s) =>
      buildStudentRow(
        { id: s.id as string, name: (s.full_name as string | null) ?? null },
        estBy.get(s.id as string) ?? [],
        subsBy.get(s.id as string) ?? [],
        now,
      ),
    )
    .sort(byLiftThenName);

  // Usage / seats.
  const quota = await getGradingQuota(organizationId);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [totalCalls, generateCalls] = await Promise.all([
    countAiUsage(supabase, monthStart),
    countAiUsage(supabase, monthStart, "generate"),
  ]);

  return {
    orgName,
    plan,
    rows,
    summary: summarizeCohort(rows),
    trend: weeklyTrend(allSubs, 8, now),
    seats: { used: students.length, limit: PLAN_SEAT_LIMITS[plan] ?? null },
    gradingThisMonth: { used: quota.used, limit: quota.limit, resetAt: quota.resetAt },
    aiCalls: {
      total: totalCalls,
      generate: generateCalls,
      grade: Math.max(0, totalCalls - generateCalls),
    },
  };
}

type RlsClient = Awaited<ReturnType<typeof createClient>>;

async function countAiUsage(supabase: RlsClient, sinceISO: string, task?: "grade" | "generate"): Promise<number> {
  let q = supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceISO);
  if (task) q = q.eq("task", task);
  const { count } = await q;
  return count ?? 0;
}

/** Top gainers first (the value story); unmeasured students fall to the bottom. */
function byLiftThenName(a: StudentRow, b: StudentRow): number {
  if (a.avgLift == null && b.avgLift == null) return a.name.localeCompare(b.name);
  if (a.avgLift == null) return 1;
  if (b.avgLift == null) return -1;
  return b.avgLift - a.avgLift || a.name.localeCompare(b.name);
}
