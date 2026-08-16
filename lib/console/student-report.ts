import "server-only";

import { type BaselineSource } from "@/lib/console/progress";

import { signAvatar } from "@/lib/console/avatars";
import { weakestCriteria } from "@/lib/console/criteria";
import { createClient } from "@/lib/supabase/server";

export type PracticeSkill = "writing" | "reading" | "listening" | "speaking";

export interface PracticeRow {
  id: string;
  skill: PracticeSkill;
  when: string;
  /**
   * What the teacher called this homework, from the assignment itself. Null for
   * self-directed practice, which nobody named.
   */
  title: string | null;
  /** Band where one exists; listening quick practices may only have a score. */
  band: number | null;
  score: string | null;
  /**
   * The one thing that held THIS piece back — the lowest criterion on an essay,
   * the question type that lost the most marks on a reading test.
   *
   * On the row rather than only in the roll-up because "Band 6.0" alone tells a
   * teacher nothing they can teach from, and making them open every report to
   * find out is how a report page goes unread.
   */
  weakness: string | null;
  /** Homework when this content was assigned to one of their groups. */
  assigned: boolean;
  /**
   * The full marked-up feedback for THIS attempt — the same page the student
   * sees, reused rather than rebuilt. Null while a piece of work has no report
   * yet (an unsubmitted draft, an abandoned mock).
   */
  reportHref: string | null;
}

export interface WeaknessRow {
  label: string;
  /** How many times it showed up as the weak point. */
  count: number;
  detail?: string;
}

export interface StudentReport {
  studentId: string;
  name: string;
  photoUrl: string | null;
  bands: {
    skill: PracticeSkill;
    current: number | null;
    target: number | null;
    /** Where they started, and how much that claim is worth. */
    baseline: number | null;
    baselineSource: BaselineSource;
    sampleCount: number;
    /**
     * Did anybody actually choose this target? `target_band` defaults to 7.0
     * for every student in every skill, so an unagreed 7.0 is not a goal — it
     * is the column default, and printing it on a parent report as "Target 7.0"
     * commits the centre to something nobody promised.
     */
    targetAgreed: boolean;
  }[];
  practices: PracticeRow[];
  /** Total practices in the last 30 days, across all four skills. */
  recentCount: number;
  lastActive: string | null;
  writingWeaknesses: WeaknessRow[];
  readingWeaknesses: WeaknessRow[];
  /** Homework: assigned vs. actually done. */
  homework: { assigned: number; done: number };
  /**
   * Registers marked for this student. Null when nobody has taken a register
   * yet — which is not the same as 0%, and a parent report must not print one
   * as the other.
   */
  attendance: { sessions: number; attended: number; ratePct: number } | null;
  /** The groups they are enrolled in, for the report letterhead. */
  groups: string[];
}

/**
 * Everything a teacher needs about one student: their band per skill, every
 * practice they've done (homework or their own), and the mistakes that keep
 * recurring.
 *
 * Reads through the RLS client throughout, so this returns data only for a
 * student the caller is allowed to see — `can_view_student` scopes listening
 * and speaking to the teacher's own groups, and the older essays/reading
 * policies scope to the org. Returns null when the student isn't visible.
 */
export async function loadStudentReport(
  studentId: string,
  now: Date = new Date(),
): Promise<StudentReport | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_path")
    .eq("id", studentId)
    .maybeSingle();
  if (!profile) return null;

  const [estimatesRes, essaysRes, readingRes, listeningRes, speakingRes, assignmentsRes] =
    await Promise.all([
      supabase
        .from("skill_estimates")
        .select(
          "skill, current_band, target_band, baseline_band, baseline_source, sample_count, target_set_by",
        )
        .eq("student_id", studentId),
      supabase
        .from("essays")
        .select("id, prompt_id, status, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("reading_attempts")
        .select(
          "id, test_id, band, correct_count, total_questions, type_breakdown, status, created_at",
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("listening_attempts")
        .select("id, score, max_score, result, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("speaking_sessions")
        .select("id, state, result, started_at")
        .eq("student_id", studentId)
        .order("started_at", { ascending: false })
        .limit(50),
      // What their groups were told to do — so practice can be split into
      // homework vs. self-directed. The title comes along because the teacher
      // wrote it: "Task 2 — city living" beats "Writing" in a list of six.
      supabase.from("assignments").select("prompt_id, reading_test_id, title"),
    ]);

  const [attendanceRes, membershipRes] = await Promise.all([
    supabase
      .from("v_student_attendance")
      .select("sessions, attended, rate_pct")
      .eq("student_id", studentId)
      .maybeSingle(),
    // Two flat queries rather than a `groups(name)` embed: this schema's
    // composite foreign keys make PostgREST embeds resolve to nothing without
    // erroring, which is how a page goes blank in production and passes here.
    supabase.from("group_members").select("group_id").eq("student_id", studentId),
  ]);

  const groupIds = (membershipRes.data ?? []).map((m) => m.group_id as string);
  const { data: groupRows } = groupIds.length
    ? await supabase.from("groups").select("name").in("id", groupIds)
    : { data: [] as { name: string }[] };

  // Content id → the name the teacher gave it. Last one wins if the same
  // content was set twice; they are the same piece of work either way.
  const assignedTitle = new Map<string, string>();
  for (const a of assignmentsRes.data ?? []) {
    const key = (a.prompt_id ?? a.reading_test_id) as string | null;
    if (key && a.title) assignedTitle.set(key, a.title as string);
  }

  const assignedPrompts = new Set(
    (assignmentsRes.data ?? [])
      .map((a) => a.prompt_id as string | null)
      .filter(Boolean) as string[],
  );
  const assignedTests = new Set(
    (assignmentsRes.data ?? [])
      .map((a) => a.reading_test_id as string | null)
      .filter(Boolean) as string[],
  );

  // ---- Writing: latest grading per essay -----------------------------------
  const essays = essaysRes.data ?? [];
  const essayIds = essays.map((e) => e.id as string);
  const gradingByEssay = new Map<string, { band: number; criteria: Record<string, unknown> }>();
  if (essayIds.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, criteria, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    for (const g of gradings ?? []) {
      if (g.overall_band == null) continue;
      gradingByEssay.set(g.essay_id as string, {
        band: Number(g.overall_band),
        criteria: (g.criteria ?? {}) as Record<string, unknown>,
      });
    }
  }

  const practices: PracticeRow[] = [];
  const writingTally = new Map<string, number>();

  for (const e of essays) {
    const grading = gradingByEssay.get(e.id as string);
    // Each capping criterion counts once. Tallying the joined "A + B" cell text
    // would invent a third category that is neither.
    const capping = grading
      ? weakestCriteria(grading.criteria as Record<string, { band?: number }>)
      : [];
    for (const label of capping) writingTally.set(label, (writingTally.get(label) ?? 0) + 1);
    const weak = grading ? weakestCriterion(grading.criteria) : null;
    practices.push({
      id: e.id as string,
      skill: "writing",
      when: e.created_at as string,
      title: e.prompt_id ? (assignedTitle.get(e.prompt_id as string) ?? null) : null,
      band: grading?.band ?? null,
      score: null,
      weakness: weak,
      assigned: e.prompt_id ? assignedPrompts.has(e.prompt_id as string) : false,
      reportHref: grading ? `/activities/essay/${e.id}` : null,
    });
  }

  // ---- Reading -------------------------------------------------------------
  const readingTally = new Map<string, number>();
  for (const r of readingRes.data ?? []) {
    const missed = missedTypes(
      r.type_breakdown as Record<string, { attempted?: number; correct?: number }> | null,
    );
    for (const [type, wrong] of missed) {
      readingTally.set(type, (readingTally.get(type) ?? 0) + wrong);
    }
    // The type that cost the most marks on this test — the reading equivalent
    // of a capping criterion.
    const worstType = missed.sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    practices.push({
      id: r.id as string,
      skill: "reading",
      when: r.created_at as string,
      title: r.test_id ? (assignedTitle.get(r.test_id as string) ?? null) : null,
      band: r.band != null ? Number(r.band) : null,
      weakness: worstType,
      score:
        r.total_questions != null && r.total_questions > 0
          ? `${r.correct_count ?? 0} / ${r.total_questions}`
          : null,
      assigned: r.test_id ? assignedTests.has(r.test_id as string) : false,
      reportHref: r.status === "graded" ? `/activities/reading/${r.id}` : null,
    });
  }

  // ---- Listening + speaking (never assignable yet, so never homework) ------
  for (const l of listeningRes.data ?? []) {
    const result = (l.result ?? {}) as { band?: unknown };
    const band = Number(result.band);
    practices.push({
      id: l.id as string,
      skill: "listening",
      when: l.created_at as string,
      title: null,
      band: Number.isFinite(band) ? band : null,
      score: l.max_score ? `${l.score ?? 0} / ${l.max_score}` : null,
      weakness: null,
      assigned: false,
      reportHref: `/listen/results/${l.id}`,
    });
  }

  for (const s of speakingRes.data ?? []) {
    if (s.state !== "graded") continue;
    const result = (s.result ?? {}) as { overall_band?: unknown };
    const band = Number(result.overall_band);
    practices.push({
      id: s.id as string,
      skill: "speaking",
      when: s.started_at as string,
      title: null,
      band: Number.isFinite(band) ? band : null,
      score: null,
      weakness: null,
      assigned: false,
      reportHref: `/speak/mock/${s.id}`,
    });
  }

  practices.sort((a, b) => b.when.localeCompare(a.when));

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const homeworkRows = practices.filter((p) => p.assigned);

  return {
    studentId,
    name: (profile.full_name as string | null) ?? "—",
    photoUrl: await signAvatar((profile.avatar_path as string | null) ?? null),
    bands: (["writing", "reading", "listening", "speaking"] as PracticeSkill[]).map((skill) => {
      const est = (estimatesRes.data ?? []).find((e) => e.skill === skill);
      return {
        skill,
        current: est?.current_band != null ? Number(est.current_band) : null,
        target: est?.target_band != null ? Number(est.target_band) : null,
        baseline: est?.baseline_band != null ? Number(est.baseline_band) : null,
        baselineSource: (est?.baseline_source as BaselineSource) ?? "first_attempt",
        sampleCount: (est?.sample_count as number | null) ?? 0,
        targetAgreed: est?.target_set_by != null,
      };
    }),
    practices: practices.slice(0, 40),
    recentCount: practices.filter((p) => p.when >= thirtyDaysAgo).length,
    lastActive: practices[0]?.when ?? null,
    writingWeaknesses: toWeaknessRows(writingTally),
    readingWeaknesses: toWeaknessRows(readingTally),
    homework: {
      assigned: assignedPrompts.size + assignedTests.size,
      done: homeworkRows.filter((p) => p.band != null).length,
    },
    // No register taken at all reads as null, never 0% — the view returns no
    // row for a student nobody has marked, and "0% attendance" on a report
    // going home to a parent is an accusation the data does not support.
    attendance: attendanceRes.data
      ? {
          sessions: Number(attendanceRes.data.sessions ?? 0),
          attended: Number(attendanceRes.data.attended ?? 0),
          ratePct: Number(attendanceRes.data.rate_pct ?? 0),
        }
      : null,
    groups: (groupRows ?? []).map((g) => g.name as string).filter(Boolean),
  };
}

/** Practice counts for a whole roster, for the group page. One query per skill
 *  rather than one per student. */
export async function loadGroupActivity(
  studentIds: string[],
  now: Date = new Date(),
): Promise<Map<string, { count30d: number; lastActive: string | null }>> {
  const out = new Map<string, { count30d: number; lastActive: string | null }>();
  if (studentIds.length === 0) return out;

  const supabase = await createClient();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [essays, reading, listening, speaking] = await Promise.all([
    supabase.from("essays").select("student_id, created_at").in("student_id", studentIds),
    supabase.from("reading_attempts").select("student_id, created_at").in("student_id", studentIds),
    supabase
      .from("listening_attempts")
      .select("student_id, created_at")
      .in("student_id", studentIds),
    supabase
      .from("speaking_sessions")
      .select("student_id, started_at")
      .in("student_id", studentIds),
  ]);

  const add = (studentId: string, when: string) => {
    const row = out.get(studentId) ?? { count30d: 0, lastActive: null };
    if (when >= since) row.count30d += 1;
    if (!row.lastActive || when > row.lastActive) row.lastActive = when;
    out.set(studentId, row);
  };

  for (const r of essays.data ?? []) add(r.student_id as string, r.created_at as string);
  for (const r of reading.data ?? []) add(r.student_id as string, r.created_at as string);
  for (const r of listening.data ?? []) add(r.student_id as string, r.created_at as string);
  for (const r of speaking.data ?? []) add(r.student_id as string, r.started_at as string);

  return out;
}

function toWeaknessRows(tally: Map<string, number>): WeaknessRow[] {
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

/**
 * What capped one essay, as a single line for a table cell.
 *
 * THE TIE-BREAK BUG HAD A SECOND COPY, and this was the one that mattered most.
 * `reports.ts` was fixed in isolation, but this file carried its own version
 * walking `Object.entries` for the first strict minimum — and the grader always
 * writes CC first. Every flat essay (47 of 74 on the real corpus score
 * identically on all four criteria) therefore tallied as "Coherence &
 * Cohesion" in `writingWeaknesses`: the panel a teacher reads to decide what to
 * teach, and now the panel a PARENT reads. Fixing one call site and leaving the
 * other is how a bug comes back, so both go through the tested function.
 *
 * Two criteria tied at the bottom are both named — an essay held back equally
 * by two things is held back by two things. All four tied returns null, which
 * the table renders as "—": a uniformly 5.0 essay has no weak spot, and naming
 * one invents a finding.
 */
function weakestCriterion(criteria: Record<string, unknown>): string | null {
  const capping = weakestCriteria(criteria as Record<string, { band?: number }>);
  return capping.length > 0 ? capping.join(" + ") : null;
}

/** [questionType, wrongCount] for every type this attempt lost marks on. */
function missedTypes(
  breakdown: Record<string, { attempted?: number; correct?: number }> | null,
): [string, number][] {
  if (!breakdown) return [];
  return Object.entries(breakdown)
    .map(
      ([type, v]) =>
        [type.replaceAll("_", " "), (v?.attempted ?? 0) - (v?.correct ?? 0)] as [string, number],
    )
    .filter(([, wrong]) => wrong > 0);
}
